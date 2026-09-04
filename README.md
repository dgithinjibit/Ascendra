# SyncSenta

AI-powered education platform for Kenya's Competency-Based Curriculum (CBC).

**Live:** https://sentastudio.vercel.app

SyncSenta delivers adaptive learning for Kenyan students (PP1–Grade 9) and
intelligent teaching tools for educators. The platform combines an Omega
tutoring decision engine with real-time analytics to create personalized
learning experiences aligned with CBC standards.

---

## What it does

**For students**
- **10 CBC-aligned subjects:** 7 core subjects with interactive canvas activities
  (Mathematics, English, Kiswahili, Environmental, Creative, CRE, Indigenous
  Languages) + 3 extended courses with full chat (Blockchain, Financial Literacy, AI)
- **Adaptive Socratic tutor:** Omega decision engine computes scaffolding level
  (Independent / Guided / Intensive) before every response based on real-time
  mastery data
- **Interactive activities:** Fraction bars, counting tokens, pattern recognition
  with micro-assessment mastery gating
- **Cross-device continuity:** Activity progress saved to Redis, restored on return
- **XP progression:** Subject-specific levels (1–10, 100 XP per level)

**For teachers**
- **Real-time monitoring:** Student dashboard with misconception detection,
  scaffolding level visibility, and intervention alerts
- **CBC content generators:** Scheme-of-work, lesson plans, assessments (PP1–Grade 9)
- **Phase 2 analytics:** Competency trends, session timelines, subject chat history
- **Exam tools:** Creation, distribution, automated marking

---

## Project structure

```
studio/          Next.js 16 — primary web application (students + teachers)
ai-agents/       FastAPI — LangGraph orchestrator, CBC content generators
rust-core/       Rust library — adaptive tutoring decision engine (source of truth)
rust-service/    Rust HTTP wrapper (built, not yet deployed)
scheme-scribe/   Vite/React standalone (separate Supabase project)
supabase/        Database migrations
docs/            Architecture and development guides
CONTEXT.md       Domain glossary — read before making changes
```

**Key documentation:**
- [CONTEXT.md](CONTEXT.md) — Domain glossary and core concepts
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System design, component map, data flows
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — Local setup, test commands, troubleshooting
- [CODING_STANDARDS.md](CODING_STANDARDS.md) — Studio coding conventions
- [studio/docs/SOCRATIC_MENTOR_SPEC.md](studio/docs/SOCRATIC_MENTOR_SPEC.md) — Omega system prompt spec

---

## Running locally

Full setup instructions: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

**Quick start for Studio** (student features):
```powershell
cd studio
npm ci
npm run dev
# http://localhost:5173
```

Required environment variables in `studio/.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

**Teacher generators** require the AI Agents service (FastAPI on port 8001).  
See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for Python setup.

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

## Architecture highlights

**Omega tutoring decision engine:**  
Before every chat response, evaluates student mastery to compute scaffolding level
(Independent / Guided / Intensive). TypeScript implementation active in production
(`lib/omega-agent/metta-core.ts`); Rust source of truth in `rust-core/src/agent_runtime.rs`.

**Subject session flow:**  
Unified entry point at `/student/subject/[slug]` for all 10 subjects. Parallel
fetches: XP from `point_transactions`, resume point from Redis, chat session +
messages from Supabase. Routes to embedded chat or canvas activities by layout.

**Two curriculum data systems:**  
`studio/src/curriculum/` — student activity packs (grade 1–6, PP1–2)  
`studio/src/data/curriculum/` — CBC strands/substrands for teacher tools (PP1–Grade 9)

---

## Testing

```powershell
cd studio
npx vitest run        # Run all tests once (recommended before commits)
npx vitest            # Watch mode
npm run build         # Production build + env validation
```
