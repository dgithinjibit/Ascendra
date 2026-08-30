# Ascendra/SyncSenta - Project Status & Roadmap

**Last Updated**: 2026-08-29  
**Project**: AI-Powered CBC Education Platform for Kenya  
**Status**: Active Development - 78% Complete

---

## 🎯 Project Overview

Ascendra (branded as SyncSenta) is an AI-powered educational platform designed specifically for Kenya's Competency-Based Curriculum (CBC). It provides:

- **For Students**: Socratic AI tutor (SyncSenta) with voice support, gamification, and adaptive learning
- **For Teachers**: AI-powered lesson planning, scheme generation, assessment creation, and real-time student monitoring
- **For Parents**: Progress tracking and engagement portal (planned)

---

## ✅ COMPLETED FEATURES

### Core Infrastructure (100%)
- ✅ Supabase authentication (email/password + Google OAuth)
- ✅ Upstash Redis rate limiting (50 msgs/day free tier, unlimited paid)
- ✅ Row-Level Security (RLS) policies
- ✅ Real-time subscriptions for live data
- ✅ Multi-device sync
- ✅ PWA with offline support
- ✅ Vercel deployment pipeline

### Student Experience (80%)
- ✅ Socratic AI tutor (SyncSenta) with Groq LLM
- ✅ Voice input/output (Web Speech API)
- ✅ Progress tracking and visualization
- ✅ Gamification (badges, streaks)
- ✅ Interactive sandbox with manipulatives (fractions, counting)
- ✅ Mobile-responsive design (320px - 1920px)
- ✅ Chat history persistence
- ⚠️ Adaptive difficulty (partial - needs more work)
- ⚠️ Subject-specific learning paths (partial)

### Teacher Dashboard (100%)
- ✅ Real-time student monitoring
- ✅ Live intervention alerts
- ✅ Quick action buttons (hint, encourage, redirect)
- ✅ Analytics dashboard (Recharts visualizations)
- ✅ Student detail modal with tabs
- ✅ Bulk operations (assign students, export reports)
- ✅ Browser notifications for alerts
- ✅ CSV/JSON export

### Teacher Tools - Tier 1 (100%)
- ✅ **Scheme of Work Generator** - CBC-aligned, 10-column format, KSA-balanced
- ✅ **Lesson Plan Generator** - Structured JSON format with activities, assessments, differentiation
- ✅ **Exam Generator** - MCQ/Short/Long questions with scope validation
- ✅ **Text Leveler** - Adjust reading levels with comprehension questions
- ✅ **Worksheet Generator** - 12-item KSA-balanced worksheets
- ✅ **Standards Unpacker** - I-Can statements and success criteria

### Teacher Tools - Tier 2 (20%)
- ✅ **Differentiation Tool** - Support/OnGrade/Extension tiers with CBC-SNE alignment
- ❌ Rubric generator (not started)
- ❌ CAT item bank (not started)
- ❌ Scheme → weekly expansion (not started)
- ❌ AI-resistant assignments (not started)

### MeTTa Adaptive Learning - Phase 1 (100%)
- ✅ Behavioral telemetry capture (dwell, pathing, erasure, tool-usage)
- ✅ xAPI statement generation
- ✅ Misconception detection
- ✅ Intervention planning
- ✅ Database persistence (raw_events, behavioral_profiles, misconceptions, intervention_plans, xapi_statements)

### Recent Fixes (2026-05-26)
- ✅ Fixed schemes page 500 SSR errors (AppHeader, AppSidebar, SchemeOfWorkGenerator)
- ✅ Enhanced teacher sidebar with 10 navigation items
- ✅ Fixed teacher sidebar 500 error (replaced server action with client-side cookies)

### Recent Fixes (2026-08-29)
- ✅ **"Continue as [role]" dashboard navigation** — clicking any role card now lands directly on that role's dashboard without an extra button click
  - `page.tsx`: `handleContinue` checks for an existing Supabase session first; if signed in → goes straight to `role.redirect`; if not → goes to `/login?next=<destination>`
  - `dashboard/page.tsx`: `RoleRedirectCard` auto-navigates via `useEffect` + `router.replace()` instead of waiting for a manual button click (fallback button kept)
  - `login/page.tsx`: default post-login redirect changed from `/teacher` → `/dashboard` (the role-aware hub) so all roles land correctly
- ✅ **Supabase-backed personalization** — `test-personalization/route.ts` now reads real profile and progress data from Supabase instead of hardcoded mock data; falls back to zero-state for new users
- ✅ **Telemetry persistence** — `telemetry_api.py` and `dashboard.py` now write all behavioral data (sessions, events, profiles, misconceptions, interventions, xAPI statements) to Supabase best-effort
- ✅ **CORS security hardened** — `api.py` wildcard `allow_origins=["*"]` replaced with explicit origin list; `scheme_server.py` production fallback fixed from localhost to `sentastudio.vercel.app`; `allow_headers` tightened on both
- ✅ **Request payload logging removed** — `offline/resolve/route.ts` no longer logs full request body to console in production

