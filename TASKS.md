# SyncSenta Engineering Task Ledger

**Project:** SyncSenta — Rust/MeTTa-first Kenyan CBC learning platform  
**Repository:** `dgithinjibit/ascendra`  
**Primary application:** `studio/`  
**Owner context:** Daniel Githinji, GMT+3  
**Last updated:** 2026-09-05  
**Author:** Manus AI

## Purpose and operating constraints

This file is the source-of-truth ledger for the remaining SyncSenta engineering work. It records what has been completed, what was verified, what remains blocked by external configuration, and what must be done before child-facing production release.

SyncSenta must remain **$0 infrastructure compatible**, use **Rust and MeTTa as the intelligence direction**, retain TypeScript only where required by the existing Next.js frontend and API boundary, and avoid biometric identification, facial recognition, mood inference, synthetic production data, or mock authentication in production. Student, Teacher, Head, and Parent access must remain separated by authenticated role checks, Supabase RLS, and the parent-to-student linking relationship.

> Development placeholders may be used only for local compilation and tests. They must never be promoted to production environment variables, production credentials, or production fixtures.

## Completed engineering work

| Area | Completed work | Evidence |
|---|---|---|
| Branding | Repository-wide SyncSenta naming cleanup and removal of legacy Mwalimu branding from core product surfaces | Prior project history and current source tree |
| Authentication | Google OAuth callback updated for cookie-aware PKCE exchange; Google profile completion route added; student school selection made optional while admin school selection remains required | `studio/src/app/auth/callback/route.ts`; `studio/src/app/api/auth/complete-profile/route.ts` |
| Privacy and release controls | Ten-gate child-facing release model with SHA-256 evidence chaining and privacy-safe school-review audit trail | `src/lib/child-facing-*`; internal audit routes and tests |
| Deployment | Vercel Root Directory and framework configuration diagnosed across duplicate projects; latest successful baseline deployment created from commit `d01505a` | Vercel deployment `dpl_AkCL767tyYi98CTWthrUBwMuKVED` |
| Homepage prerender | Wrapped the homepage `useSearchParams()` consumer in Suspense so `/` can be statically prerendered | `studio/src/app/page.tsx` |
| MeTTa route runtime | Added missing React hook imports used by the MeTTa router | `studio/src/lib/omega-agent/metta-router.ts` |
| Obsolete route processor | Preserved upstream deletion of the truncated route processor during rebase instead of restoring incomplete code | Rebase resolution against latest `origin/main` |
| Supabase typing | Changed the server helper contract to non-null `SupabaseClient<Database>` while retaining runtime placeholder behavior only for build-time compilation | `studio/src/lib/supabase/server.ts` |
| Supabase schema typing | Added legacy contracts for existing referenced tables: payments, user profiles, Omega decisions, teacher-student feedback, and student sessions | `studio/src/lib/supabase/types.ts` |
| Learning telemetry typing | Added `hints_used` and `consecutive_wrong` to the learning-progress Row/Insert/Update contracts | `studio/src/lib/supabase/types.ts`; chat route update path |
| Payments typing | Aligned Stripe API version declarations with the installed SDK version `2022-11-15` | Stripe checkout and webhook routes |
| Role tiering | Replaced invalid `school_head` comparison with the canonical database `admin` role for school-tier rate limiting | `studio/src/app/api/middleware-rate-limit.ts` |
| UI dependency | Added `framer-motion` as an explicit dependency for live student and teacher feedback components | `studio/package.json`; lockfile |
| Live feedback typing | Corrected asynchronous student response and teacher hint callback contracts | `live-teacher-feedback.tsx`; `live-classroom-monitor.tsx` |
| Omega hook typing | Narrowed authenticated user identity before asynchronous agent initialization | `studio/src/hooks/use-omega-agent.ts` |
| Feedback policy | Added redirect feedback templates for every supported feedback type | `studio/src/lib/realtime-feedback.ts` |
| XP boundary | Made the XP threshold lookup safe at the maximum level without indexing outside a tuple | `studio/src/lib/subject-session.ts` |
| MeTTa tutoring policy | New learners with zero attempts now enter Guided scaffolding; frustration, repeated hints, and low mastery after an attempt still trigger Intensive support | `studio/src/lib/omega-agent/metta-core.ts` |
| Regression coverage | Added tests for learning-state counters, Rust-aligned mastery flooring, feedback template coverage, and safe legacy defaults | `studio/src/lib/__tests__/production-readiness-regressions.test.ts` |

## Verification completed in this work session

The following commands were run from `/home/ubuntu/syncsenta-fix/studio` on the corrected worktree.

| Gate | Result | Details |
|---|---:|---|
| Strict TypeScript | PASS | `npm run typecheck` exited `0` with no TypeScript errors |
| Focused regression suite | PASS | 5 tests passed in the new production-readiness regression file |
| Full Vitest suite | PASS | 35 test files passed; 236 tests passed |
| Production build | PASS | `npm run build` exited `0` using non-secret placeholder Supabase variables; static and dynamic routes compiled successfully |
| ESLint | PASS | `npm run lint` exited `0`; 0 errors and 863 warnings remain |
| Local production secrets | SAFE | No real credentials were used during reproduction; placeholders were supplied only to satisfy build-time environment validation |

