# Architecture

## Executive view

Ascendra is a repository of related education products rather than a single
monolithic application. The principal implemented path is a Next.js
application called Studio, backed by a FastAPI service called SyncSenta AI
Agents and Supabase. A standalone Scheme Scribe application and an ESP32-CAM
prototype live alongside that path.

The most important architectural fact is that there are **two AI delivery
paths** in Studio:

1. The Socratic student chat calls Studio's own POST /api/chat route. That
   route authenticates, rate-limits when Upstash is configured, calls Groq
   directly, persists progress, and streams Server-Sent Events to the browser.
2. syncsenta chat, teacher generators, telemetry, and dashboard tooling call the
   FastAPI service at NEXT_PUBLIC_AI_AGENTS_URL, normally on port 8001 in
   development.

The paths share product intent and Supabase concepts, but they are not a
single API abstraction. Changes should preserve or deliberately consolidate
both paths.

## High-level component map

![Ascendra / SyncSenta architecture overview](images/architecture-overview.png)

This image is a conceptual component map. The system context and request-flow
diagrams below are the authoritative reference for connection direction and
runtime behavior.

## System context

~~~mermaid
flowchart LR
  Student["Student browser"] --> Studio["Studio: Next.js app"]
  Teacher["Teacher/admin browser"] --> Studio

  Studio -->|cookie-aware browser access| Supabase["Supabase Auth + Postgres + Storage"]
  Studio -->|POST /api/chat, SSE| StudioChat["Studio chat route"]
  StudioChat --> Groq["Groq API"]
  StudioChat --> Supabase

  Studio -->|HTTPS and WebSocket| Agents["AI Agents: FastAPI"]
  Agents --> Orchestrator["LangGraph orchestration + specialists"]
  Orchestrator --> Groq
  Agents -->|service-role client, optional/best effort| Supabase

  Scheme["Scheme Scribe: Vite/React"] --> SchemeDB["Separate Supabase client and Edge Functions"]
  SchemeDB --> Groq

  ESP32["ESP32-CAM firmware"] -. intended HTTP integration .-> Agents
~~~

The dashed firmware line is intentional. The firmware currently has a
placeholder base URL and expects endpoints such as /assess and /generate-exam,
while the current FastAPI service exposes different route names. It is a
prototype integration contract, not a connected production path.

## Components and responsibilities

### 1. Studio web application

Location: [studio](../studio)

Studio is a Next.js App Router application using React, TypeScript, Tailwind,
Supabase SSR utilities, and a mix of server and client components. The
committed package manifest pins Next 16.2.5 and React 18.3.1.

Responsibilities:

- Public routes, authentication pages, and role-oriented layouts.
- Student chat, sandboxes, tutor dashboard, quizzes, and progress screens.
- Teacher schemes, lesson plans, assessments, learner monitoring, feedback,
  and administrative dashboards.
- Next route handlers under studio/src/app/api for same-origin operations and
  selected proxying to the AI-agent service.
- Browser-side Supabase sessions and Supabase-backed application data.
- Direct Groq streaming for the primary Socratic chat route.

Useful source areas:

| Concern | Source |
| --- | --- |
| App routes and layouts | studio/src/app |
| UI components | studio/src/components |
| Client/service configuration | studio/src/lib/api-config.ts |
| Supabase helpers | studio/src/lib/supabase |
| Student Socratic chat | studio/src/components/student/socratic-chat.tsx |
| Direct multi-agent chat | studio/src/components/student/syncsenta-chat.tsx |
| Security headers and CSP | studio/src/middleware.ts |

Studio starts on port 5173 because its dev script is next dev -p 5173.

### 2. SyncSenta AI Agents service

Location: [ai-agents](../ai-agents)

The deployable FastAPI application is created in
ai-agents/src/syncsenta_agents/api/server.py. The Render configuration starts
that exact application with Uvicorn and exposes a health check at /healthz.
The service is conventionally run on port 8001.

Responsibilities:

