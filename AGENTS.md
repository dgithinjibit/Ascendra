# AGENTS.md - AI Development Context

## Project Overview
**Ascendra** (formerly Syncsenta) is a Kenyan education platform combining Next.js 14 frontend with Python FastAPI AI agents backend. The platform provides AI-powered lesson planning, assessment generation, and student monitoring aligned with Kenya's Competency-Based Curriculum (CBC) and Vision 2030 goals.

### Architecture
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Shadcn/ui
- **Backend**: Python FastAPI + Supabase PostgreSQL + Hyperon MeTTa reasoning engine
- **AI Agents**: Multi-agent system for pedagogical tasks (LessonArchitect, AssessmentAgent, etc.)
- **Deployment**: Vercel (frontend) + Render (backend Python service)

### Key Technologies
- **Auth**: Supabase Auth (JWT-based sessions)
- **Database**: Supabase PostgreSQL with RLS (Row Level Security)
- **AI Models**: OpenAI GPT-4, Google Gemini, Anthropic Claude (via multi-provider client)
- **Reasoning**: Hyperon MeTTa for policy evaluation with pure-Python fallback
- **Vector DB**: Supabase pgvector for RAG (Retrieval-Augmented Generation)

---

## Repository Structure

```
Ascendra/
├── AGENTS.md                           # This file - AI agent context
├── CODE_MAP.md                         # Detailed codebase map
├── package.json                        # Frontend dependencies
├── next.config.ts                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind CSS setup
├── tsconfig.json                       # TypeScript config
│
├── app/                                # Next.js 14 App Router
│   ├── (auth)/                        # Auth routes (login, signup)
│   ├── dashboard/                     # Main dashboard
│   ├── student/                       # Student view
│   ├── teacher/                       # Teacher workflows
│   ├── api/                           # API routes (proxies to Python backend)
│   └── layout.tsx                     # Root layout
│
├── components/                         # React components
│   ├── ui/                            # Shadcn/ui base components
│   ├── *-dashboard.tsx               # Role-specific dashboards
│   ├── app-sidebar.tsx               # Navigation sidebar
│   └── theme-provider.tsx            # Dark mode support
│
├── lib/                               # Frontend utilities
│   ├── auth.ts                       # Supabase auth helpers
│   ├── supabase/                     # Supabase client setup
│   └── utils.ts                      # General utilities
│
├── ai-agents/                         # Python FastAPI backend
│   ├── src/syncsenta_agents/
│   │   ├── agents/                   # AI agent implementations
│   │   │   ├── lesson_architect.py  # Lesson plan generation
│   │   │   ├── assessment_agent.py  # Assessment creation
│   │   │   ├── worksheet_agent.py   # Worksheet generation
│   │   │   └── ...
│   │   ├── api/                      # FastAPI routes
│   │   │   ├── lesson_routes.py
│   │   │   ├── assessment_routes.py
│   │   │   └── ...
│   │   ├── core/                     # Core utilities
│   │   │   ├── multi_provider_client.py  # LLM client abstraction
│   │   │   └── ...
│   │   ├── reasoning/                # MeTTa reasoning engine
│   │   │   ├── hyperon_evaluator.py # Hyperon MeTTa integration
│   │   │   ├── metta_engine.py      # Policy evaluation
│   │   │   └── ...
│   │   ├── db/                       # Database models & queries
│   │   ├── rag/                      # RAG implementation
│   │   └── main.py                   # FastAPI app entry
│   ├── requirements.txt              # Python dependencies
│   ├── tests/                        # Pytest test suite
│   └── scripts/                      # Utility scripts
│
├── datasets/                          # Training & knowledge data
├── docs/                             # Documentation
└── .github/workflows/                # CI/CD pipelines
```

---

## Setup Commands

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Environment setup (copy .env.example to .env.local)
cp .env.example .env.local

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Backend (Python FastAPI)
```bash
cd ai-agents

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn src.syncsenta_agents.main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Run specific test
pytest tests/test_lesson_architect_e2e.py -v
```

---

## Code Style Guidelines

### TypeScript / Next.js
- **Strict mode enabled**: All TypeScript code must pass strict type checking
- **Import aliases**: Use `@/` for imports from project root
  - `@/components/...`
  - `@/lib/...`
  - `@/app/...`
- **File naming**: kebab-case for files (`student-dashboard.tsx`)
- **Component naming**: PascalCase for React components
- **Client components**: Explicitly mark with `"use client"` directive when using hooks/interactivity
- **Server components**: Default in App Router, no directive needed
- **Async components**: Server components can be async for data fetching

### Python / FastAPI
- **PEP 8 compliance**: Follow Python style guide
- **Type hints**: Use Python type hints for all function signatures
- **Async/await**: Prefer async functions for I/O operations
- **Pydantic models**: Use for request/response validation
- **Module naming**: snake_case for all Python files
- **Class naming**: PascalCase for classes
- **Docstrings**: Google-style docstrings for all public functions

### General Conventions
- **Line length**: 100 characters max (Python), 120 characters max (TypeScript)
- **Indentation**: 2 spaces (TS/TSX), 4 spaces (Python)
- **Trailing commas**: Use in multiline arrays/objects
- **Quotes**: Double quotes for TypeScript, single quotes for Python
- **Comments**: Explain *why*, not *what*

