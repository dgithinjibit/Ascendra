# Pure Language Policy and Indigenous Language RAG

Date: 2026-08-27

## Language policy correction

SyncSenta now treats Kiswahili as a pure Kiswahili learning subject. Non-Kiswahili subjects are routed to pure English. The active student chat no longer allows a persisted `mixed` preference to override the subject policy. Lower-primary Indigenous Language remains an explicit, separately configured path rather than an automatic mixed-language mode.

The policy is centralized in `studio/src/lib/teaching-language-policy.ts` and covered by three tests. The prompt builder also normalizes direct mixed requests to pure English for non-Kiswahili subjects and pure Kiswahili for Kiswahili subjects.

## Repository Indigenous Language sources

The repository contains KICD Indigenous Language design PDFs for Grades 1–7, structured Grade 4–6 adapters in `studio/src/data/curriculum/upper-primary/indigenous-language.ts`, and the corresponding transpiled AI-agent module. The existing source headings describe curriculum structure but do not constitute translations or vocabulary for each community language.

The new `datasets/indigenous-language-rag/source-manifest.json` preserves source paths, grade, subject, language-label status, adapter provenance, and an approved-source-only retrieval policy. The dataset is deliberately a provenance manifest until human-reviewed, language-specific corpora are supplied.

A Rust-native `indigenous_rag` module indexes the approved source records and refuses unknown community-language evidence. It does not invent translations, pronunciation, oral histories, or cultural examples.

## Verification

- Rust core tests: 77 passed.
- Rust role tests: 5 passed.
- Frontend TypeScript: passed.
- Frontend language, prompt, consent, and curriculum tests: 29 passed.
- `git diff --check`: passed.
- Local preview health: previously verified HTTP 200.

## Scope qualification

The RAG source manifest and retrieval boundary are implemented. Full semantic RAG requires a reviewed text corpus, chunk extraction, embeddings/vector storage, and an approved review workflow. Those steps must not be replaced with synthetic community-language content.
