# SyncSenta Hyperon Rust Bridge (Experimental)

This crate is an isolated experiment on `experiment/hyperon-rust-embedding`. It embeds the official Hyperon Rust library from `trueagi-io/hyperon-experimental` at tag `v0.2.10` and exposes a small bounded `run_metta` API.

The bridge is not used by `rust-core`, `rust-service`, or the Next.js application. It creates a fresh interpreter per call, limits program size to 64 KiB, does not expose network access or cross-request mutable state, and converts runtime failures into typed errors. It must not be promoted to production without a policy allowlist, timeout/resource controls, deterministic semantics review, and a maintainer-confirmed support path.

## Verification

```bash
cargo test --manifest-path rust-hyperon-bridge/Cargo.toml
```

The prototype is pinned to the MIT-licensed Hyperon Experimental v0.2.10 release. Hyperon is an active pre-alpha reference implementation, so SyncSenta should keep its current Rust-enforced MeTTa verdict contract as the production fallback until the embedding boundary is independently reviewed.