- Assessment quiz generation and grading.
- Agent chat through SyncSentaOrchestrator.
- Lesson Architect operations: schemes, plans, worksheets, text-leveling,
  outcome unpacking, differentiation, and exams.
- Telemetry analysis, xAPI-statement generation, and best-effort persistence.
- Teacher dashboard data queries and WebSocket connections.
- Curriculum validation and training-data export.

The FastAPI service uses a lazy-initialized SyncSentaOrchestrator. Its
LangGraph workflow classifies a request and dispatches registered specialist
agents. The active orchestration and several agents use Groq through
langchain-groq. The source tree also contains Ollama, Dify, and model
deployment modules, but the current multi-provider client only instantiates a
Groq provider.

Important entry-point distinction:

- api/server.py is the application selected by render.yaml and the normal
  development command.
- ai-agents/src/syncsenta_agents/api.py defines a different FastAPI app with
  older /health and /api/agents paths. It is not the service started by
  render.yaml.

### 3. Supabase

Supabase provides several distinct roles:

- Auth and browser sessions for Studio and Scheme Scribe.
- PostgreSQL storage for profiles, chat history, progress, teacher materials,
  telemetry, dashboard data, and generated content.
- Storage use for training-data exports and, by design, other artifacts.
- Edge Functions for Scheme Scribe's generation and grading workflow.

Studio uses three access styles:

| Style | Helper | Intended use |
| --- | --- | --- |
| Browser session | studio/src/lib/supabase/client.ts | Client components and RLS-protected user actions |
| Cookie-aware route client | studio/src/lib/supabase/route-handler.ts | Route handlers acting as the signed-in caller |
| Service-role client | studio/src/lib/supabase/server.ts | Administrative or trusted server-side operations |

The Python service uses SUPABASE_URL plus SUPABASE_SERVICE_KEY and therefore
acts as a trusted server process. See [Data and API reference](DATA_AND_API.md)
for the migration-source and RLS implications.

### 4. Scheme Scribe

Location: [scheme-scribe](../scheme-scribe)

Scheme Scribe is a self-contained Vite/React application. It has its own
router, authentication provider, Supabase client, database migrations, and
Supabase Edge Functions. It offers:

- Google sign-in through the Lovable integration.
- Scheme-of-work generation and feedback.
- Lesson-plan generation and DOCX/PDF export.
- Exam generation, taking, scoring, and a pupil dashboard.

The visible components mainly call Supabase Edge Functions such as
generate-scheme, generate-exam, mark-exam, fetch-strands, and
generate-lesson-plan. The repository also contains a generic API client for
the FastAPI Lesson Architect, but this is not the primary component path.

Treat Scheme Scribe's database and Edge Function secrets as separate from
Studio until a deliberate migration unifies them.

### 5. ESP32-CAM firmware

Location: [arduino/syncsenta_system](../arduino/syncsenta_system)

The firmware is designed around local SD-card data, Wi-Fi, a camera/face
recognition loop, attendance collection, and HTTP calls to a backend. Its
configuration declares an API base URL and API key, but both must be supplied
by the deployment owner. It expects the following legacy-style API shapes:

    GET  /health
    POST /assess
    POST /generate-exam
    GET  /analyze-progress/{studentId}
    GET  /recommendations/{studentId}
    POST /grade-exam

Those routes do not match the deployed FastAPI API. A firmware integration
requires an adapter service or an agreed API contract before it can be enabled.

## Primary request flows

### Socratic student chat

~~~mermaid
sequenceDiagram
  participant B as Browser
  participant N as Studio /api/chat
  participant S as Supabase
  participant R as Upstash Redis
  participant G as Groq
  B->>N: Message, history, grade, subject, mode
  N->>S: Validate user/profile and load/persist history
  N->>R: Apply subscription-based rate limit when configured
  N->>G: Request streamed completion with Socratic prompt
  G-->>N: Tokens
  N-->>B: Server-Sent Event stream
  N->>S: Message, progress, activity, and usage updates
