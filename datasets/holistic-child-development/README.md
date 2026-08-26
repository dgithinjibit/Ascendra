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
| `source_principles` | array[string] | High-level principles informing the synthetic scenario; not copied source text |
| `learning_objective` | string | Intended learner capability or reflection |
| `localization_notes` | string | Guidance for adaptation across cultures, languages, and education systems |
| `accessibility_notes` | string | Alternate access and expression considerations |
| `adult_support_route` | string | Suggested trusted-adult or institutional support route |
| `license` | string | License for the Syncsenta-created record |

## Intended use

The dataset can support evaluation of Mwalimu AI responses, policy routing regression tests, curriculum-aware personalization, learner-choice scaffolding, educator training, and offline-first practice flows. Developers should adapt it through educator review, child-safety review, Kenyan curriculum alignment, multilingual review, accessibility review, and documented dataset versioning. It must not be used for clinical assessment, automated high-stakes decisions, surveillance, sensitive-trait inference, or autonomous safeguarding decisions.

## AI and wellbeing expansion

The current release contains 20 records, including 10 original synthetic scenarios on AI literacy and wellbeing. They address AI verification, data minimization, fairness and language bias, AI-companion boundaries, learner authorship, transparency and human review, age-appropriate use, environmental/resource awareness, and child participation in school AI governance.

The scenarios were informed by high-level principles from Common Sense Media’s Digital Literacy & Well-Being Curriculum and AI Basics for K–12 Teachers course, UNESCO’s human-centred guidance for generative AI in education, UNICEF’s Guidance on AI and Children 3.0, OECD child digital-wellbeing policy, and Africa-focused child-rights analysis from CIPESA. The dataset does not reproduce lesson text, slides, videos, or proprietary course materials.

## Open license and provenance

The original synthetic records, metadata, schema, validator, and documentation in this directory are released under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. Reusers may share and adapt Syncsenta-created content with attribution. External sources remain under their own terms. In particular, the Common Sense Media lesson page identifies a Creative Commons Attribution-NonCommercial-NoDerivatives license for that lesson; this release cites the page for design principles only and does not relicense or remix its content.

Recommended attribution: `Syncsenta Team, Holistic Child Development Dataset, CC BY 4.0, https://github.com/dgithinjibit/Ascendra/tree/main/datasets/holistic-child-development`.

## Research references

- Common Sense Media, [Digital Literacy & Well-Being Curriculum](https://www.commonsense.org/education/digital-literacy).
- Common Sense Education, [AI Basics for K–12 Teachers](https://www.commonsense.org/education/training/ai-basics-for-k-12-teachers).
- Common Sense Education, [What Is AI?](https://www.commonsense.org/education/digital-citizenship/lesson/what-is-ai).
- UNICEF, [Guidance on AI and children, version 3.0](https://www.unicef.org/innocenti/reports/policy-guidance-ai-children).
- UNESCO, [Guidance for generative AI in education and research](https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research).
- OECD, [Enhancing child well-being in the digital age](https://www.oecd.org/en/publications/how-s-life-for-children-in-the-digital-age_0854b900-en/full-report/enhancing-child-well-being-in-the-digital-age-a-four-pillar-policy_42f060db.html).
- CIPESA, [Elevating Children’s Voices and Rights in AI Design and Online Spaces in Africa](https://cipesa.org/2025/07/elevating-childrens-voices-and-rights-in-ai-design-and-online-spaces-in-africa/).

## Files

- `holistic_child_development_dataset.jsonl`: 20 validated synthetic examples, including 10 AI-wellbeing scenarios.
- `expand_dataset.py`: reproducible expansion script for the AI-wellbeing records.
- `validate_hcd_dataset.py`: deterministic schema and privacy validator.

## Validation

The release contains 20 rows across holistic development and AI-wellbeing domains. The validator confirms required fields, unique IDs, synthetic evidence type, array fields, and `pii_present: false` for every row.