---

## Testing

### Frontend
```bash
# Run Jest tests (if configured)
npm test

# Run Playwright e2e tests (if configured)
npm run test:e2e
```

### Backend
```bash
cd ai-agents

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src/syncsenta_agents --cov-report=html

# Run specific test file
pytest tests/test_lesson_architect_e2e.py -v

# Run tests matching pattern
pytest tests/ -k "metta" -v
```

**Coverage Target**: 80% for core agent logic

---

## Environment Variables

### Frontend (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000  # Dev
# NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com  # Prod
```

### Backend (ai-agents/.env)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# LLM Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Hyperon (optional, fallback available)
# No key needed - local runtime

# Optional
LOG_LEVEL=INFO
ENVIRONMENT=development
```

---

## Key Features & Components

### Authentication Flow
1. User signs up/logs in via Supabase Auth (`lib/auth.ts`)
2. JWT token stored in HTTP-only cookie
3. Server components use `getServerUser()` to validate session
4. Protected routes check auth status in layout/middleware

### AI Agent Flow
1. Frontend sends request to Next.js API route (`app/api/...`)
2. API route validates auth, forwards to Python backend
3. Python agent processes request using LLM + MeTTa policy
4. Response validated against policy rules (safeguarding, consent, etc.)
5. Result stored in Supabase + returned to frontend

### MeTTa Policy Integration
- **Policy file**: `ai-agents/knowledge/syncsenta_policy.metta`
- **Evaluator**: `hyperon_evaluator.py` (Hyperon runtime with Python fallback)
- **Usage**: All agent outputs pass through policy checks before delivery
- **Checks**: Safeguarding, consent, CBC alignment, assessment finalization

---

## Common Development Tasks

### Adding a New AI Agent
1. Create agent file in `ai-agents/src/syncsenta_agents/agents/`
2. Implement agent class with `process()` method
3. Add API route in `ai-agents/src/syncsenta_agents/api/`
4. Wire route in `main.py`
5. Add tests in `ai-agents/tests/`
6. Create frontend API proxy in `app/api/`
7. Add UI component in `components/` or `app/`

### Adding a New Dashboard Feature
1. Create component in `components/`
2. Add route in `app/dashboard/[feature]/`
3. Implement server-side data fetching
4. Add to sidebar navigation in `app-sidebar.tsx`
5. Ensure auth protection in layout

### Updating MeTTa Policy
1. Edit `ai-agents/knowledge/syncsenta_policy.metta`
2. Update `hyperon_evaluator.py` fallback if needed
3. Run tests: `pytest tests/test_metta_hyperon.py -v`
4. Restart backend service

---

## Deployment

### Vercel (Frontend)
- **Project**: ascendra-u1eu
- **Branch**: `main` (production), `staging` (preview)
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Environment variables**: Set in Vercel dashboard

### Render (Backend)
- **Service type**: Web Service
- **Build command**: `pip install -r ai-agents/requirements.txt`
- **Start command**: `cd ai-agents && uvicorn src.syncsenta_agents.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables**: Set in Render dashboard

---

## Critical Notes for AI Agents

### What NOT to do:
- ❌ Don't modify `.env.example` - it's a template
- ❌ Don't hardcode API keys or secrets
- ❌ Don't remove Supabase RLS policies without review
- ❌ Don't bypass MeTTa policy checks in production
- ❌ Don't create unsecured API endpoints
- ❌ Don't commit `.env` or `.env.local` files

### Best Practices:
- ✅ Always validate user input in API routes
- ✅ Use Supabase RLS for data access control
- ✅ Run policy checks on all agent outputs
- ✅ Write tests for new features
- ✅ Use type safety (TypeScript + Pydantic)
- ✅ Handle errors gracefully with user-friendly messages
- ✅ Log important events for debugging
- ✅ Keep dependencies up to date

### Performance Considerations:
- Use React Server Components for data fetching (reduces client JS)
- Implement streaming responses for long LLM completions
- Cache frequently accessed data (Supabase queries)
- Optimize images with Next.js Image component
- Use Suspense boundaries for async components

---

## Troubleshooting

### Frontend Issues
- **Build errors**: Check TypeScript types, run `npm run lint`
- **Auth not working**: Verify Supabase env vars, check cookie settings
- **404 on deployment**: Ensure App Router structure is correct

### Backend Issues
- **Import errors**: Check PYTHONPATH, ensure virtual env is activated
- **Hyperon not loading**: Check fallback is working (expected behavior)
- **Database errors**: Verify Supabase connection, check RLS policies
- **LLM timeout**: Increase timeout in multi_provider_client.py

---

## Documentation References
- **Next.js 14 Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Hyperon MeTTa**: https://github.com/trueagi-io/hyperon-experimental
- **Shadcn/ui**: https://ui.shadcn.com/

---

## Project Status
**Current Phase**: MVP Launch Preparation  
**Target**: 100% code completeness + security hardening  
**Last Updated**: 2026-08-29

See `ROADMAP.md` for detailed progress tracking.
