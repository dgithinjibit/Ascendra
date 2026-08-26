# Verified local role workflow evidence

**Execution mode:** Local Rust deterministic core; no external AI provider, Supabase account, Vercel deployment, or real learner session was used.

## Conversation

- User: “Explain fractions using a simple example”
- Assistant: “A fraction shows part of a whole. What equal parts can you draw?”
- Scaffolding: Intensive
- Next action: `show_conceptual_example`

## Exam

- Exam ID: `sandbox-exam-01`
- Question 1 expected `1/2`; submitted `1/4`; incorrect.
- Question 2 expected `3/4`; submitted `3/4`; correct.
- Score: **1/2 points, 50%, performance band `approaching`**.

## Role contracts

- Teacher feedback validation: **passed**.
- Head-of-school learning-support review request: **created**.
- Parent/guardian well-being review request: **created**.
- Student learn capability: **allowed**.
- Teacher progress-review capability: **allowed**.
- Head manage-school capability: **allowed**.
- Parent/guardian progress-review capability: **allowed**.

## Notifications

The local Rust core printed:

- Teacher notification: **not implemented in local core**.
- Head notification: **not implemented in local core**.
- Parent notification: **not implemented in local core**.

These notifications must not be reported as delivered. Delivery requires the authenticated connector, canonical Supabase schema, notification transport, and live role sessions.
