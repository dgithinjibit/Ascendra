# Architecture

*Last updated: September 2026*

## Executive view

Ascendra is a monorepo of related education products. The primary path is a
Next.js application called **Studio**, backed by a Python FastAPI service
(**AI Agents**) and **Supabase**. A standalone **Scheme Scribe** Vite app,
a **Rust adaptive service**, and an **ESP32-CAM firmware** prototype live
alongside that path.

## Two AI delivery paths in Studio

Studio has two distinct AI paths that share intent but are not a single
abstraction:

**Path 1 — Socratic student chat** (`/api/chat`)
Student browser → `POST /api/chat` → Groq (streamed SSE) → browser.
This route authenticates, rate-limits via Upstash, calls Groq directly,
persists history and progress, and streams SSE. Before every response it
calls `evaluateTutoringDecision()` to compute a scaffolding level
(Independent / Guided / Intensive) and builds a dynamic system prompt via
`buildDynamicSystemPrompt()`. The scaffolding level is persisted to Redis
fire-and-forget. The Rust adaptive service (`SYNCSENTA_RUST_ADAPTIVE_URL`)
can replace this TS decision engine when deployed — the route falls back
to the TS engine when that env var is not set.

**Path 2 — FastAPI agent calls**
Teacher generators (schemes, lesson plans, assessments), the AI agents chat,
and telemetry call the FastAPI service at `NEXT_PUBLIC_AI_AGENTS_URL`
(port 8001 in development, Render in production).

Changes must preserve or deliberately consolidate both paths.

