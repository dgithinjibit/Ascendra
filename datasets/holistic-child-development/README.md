# Syncsenta Holistic Child Development Dataset

## Purpose

This dataset contains **synthetic, privacy-preserving educational scenarios** for supporting holistic development in children and adolescents. It is intentionally broader than health: it covers learning self-regulation, social-emotional learning, identity and confidence, physical wellbeing without diagnosis, creativity, digital citizenship, safety and protection, independent learning, inclusion and language access, and crisis boundaries.

The dataset is designed for bounded educational support, not clinical assessment, surveillance, profiling, or autonomous safeguarding decisions.

## Safety and governance

Every record is synthetic and marked `pii_present: false`. No real child, school, family, location, diagnosis, or identifiable event should be added. Records involving possible abuse, self-harm, coercion, non-consensual media, or other serious risk use `human_review_required` or an equivalent escalation label. The system must not probe for explicit details, promise secrecy, diagnose, facilitate harm, or replace a trusted adult or local safeguarding protocol.

The Rust/MeTTa policy layer should treat `safety_flags` and `escalation` as hard routing signals. The tutoring surface may provide age-appropriate support for low-risk educational and social-emotional scenarios; high-risk scenarios must fail closed into human-support routing.

## Schema

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable synthetic record identifier |
| `age_band` | string | Broad developmental band; not an inferred age |
| `grade_band` | string | Broad school-stage label |
| `domain` | string | Holistic-development domain |
| `context` | string | Synthetic learner statement or situation |
| `signals` | array[string] | Observable support signals, not diagnoses |
| `support_goal` | string | Intended educational or wellbeing-support objective |
| `recommended_response` | string | Bounded, age-appropriate response pattern |
| `autonomy_level` | string | Degree of learner choice and scaffolding |
| `escalation` | string | Routing requirement when risk is present |
| `safety_flags` | array[string] | Hard policy flags for routing and review |
| `evidence_type` | string | Must remain `synthetic_scenario` for this seed set |
| `pii_present` | boolean | Must remain `false` for this dataset |

## Intended use

The seed set can support evaluation of Mwalimu AI responses, policy routing regression tests, curriculum-aware personalization, learner-choice scaffolding, and offline-first practice flows. It should be expanded through educator review, child-safety review, Kenyan curriculum alignment, multilingual review, and documented dataset versioning.

## Files

- `holistic_child_development_dataset.jsonl`: 10 validated synthetic examples.
- `validate_hcd_dataset.py`: deterministic schema and privacy validator.

## Validation

The initial seed set contains 10 rows across 10 domains. The validator confirms required fields, unique IDs, synthetic evidence type, array fields, and `pii_present: false` for every row.
