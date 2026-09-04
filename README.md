# SyncSenta

AI-powered education platform for Kenya's Competency-Based Curriculum (CBC).
Students get an adaptive Socratic tutor. Teachers get real-time analytics,
scheme-of-work generation, and lesson planning tools.

**Live:** https://sentastudio.vercel.app

---

## What it does

**For students (PP1 – Grade 9)**
- Subject catalogue with 10 subjects — 7 core CBC subjects (canvas activities)
  and 3 extended courses (Blockchain, Financial Literacy, AI) with full-height
  embedded chat
- Adaptive Socratic tutor: the Omega decision engine computes a scaffolding
  level (Independent / Guided / Intensive) before every response, based on
  the student's mastery data
- Interactive canvas activities (fraction bars, counting tokens) with
  micro-assessment mastery gating
- Cross-device resume: activity progress saved to Redis, restored on return
- XP + level system per subject

**For teachers**
- Real-time student monitoring with misconception detection and intervention
  alerts
- CBC scheme-of-work generator, lesson plan generator, assessment generator
  (PP1 – Grade 9)
- Phase 2 analytics: competency trends, session timeline, subject chat
  history with scaffolding level visibility
- Exam creation and marking

---

## Monorepo layout

```
Ascendra/
├── studio/          Next.js 16 app — the primary web application
├── ai-agents/       Python FastAPI service — teacher generators, LangGraph orchestrator
├── rust-core/       Rust library — adaptive question + tutoring decision engine
├── rust-service/    Rust HTTP service wrapping rust-core (built, not yet deployed)
├── scheme-scribe/   Vite/React standalone app — scheme + lesson tools (separate Supabase)
├── arduino/         ESP32-CAM firmware prototype
├── docs/            Architecture, development, and reference docs
├── sql/             Studio database migrations
├── supabase/        Shared Supabase migrations
├── CONTEXT.md       Domain glossary — read this before any code change
└── CODING_STANDARDS.md  Coding conventions for Studio
```

---

## Running locally

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full guide.

Quick version — two terminals:

**Terminal 1 — AI Agents** (needed for teacher generators only)
```powershell
Set-Location "c:\Users\hp\codes\Ascendra\ai-agents"
py -3.11 -m venv .venv ; .\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:PYTHONPATH = "$PWD\src"
python -m uvicorn syncsenta_agents.api.server:app --host 127.0.0.1 --port 8001 --reload
```

**Terminal 2 — Studio**
```powershell
Set-Location "c:\Users\hp\codes\Ascendra\studio"
npm ci
npm run dev
# http://localhost:5173
```

Create `studio/.env.local` from `studio/.env.example` — you need at minimum:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GROQ_API_KEY`.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | student01@syncsenta.dev | Demo@Student01 |
| Teacher | teacher01@syncsenta.dev | Demo@Teacher01 |
| Head teacher | head01@syncsenta.dev | Demo@Head01 |
| Parent | parent01@syncsenta.dev | Demo@Parent01 |

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Database + Auth | Supabase (Postgres, RLS, Realtime) |
| LLM | Groq (`llama-3.3-70b-versatile`) — switchable to Gemini |
| Session cache | Upstash Redis |
| AI Agents backend | FastAPI, LangGraph, Python 3.11 — deployed on Render |
| Adaptive engine | Rust (`rust-core/`) — TypeScript port active until Rust service deployed |
| Deployment | Vercel (Studio) + Render (AI Agents) |

---

## Key docs

| Document | What it covers |
|---|---|
| [CONTEXT.md](CONTEXT.md) | Domain glossary — start here |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Full system architecture, component map, request flows |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, test commands, known traps |
| [CODING_STANDARDS.md](CODING_STANDARDS.md) | Studio coding conventions |
| [studio/docs/SOCRATIC_MENTOR_SPEC.md](studio/docs/SOCRATIC_MENTOR_SPEC.md) | Chat system prompt spec + Omega decision flow |
| [docs/architecture/rust-adaptive-deployment.md](docs/architecture/rust-adaptive-deployment.md) | Rust service deployment notes |

---

## Tests

```powershell
Set-Location "c:\Users\hp\codes\Ascendra\studio"
npx vitest run        # all tests once
npm run build         # production build + env check
```
