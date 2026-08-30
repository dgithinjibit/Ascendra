# 🗺️ CODE MAP - Developer Navigation Guide

**Last Updated**: 2026-05-25  
**Purpose**: Quick reference for finding code in the Ascendra/SyncSenta project

---

## 📁 PROJECT STRUCTURE

```
Ascendra/
├── studio/              # Frontend (Next.js 14, TypeScript, Tailwind)
├── ai-agents/           # Backend (Python FastAPI, Groq LLM)
├── supabase/            # Database (Postgres, migrations, RLS)
├── scheme-scribe/       # Legacy scheme generator (being deprecated)
└── arduino/             # ESP32-CAM hardware (out of scope)
```

---

## 🎨 FRONTEND (`studio/`)

### Core App Structure
```
studio/src/
├── app/                 # Next.js 14 App Router
│   ├── (auth)/         # Auth pages (login, signup)
│   ├── student/        # Student dashboard & learning
│   ├── teacher/        # Teacher dashboard & tools
│   ├── api/            # API routes (Next.js serverless)
│   └── layout.tsx      # Root layout with providers
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── teacher/       # Teacher-specific components
│   ├── student/       # Student-specific components
│   └── scheme-wizard/ # Scheme generation wizard
├── lib/               # Utilities & helpers
├── hooks/             # Custom React hooks
└── types/             # TypeScript type definitions
```

### Key Files by Feature

#### 🎓 Student Experience
- **Chat Interface**: [`studio/src/app/student/chat/page.tsx`](studio/src/app/student/chat/page.tsx)
- **Voice Input**: [`studio/src/hooks/use-speech-recognition.ts`](studio/src/hooks/use-speech-recognition.ts)
- **Progress Tracking**: [`studio/src/components/student/progress-dashboard.tsx`](studio/src/components/student/progress-dashboard.tsx)
- **Gamification**: [`studio/src/components/ui/achievement-system.tsx`](studio/src/components/ui/achievement-system.tsx)
- **Sandbox Activities**: [`studio/src/app/student/sandbox/`](studio/src/app/student/sandbox/)

#### 👨‍🏫 Teacher Dashboard
- **Main Dashboard**: [`studio/src/app/teacher/dashboard/page.tsx`](studio/src/app/teacher/dashboard/page.tsx)
- **Real-time Monitoring**: [`studio/src/components/teacher/student-list.tsx`](studio/src/components/teacher/student-list.tsx)
- **Analytics**: [`studio/src/components/teacher/analytics-tab.tsx`](studio/src/components/teacher/analytics-tab.tsx)
- **Quick Actions**: [`studio/src/components/teacher/quick-actions.tsx`](studio/src/components/teacher/quick-actions.tsx)
- **ROI Calculator**: [`studio/src/components/teacher/roi-calculator.tsx`](studio/src/components/teacher/roi-calculator.tsx)

#### 📝 Teacher Tools (Tier 1)
- **Scheme Generator**: [`studio/src/app/teacher/schemes/page.tsx`](studio/src/app/teacher/schemes/page.tsx)
- **Lesson Planner**: [`studio/src/app/teacher/lessons/page.tsx`](studio/src/app/teacher/lessons/page.tsx)
- **Exam Generator**: [`studio/src/app/teacher/exams/page.tsx`](studio/src/app/teacher/exams/page.tsx)
- **Text Leveler**: [`studio/src/app/teacher/leveler/page.tsx`](studio/src/app/teacher/leveler/page.tsx)
- **Worksheet Generator**: [`studio/src/app/teacher/worksheets/page.tsx`](studio/src/app/teacher/worksheets/page.tsx)
- **Standards Unpacker**: [`studio/src/app/teacher/unpacker/page.tsx`](studio/src/app/teacher/unpacker/page.tsx)

#### 🔧 Utilities & Infrastructure
- **API Client**: [`studio/src/lib/api-utils.ts`](studio/src/lib/api-utils.ts)
- **Caching**: [`studio/src/lib/cache.ts`](studio/src/lib/cache.ts)
- **Offline Queue**: [`studio/src/lib/offline-queue.ts`](studio/src/lib/offline-queue.ts)
- **Analytics**: [`studio/src/lib/analytics.ts`](studio/src/lib/analytics.ts)
- **Content Moderation**: [`studio/src/lib/content-moderation.ts`](studio/src/lib/content-moderation.ts)
- **Session Management**: [`studio/src/lib/session-manager.ts`](studio/src/lib/session-manager.ts)
- **Security Utils**: [`studio/src/lib/security-utils.ts`](studio/src/lib/security-utils.ts)
- **Error Messages**: [`studio/src/lib/error-messages.ts`](studio/src/lib/error-messages.ts)

