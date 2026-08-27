# Landscape Lesson Plan and Junior Secondary AI Test

Date: 2026-08-27

## Landscape integration

The scheme preview already used an isolated landscape print document. The lesson-plan dialog still wrote into a hidden page element and called the dashboard's global `window.print()`, which caused the full page to print in portrait or include unrelated UI.

The lesson-plan print action now opens a dedicated print-only window with `@page { size: landscape; margin: 10mm; }`. It includes grade, subject, term, week, lesson, scheme ID, the complete source scheme row (including KIQ and reflection), generated objectives, introduction, development, conclusion, assessment, differentiation, resources, teacher reflection space, and signature lines. Model-generated values are HTML-escaped before insertion.

## Junior Secondary Environmental Activities test

Sample profile:

| Field | Value |
|---|---|
| Grade | Grade 8 |
| CBC stage | Junior Secondary |
| Age band | 12–14 |
| Subject | Environmental Activities |
| Competency | Conserving the environment |
| Mastery | Developing |
| Progress | 46% |
| Language | English |

The prompt regression test confirmed that Mwalimu AI receives the verified stage, age band, competency, mastery, progress, Environmental Activities subject scope, and the explicit prohibition on inferring emotion or wellbeing from facial, voice, response-speed, or behavioral proxies.

## Verification

- TypeScript: passed.
- Focused curriculum tests: 4 passed.
- Junior Secondary Environmental Activities context test: passed.
- Combined focused run: 5 tests passed.
- The test validates the prompt/context contract. A live model response was not claimed because a real authenticated staging student session and model provider credentials were not available in this run.
