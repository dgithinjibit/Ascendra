# Ascendra/SyncSenta - Comprehensive Project Guide

**Last Updated**: 2026-08-30  
**Status**: 78% Complete | Ready for MVP with 4-6 weeks of payment + parent portal work  
**Deployment**: Vercel (frontend) + Render (backend)

---

## 📚 Quick Navigation

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Current Implementation Status](#-current-implementation-status)
- [Getting Started](#-getting-started)
- [Deployment & Infrastructure](#-deployment--infrastructure)
- [Development Workflow](#-development-workflow)
- [Testing Strategy](#-testing-strategy)
- [Known Issues & Workarounds](#-known-issues--workarounds)
- [Next Steps](#-next-steps)

---

## 🎯 Project Overview

Ascendra (branded as **SyncSenta**) is an AI-powered educational platform built specifically for Kenya's Competency-Based Curriculum (CBC).

### User Personas

| Role | What They Use | Key Features |
|------|---------------|--------------|
| **Student** | Web/PWA app | AI tutor, voice Q&A, progress tracking, gamification |
| **Teacher** | Web dashboard | Real-time student monitoring, lesson/scheme generators, assessments |
| **Parent** | Web dashboard (planned) | Progress reports, homework tracking, messaging |
| **Admin** | Web dashboard (planned) | School management, user admin, reporting |

### Key Differentiators
1. **CBC-Native** - Built for Kenya's curriculum, not a translation
2. **Kiswahili-First** - Native language generation (not translation)
3. **Offline-Capable** - PWA works in low-connectivity areas
4. **Teacher-Empowering** - AI assists, doesn't replace teachers
5. **Culturally Authentic** - Kenyan examples and contexts
6. **Affordable** - Pricing designed for teacher budgets (KES 400/month for students)

---

## 🏗️ Architecture

### Tech Stack

**Frontend (Vercel)**
- Next.js 14 (TypeScript, React)
- Tailwind CSS
- Shadcn UI components
- Real-time subscriptions via Supabase
- PWA with Service Worker
- Web Speech API (TTS/STT)

**Backend (Render)**
- Python FastAPI
- Groq LLM (fast, Kiswahili-capable)
- Agent framework (LangChain-style)
- Behavioral telemetry capture

**Database (Supabase)**
- PostgreSQL with PostGIS
- Row-Level Security (RLS)
- Real-time subscriptions
- Vector search (pgvector) for embeddings

**Infrastructure**
- Vercel (frontend deployment)
- Render (backend API + workers)
- Upstash Redis (rate limiting)
- Supabase (database + auth)

### System Diagram

```
┌─────────────────────────────────────┐
│   Frontend (Vercel)                 │
│   ├─ Next.js App                    │
│   ├─ Student Dashboard              │
│   ├─ Teacher Dashboard              │
│   └─ Auth Pages                     │
└────────────┬────────────────────────┘
             │ HTTP/WebSocket
             ▼
┌─────────────────────────────────────┐
│   Backend API (Render)              │
│   ├─ /api/chat                      │
│   ├─ /api/generate/*                │
│   ├─ /api/telemetry                 │
│   └─ Groq LLM Integration           │
└────────────┬────────────────────────┘
             │ SQL
             ▼
┌─────────────────────────────────────┐
│   Database (Supabase/PostgreSQL)    │
│   ├─ Profiles                       │
│   ├─ Conversations                  │
│   ├─ Progress                       │
│   ├─ Telemetry Events               │
│   └─ Schools/Classes                │
└─────────────────────────────────────┘
```

### Key Integration Points

1. **Authentication**: Supabase Auth → stored in cookies + Supabase session
2. **Rate Limiting**: Upstash Redis → keyed by user_id (50 msgs/day free tier)
3. **Streaming Chat**: Next.js API route streams to client (Server-Sent Events)
4. **Real-time Updates**: Supabase realtime channel for alerts, progress
5. **Offline Queue**: Service Worker queues requests during offline, syncs on reconnect
6. **Telemetry**: FastAPI endpoint captures behavioral events, writes to Supabase

---

## ✅ Current Implementation Status

### Tier 1: Complete & Production-Ready

**Core Infrastructure (100%)**
- ✅ Supabase Auth (email/password + Google OAuth)
- ✅ Upstash Redis rate limiting
- ✅ RLS policies on all data tables
- ✅ Real-time subscriptions
- ✅ CORS security hardening
- ✅ CSP + security headers

**Student Experience (80%)**
- ✅ Socratic AI tutor (SyncSenta) with streaming chat
- ✅ Voice input/output (Web Speech API)
- ✅ Progress tracking (topics, mastery %)
- ✅ Gamification (badges, streaks, points)
- ✅ Chat history persistence
- ✅ Mobile-responsive design
- ⚠️ Adaptive difficulty (basic version, needs refinement)
- ⚠️ Subject-specific learning paths (partial)

**Teacher Dashboard (100%)**
- ✅ Real-time student monitoring
- ✅ Live intervention alerts
- ✅ Quick action buttons (hint, encourage, redirect, message)
- ✅ Analytics dashboard (Recharts)
- ✅ Student detail modal with tabs
- ✅ Bulk operations (assign, export)
- ✅ CSV/JSON export
- ✅ Browser notifications

**Teacher Tools - Tier 1 (100%)**
- ✅ **Scheme of Work Generator** - CBC-aligned, 10-column format
- ✅ **Lesson Plan Generator** - Structured JSON, activities, assessments
- ✅ **Assessment/Exam Generator** - MCQ/Short/Long questions
- ✅ **Text Leveler** - Adjust reading difficulty + comprehension questions
- ✅ **Worksheet Generator** - 12-item KSA-balanced worksheets
- ✅ **Standards Unpacker** - I-Can statements + success criteria

**Teacher Tools - Tier 2 (20%)**
- ✅ Differentiation Tool (Support/OnGrade/Extension tiers)
- ❌ Rubric Generator (not started)
- ❌ CAT Item Bank (not started)

**MeTTa Adaptive Learning - Phase 1 (100%)**
- ✅ Behavioral telemetry capture (dwell, pathing, erasure, tool usage)
- ✅ Misconception detection
- ✅ Intervention planning
- ✅ xAPI statement generation
- ✅ Database persistence

**Auth & Navigation Flow (100%)**
- ✅ Role-based dashboards (student → /student, teacher → /teacher/dashboard)
- ✅ Direct navigation from role card
- ✅ Test account quick login buttons
- ✅ Demo mode flag (AUTH_WALL_ENABLED)

### Tier 2: Incomplete or Missing

**Payment Integration (0%)**
- ❌ M-Pesa (Safaricom Daraja API)
- ❌ Stripe (international)
- ❌ Subscription management
- ❌ Pricing page

**Parent Portal (0%)**
- ❌ Parent dashboard
- ❌ Progress reports (email + in-app)
- ❌ Homework tracking
- ❌ Teacher messaging

**Advanced Security (40%)**
- ✅ CORS + CSP headers
- ✅ Rate limiting (chat messages)
- ✅ RLS policies
- ❌ Multi-factor authentication (SMS OTP)
- ❌ GDPR-compliant data deletion
- ❌ Content safety (profanity filter, AI output moderation)
- ❌ Audit logs for AI interactions

**Monitoring & Observability (0%)**
- ❌ Error tracking (Sentry)
- ❌ Analytics (PostHog/Plausible)
- ❌ Uptime monitoring (UptimeRobot)
- ❌ Status page

**Curriculum & Content (30%)**
- ⚠️ CBC curriculum mapping (examples only, not 500+ questions per subject)
- ⚠️ Kenyan contextualization (basic examples, not 1000+ deep)
- ❌ Regional variations (Nairobi, Mombasa, Kisumu, etc.)

**Performance (20%)**
- ❌ Lighthouse score 90+ (currently ~70)
- ❌ Code splitting & lazy loading
- ❌ Image compression
- ❌ Font subsetting

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account (free tier OK)
- Render account (free tier OK)
- Groq API key (free tier: 30 reqs/min)

### Local Setup

**1. Clone & Install**
```bash
git clone https://github.com/yourusername/ascendra.git
cd ascendra

# Frontend
cd studio
npm install

# Backend
cd ../ai-agents
pip install -r requirements.txt
```

**2. Environment Variables**

**Studio (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_DEMO_MODE=true
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

**Backend (.env)**
```env
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
DATABASE_URL=your_postgres_url
REDIS_URL=your_redis_url
```

**3. Run Locally**
```bash
# Terminal 1: Frontend
cd studio
npm run dev

# Terminal 2: Backend
cd ai-agents
python -m uvicorn src.syncsenta_agents.api.api:app --reload --port 8000
```

**4. Test Quick Login**
- Go to http://localhost:3000/auth/signin
- Click "Continue as student01" (or teacher/parent/admin)
- Password: `TestPassword123!`

---

## 🌐 Deployment & Infrastructure

### Frontend (Vercel)

**Environment Variables** (Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_DEMO_MODE=true (for demo), false (for production)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

**Deployment**
- URL: https://sentastudio.vercel.app
- Branch: `main` (auto-deploys)
- Build: `npm run build`

### Backend (Render)

**Environment Variables** (Settings → Environment)
```
GROQ_API_KEY=your_groq_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
ENVIRONMENT=production
```

**Deployment**
- URL: https://ascendra-1.onrender.com
- Build: `pip install -r requirements.txt`
- Start: `gunicorn ...` or `uvicorn ...`
- Keep-alive: Render auto-keeps-alive on paid tier ($7/month)

### Database (Supabase)

**Setup Steps**
1. Create project at supabase.com
2. Run migrations: `supabase db push`
3. Enable RLS on all tables
4. Set up authentication: Email + Google OAuth
5. Create storage bucket for uploads (if needed)

**Key Tables**
- `profiles` - User metadata (role, grade, school)
- `chat_sessions` - Conversation history
- `chat_messages` - Individual messages
- `progress_tracking` - Student mastery data
- `raw_events` - Behavioral telemetry
- `behavioral_profiles` - Aggregated student behavior
- `misconceptions` - Detected misconceptions
- `intervention_plans` - Planned interventions
- `students` - Student records (linked to profiles)

---

## 💻 Development Workflow

### File Structure
```
studio/
├── src/
│   ├── app/               # Next.js pages & API routes
│   │   ├── auth/          # Auth pages (signin, signup, callback)
│   │   ├── student/       # Student dashboard & pages
│   │   ├── teacher/       # Teacher dashboard & pages
│   │   ├── api/           # API routes (chat, generate, telemetry)
│   │   └── dashboard/     # Role redirect page
│   ├── components/        # React components
│   │   ├── auth/          # Auth forms
│   │   ├── student/       # Student UI
│   │   ├── teacher/       # Teacher UI
│   │   └── ui/            # Shadcn UI components
│   ├── lib/               # Utilities & helpers
│   │   ├── supabase/      # Supabase clients
│   │   ├── rate-limit-*.ts # Rate limiting
│   │   ├── progress-tracking.ts
│   │   └── gamification/  # Points, badges, streaks
│   └── styles/            # Global styles
├── public/
│   └── sw.js              # Service Worker for PWA
└── scripts/
    └── seed-test-accounts.ts # Create demo accounts

ai-agents/
├── src/syncsenta_agents/
│   ├── agents/            # LLM agents (SyncSenta, lesson planner, etc)
│   ├── api/               # FastAPI routes
│   ├── tools/             # Agent tools (generators, analyzers)
│   └── utils/             # Helpers
└── requirements.txt
```

### Adding a New Feature

1. **Frontend**: Create component in `components/`, hook into page
2. **Backend**: Add endpoint in `api-agents/src/syncsenta_agents/api/`
3. **Database**: If needed, create migration & run `supabase db push`
4. **Test**: Use quick-login buttons on `/auth/signin`
5. **Deploy**: Push to `main` (auto-deploys to Vercel + Render)

### Common Tasks

**Add a new API endpoint:**
```typescript
// studio/src/app/api/my-endpoint/route.ts
export async function POST(request: Request) {
  const { /* params */ } = await request.json();
  // Logic here
  return Response.json({ result });
}
```

**Add a Supabase table:**
```bash
supabase migration new add_my_table
# Edit migration file
supabase db push
```

**Update rate limiting logic:**
```typescript
// studio/src/lib/rate-limit-upstash.ts
// Modify checkRateLimit() function
```

---

## 🧪 Testing Strategy

### Manual Testing

**Test Accounts**
| Role | Email | Password |
|------|-------|----------|
| Student | student01@ascendra.test | TestPassword123! |
| Teacher | teacher01@ascendra.test | TestPassword123! |
| Parent | parent01@ascendra.test | TestPassword123! (WIP) |
| Admin | admin01@ascendra.test | TestPassword123! (WIP) |

**Quick Test Flow**
1. Go to `/auth/signin`
2. Click "Continue as student01"
3. Click a topic → chat should work
4. Refresh page → should retain chat history
5. Close browser → re-open → should show offline message

**Teacher Testing**
1. Go to `/auth/signin` → "Continue as teacher01"
2. Go to `/teacher/dashboard`
3. Should see student list (populated from seeds)
4. Click on a student → see details modal

### Automated Testing

**Setup (if implementing)**
```bash
npm install --save-dev vitest @testing-library/react
```

**Test Example**
```typescript
// studio/src/components/student/__tests__/SocraticMentor.test.tsx
import { render, screen } from '@testing-library/react';
import { SocraticMentor } from '../SocraticMentor';

describe('SocraticMentor', () => {
  it('renders chat input', () => {
    render(<SocraticMentor />);
    expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument();
  });
});
```

---

## 🐛 Known Issues & Workarounds

### Issue 1: Render Keep-Alive
**Problem**: Render free tier hibernates after 15 min inactivity  
**Workaround**: Upgrade to Render paid tier ($7/month) or add periodic pings  
**Fix Planned**: Monitor Render status page, implement health check endpoint

### Issue 2: Slow Groq API Responses
**Problem**: First token takes 500ms+ during peak hours  
**Workaround**: None (API limitation)  
**Mitigation**: Cache common question patterns, add "thinking..." UI

### Issue 3: Offline Sync Conflicts
**Problem**: Multi-device edits can conflict when reconnecting  
**Status**: Partial fix implemented (conflict detection, retry UI)  
**TODO**: Full conflict resolution strategy

### Issue 4: Low Bandwidth Mode Incomplete
**Problem**: CSS toggle added but image lazy-loading not implemented  
**Status**: ~80% done  
**TODO**: Lazy-load images, compress fonts, reduce animations

---

## 📋 Next Steps (Priority Order)

### Immediate (This Week)
- [x] Fix parent-dashboard.tsx duplicate export (DONE)
- [x] Set up test accounts (DONE)
- [x] Add quick-login buttons (DONE)
- [ ] Document Render backend setup
- [ ] Update deployment guides

### Short Term (Next 2-4 Weeks)
1. **Payment Integration** - M-Pesa + Stripe (CRITICAL BLOCKER)
2. **Parent Portal** - Basic dashboard + reports
3. **Performance** - Lighthouse 85+
4. **Content** - 500+ practice questions per subject

### Medium Term (Weeks 5-8)
1. **Advanced Security** - MFA, GDPR compliance, audit logs
2. **Monitoring** - Sentry + PostHog
3. **Teacher Tools Tier 2** - Rubric generator, item bank
4. **Pilot Program** - Run with 3-5 schools

### Long Term (Weeks 9-16)
1. **Full Production Readiness** - All security, monitoring, content
2. **Advanced Features** - Local AI fallback, mother tongue support
3. **Scale Optimization** - Database tuning, CDN, caching
4. **Market Expansion** - Partnerships, marketing

---

## 📞 Support & Resources

**Documentation**
- [PROJECT_STATUS.md](../PROJECT_STATUS.md) - Current status & roadmap
- [REMAINING_TASKS.md](../REMAINING_TASKS.md) - What's left to do
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Dev setup & guidelines

**External**
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Groq API: https://console.groq.com
- Render Docs: https://render.com/docs

**Contact**
- GitHub Issues: [Report bugs](https://github.com/yourusername/ascendra/issues)
- Email: support@ascendra.dev (TBD)

---

**Last Updated**: 2026-08-30  
**Maintained By**: Development Team  
**Next Review**: 2026-09-13
