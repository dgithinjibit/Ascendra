# Ascendra documentation

This folder is the maintained entry point for understanding the code that is
currently in this repository. It was written from the implementation,
configuration, migrations, and tests rather than from the historical planning
documents at the repository root.

## Project identity

The Git repository is named **Ascendra**, while most product-facing source
code calls the platform **SyncSenta** and the tutoring experience **syncsenta**.
Those names refer to the same broad education-platform effort, but the
repository contains more than one application and more than one generation of
the architecture.

## Use-case overview

![Ascendra / SyncSenta use-case overview](images/use-case-overview.png)

The platform centers syncsenta around learners, teachers, school leaders,
county teams, and an ESP32-based classroom-device prototype.

| Area | What it is | Main entry point |
| --- | --- | --- |
| Studio | The most integrated web application: student, teacher, school, and county interfaces. | studio/src/app |
| AI agents | Python/FastAPI service for agent workflows, content generation, assessment, telemetry, and dashboard queries. | ai-agents/src/syncsenta_agents/api/server.py |
| Scheme Scribe | A separate Vite/React application for schemes of work, lesson plans, and exams. | scheme-scribe/src/main.tsx |
| Supabase | PostgreSQL schemas, RLS policies, and application data models. | sql/studio_migrations and supabase/migrations |
| Arduino | ESP32-CAM classroom/attendance prototype and intended AI integration. | arduino/syncsenta_system/syncsenta_system.ino |

## Read these documents in order

1. [Architecture](ARCHITECTURE.md) explains the deployed components, main
   request flows, service boundaries, and the distinction between active and
   aspirational integrations.
2. [Development guide](DEVELOPMENT.md) explains how to configure, run, test,
   and deploy the primary Studio plus AI-agents stack.
3. [Data and API reference](DATA_AND_API.md) lists the current route groups,
   storage responsibilities, migration layout, and data-security boundaries.

## Recommended starting point

For local work on the main product, treat **Studio + AI agents + one
Supabase project** as the primary stack:

    studio/     Next.js web application on port 5173
    ai-agents/  FastAPI service on port 8001
    Supabase    Auth, PostgreSQL, and optional storage
    Groq        LLM provider used by both the Studio chat route and AI agents

Scheme Scribe is independently runnable and uses its own Vite application,
Supabase Edge Functions, and Supabase client configuration. It should not be
assumed to share a database or deployment with Studio until that has been
explicitly verified.

## Repository map

    .devcontainer/       Development-container configuration
    ai-agents/           Python agents, FastAPI routes, tests, deployment config
    arduino/             ESP32-CAM firmware and hardware notes
    docs/                This documentation set
    scheme-scribe/       Standalone Vite/React teacher tool
    scripts/             Shell helpers; some refer to retired Rust directories
    sql/                 Full SQL sources and migration copies
    studio/              Main Next.js application and local Supabase migration links
    supabase/            Newer Supabase migration files and pointer files
    _archive/            Historical material; do not treat as active implementation

## Important repository conventions

- Do not use the root README.txt as the authoritative setup guide. It describes
  an Arduino-focused system and names folders that do not all represent the
  current runnable stack.
- The numbered files 001 through 005 in both supabase/migrations and
  studio/supabase/migrations are short absolute-path pointer files in this
  checkout, not executable SQL. Their full SQL sources are under
  sql/studio_migrations.
- sql/supabase_migrations duplicates several newer migrations found under
  supabase/migrations. Never apply both copies to one database.
- Existing root documents such as PROJECT_STATUS.md, CODE_MAP.md, and
  DEPLOYMENT_CHECKLIST.md are useful historical context, but individual claims
  can conflict with the code. Use the source files linked by the documents in
  this folder when making implementation decisions.

## Documentation maintenance

Update these documents in the same change as any of the following:

- a new app route, FastAPI router, or public service contract;
- a new environment variable or deployment target;
- a Supabase migration, RLS-policy change, or schema-source move;
- a client-to-service integration change;
- a decision to retire, merge, or promote one of the parallel applications.

For a concrete code change, link to the source location in the relevant
document and state whether the behavior is implemented, optional, or planned.
