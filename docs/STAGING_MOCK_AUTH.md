# Local staging mock authentication

These fixtures are for **localhost gate testing only**. They are opaque strings, not Supabase JWTs, do not authenticate against Supabase, and must never be placed in Vercel, staging secrets, production secrets, or browser storage.

## Run the local mock gate

From the repository root, start the Next.js app on port 5173 and the local role-health fixture server on port 8787:

```bash
cd studio
pnpm dev --port 5173
```

In a second terminal:

```bash
cd /path/to/Ascendra
python3 scripts/staging-mock-role-server.py
```

In a third terminal, load the local-only fixture values and run the gate:

```bash
cd /path/to/Ascendra
set -a
. scripts/staging-mock-auth.env.example
set +a
./scripts/staging-e2e-gate.sh
```

The expected result is a pass for Rust formatting/tests, frontend TypeScript, the student route, service health, and all four local mock role probes.

## Real staging verification

For an actual Supabase-backed test, provision four approved **non-production** users in a staging Supabase project and obtain short-lived access tokens through the normal Supabase authentication flow. Do not hand-edit JWTs and do not use the local fixture strings. Set `REQUIRE_AUTH_PROBES=true`, the four real role-health URLs, and the four short-lived tokens in the staging secret manager, then run the same gate.

The gate must be run against a staging deployment whose role-health endpoints validate the Supabase bearer token and enforce the role-to-school/child relationship. A local mock pass proves only harness wiring and response handling; it does not prove Supabase authentication, RLS, relationship scoping, or learner workflow behavior.

## Safety rules

Never commit real tokens. Never point the mock URLs at Supabase. Never deploy `staging-mock-role-server.py`. Rotate and revoke any credential that is accidentally exposed. Keep the live Supabase project free of synthetic users unless the project owner has explicitly approved a separate non-production project for them.