---

## 🚧 IN PROGRESS

### Current Sprint (2026-08-29)
1. **Demo flow ready for production testing** — role cards → direct dashboard navigation working end-to-end
2. **Vercel env vars** — `NEXT_PUBLIC_DEMO_MODE=true` must be set in Vercel dashboard before deploy
3. **Render env vars** — `GROQ_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` must be confirmed in Render dashboard
4. **Auth wall** — `AUTH_WALL_ENABLED=false` intentional for demo/presentation; flip to `true` when real user onboarding begins

---

## ❌ NOT STARTED / PLANNED

### High Priority (Next 4 Weeks)

#### Payment Integration
- ❌ M-Pesa integration (Safaricom Daraja API)
- ❌ Stripe integration (international payments)
- ❌ Subscription management (upgrade/downgrade/cancel)
- ❌ Pricing page with clear value propositions

#### CBC Curriculum Deep Integration
- ❌ Complete curriculum mapping (Grade 1-9)
- ❌ 500+ practice questions per subject
- ❌ 1000+ Kenyan-context examples
- ❌ Regional variations (Nairobi, Mombasa, Kisumu, rural)

#### Performance Optimization
- ❌ Lighthouse score 90+ (currently ~70)
- ❌ Bundle size reduction (code splitting, lazy loading)
- ❌ CDN for static assets
- ❌ Database query optimization (caching)

### Medium Priority (Next 8 Weeks)

#### Parent Portal
- ❌ Parent dashboard
- ❌ Weekly progress reports (email + in-app)
- ❌ Homework tracking
- ❌ Direct messaging with teachers
- ❌ Co-learning mode

#### Teacher Tools - Tier 3
- ❌ Class roster + per-learner notes
- ❌ Parent communication drafter (Kiswahili ↔ English)
- ❌ Learner progress report comments
- ❌ Individual Learning Plan generator (KICD-SNE)

#### Security & Compliance
- ✅ CORS locked to known origins (all FastAPI servers)
- ✅ CSP, HSTS, X-Frame-Options, Permissions-Policy headers (middleware)
- ✅ Rate limiting — in-memory (signup/onboarding) + Upstash Redis (chat)
- ✅ Supabase RLS policies on all data tables
- ✅ Service role key server-only (never exposed to browser)
- ✅ Request payload logging removed from API routes
- ❌ Multi-factor authentication (SMS OTP)
- ❌ GDPR-compliant data deletion
- ❌ Content safety (profanity filter, AI moderation)
- ❌ Audit logs for AI interactions

#### Monitoring & Observability
- ❌ Sentry integration (error tracking)
- ❌ PostHog/Plausible (analytics)
- ❌ UptimeRobot (uptime monitoring)
- ❌ Status page

### Low Priority (Future)

#### Advanced Features
- ❌ Local AI fallback for offline
- ❌ Mother tongue support (Kikuyu, Luo, Luhya)
- ❌ YouTube/PDF → lesson plan
- ❌ Image → activity (OCR)
- ❌ Podcast/audio lessons

#### MeTTa Phase 2
- ❌ Expanded misconception types
- ❌ Teacher dashboard for misconception trends
- ❌ Adaptive difficulty based on telemetry

---

## 📊 COMPLETION METRICS

### Overall Progress
- **Core Infrastructure**: 100% ✅
- **Student Experience**: 80% ⚠️
- **Teacher Dashboard**: 100% ✅
- **Teacher Tools Tier 1**: 100% ✅
- **Teacher Tools Tier 2**: 20% ⚠️
- **MeTTa Phase 1**: 100% ✅
- **Auth & Navigation Flow**: 100% ✅  ← _was broken, now fixed_
- **Security Hardening**: 70% ⚠️  ← _CORS, CSP, rate limiting done; MFA/audit logs pending_
- **Payment Integration**: 0% ❌
- **Parent Portal**: 0% ❌
- **Monitoring & Observability**: 0% ❌

**Total Project Completion**: ~78%

### Time Estimates
- **To MVP Launch**: 2-3 weeks (with payment integration)
- **To Competition Ready**: 6-8 weeks (with pilot results)
- **To Full Feature Parity**: 12-16 weeks

---

## 🗂️ PROJECT STRUCTURE

```
Ascendra/
├── ai-agents/          # Python FastAPI backend (Groq LLM, agents)
├── studio/             # Next.js frontend (TypeScript, React)
├── supabase/           # Database migrations and schema
├── arduino/            # ESP32-CAM hardware (out of scope)
├── scheme-scribe/      # Legacy scheme generator (being merged)
└── scripts/            # Deployment and utility scripts
```

### Key Files
- `ai-agents/src/syncsenta_agents/api/` - API endpoints
- `ai-agents/src/syncsenta_agents/agents/` - AI agent implementations
- `studio/src/app/` - Next.js pages and routes
- `studio/src/components/` - React components
- `supabase/migrations/` - Database schema migrations

