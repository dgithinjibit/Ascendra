# SyncSenta Rust/MeTTa Main Agent Core

This crate provides a **Rust-first, deterministic MoE supervisor** for SyncSenta. It is intentionally independent of the legacy Python and TypeScript surfaces in Ascendra and has no runtime dependencies beyond the Rust standard library.

The supervisor validates input, applies consent and child-safety boundaries, retains privacy-safe decision summaries, selects a bounded top-k set of experts, and switches to a deterministic offline or metered mode when connectivity is constrained. The shared `safety` and `grounding` experts are preserved for every allowed route. The crate never considers a request actionable until the MeTTa policy result is explicitly `Approved`.

The declarative policy is checked in at `../metta-logic/syncsenta_policy.metta` and is bound into the crate as `METTA_POLICY_SOURCE`. A native Hyperon/MeTTa runtime adapter can be connected later behind this stable contract without changing the routing or safety API.

## Verify

From the repository root:

```bash
cargo fmt -- --check
cargo check --workspace
cargo test --workspace
cargo check --workspace --all-targets --all-features
```

The core currently has no third-party dependencies, so these checks work offline once the Rust toolchain is installed.

## Design references

The implementation adapts the fail-closed supervisory pattern from Project Nzi, the session-isolation and fallback seam from Syncsenta Studio, the CBC-oriented domain vocabulary from the local schemer repository, and the researched requirements recorded in `docs/research/SYNCSENTA_EDGE_CASES.md`.
