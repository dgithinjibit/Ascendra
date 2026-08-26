# Syncsenta Support Guide

**Version:** 1.0  
**Audience:** Support staff, teachers, school administrators, parent/guardian representatives, and technical operators  
**Scope:** Kenyan CBC learning, role workflows, offline use, AI assistance, privacy, and escalation

## 1. Support principle

Syncsenta support follows a structured prompt method: identify the user’s goal, establish the relevant role and learning context, state the constraints, collect only the evidence needed, provide the smallest useful action, and define the next verification step. Support staff should never ask a learner to disclose a password, access token, full national identifier, or unnecessary personal information.

When a request concerns a child’s safety, privacy, consent, abuse, exploitation, self-harm, or a potentially harmful activity, normal troubleshooting stops. The case is routed to the designated safeguarding or privacy reviewer with the minimum necessary context. Support must not make a diagnosis, legal determination, or disciplinary decision through the AI system.

## 2. The support response pattern

| Step | Support action | Example |
|---|---|---|
| Goal | Restate what the person is trying to do | “You are trying to submit a Mathematics activity.” |
| Context | Confirm role, grade, subject, device, language, and connectivity | “Are you a learner using a phone on mobile data?” |
| Constraint | Identify the blocking condition | “The activity is saved locally but has not synchronized.” |
| Evidence | Request a request ID, visible error, time, and route—not raw learner content | “Share the displayed error code and approximate time.” |
| Action | Give one or two reversible steps | “Reconnect, open Sync status, and select Retry.” |
| Verification | Confirm the outcome and next owner | “If it remains pending, record the queue ID for the teacher.” |

## 3. Role-aware support

| Role | Normal support scope | Escalate when |
|---|---|---|
| Student | Activities, hints, feedback, language/accessibility settings, offline queue status | Safety concern, privacy request, repeated incorrect feedback, or consent uncertainty |
| Teacher | Class progress, curriculum evidence, content feedback, interventions, review queue | Student safeguarding, disputed assessment outcome, suspected data overexposure, or missing assignment relationship |
| Head of School | School-level progress, aggregate trends, consent/compliance status, operational health | Cross-school data appears, RLS exposure is suspected, or production activation is proposed |
| Parent/Guardian | Linked-child progress, consent status, teacher feedback summary, support request | Child-link is missing, consent is disputed, or sensitive safeguarding information requires trained handling |

## 4. Prompt construction for support

Support prompts should be short and structured. A safe template is:

```text
Goal: [what the user is trying to accomplish]
Role: [student | teacher | head | parent/guardian]
Context: [grade/subject/device/connectivity, if needed]
Observed issue: [exact visible behavior or error]
Evidence available: [request ID, queue ID, timestamp, route]
Constraints: [offline, low bandwidth, accessibility, consent, privacy]
Expected response: [one action, explanation, or escalation]
Safety boundary: do not request passwords, tokens, raw telemetry, or unnecessary identifiers
```

Support agents should prefer deterministic checks and known status messages before asking a model to interpret a problem. If the model is unavailable, the user should still receive a clear offline or manual-review path.

## 5. Common procedures

### Student cannot submit an activity

First confirm whether the answer was saved locally. If the device is offline or metered, ask the student to keep the app open until the queue shows a stable pending state, then retry after connectivity returns. Do not ask the student to repeat a completed assessment solely because synchronization is delayed. Teachers should use the opaque queue or submission identifier when investigating.

### Student receives confusing or incorrect feedback

Record the activity identifier, subject, grade, visible feedback category, and teacher observation. Do not paste the learner’s full conversation into an email or support ticket. A teacher may submit content-correction feedback; repeated or high-impact errors should create a human-review request.

### Teacher wants to report generated content

Use the content type and content identifier, select thumbs-up or thumbs-down, and include a specific improvement suggestion for negative feedback. Feedback should describe the problem rather than reproduce learner data. The connector rejects unsupported content types, oversized fields, and negative feedback without actionable context.

### Parent/Guardian cannot see a child

Confirm that the authenticated account is the intended guardian account and that the child relationship is recorded. Do not manually disclose progress in email while the relationship is unresolved. Route the request to account support or privacy review.

### A safeguarding concern is reported

Acknowledge the concern briefly, avoid collecting unnecessary details, do not promise confidentiality beyond the organization’s policy, and escalate immediately through the designated safeguarding process. The AI assistant must not be used as the sole response channel for an immediate safety risk.

## 6. Privacy and communications

Operational updates may contain a route, role class, connectivity class, latency bucket, outcome class, and opaque request or queue identifier. They must not contain message text, prompts, passwords, tokens, email addresses, full learner identifiers, raw telemetry, or copied assessment answers. Email is not an approved channel for learner telemetry or safeguarding details.

Before sharing any progress information, the system must verify the authenticated role and the relevant relationship: own learner record, active teacher assignment, same-school head access, or linked-child guardian access. Unknown, denied, or expired consent is a review state rather than an approval state.

## 7. Escalation matrix

| Trigger | Route | Priority |
|---|---|---:|
| Self-harm, abuse, exploitation, sexual content involving a minor, or dangerous activity | Safeguarding reviewer and trusted-adult/emergency process as appropriate | Urgent |
| Privacy request, suspected data exposure, or wrong-account visibility | Privacy reviewer | High |
| Well-being concern without immediate danger | Well-being reviewer | High |
| Incorrect curriculum mapping or material assessment feedback | Content-correction reviewer | Normal |
| Repeated offline conflicts involving grades or teacher overrides | Teacher review queue | High |
| Availability, latency, or provider failure | Technical operator | Normal/High |

## 8. Operator checklist

Support operators should verify the deployment version, Rust runtime health, MeTTa policy version, queue status, and relevant role relationship before changing data. They should use reversible actions, record an opaque case identifier, and never disable RLS or bypass consent to resolve a support ticket. Production changes follow `docs/PRODUCTION_ACTIVATION_CHECKLIST.md` and `scripts/rust-agent-cutover.sh`.

## 9. Related project references

- [Main-agent safety and prompt contract](MOE_MAIN_AGENT_PROMPT.md)
- [Production activation checklist](PRODUCTION_ACTIVATION_CHECKLIST.md)
- [Role-based tool test workflow](role-based-tool-test-workflow.md)
- [Research foundations implementation](RESEARCH_FOUNDATIONS_IMPLEMENTATION.md)
- [Privacy-safe observability contract](../rust-core/src/observability.rs)
