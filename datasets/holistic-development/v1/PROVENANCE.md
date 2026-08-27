# SyncSenta Holistic Development Evidence v1

## Scope

This release contains **synthetic fixtures only**. It is intended to test schema validation, consent gates, bounded support routing, and language-aware educational workflows. It does not contain real children, real schools, contact details, raw chat logs, biometric signals, facial images, voiceprints, inferred emotions, diagnoses, rankings, or protected-characteristic labels.

## License

The fixtures and schema in this directory are released under **CC BY 4.0**. The SyncSenta software that consumes them remains governed by the repository license. Any future external source must be added only after its license, provenance, permitted use, and removal process have been recorded here.

## Evidence contract

Every record must identify a bounded development domain and an explicit evidence source. Wellbeing check-ins require recorded consent. Statements must remain evidence or self-report; they must not assert that an emotion, personality trait, ability, or risk was inferred from a camera, microphone, face, voice, or other biometric signal.

## Intended use

Developers may use these fixtures for deterministic unit tests, policy evaluation, interface prototypes, and documentation examples. They must not be used to make admissions, disciplinary, grading, safeguarding, medical, or funding decisions about a real learner.

## Versioning

The v1 schema is backward-incompatible if required fields, allowed domains, consent rules, or provenance requirements change. Such changes require a new version directory and updated tests. Synthetic learner references are deliberately non-identifying and must not be replaced with real identifiers in this release.

## Maintainer checklist

Before releasing a new version, verify that all records validate against `schema.json`, that no raw personal or biometric data is present, that the license is still accurate, and that Rust policy tests cover consent-required and biometric-rejection paths.
