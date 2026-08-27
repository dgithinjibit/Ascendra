# SyncSenta Indigenous Language RAG

This dataset package indexes the Indigenous Language curriculum sources already present in the repository. The current release is a **source manifest**, not a fabricated translation corpus.

## Verified repository sources

The repository contains KICD curriculum-design PDFs for Grades 1–7 under `studio/public/designs/gradeN/`, plus structured Grade 4–6 strand adapters under `studio/src/data/curriculum/upper-primary/indigenous-language.ts`. The adapter is also transpiled into the AI-agent curriculum module.

## Grounding rules

Retrieval must filter by grade, subject, and the explicitly selected community-language label. A document may be used for scheme structure only when its source path is present in `source-manifest.json`. The English strand headings in the adapter must not be presented as translations into Gikuyu, Luo, Turkana, or another community language.

The RAG must not invent vocabulary, pronunciation, spelling, oral histories, or cultural examples. Community-language content requires an approved, human-reviewed corpus for that specific language and locale. Until such a corpus is added, the system can retrieve the KICD structure and ask the teacher to supply verified local examples.

## Intended retrieval record

Each future chunk should include `document_id`, `grade`, `subject`, `language_label`, `source_path`, `page`, `text`, `review_status`, and `content_hash`. Only `review_status=approved` records should be passed to the model.

## Current coverage

| Grade | KICD PDF | Structured adapter | Community-language text |
|---|---:|---:|---:|
| 1 | Present | Not found in active adapter directory | Not present |
| 2 | Present | Not found in active adapter directory | Not present |
| 3 | Present | Not found in active adapter directory | Not present |
| 4 | Present | Present | Not present |
| 5 | Present | Present | Not present |
| 6 | Present | Present | Not present |
| 7 | Present | Not found in active adapter directory | Not present |

The next safe RAG step is PDF text extraction, chunking, provenance hashing, and human review—not automatic generation of Indigenous-language translations.
