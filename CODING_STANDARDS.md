# Coding Standards — Studio

Standards for `studio/src/`. Applied by the `code-review` skill.

---

## TypeScript

**No `any` except at explicit boundaries.**
Use `any` only at third-party type boundaries where the library provides no
types. Comment it: `// eslint-disable-next-line @typescript-eslint/no-explicit-any — Supabase raw row`.

**Prefer named exports over default exports for modules.**
Default exports make refactoring and grep harder. Exception: Next.js page
components must use default export.

**Explicit return types on all exported functions.**
Inference is fine for private helpers, but exported functions are a
public interface — state what they return.

**No barrel files that re-export everything.**
Import from the specific file, not a catch-all `index.ts`.

**Const over let, let over var.**
Mutate objects via reassignment, not `let` + `push`.

---

## React / Next.js

**Client components only when necessary.**
Default to server components. Add `'use client'` only when the component
uses hooks, browser APIs, or event handlers.

**`useEffect` is a last resort for data fetching.**
Prefer server components, `use server` actions, or route handlers. When
`useEffect` is necessary, always clean up (abort controllers, event listeners).

**Parallel data fetches with `Promise.all`.**
Never `await` sequentially when requests are independent:
```ts
// Good
const [xp, session, chatSession] = await Promise.all([
  getSubjectXP(userId, slug),
  fetchSession(),
  getOrCreateChatSession(supabase, userId, slug, grade),
]);

// Bad
const xp = await getSubjectXP(userId, slug);
const session = await fetchSession();
```

**No inline styles unless unavoidable.**
Use Tailwind classes. Dynamic values that Tailwind can't handle: use `style={}`.

**Loading and error states are required.**
Every async component that fetches data must render a skeleton/spinner and
an error message. Never leave the user on a blank screen.

**Accessibility is not optional.**
Interactive elements need accessible labels (`aria-label`, `aria-labelledby`).
Buttons must be `<button>`, links must be `<a>`. Color alone must not convey
information.

---

## API routes

**Validate all inputs with Zod before touching them.**
Never trust `req.json()` directly.

**Auth check is always first.**
Every route handler authenticates before any DB query or business logic.
Use `getSupabaseServerClient()` with the appropriate access style
(see `docs/ARCHITECTURE.md` § Supabase).

**Fire-and-forget writes must not block the response.**
Use `.catch()` to suppress errors from non-critical async writes (Redis,
analytics). Never `await` them inline in the response path:
```ts
// Good — fire and forget
updateLearningSession(userId, { ... })
  .catch(err => console.error('[chat] Redis write failed:', err));

// Bad — blocks the stream
await updateLearningSession(userId, { ... });
```

**Streaming SSE: always send `[DONE]` and close the controller.**
Never leave the client hanging on an open stream.

**Never log secrets.** Redact before logging: `[REDACTED]`.

---

## Supabase

**Use parameterized queries — never string interpolation in queries.**
Supabase's query builder is always parameterized. Do not fall back to
`.rpc()` with raw string SQL unless absolutely necessary, and review it.

**RLS is the access control layer.**
Route handlers are a second line of defence, not the first. Don't bypass
RLS by using the service-role client where the anon/user client should be used.

**Column names are snake_case.**
TypeScript variables that mirror DB columns: keep snake_case inside `from()`
calls, convert to camelCase in the return value of helper functions.

---

## File and folder naming

| Thing | Convention | Example |
|---|---|---|
| React components | kebab-case | `subject-chat.tsx` |
| Lib modules | kebab-case | `subject-session.ts` |
| Types/interfaces | PascalCase | `SubjectMeta`, `TutoringDecision` |
| Constants | SCREAMING_SNAKE | `SUBJECT_REGISTRY`, `XP_THRESHOLDS` |
| Test files | `*.test.ts` in `__tests__/` | `lib/__tests__/subject-session.test.ts` |
| Page files | `page.tsx` (Next.js convention) | `app/student/subject/[slug]/page.tsx` |
| API routes | `route.ts` (Next.js convention) | `app/api/chat/route.ts` |

---

## Tests

**Tests live in `lib/__tests__/`** for lib modules, and alongside route
handlers as `route.test.ts` for API routes.

**Pure functions get tested first.**
`evaluateTutoringDecision`, `buildDynamicSystemPrompt`, `getSubjectXP`,
`buildLearningState` are all pure or near-pure. These are the highest
priority for test coverage.

**Test at the public interface, not internals.**
Import the exported function. Do not test private helpers directly.

**Test runner:** Vitest. Run with `npx vitest run`.
Config: `studio/vitest.config.ts` (globals: true, so `describe`/`it`/`expect`
are available without imports).

**Golden-output tests for system prompts.**
Any change to `buildDynamicSystemPrompt` or `buildCompassSystemPrompt` must
be reflected in a test assertion. These are drift-detection tests, not
unit tests — they fail loudly when something changes accidentally.

---

## Commits

**One logical change per commit.**
A feature and its tests in one commit. A refactor and a feature in separate
commits.

**Commit message format:**
```
type: short description (≤ 70 chars)

Optional body explaining why, not what.
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`.

**Never push to `main` directly on a Friday.**
Local commits are fine. Push after manual verification on Monday.

---

## What we don't do

- No `console.log` left in committed code (use `console.error` for real
  errors in route handlers, with `[route-name]` prefix)
- No commented-out code committed — delete it, git has history
- No `TODO` comments committed without a linked issue
- No hardcoded credentials, URLs, or magic numbers without a named constant
- No `eslint-disable` without a comment explaining why
