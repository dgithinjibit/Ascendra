# Syncsenta Role-Based Tool Test Workflow

## Purpose

This workflow verifies the four Syncsenta operating roles without using real learner information: **student**, **teacher**, **head of school**, and **parent/guardian**. It distinguishes route reachability from authenticated business success. It must be run against a local, staging, or production base URL with credentials supplied externally.

## Runner

Run from `studio/`:

```bash
BASE_URL=http://127.0.0.1:5173 node scripts/test-role-workflows.mjs
```

For authenticated testing, provide a short-lived test session through `AUTH_COOKIE` or `AUTHORIZATION`. Never put a real API key in the script, browser bundle, or Git history.

## Sequence

| Stage | Role | Test scope | Exit evidence |
|---|---|---|---|
| 1 | Student | Home, student dashboard, demo, journey, sandbox, chat, tutor dashboard, quiz, offline page | Pages render; local progress storage does not execute during SSR; sandbox route loads |
| 2 | Teacher | Teacher dashboard, exams, scheme wizard, setup, MeTTa analytics | Teacher pages render; authenticated assignment, feedback, lookup, and report APIs enforce role checks |
| 3 | Head of school | School dashboard, staff, submissions, finance, county resource/teacher/comms views | Administrative pages render; data is scoped to the authorized school/county |
| 4 | Parent/guardian | `/parent` and `/parent/dashboard` | Connection-first dashboard renders with no fabricated learner data; consent and relationship linking are the next integration |
| 5 | Shared APIs | Personalization, active schemes, chat, lesson/assessment/scheme generation, offline resolve | Each route returns success, validation, authentication, or provider-dependent status with a clear preview |

## Interpretation

A `200` indicates route-level success, not that the role’s full authenticated workflow is complete. `400`, `401`, `403`, `405`, `409`, and `429` are expected reachable outcomes when required fields, sessions, permissions, or rate limits are intentionally absent. A `404` is a missing surface. A `5xx` is a release blocker unless it is explicitly documented as a provider or environment dependency. An `unreachable` result means the server, network, or process lifecycle must be repaired before evaluating the route.

## Parent/guardian connection order

The parent dashboard deliberately starts empty. The next safe integration is a verified guardian–learner relationship table with explicit consent, followed by read-only progress summaries, teacher messages, assignments, and wellbeing escalation notices. The parent view must not expose private teacher notes, raw chat transcripts, or sensitive wellbeing details without an approved data-sharing policy.

## Local latency checks

The runner records route latency. For tutor interactions, add a browser-level authenticated test that measures time to first visible hint and total completion time separately. Keep the first response short, stream model output, cache curriculum/problem templates, and use deterministic local feedback before a model call. Report Turkana and Nairobi results by network/device profile, not as a single average.
