# CockroachDB contingency decision

## Decision

CockroachDB is **not enabled or added as a second live SyncSenta database** at this stage. Supabase remains the canonical system for authentication, row-level security, consent relationships, telemetry, notification delivery, and storage metadata.

## Why

SyncSenta has a $0 infrastructure target and already has a staged Supabase schema, RLS policies, authenticated role probes, and fail-closed notification contracts. Introducing a second live database now would duplicate migrations, create consistency and privacy risks, and make the four-role evidence path harder to verify.

## Safe future adapter boundary

If a later pilot requires CockroachDB, the integration should be introduced behind a Rust storage trait with these constraints:

1. CockroachDB may be a development, export, or disaster-recovery target first; it must not become authoritative by configuration alone.
2. Authentication, consent, and role authorization remain enforced by the canonical identity service before any write is attempted.
3. Only minimized, versioned aggregates may be replicated by default. Raw child telemetry and identifying data require an explicit data-processing review and migration evidence.
4. Every migration must be tested against PostgreSQL-compatible behavior, serializable transaction retries, RLS-equivalent application checks, retention, deletion, and audit-chain integrity.
5. A cutover must be reversible, dual-read/verified before dual-write, and blocked unless health, parity, privacy, and rollback checks pass.
6. `COCKROACH_DATABASE_URL` must never be required for the normal Supabase deployment and must remain absent from browser bundles.

## Current implementation status

The Rust core now exposes deterministic adaptive-question decisions independently of storage. This keeps the MeTTa-ready learning contract portable while avoiding an unnecessary database dependency. A future Cockroach adapter can implement the storage boundary after the required privacy and parity evidence exists.