#### 🔐 Authentication & Security
- **Auth Middleware**: [`studio/src/middleware.ts`](studio/src/middleware.ts)
- **Auth API**: [`studio/src/app/api/auth/route.ts`](studio/src/app/api/auth/route.ts)
- **Supabase Client**: [`studio/src/lib/supabase/client.ts`](studio/src/lib/supabase/client.ts)
- **Security Logger**: [`studio/src/lib/security-logger.ts`](studio/src/lib/security-logger.ts)

---

## 🐍 BACKEND (`ai-agents/`)

### Core Structure
```
ai-agents/src/syncsenta_agents/
├── api/                # FastAPI endpoints
│   ├── chat.py        # Student chat API
│   ├── teacher.py     # Teacher tools API
│   └── monitoring.py  # Real-time monitoring
├── agents/            # AI agent implementations
│   ├── socratic_mentor.py      # Student tutor
│   ├── scheme_architect.py     # Scheme generator
│   ├── lesson_architect.py     # Lesson planner
│   ├── assessment_agent.py     # Exam generator
│   ├── text_leveler.py         # Reading level adjuster
│   ├── worksheet_generator.py  # Worksheet creator
│   └── standards_unpacker.py   # Standards breakdown
├── db/                # Database utilities
│   └── supabase_client.py     # Supabase connection
├── core/              # Core logic
│   ├── curriculum.py  # CBC curriculum data
│   ├── prompts.py     # LLM prompts
│   └── validators.py  # Input validation
└── utils/             # Helper functions
```

### Key Files by Feature

#### 🤖 AI Agents
- **Socratic Mentor**: [`ai-agents/src/syncsenta_agents/agents/socratic_mentor.py`](ai-agents/src/syncsenta_agents/agents/socratic_mentor.py)
- **Scheme Architect**: [`ai-agents/src/syncsenta_agents/agents/scheme_architect.py`](ai-agents/src/syncsenta_agents/agents/scheme_architect.py)
- **Lesson Architect**: [`ai-agents/src/syncsenta_agents/agents/lesson_architect.py`](ai-agents/src/syncsenta_agents/agents/lesson_architect.py)
- **Assessment Agent**: [`ai-agents/src/syncsenta_agents/agents/assessment_agent.py`](ai-agents/src/syncsenta_agents/agents/assessment_agent.py)

#### 🔌 API Endpoints
- **Chat API**: [`ai-agents/src/syncsenta_agents/api/chat.py`](ai-agents/src/syncsenta_agents/api/chat.py)
- **Teacher Tools API**: [`ai-agents/src/syncsenta_agents/api/teacher.py`](ai-agents/src/syncsenta_agents/api/teacher.py)
- **Monitoring API**: [`ai-agents/src/syncsenta_agents/api/monitoring.py`](ai-agents/src/syncsenta_agents/api/monitoring.py)

#### 📚 Curriculum & Data
- **CBC Curriculum**: [`ai-agents/src/syncsenta_agents/core/curriculum.py`](ai-agents/src/syncsenta_agents/core/curriculum.py)
- **Prompts Library**: [`ai-agents/src/syncsenta_agents/core/prompts.py`](ai-agents/src/syncsenta_agents/core/prompts.py)

---

## 🗄️ DATABASE (`supabase/`)

### Migrations
```
supabase/migrations/
├── 20260525_voice_call_tables.sql           # Voice conversation tables
├── 20260526000001_enable_rls_remaining_tables.sql  # RLS policies
└── [other migrations...]
```

### Key Tables

#### 👤 User Management
- `profiles` - User profiles (student/teacher/parent)
- `user_roles` - Role assignments
- `user_preferences` - User settings

#### 💬 Chat & Learning
- `chat_sessions` - Student chat history
- `chat_messages` - Individual messages
- `student_progress` - Learning progress tracking
- `achievements` - Gamification badges
- `voice_conversations` - Voice chat sessions
- `voice_messages` - Voice message transcripts

