# Syncsenta production activation checklist

Status: **gated until canonical Supabase target and authenticated staging sessions are verified**.

## Preconditions

- [ ] Confirm the canonical Vercel project is `ascendra-u1eu` and record its Production domain.
- [ ] Read the Production `NEXT_PUBLIC_SUPABASE_URL` from Vercel and match its project reference to the Supabase dashboard.
- [ ] Confirm the target database contains `profiles`, `students`, `teacher_student_assignments`, `student_sessions`, `telemetry_events`, `behavioral_profiles`, `misconceptions`, `interventions`, and `xapi_statements`.
- [ ] Apply migrations in dependency order: core identity schema, relationships, telemetry tables, telemetry lockdown, explicit role policies, and research foundations.
- [ ] Verify RLS is enabled on all six telemetry tables and that no broad authenticated write policy exists.
- [ ] Configure production secrets in the deployment secret manager. Never commit or paste secrets into repository files, logs, Monday updates, or email.
- [ ] Confirm the Rust and Python health endpoints and the real routing adapter are available.

## Staging verification

Run the fail-closed gate from the repository root:

```bash
BASE_URL=https://<staging-domain> \
REQUIRE_AUTH_PROBES=true \
STUDENT_HEALTH_URL=https://<staging-domain>/api/health/student \
TEACHER_HEALTH_URL=https://<staging-domain>/api/health/teacher \
HEAD_HEALTH_URL=https://<staging-domain>/api/health/head \
PARENT_HEALTH_URL=https://<staging-domain>/api/health/parent \
./scripts/staging-e2e-gate.sh
```

The gate must pass Rust formatting/tests, the frontend typecheck, the Student route, the service health endpoint, and all four authenticated role probes. It must fail if any token or endpoint is absent.

## Rust cutover

Set the routing adapter explicitly and run:

```bash
export RUST_URL="https://rust-staging.example.com"
export LEGACY_URL="https://python-staging.example.com"
export ROUTE_READ_CMD='your-router read-backend'
export ROUTE_SWITCH_CMD='your-router set-backend "$BACKEND"'
./scripts/rust-agent-cutover.sh preflight
./scripts/rust-agent-cutover.sh cutover
```

The controller must record the legacy backend, verify the Rust route, and pass repeated health and chat probes before activation is accepted. An interruption, failed probe, timeout, or non-zero command must restore the recorded legacy backend automatically.

## Production activation gates

- [ ] Staging gate passes with all four authenticated roles.
- [ ] Student can complete an activity, submit an intentionally incorrect answer, receive bounded personalized feedback, and retry.
- [ ] Teacher can review the learner evidence and submit feedback; negative feedback includes actionable context.
- [ ] Head of School can view only same-school aggregate/progress data.
- [ ] Parent/Guardian can view only linked-child progress and consent state.
- [ ] Safeguarding, privacy, consent, and curriculum-evidence reviews route to human review.
- [ ] Offline queue replay is idempotent and does not retain authorization headers.
- [ ] Operational metrics contain no message text, prompt, email, token, password, or direct learner identifier.
- [ ] Rust route remains healthy for the observation window.
- [ ] Rollback command is tested and the previous backend remains deployable.

## Automatic rollback triggers

Rollback immediately on any failed role probe, RLS denial/overexposure, missing consent enforcement, safety-policy bypass, elevated error rate, latency-budget breach, unavailable Rust backend, unexpected schema mismatch, or telemetry-sensitive-data finding.

## Sign-off record

Record the commit SHA, migration identifiers, Vercel deployment ID, Supabase project reference, UTC activation time, observer window, probe results, and rollback owner in the deployment system. Do not place credentials or raw learner data in the sign-off record.
