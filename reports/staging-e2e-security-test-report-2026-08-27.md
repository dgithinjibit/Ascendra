# Syncsenta Staging E2E and Security Test Report

**Generated:** 2026-08-27  
**Repository:** `dgithinjibit/Ascendra`  
**Branch:** `main`  
**Live Supabase project:** `SyncSenta` (`tumikgwhrbvirpjswlzh`)

## Executive result

The non-authenticated staging gate passed after implementing the missing `/api/health` route. The Rust policy/runtime suite passed with **75 core tests and 5 role tests**, the frontend TypeScript check passed, the student route emitted valid Next.js markers, and the service health endpoint returned HTTP 200 with a healthy status.

The authenticated four-role gate was not executed because the staging environment does not contain `STUDENT_TOKEN`, `TEACHER_TOKEN`, `HEAD_TOKEN`, or `PARENT_TOKEN`, and the live Supabase project contains zero authenticated users. The role workflow therefore remains **not verified**, rather than being marked as passed by assumption.

## Automated test matrix

| Gate | Result | Evidence |
|---|---:|---|
| Rust formatting | Passed | `cargo fmt -- --check` |
| Rust core/runtime tests | Passed | 75 passed, 0 failed |
| Rust role tests | Passed | 5 passed, 0 failed |
| Frontend TypeScript | Passed | `tsc --noEmit` |
| Student route | Passed | HTTP 200 and Next.js chunk markers |
| Service health | Passed | `/api/health` HTTP 200; `status: healthy` |
| Local non-auth staging gate | Passed | `STAGING_GATE_PASS: staging end-to-end gate complete` |
| Student authenticated probe | Blocked | Missing `STUDENT_TOKEN` and URL |
| Teacher authenticated probe | Blocked | Missing `TEACHER_TOKEN` and URL |
| Head authenticated probe | Blocked | Missing `HEAD_TOKEN` and URL |
| Parent authenticated probe | Blocked | Missing `PARENT_TOKEN` and URL |
| Live role data readiness | Blocked | Live `auth.users` count is 0; profile/student counts are 0 |

## Supabase security review

The following changes were applied to the live project and committed in migration files:

| Area | Result |
|---|---|
| Six intelligence tables | Explicit service-role-only RLS policies applied |
| Legacy `get_teacher_feedback_summary(text)` | Anonymous and authenticated execution revoked; service-role-only; fixed search path |
| Legacy `get_top_rules(integer)` | Anonymous and authenticated execution revoked; service-role-only; fixed search path |
| Legacy `rls_auto_enable()` | Anonymous and authenticated execution revoked; service-role-only; fixed search path |
| New role predicates | Anonymous execution revoked; authenticated execution retained because RLS policies invoke them |
| Role predicate search path | Fixed to `public, pg_catalog` |

The final Supabase advisor output reports only four warnings, all for the new authenticated role predicates: `syncsenta_is_student_for`, `syncsenta_is_teacher_for`, `syncsenta_is_parent_for`, and `syncsenta_is_head_for`. These functions return authorization booleans and are required by the explicit RLS policies. Direct PostgreSQL privilege verification confirmed `anon_execute=false` for all seven targeted functions and confirmed the fixed search path.

## Production and pilot decision

Syncsenta is ready for the **next controlled staging step**, but it is not yet ready to claim a completed four-role pilot verification. The remaining gate is operational rather than a failing code test: provision approved non-production accounts and inject their short-lived tokens and health URLs into the staging environment, then rerun `scripts/staging-e2e-gate.sh` with `REQUIRE_AUTH_PROBES=true`.

No live learner records, synthetic accounts, notifications, or parent reports were created during this run.

## Commits

- `b260b79` — live Syncsenta foundation schema
- Current working tree includes the health route and the security-advisory migrations pending commit.