## Component map

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browsers                                 │
│  Student (PP1–Grade 9)    Teacher / Admin    Guardian           │
└────────┬──────────────────────┬─────────────────────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Studio  (Next.js, Vercel)                     │
│                                                                 │
│  /student/*          /teacher/*          /api/*                 │
│  ├ sandbox (canvas)  ├ dashboard         ├ chat (SSE+Omega)     │
│  ├ subject/[slug]    ├ scheme-wizard      ├ teacher/*           │
│  ├ chat tutor        ├ phase2 analytics  ├ session/sync        │
│  └ journey/profile   └ exams             └ generate/* (proxy)  │
└──────┬──────────────────────┬──────────────────────────────────┘
       │                      │
       │ direct Groq           │ NEXT_PUBLIC_AI_AGENTS_URL
       ▼                      ▼
  ┌─────────┐       ┌──────────────────────────────────────────┐
  │  Groq   │       │  AI Agents  (FastAPI, Render)            │
  │  API    │       │  LangGraph orchestrator + specialists     │
  └─────────┘       │  Lesson Architect, telemetry, xAPI       │
                    └─────────────────┬────────────────────────┘
                                      │
                    ┌─────────────────▼────────────────────────┐
                    │           Supabase                       │
                    │  Auth · Postgres · RLS · Realtime        │
                    │  Storage · Edge Functions (Scheme Scribe) │
                    └──────────────────────────────────────────┘

  ┌───────────────────┐    ┌──────────────────────────┐
  │  Upstash Redis    │    │  Rust adaptive service   │
  │  LearningSession  │    │  rust-service/ (port 8091)│
  │  rate limits      │    │  Not yet in production   │
  └───────────────────┘    └──────────────────────────┘
```

## Components and responsibilities

### 1. Studio — `studio/`

Next.js 16 App Router, React 18, TypeScript, Tailwind, shadcn/ui.

**Student routes**

| Route | Purpose |
|---|---|
| `/student` | Landing + journey selector |
| `/student/sandbox` | Subject catalogue — routes all 10 subjects to `/student/subject/[slug]` |
| `/student/subject/[slug]` | Subject entry page: XP badge, resume point, chat or sandbox layout |
| `/student/sandbox/[grade]/[subject]` | Activity list |
| `/student/sandbox/[grade]/[subject]/[activityId]` | Activity player (canvas + worksheet renderer, Redis resume) |

**Teacher routes**

| Route | Purpose |
|---|---|
| `/teacher/dashboard` | Main teacher view |
| `/teacher/scheme-wizard` | CBC scheme-of-work generator |
| `/teacher/grade/[grade]/[...slug]` | Per-grade student view |
| `/teacher/exams` | Exam tooling |

**Key API routes**

| Route | What it does |
|---|---|
| `POST /api/chat` | Socratic chat — Omega decision → dynamic prompt → Groq SSE |
| `GET /api/teacher/student-subjects` | Per-subject session summary for teacher dashboard |
| `GET/POST /api/session/sync` | Redis LearningSession read/write |
| `POST /api/metta/interact` | MeTTa-style interaction processing |
| `POST /api/generate/scheme` | Proxies to FastAPI Lesson Architect |
| `POST /api/generate/lesson-plan` | Proxies to FastAPI Lesson Architect |
| `POST /api/generate/assessment` | Proxies to FastAPI Lesson Architect |

**Key library modules**

| Module | Purpose |
|---|---|
| `lib/subject-session.ts` | SUBJECT_REGISTRY, XP/level, chat session helpers, Omega prompt builder |
| `lib/omega-agent/metta-core.ts` | `evaluateTutoringDecision()` — TS port of Rust `decide_tutoring()` |
| `lib/sandbox-activities.ts` | Activity catalogue (loads from `curriculum/`) |
| `lib/session-persistence.ts` | Redis LearningSession CRUD |
| `lib/cbc-curriculum.ts` | Grade/level/subject structure |
| `lib/socratic-prompts.ts` | `buildCompassSystemPrompt()` (socratic replaced by Omega path) |
| `lib/chat-history-supabase.ts` | `chat_sessions` + `chat_messages` persistence |
| `lib/rate-limit-upstash.ts` | Distributed rate limiting |

### 2. AI Agents service — `ai-agents/`

FastAPI (Python 3.11), LangGraph, Groq. Deployed on Render.

- Assessment quiz generation and grading
- LangGraph orchestration + specialist agents
- Lesson Architect: schemes, lesson plans, worksheets, text-leveling, differentiation, exams
- Telemetry capture, xAPI statements, behavioral profiling
- Teacher dashboard data queries and WebSockets
- Training data export

Entry point: `src/syncsenta_agents/api/server.py` (started by `render.yaml`).
Health check: `GET /healthz`.

> Note: `ai-agents/src/syncsenta_agents/api.py` is a separate legacy FastAPI
> app with different paths. It is **not** started by `render.yaml`.

### 3. Supabase

Primary database and auth layer.

| Access style | Helper | Use |
|---|---|---|
| Browser session | `lib/supabase/client.ts` | Client components, RLS user actions |
| Cookie-aware route | `lib/supabase/route-handler.ts` | Route handlers acting as signed-in caller |
| Service-role | `lib/supabase/server.ts` | Trusted server-side operations |

Key tables: `profiles`, `chat_sessions`, `chat_messages`, `learning_progress`,
`point_transactions`, `behavioral_profiles`, `misconceptions`,
`interventions`, `schemes`, `lesson_plans`, `exams`.

### 4. Upstash Redis

Stores `LearningSession` per user (7-day TTL). Accessed via
`lib/session-persistence.ts` and `/api/session/sync`.

Contains per-user: `currentActivity` (resume point), `recentActivities`,
`preferences.scaffoldingLevel` (last Omega decision), `competencyProgress`,
`achievements`.

### 5. Rust adaptive service — `rust-service/` + `rust-core/`

`rust-core/` contains 14 modules including `agent_runtime.rs`
(`decide_tutoring()` — the Rust source of truth for scaffolding thresholds)
and `adaptive_question.rs`.

`rust-service/` wraps rust-core as an HTTP service:
- `GET /health`
- `POST /v1/adaptive-question`

**Current status: built locally, not deployed to production.**
Studio's `/api/chat` uses the TypeScript port in `metta-core.ts` as fallback.
Wire it by setting `SYNCSENTA_RUST_ADAPTIVE_URL` in Vercel env vars.
Readiness probe: `scripts/rust-adaptive-readiness.sh`.

### 6. Scheme Scribe — `scheme-scribe/`

Self-contained Vite/React app with its own Supabase project, auth, Edge
Functions, and migrations. Offers scheme-of-work generation, lesson planning,
exam generation and grading, and a pupil dashboard.

Treat its database and Edge Function secrets as separate from Studio until
a deliberate migration unifies them.

### 7. ESP32-CAM firmware — `arduino/`

Prototype attendance + assessment device. Expects API routes (`/assess`,
`/generate-exam`, etc.) that do not match the current FastAPI contract.
A firmware integration requires an adapter service or agreed API contract.
Not connected in production.

## Omega tutoring decision engine

```
POST /api/chat
  │
  ├─ Query learning_progress (questions_answered, correct_answers, mastery_level)
  │
  ├─ buildLearningState()  →  { attempts, correctAttempts, hintsUsed, frustrationSignal }
  │
  ├─ evaluateTutoringDecision()  →  TutoringDecision
  │      frustrationSignal || hintsUsed >= 2 || masteryPct < 40  →  Intensive
  │      attempts === 0 || masteryPct < 80                        →  Guided
  │      else                                                     →  Independent
  │
  ├─ buildDynamicSystemPrompt()  →  system prompt with scaffolding instructions
  │
  ├─ Groq / Gemini streaming call
  │
  └─ updateLearningSession() fire-and-forget  →  Redis scaffoldingLevel
```

TypeScript implementation: `lib/omega-agent/metta-core.ts`
Rust source of truth: `rust-core/src/agent_runtime.rs`
Thresholds must stay in sync between the two.

## Subject session flow

```
sandbox/page.tsx
  └─ openSubject({ slug })
       └─ router.push('/student/subject/[slug]')
            └─ /student/subject/[slug]/page.tsx
                 ├─ getSubjectXP()         (point_transactions)
                 ├─ /api/session/sync      (Redis resume point)
                 ├─ getOrCreateChatSession() (chat_sessions)
                 └─ getChatMessages()      (chat_messages)

layout: 'chat'     →  SubjectChat  →  POST /api/chat (SSE)
layout: 'sandbox'  →  redirect to /student/sandbox/[grade]/[slug]
```

Subject slugs: `mathematics`, `english`, `kiswahili`, `environmental`,
`creative`, `cre`, `indigenous` (sandbox), `blockchain`, `financial-literacy`,
`ai` (chat).

## Primary request flows

### Socratic student chat (with Omega)

```
Browser → POST /api/chat
  → auth + profile
  → rate limit (Upstash)
  → query learning_progress
  → evaluateTutoringDecision()
  → buildDynamicSystemPrompt()
  → Groq streaming
  → SSE to browser
  → persist: chat_messages, learning_progress, api_usage
  → fire-and-forget: Redis scaffoldingLevel
```

### Teacher material generation

```
Teacher UI → /api/generate/scheme
           → proxy → FastAPI /lesson-architect/generate-scheme
           → LangGraph LessonArchitectAgent
           → Groq
           → persist to `schemes` table
```

### Activity resume

```
ActivityPage mounts
  → GET /api/session/sync?action=get
  → Redis LearningSession.currentActivity
  → if id matches activityId: restoreVariationIndex
  → InteractiveSandbox(initialVariationIndex)

On variation complete (not yet mastered):
  → POST /api/session/sync { currentActivity: { id, name, progress, data } }

On mastered:
  → POST /api/session/sync { currentActivity: null }
  → submitActivity() → Supabase
```

## Deployment topology

| Component | Config | Platform |
|---|---|---|
| Studio | `studio/vercel.json` | Vercel |
| AI Agents | `ai-agents/render.yaml` | Render |
| Scheme Scribe | Vite + Supabase Edge Functions | Separate |
| Rust service | `rust-service/Dockerfile` | Not yet deployed |

Studio starts on port 5173 (`next dev -p 5173`).
AI Agents runs on port 8001.

## Known integration gaps

- FastAPI CORS lists ports 3000/3001; Studio uses 5173. Direct browser calls
  to the FastAPI service need the CORS allow-list updated.
- Service-role Supabase helper is not cookie-aware. Some route handlers call
  `auth.getUser()` through it — align before relying on those for access control.
- The teacher-feedback FastAPI router exists in source but is not registered
  in `api/server.py`.
- Firmware API contract does not match FastAPI contract.
- Rust service is built but not wired to production.
- Voice call orchestrator contains a placeholder AI method.