#### 📊 Teacher Tools
- `schemes_of_work` - Generated schemes
- `lesson_plans` - Generated lesson plans
- `assessments` - Generated exams/quizzes
- `worksheets` - Generated worksheets
- `teacher_feedback` - Teacher ratings of AI outputs (NEW)

#### 📈 Analytics & Monitoring
- `student_activity` - Activity logs
- `intervention_alerts` - Real-time alerts
- `analytics_events` - Custom event tracking
- `behavioral_profiles` - MeTTa telemetry
- `misconceptions` - Detected misconceptions
- `xapi_statements` - xAPI learning records

---

## 🔑 KEY CONCEPTS

### Authentication Flow
1. User signs up/logs in via [`studio/src/app/(auth)/`](studio/src/app/(auth)/)
2. Supabase handles auth tokens
3. Middleware validates on each request: [`studio/src/middleware.ts`](studio/src/middleware.ts)
4. RLS policies enforce data access in database

### AI Generation Flow
1. Frontend form collects inputs (e.g., scheme wizard)
2. API route validates and forwards to backend: [`studio/src/app/api/`](studio/src/app/api/)
3. Backend agent processes with Groq LLM: [`ai-agents/src/syncsenta_agents/agents/`](ai-agents/src/syncsenta_agents/agents/)
4. Result saved to Supabase and returned to frontend
5. Frontend displays with preview/export options

### Real-time Monitoring
1. Student activity tracked in `student_activity` table
2. Triggers create `intervention_alerts` for concerning patterns
3. Teacher dashboard subscribes to real-time updates
4. Alerts appear instantly with quick action buttons

---

## 🚀 COMMON TASKS

### Adding a New Teacher Tool
1. Create agent in [`ai-agents/src/syncsenta_agents/agents/`](ai-agents/src/syncsenta_agents/agents/)
2. Add API endpoint in [`ai-agents/src/syncsenta_agents/api/teacher.py`](ai-agents/src/syncsenta_agents/api/teacher.py)
3. Create frontend page in [`studio/src/app/teacher/`](studio/src/app/teacher/)
4. Add to sidebar in [`studio/src/components/teacher/sidebar.tsx`](studio/src/components/teacher/sidebar.tsx)
5. Add database table in [`supabase/migrations/`](supabase/migrations/)

### Adding a New Student Feature
1. Create component in [`studio/src/components/student/`](studio/src/components/student/)
2. Add page in [`studio/src/app/student/`](studio/src/app/student/)
3. Update Socratic Mentor if needed: [`ai-agents/src/syncsenta_agents/agents/socratic_mentor.py`](ai-agents/src/syncsenta_agents/agents/socratic_mentor.py)
4. Track analytics: [`studio/src/lib/analytics.ts`](studio/src/lib/analytics.ts)

### Debugging Issues
- **Frontend errors**: Check browser console + [`studio/src/lib/error-messages.ts`](studio/src/lib/error-messages.ts)
- **API errors**: Check Render logs (backend) or Vercel logs (frontend API routes)
- **Database errors**: Check Supabase logs + RLS policies
- **Auth issues**: Check [`studio/src/middleware.ts`](studio/src/middleware.ts) + Supabase auth logs

---

## 📦 DEPENDENCIES

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **State**: React hooks + Zustand (minimal)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Backend
- **Framework**: FastAPI
- **LLM**: Groq (llama-3.1-70b-versatile)
- **Database**: Supabase (Postgres)
- **Rate Limiting**: Upstash Redis
- **Testing**: Pytest

---

## 🔗 EXTERNAL SERVICES

- **Supabase**: https://app.supabase.com (project URL stored in Vercel env vars only)
- **Backend API**: https://ascendra-1.onrender.com
- **Frontend**: https://sentastudio.vercel.app
- **Upstash Redis**: (rate limiting)

---

## 📞 NEED HELP?

1. Check this CODE_MAP.md
2. Review [`IMPLEMENTATION_STATUS.md`](IMPLEMENTATION_STATUS.md) for feature status
3. Check [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for roadmap
4. Review [`REMAINING_TASKS.md`](REMAINING_TASKS.md) for pending work
5. Check [`.claude/CLAUDE.md`](.claude/CLAUDE.md) for technical details

---

**Happy coding! 🚀**
