# Research Foundations Implementation

The research-backed implementation was added in commit `2fc7025` and pushed to `main`.

## Included in code

- `studio/src/lib/offline-queue.ts` now uses stable event IDs, strips authorization/cookie/API-key headers before durable storage, expires entries after seven days, limits restored queue size, avoids retrying permanent client errors, and avoids logging learner/request metadata.
- `supabase/migrations/20260826000003_research_foundations.sql` adds consent provenance, privacy-rights requests, CBC-aligned learning evidence, human review/escalation, event receipts for idempotent sync, retention pruning, and explicit role policies.

## Live database prerequisite

The connected Supabase project `SyncSenta` (`tumikgwhrbvirpjswlzh`) was restored and became `ACTIVE_HEALTHY`, but its live `public` schema currently contains only:

- `ai_decisions`
- `learned_rules`
- `cultural_patterns`
- `teacher_rule_proposals`
- `rule_votes`
- `rule_ab_tests`

It has no `public.profiles`, `public.students`, `public.teacher_student_assignments`, or six telemetry tables. The migration therefore correctly failed closed with PostgreSQL error `42P01: relation "public.profiles" does not exist`; no partial migration was applied.

Do not bootstrap a new `profiles` table into this database without confirming that it is the intended Syncsenta application database. The migration must be applied after the canonical identity/core schema and telemetry migrations are present, or the application must be pointed at the correct Supabase project.

## Required live verification order

1. Confirm the canonical Supabase project and apply the existing core identity schema.
2. Apply the six telemetry-table migration and telemetry lockdown/policy migrations.
3. Apply `20260826000003_research_foundations.sql`.
4. Create synthetic test users or use approved test accounts with roles Student, Teacher, Head, and Parent/Guardian.
5. Verify allow/deny queries on every telemetry and research-foundations table.
6. Verify consent revocation, privacy-request visibility, idempotent event receipt handling, retention pruning, and human-review escalation.

## Evidence status

Local TypeScript passed. Rust passed 37 unit tests and 5 role tests. The new SQL passed static checks. Live application is intentionally pending database-target confirmation because applying it to the currently connected schema would be unsafe and incomplete.