The build validator correctly failed once when `NEXT_PUBLIC_SUPABASE_ANON_KEY` was omitted. The build passed after supplying the complete local placeholder set. This confirms the environment validator is fail-closed for required Supabase configuration.

## Current Vercel baseline

The latest already-pushed baseline is commit `d01505a`. That deployment successfully compiled and prerendered the application in Vercel.

| Item | Status |
|---|---|
| Vercel deployment | Ready |
| Deployment ID | `dpl_AkCL767tyYi98CTWthrUBwMuKVED` |
| Production alias | [`sentastudio.vercel.app`](https://sentastudio.vercel.app) |
| Preview alias | [`sentastudio-cfp7pdug8-dans-projects-5f474b51.vercel.app`](https://sentastudio-cfp7pdug8-dans-projects-5f474b51.vercel.app) |
| Previous failure | Commit `1741501`, homepage prerender failure |
| Fixed baseline | Commit `d01505a` |
| Current release candidate | Commit `2960776` — `fix: close production type and tutoring policy gates` |
| Current deployment | `dpl_CqhhvGdJ7UfS5AKHSQzU2PauB44q` — `READY` |
| Current production URL | [`sentastudio.vercel.app`](https://sentastudio.vercel.app) |
| Current preview URL | [`sentastudio-i2s4v4ds2-dans-projects-5f474b51.vercel.app`](https://sentastudio-i2s4v4ds2-dans-projects-5f474b51.vercel.app) |
| New local changes | Pushed to `main` and deployed successfully |

The current changes were committed as `2960776`, pushed to `main`, and verified in Vercel as `READY`. The remaining release work is now authenticated staging verification, live Supabase/RLS confirmation, production provider configuration, and child-facing approval evidence.

## Remaining work before production release

### Immediate repository actions

1. Commit the verified source, test, dependency, and `TASKS.md` changes.
2. Push the commit to `main`.
3. Confirm Vercel builds the new commit with the correct `studio` Root Directory and required production environment variables.
4. Verify the public homepage, authentication entry points, `/student`, `/teacher`, `/head`, and `/parent` routes after deployment.
5. Run authenticated staging E2E tests with genuine non-production test accounts and tokens supplied by the project owner. Do not create synthetic production identities.

### Required external configuration

1. Confirm the canonical Supabase project contains the current profiles, schools, curriculum, relationship, telemetry, notification, payment, Omega, and artifact tables.
2. Confirm all role-specific RLS policies are applied and tested against Student, Teacher, Head, and Parent identities.
3. Confirm the parent can see a child only after entering and verifying the student-generated relationship code.
4. Configure Google OAuth redirect URIs and Supabase Google provider credentials before re-enabling Google sign-in as a production path.
5. Configure production AI providers only through server-side environment variables. Missing provider keys must remain fail-closed and must not expose secrets to the browser.
6. Review the 863 ESLint warnings and reduce them by risk, beginning with warnings in authentication, payments, telemetry, privacy, and child-facing code. Warnings are not currently build blockers, but they are not equivalent to a clean quality gate.
7. Run a dependency audit and resolve the remaining low-severity advisory where compatible with the $0 infrastructure constraint.

### Product and child-facing approval gates

1. Complete authenticated browser verification for all four roles with real staging identities.
2. Verify the full learning loop: student attempt, incorrect response, personalized feedback, adaptive next question, teacher feedback, head-level progress summary, and parent-linked report.
3. Verify language policy: pure Kiswahili for Kiswahili, pure English for other subjects unless the lower-primary/local-language policy explicitly applies.
4. Verify that no facial recognition, biometric identification, mood inference, or attendance-by-face functionality is enabled.
5. Verify media generation is consent-gated, moderated, stored privately, and does not use synthetic student records.
6. Complete the child-facing release decision only after every blocking gate has independently recorded evidence.

## Deferred or explicitly blocked items

| Item | Reason | Required next action |
|---|---|---|
| Historical Vercel failure emails | 127 older messages remain pending deletion confirmation | Obtain explicit user confirmation before moving them to Gmail Trash |
| Google OAuth production completion | Requires Google Cloud and Supabase provider configuration | Owner supplies/configures production OAuth credentials and redirects |
| Real authenticated staging E2E | Requires genuine staging tokens/accounts | Owner supplies non-production credentials through the approved secure channel |
| Supabase schema confirmation | The repository type map now includes referenced legacy contracts, but only the canonical Supabase project can confirm live tables and RLS | Run read-only schema inspection and authenticated role probes |
| Full lint cleanup | 863 warnings remain, though lint exits successfully | Triage and fix security- and privacy-relevant warnings first |
| Production provider keys | Not needed for compilation; required for real AI interactions | Configure server-side keys only in the deployment environment |

## Development command set

```bash
cd studio

# Strict compiler gate
npm run typecheck

# Unit and integration tests
npm run test

# Production build with required local placeholders only
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-key \
npm run build

# Lint gate
npm run lint
```

## Change-control rules

Every future change must update this file with the implementation summary, test evidence, deployment state, and any newly discovered blocker. No production claim may be made solely from a local placeholder build. No credentials, tokens, biometric data, or synthetic student records may be committed to the repository.

## References

[1]: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout "Next.js missing Suspense boundary guidance"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"
[3]: https://www.typescriptlang.org/docs/handbook/2/narrowing.html "TypeScript narrowing documentation"
[4]: https://docs.stripe.com/api/versioning "Stripe API versioning documentation"
