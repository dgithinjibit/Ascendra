## Rust embedding guidance for Hyperon v0.2.10

SyncSenta is a privacy-first Kenyan CBC learning platform whose production decision boundary is Rust-first and whose policy source is MeTTa. We created an isolated experimental adapter that pins `trueagi-io/hyperon-experimental` at v0.2.10 and exposes a bounded Rust `run_metta` function. The prototype loads our policy file and evaluates safeguarding and attendance decisions successfully.

We would appreciate guidance on the following integration questions:

1. `SExprParser` is public under `hyperon::metta::text` but is not re-exported from `hyperon::metta::runner`. Is the `hyperon::metta::text::SExprParser` path considered stable for embedding?
2. Enabling the default DAS feature produced duplicate `hyperon_atom` types in the dependency graph in our adapter, while the local interpreter with `pkg_mgmt` enabled compiled successfully. Is there a recommended feature set or dependency pin for embedding the local interpreter without DAS?
3. For a safety-sensitive application, is a fresh interpreter per request preferred, or is a managed interpreter/space recommended? What resource and timeout controls should an embedding application apply?
4. What deterministic-evaluation expectations, API stability guidance, and licensing/redistribution requirements should we account for when embedding the Rust library?

We are keeping the adapter out of production until these questions and the relevant API guarantees are reviewed. The experimental branch is available here:

https://github.com/dgithinjibit/Ascendra/tree/experiment/hyperon-rust-embedding

The integration does not contain learner data, credentials, or secrets. Thank you for any guidance, issue links, or recommended examples.
