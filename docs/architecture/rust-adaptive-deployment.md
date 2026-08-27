# Rust adaptive service deployment

The `rust-service` crate is a small, stateless HTTP service around the Rust adaptive-question contract. It exposes `GET /health` and `POST /v1/adaptive-question`.

The Next.js route uses the Rust service only when the server-side variable `SYNC_SENTA_RUST_ADAPTIVE_URL` is configured. If the service is unreachable, slow, or returns an invalid decision, the Next.js route uses its deterministic server fallback. The browser never receives this URL or any provider secret.

The service is packaged independently at `rust-service/Dockerfile`. The default container bind is `0.0.0.0:8091`; local development binds to `127.0.0.1:8091`. `scripts/rust-adaptive-readiness.sh` is a read-only probe and reports only `ready`, `unreachable`, or `invalid_health_response`.

Supabase remains canonical for identity, consent, RLS, telemetry, notifications, and storage. The Rust adaptive service is stateless and does not connect to CockroachDB or any other database.