~~~

The browser implementation is SocraticChat. It preserves anonymous history in
local storage and migrates it when a user is authenticated. Authenticated
requests expect a profile row and a server-side GROQ_API_KEY. Missing Upstash
credentials disable rate limiting rather than blocking chat.

### FastAPI agent chat

~~~mermaid
sequenceDiagram
  participant B as syncsenta chat or teacher UI
  participant A as FastAPI /agents/chat
  participant S as Supabase
  participant O as SyncSentaOrchestrator
  participant G as Groq
  B->>A: message, user_id, session, grade, subject, language
  A->>S: Best-effort session and message persistence
  A->>O: AgentRequest
  O->>G: Routing and specialist generation
  O-->>A: response, agent metadata, fallback state
  A->>S: Best-effort assistant-message persistence
  A-->>B: JSON response
~~~

syncsenta chat reads NEXT_PUBLIC_AI_AGENTS_URL but also has a hard-coded Render
fallback. Teacher components use the shared API configuration helper. This is
a JSON API, not the same SSE transport as SocraticChat.

### Teacher material generation

Teacher components either call FastAPI directly with the API configuration
helper or pass through Studio proxy routes:

    /api/generate/scheme       -> /lesson-architect/generate-scheme
    /api/generate/lesson-plan  -> /lesson-architect/generate-lesson-plan
    /api/generate/assessment   -> /lesson-architect/generate-exam

The Lesson Architect API constructs a LessonArchitectAgent, validates the
request, calls the LLM-backed generation functions, and can persist outputs
to tables such as schemes, lesson_plans, worksheets, unpacked_outcomes,
differentiations, and exams.

### Sandbox telemetry and dashboards

InteractiveSandbox captures pointer, hover, drag, drop, undo, erase, and
submit events. On submission, it calls the FastAPI /telemetry/capture route.
That route:

1. derives a behavioral profile;
2. detects misconceptions;
3. generates an intervention plan;
4. creates xAPI statements;
5. attempts to persist the data to Supabase without blocking the learner if
   the database fails.

Dashboard route handlers query those stored telemetry tables. WebSockets
provide teacher and student activity channels, but several intervention and
alert mutation paths are still marked TODO in the backend.

## Deployment topology

The checked-in deployment configuration targets:

| Component | Configuration | Current intent |
| --- | --- | --- |
| Studio | studio/vercel.json | Vercel deployment, with selected proxy rewrites |
| Studio alternative | netlify.toml | Netlify Next.js deployment configuration |
| AI agents | ai-agents/render.yaml | Render web service plus a scheduled rule-learning job |
| Scheme Scribe | Supabase plus Vite configuration | Separate frontend and Edge Functions |

Production deployments should use one authoritative target per component.
Vercel and Netlify contain different backend environment URLs, so they should
not be assumed to be interchangeable.

## Current integration boundaries and verification items

These are code-backed items to resolve before calling the whole repository a
single production system:

- FastAPI CORS explicitly lists local ports 3000 and 3001, whereas Studio
  starts on 5173. Direct browser calls to port 8001 need a local CORS test or
  an updated allow-list.
- Studio's service-role helper explicitly warns that it is not cookie-aware.
  Several routes call auth.getUser through that helper, while
  /api/teacher/assignments correctly uses the cookie-aware helper. Align the
  authentication approach before relying on those other routes for access
  control.
- The FastAPI server includes dashboard, telemetry, Lesson Architect,
  validation, and training-export routers. It does not include the
  teacher-feedback router that exists in the source tree.
- The firmware contract does not match the FastAPI contract.
- The two frontend applications have separate Supabase migration histories and
  generation paths.
- Several helper scripts refer to missing backend or frontend Rust
  directories. Use the manual commands in [Development guide](DEVELOPMENT.md)
  rather than assuming every shell script is runnable.

These are documentation observations, not hidden behavior changes. They are
intended to give future maintainers safe boundaries for integration work.
