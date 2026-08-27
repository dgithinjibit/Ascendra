# Ascendra AI Agent and Student Experience Review

## 1. Summary

This project already has strong foundations in teacher-facing AI tooling and CBC curriculum grounding, but the student side is vague and the AI agent architecture is not fully realized.

Key findings:
- Student-facing SyncSenta has a convincing Socratic prompt design and streaming SSE chat, but the experience is incomplete and largely local-storage-only.
- The multi-agent architecture described in documentation is aspirational: the actual Python orchestrator only registers `socratic_tutor`, `assessment`, and `lesson_architect`.
- Important claims like Kikuyu translation, Dify agent integration, and school intelligence agents are not present in the implemented agent registry.
- There is a mismatch between UI language support and backend prompt acceptance.
- Rate limiting, persistence, and production hardening are still brittle.

## 2. What currently works

### Student-facing strengths
- `studio/src/app/api/chat/route.ts` provides a streaming Socratic chat endpoint using Groq.
- `studio/src/lib/socratic-prompts.ts` enforces strong subject scoping, Kenyan localisation, and a 5-stage Socratic reasoning process.
- `studio/src/components/student/socratic-chat.tsx` handles token streaming, `CHOICE` buttons, cancellation, TTS, and history persistence.
- `studio/src/components/student/language-selector.tsx` includes English, Kiswahili, and Kikuyu support in the UI.

### Backend and curriculum strengths
- The AI backend has a detailed curriculum registry and lesson architect code in `ai-agents/src/syncsenta_agents/curriculum/`.
- The tutoring agent includes neuro-symbolic reasoning components, mastery estimation, and misconception detection in `ai-agents/src/syncsenta_agents/agents/tutoring.py`.
- The orchestrator uses a workflow graph in `ai-agents/src/syncsenta_agents/orchestrator/workflow.py` and can synthesize multi-agent responses.
- Teacher feature docs and dashboards are far more fleshed out than the student experience.

## 3. Main gaps and risks

### 3.1 Student side is still vague
- `SocraticChat` persists history only in localStorage; there is no central student history or multi-device sync.
- The student journey page still uses grade selection via sessionStorage and defaults to `Grade 4` when missing.
- `MwalimuChat` has an alternative WebSocket path to a Python FastAPI backend, but its relationship to the Socratic chat flow is unclear.
- Voice and translation support are claimed, but actual backend integration is incomplete.

### 3.2 Documentation vs implementation mismatch
- `studio/MULTI_AGENT_SYSTEM.md` claims three specialized agents (Mwalimu Expert, Kikuyu Translation, Dify Agent), but the active backend only registers:
  - `socratic_tutor`
  - `assessment`
  - `lesson_architect`
- The backend still contains placeholder responses for `cbc_curriculum`, `school_intelligence`, and `career_pathways`.
- `studio/docs/SOCRATIC_MENTOR_SPEC.md` describes a polished student prompt flow, yet the actual `studio/src/app/api/chat/route.ts` only supports three modes and does not wire the documented multi-agent orchestration.

### 3.3 Language support mismatch
- UI `LanguageSelector` includes `kikuyu`, but `studio/src/app/api/chat/route.ts` only accepts `english`, `kiswahili`, and `mixed`.
- The Groq endpoint and Socratic prompt builder do not appear to have a true Kikuyu translation mode.

### 3.4 Routing and orchestration fragility
- Request routing in `ai-agents/src/syncsenta_agents/orchestrator/workflow.py` relies on an LLM call to classify requests.
- Fallback route logic is keyword-based and not robust enough for complex education queries.
- Multi-agent coordination is implemented, but the required agents are often not registered.
- Agent synthesis uses the same Groq LLM, which risks compounding hallucinations instead of grounding answers.

### 3.5 Operational concerns
- Rate limiting in `studio/src/lib/rate-limit.ts` is per-process memory-only and unsuitable for serverless scaling.
- The student chat backend depends on `GROQ_API_KEY`; if missing, the route fails entirely.
- The backend architecture still depends on external Render/vehicle services, even though docs mention Next.js migration as a priority.

## 4. Suggested improvement approach

### 4.1 Align architecture with implementation
- Inventory and document which agents are actually running.
- Clearly mark unimplemented agents as planned, not production-ready.
- Adjust `studio/MULTI_AGENT_SYSTEM.md` and other docs to match the actual agent registry.

### 4.2 Secure the student AI path
- Consolidate the student chat experience around `studio/src/components/student/socratic-chat.tsx` and `/api/chat`.
- Add mandatory grade/subject selection before the student enters chat.
- Centralize conversation history in Supabase or the AI backend.
- Implement a fallback flow for low-bandwidth / offline students.

### 4.3 Fix language and translation support
- Extend backend chat route and prompt builder to support `kikuyu` if the UI exposes it.
- If Kikuyu support is not available yet, remove it from the student language selector.
- Build a dedicated translation / bilingual agent for indigenous-language support.

### 4.4 Harden the agent orchestrator
- Register all claimed agents or remove placeholder routing paths.
- Replace the LLM-based router with a hybrid classifier: deterministic rules + fine-tuned classification model.
- Ground tutoring and curriculum responses with explicit curriculum retrieval.
- Use synthesis only when multiple agent outputs are available and verified.

### 4.5 Strengthen student personalization
- Use telemetry data to power adaptive difficulty, not only prompt-based scaffolding.
- Persist mastery, misconceptions, and intervention history centrally.
- Surface explicit next steps and learning path recommendations.

### 4.6 Improve resilience and observability
- Replace in-memory rate limiting with Upstash Redis / Supabase / shared store.
- Add end-to-end tests for:
  - student chat flow
  - compass mode teacher grounding
  - agent routing decisions
  - localStorage fallback vs central persistence
- Add monitoring for model latency, prompt failures, and fallback usage.

## 5. Recommended roadmap

### Immediate wins
- Fix language-selector/backend mismatch for Kikuyu.
- Document and remove unsupported multi-agent claims.
- Add central history persistence for student chat.
- Move teacher generator APIs into Next.js and remove the Render dependency.

### Near-term roadmap
- Implement or remove `cbc_curriculum`, `school_intelligence`, `career_pathways` agents.
- Add concrete adaptive learning paths for student grades and subjects.
- Add robust offline and low-bandwidth student modes.
- Standardize teacher intervention messages into the student chat experience.

### Long-term vision
- Build a truly adaptive, curriculum-grounded multi-agent system that can:
  - route accurately by student intent
  - fuse tutoring, curriculum grounding, and assessment responses
  - support indigenous language learning with a dedicated translation agent
  - maintain clear teacher-context grounding via compass mode
  - scale safely with shared rate-limiting and centralized analytics

## 6. Why this matters

The project is strongest when it focuses on teacher productivity and CBC alignment. To become truly great in edtech, the student side must become equally concrete: a reliable, grounded Socratic tutor with consistent progress tracking, language support, and meaningful adaptive learning.

This file is a starting point for a focused AI agent and student experience remediation plan.
