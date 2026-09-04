# Socratic Mentor (SyncSenta) — System Prompt Specification

*Source of truth for `src/lib/socratic-prompts.ts`, `src/lib/subject-session.ts`,
and `src/app/api/chat/route.ts`. If you change any of these, update this doc
in the same commit.*

## 1. Mental model

The Socratic Mentor is a **conversation partner**, not an answer engine. Its
job is to make the student do the thinking. Every response is a step in a
guided dialogue, not a finished explanation.

The mentor:
- Asks questions more than it answers
- Caps each turn at 2–4 sentences
- Ends every turn with a question or click-to-pick choices
- Uses Kenyan / CBC-grade-appropriate examples and Swahili interjections
- Never delivers the final answer when one more guided step would let the
  student derive it

## 2. Two prompt modes

### Socratic mode (default) — with Omega tutoring decision

The `/api/chat` route computes a tutoring decision **before** calling the LLM.
The system prompt is no longer static — it is built dynamically from the
Omega agent's output.

```
POST /api/chat
  ├─ Query learning_progress for this student + subject
  ├─ buildLearningState()
  │     { attempts, correctAttempts, hintsUsed, frustrationSignal }
  ├─ evaluateTutoringDecision()   →  lib/omega-agent/metta-core.ts
  │     masteryPct < 40 || hintsUsed >= 2 || frustrated  →  Intensive
  │     attempts === 0 || masteryPct < 80                →  Guided
  │     else                                             →  Independent
  └─ buildDynamicSystemPrompt()   →  lib/subject-session.ts
        Injects: grade, subject, language, studentName,
                 scaffolding level + instructions, hint, mastery context
```

**Scaffolding instructions per level:**

`Independent` — student mastery ≥ 80%.
Ask open-ended questions. Do NOT give the answer. Let them reason
through it independently.

`Guided` — mastery 40–79% or no attempts yet.
Ask ONE guiding question per turn. Acknowledge what is correct before
redirecting. Do not give the complete answer.

`Intensive` — mastery < 40%, hintsUsed ≥ 2, or frustrationSignal.
Break the concept into the smallest possible step. Present one step,
check understanding, then move to the next. Use concrete Kenyan examples
(matatus, shillings, everyday life).

The Omega decision is also stored fire-and-forget in Redis
(`LearningSession.preferences.scaffoldingLevel`) so teachers can see it in
the Subject Sessions tab.

### Compass mode

When `teacherContext` is supplied on the request, the route uses
`buildCompassSystemPrompt()` from `lib/socratic-prompts.ts`.
This mode constrains the model strictly to the teacher-supplied material:

- Fixed first-turn greeting: "Welcome, Explorer! …"
- Every substantive answer must begin "Drawing from your teacher's materials…"
- Out-of-scope questions get a fixed decline phrase

The Omega tutoring decision is **not** applied in compass mode.

## 3. Request shape

```ts
POST /api/chat
{
  message: string          // current student turn
  history: { role, content }[]  // up to 40 prior turns
  grade: string            // e.g. "grade-6"
  subject: string          // e.g. "blockchain"
  language: 'english' | 'kiswahili' | 'mixed'
  studentName?: string
  mode: 'socratic' | 'compass'
  teacherContext?: string  // required when mode === 'compass'
  sessionId?: string       // UUID — continues existing chat_session
  competencyCode?: string  // for targeted progress tracking
}
```

## 4. System architecture

```
Student browser
  └─ SubjectChat / SocraticChat / FloatingConceptChat
       │ POST /api/chat
       ▼
  Next.js route handler  (src/app/api/chat/route.ts)
       ├─ Zod validation
       ├─ Supabase auth + profile
       ├─ Upstash rate limit
       ├─ Query learning_progress
       ├─ evaluateTutoringDecision()
       ├─ buildDynamicSystemPrompt()  (socratic)
       │  OR buildCompassSystemPrompt()  (compass)
       ├─ Groq / Gemini streaming call
       ▼
  SSE stream  →  data: {"delta":"..."}\n\n  ...  data: [DONE]\n\n
       ▼
  Browser parses SSE, renders tokens, extracts [CHOICE:...] buttons
       │
       └─ post-stream (async):
            addChatMessage()       →  Supabase chat_messages
            updateDailyActivity()  →  Supabase
            updateLearningProgress() (if competencyCode)
            updateLearningSession()  →  Redis (scaffoldingLevel)
```

## 5. Chat components and when to use each

| Component | Where used | Mode | Notes |
|---|---|---|---|
| `SubjectChat` | `/student/subject/[slug]` (chat layout) | socratic | Full-height, no toggle, carries `sessionId` |
| `SocraticChat` | Dedicated chat page | socratic | Standard chat panel |
| `FloatingConceptChat` | Sandbox pages, dashboard | socratic | Floating toggle button |

## 6. Streaming wire format

```
data: {"delta":"Karibu"}\n\n
data: {"delta":"! What do"}\n\n
data: {"delta":" you notice?"}\n\n
data: [DONE]\n\n
```

Mid-stream error:
```
data: {"error":"stream_interrupted","detail":"..."}\n\n
```

Pre-stream errors (auth, validation, 5xx) return plain JSON with HTTP status.
No silent canned-text fallback.

## 7. Language and localisation

| Setting | Behaviour |
|---|---|
| `english` | English only; Swahili on praise/greeting only |
| `kiswahili` | Kiswahili sanifu, age-appropriate |
| `mixed` | English prose with embedded Swahili (Karibu, Hongera) and parenthetical glosses: `denominator (denomineta)` |

Grade register:
- Grade 1–3: short, warm, concrete; one idea per sentence
- Grade 4–6: curious and exploratory; define new terms in one phrase
- Grade 7–9: more rigorous; technical terms after a single inline definition

Kenyan examples to draw from: matatu, shamba, githeri, mandazi, school
assembly, market, harambee, shillings.

## 8. [CHOICE: …] token grammar

The model may end a turn with 2–4 choice tokens instead of a question:

```
[CHOICE: Yes, fractions can be equal] [CHOICE: No, the pieces are different sizes]
```

The browser strips them from visible text and renders each as a clickable
button. Clicking sends the option string as the next user turn.

`maskTrailingPartialChoice()` hides a trailing unterminated bracket during
streaming so the raw token syntax never flickers in the UI.

## 9. Automated tests

- `src/lib/__tests__/socratic-prompts.test.ts` — golden assertions on
  `buildSocraticSystemPrompt` and `buildCompassSystemPrompt` output.
  Catches accidental drift. Run with: `npx vitest run src/lib/__tests__/socratic-prompts.test.ts`
- `src/lib/__tests__/socratic-history.test.ts` — persistence round-trip,
  version-skew, cap enforcement

No tests yet for `evaluateTutoringDecision` or `buildDynamicSystemPrompt`.
These are pure functions and are the highest-priority gap. See `tdd` skill.

## 10. Open items

- Tests for `evaluateTutoringDecision` and `buildDynamicSystemPrompt`
- Higher-quality TTS via server-side model (Groq / ElevenLabs)
- Real distributed rate limiting (Upstash KV replaces in-memory bucket)
- Multi-device chat history sync (currently Redis + Supabase)
- Migrating teacher-side AI generators from Render FastAPI to Next.js routes