---

## 🎯 DIFFERENTIATORS

What makes Ascendra unique:

1. **CBC-Native** - Built specifically for Kenya's Competency-Based Curriculum
2. **Kiswahili-First** - Native generation, not translation
3. **Offline-Capable** - PWA with offline support for low-connectivity areas
4. **Voice-First** - Critical for younger learners
5. **Teacher-in-the-Loop** - Empowering teachers, not replacing them
6. **Culturally Authentic** - Kenyan examples, contexts, and celebrations
7. **Affordable** - Pricing designed for Kenyan teacher salaries

---

## 💰 BUSINESS MODEL

### Free Tier
- 50 AI chat messages per day
- Access to 3 subjects
- Basic progress tracking
- Community support

### Student Premium ($2.99/month or KES 400/month)
- Unlimited AI chat messages
- All subjects
- Advanced analytics
- Priority support
- Offline mode
- Ad-free

### School/Teacher Plan ($49/month or KES 6,500/month for 50 students)
- All premium features for students
- Teacher dashboard
- Bulk content generation
- Custom branding
- Dedicated account manager
- Training and onboarding

---

## 🚀 DEPLOYMENT

### Production URLs
- **Frontend**: https://sentastudio.vercel.app
- **Backend**: https://ascendra-1.onrender.com
- **Supabase**: https://app.supabase.com (project URL in Vercel/Render env vars only)

### Environment Variables
See `.env.example` for required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

---

## 📝 ACTIVE SPECS

Located in `.kiro/specs/`:
1. **curriculum-alignment-validator** - Validate CBC alignment
2. **lesson-plan-workflow-improvement** - Enhance lesson planning UX
3. **schemes-page-500-error-fix** - Fixed SSR errors (COMPLETE)
4. **tier-1-completion** - Teacher tools Tier 1 (COMPLETE)

---

## 🗑️ DEPRECATED/OBSOLETE

The following files are outdated and can be archived:
- `BACKEND_CONSOLIDATION.txt` - Superseded by current architecture
- `REPOSITORY_STRUCTURE.txt` - Outdated structure info
- `SCHEME_INTEGRATION_SUMMARY.md` - Completed integration
- `SCHEME_TO_LESSON_PLAN_FLOW.md` - Now in CLAUDE.md
- `SUPABASE_MISSING_TABLES.sql` - Tables now migrated
- `TECHDISRUPT_YC_TASKS.md` - Merged into REMAINING_TASKS.md

---

## 📚 DOCUMENTATION

### Primary Docs (Keep)
- `PROJECT_STATUS.md` (this file) - Central project status
- `.claude/CLAUDE.md` - Technical architecture and active tasks
- `REMAINING_TASKS.md` - Detailed task breakdown
- `TIER1_IMPLEMENTATION.md` - Tier 1 teacher tools documentation
- `TEACHER_SIDEBAR_ENHANCEMENT.md` - Sidebar navigation documentation
- `DEPLOYMENT_COMPLETE_GUIDE.md` - Deployment instructions
- `TESTING_GUIDE.md` - Testing procedures

### Secondary Docs (Archive)
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - One-time checklist
- `RATE_LIMIT_HANDLING.md` - Implementation details
- `TIER1_QUICK_START.md` - Quick start guide
- `TRAINING_DATA_EXPORT.md` - Data export procedures

---

## 🤝 CONTRIBUTING

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run `npm run build` and `pytest` locally
4. Push and create PR
5. Deploy to Vercel preview
6. Merge to `main` after review

### Code Standards
- TypeScript for frontend (strict mode)
- Python 3.11+ for backend (type hints required)
- Prettier for formatting
- ESLint for linting
- Pytest for backend tests

---

## 📞 SUPPORT

For questions or issues:
1. Check this document first
2. Review `.claude/CLAUDE.md` for technical details
3. Check `REMAINING_TASKS.md` for task status
4. Review relevant spec in `.kiro/specs/`

---

## 🎉 RECENT WINS

- ✅ Teacher dashboard with real-time monitoring (2026-05-22)
- ✅ All Tier 1 teacher tools complete (2026-05-22)
- ✅ MeTTa Phase 1 telemetry system (2026-05-23)
- ✅ Differentiation tool (Tier 2) (2026-05-24)
- ✅ Fixed schemes page 500 errors (2026-05-26)
- ✅ Enhanced teacher sidebar navigation (2026-05-26)
- ✅ "Continue as [role]" → direct dashboard navigation (2026-08-29)
- ✅ Supabase-backed real personalization data (2026-08-29)
- ✅ Full telemetry persistence to Supabase (2026-08-29)
- ✅ CORS hardened across all FastAPI servers (2026-08-29)

---

**Next Milestone**: Set Vercel `NEXT_PUBLIC_DEMO_MODE=true` + confirm Render env vars → push `staging` → test demo flow in production → payment integration
