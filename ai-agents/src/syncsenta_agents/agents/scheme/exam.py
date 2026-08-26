"""End-of-term exam generation ported from scheme-scribe-ai.

Source of truth:
``_inventory/scheme-scribe-ai/supabase/functions/generate-exam/index.ts``.

The TS implementation calls the Lovable AI gateway with
``google/gemini-2.5-flash`` and a forced ``submit_exam`` tool call. Ascendra
routes through the same text-in/text-out :class:`LLMProvider` that powers
schemes and lesson plans, so we replace the tool-call contract with a JSON
prompt contract (``{"questions": [...]}``). The shape, scope rules, practical-
task regex, echo-answer detector, MCQ answer validation, and dedup all match
the TS source line-for-line.

Output discriminated union — kept identical to lines 19-46 of the TS source.
The studio consumes these dicts directly, so do not rename fields without
coordinating with the exam renderer.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Dict, List, Literal, Optional, Protocol, Sequence, Union

from pydantic import BaseModel, Field, ValidationError

from .batched import RateLimitError

log = logging.getLogger(__name__)


# Mirrors batched.LLMProvider — duplicated so this module is usable standalone.
class LLMProvider(Protocol):
    async def generate(self, prompt: str, *, system: Optional[str] = None) -> str: ...


class ExamValidationError(ValueError):
    """Raised when no valid questions survive scope/answer validation."""


# ────────────────────────────────────────────────────────────────────────────
# Allocation input shape — matches StrandAllocation/SubStrandInfo (TS:7-17).
# ────────────────────────────────────────────────────────────────────────────
class SubStrandInfo(BaseModel):
    name: str
    lessons: int
    learningOutcomes: Optional[List[str]] = None
    keyInquiryQuestion: Optional[str] = None


class StrandAllocation(BaseModel):
    strandName: str
    subStrands: List[SubStrandInfo]


class ExamCounts(BaseModel):
    mcq: int = 15
    short: int = 8
    long: int = 2


# ────────────────────────────────────────────────────────────────────────────
# Output contract — discriminated union mirroring TS:19-46.
# ────────────────────────────────────────────────────────────────────────────
class MCQ(BaseModel):
    type: Literal["mcq"]
    strand: str
    subStrand: str
    question: str
    options: List[str]
    answerIndex: int
    marks: int


class ShortQ(BaseModel):
    type: Literal["short"]
    strand: str
    subStrand: str
    question: str
    expectedAnswer: str
    acceptableKeywords: List[str] = Field(default_factory=list)
    marks: int


class LongQ(BaseModel):
    type: Literal["long"]
    strand: str
    subStrand: str
    question: str
    rubric: str
    marks: int


ExamQuestion = Union[MCQ, ShortQ, LongQ]


_KISWAHILI = "Kiswahili"


# ────────────────────────────────────────────────────────────────────────────
# Prompt builder — reproduces buildSystemPrompt (TS:50-178) verbatim, including
# the scope block, distribution rules, KICD answer-quality guardrails, the
# text-only / no-practical-tasks block, and the unambiguous-MCQ block.
# ────────────────────────────────────────────────────────────────────────────
def _build_system_prompt(
    *,
    grade: str,
    subject: str,
    term: str,
    allocation: Sequence[StrandAllocation],
    counts: ExamCounts,
) -> str:
    is_sw = subject == _KISWAHILI
    lang = "Kiswahili" if is_sw else "English"

    scope_lines: List[str] = []
    for s in allocation:
        sub_lines: List[str] = []
        for ss in s.subStrands:
            outcomes_line = ""
            if ss.learningOutcomes:
                outcomes_line = (
                    "\n      Outcomes: "
                    + "; ".join(ss.learningOutcomes[:4])
                )
            sub_lines.append(
                f"    - {ss.name} (lessons: {ss.lessons}){outcomes_line}"
            )
        scope_lines.append(f"  • {s.strandName}\n" + "\n".join(sub_lines))
    scope_block = "\n".join(scope_lines)

    return f"""You are a senior KICD CBC assessment writer for {grade} {subject}, {term}.
Generate an end-of-term exam in {lang}.

═══ NON-NEGOTIABLE SCOPE RULE ═══
You MUST ONLY ask questions on the strands and sub-strands listed below.
Do NOT introduce ANY topic, concept, vocabulary or skill that is not in this list.
Do NOT use content from previous or future terms.
If a sub-strand is not listed, it is OUT OF SCOPE — ignore it completely.

IN-SCOPE CONTENT FOR {term}:
{scope_block}

═══ EXAM STRUCTURE (STRICT) ═══
- {counts.mcq} multiple-choice questions (Section A) — exactly 4 options each, ONE correct answer, 1 mark each
- {counts.short} short-answer questions (Section B) — one-line answer, 2 marks each
- {counts.long} long/structured questions (Section C) — 5 marks each, requires explanation

═══ DIFFICULTY ({grade} appropriate) ═══
- Use simple, age-appropriate {lang} vocabulary
- Questions must be answerable by a learner in {grade}
- No trick questions, no double negatives
- For Mathematics: keep numbers within the term's taught range

═══ DISTRIBUTION RULE ═══
- Distribute questions across sub-strands PROPORTIONALLY to "lessons" count
- A sub-strand with 6 lessons gets ~2x the questions of one with 3 lessons
- Every listed sub-strand MUST get at least one question if total questions allow

═══ ANSWER QUALITY (MANDATORY — NEVER OMIT) ═══
EVERY question MUST include its answer. Questions without answers will be REJECTED.

- MCQ (type="mcq"): MUST include
    • options: array of EXACTLY 4 strings
    • answerIndex: integer 0, 1, 2, or 3 — the index of the ONE correct option
    • The correct option MUST actually be correct and present in options[]
    • Do NOT leave answerIndex blank, null, or missing under any circumstance

- Short (type="short"): MUST include
    • expectedAnswer: the REAL CONTENT a pupil should write — NOT a restatement of the question
        ◦ The question asks WHAT to do; expectedAnswer is the ACTUAL THING that does it.
        ◦ BAD examples (NEVER do this):
            – Q: "Name four members of your family." → expectedAnswer: "Name four family members." ❌
            – Q: "List three colours of the Kenyan flag." → expectedAnswer: "Three colours of the flag." ❌
            – Q: "Write the number after 9." → expectedAnswer: "The number after 9." ❌
        ◦ GOOD examples (DO THIS):
            – Q: "Name four members of your family." → expectedAnswer: "Father, Mother, Brother, Sister" ✅
            – Q: "List three colours of the Kenyan flag." → expectedAnswer: "Black, Red, Green" ✅
            – Q: "Write the number after 9." → expectedAnswer: "10" ✅
    • acceptableKeywords: 2-5 lowercase keywords from the actual answer content (not from the question)

- Long (type="long"): MUST include
    • rubric: concrete marking guide that names the SPECIFIC points/items/steps a pupil must mention to earn full marks. Do NOT write a vague rubric like "award marks if the answer is good".

Self-check before submitting:
- For every MCQ confirm answerIndex is a number 0-3.
- For every short question confirm expectedAnswer contains the ACTUAL ANSWER (names, numbers, facts) — NOT a paraphrase of the question.
- For every long question confirm rubric lists specific expected content.

═══ NO REPETITION / NO VAGUENESS (CRITICAL) ═══
- Do NOT repeat the same question, even with reworded phrasing.
- Do NOT repeat the same numerical example, the same names, or the same scenario across questions.
- Do NOT produce two MCQs that test the exact same fact (e.g. "What is 2+3?" and "Add 2 and 3").
- Vary the numbers, names, contexts and verbs used across the paper.
- Every question MUST be SPECIFIC and SELF-CONTAINED:
    • BAD: "Write a number." / "Say something about animals." / "Give an example."
    • GOOD: "Write the number that comes after 47." / "Name one domestic animal that gives us milk."
- Avoid vague stems like "Discuss…", "Talk about…", "Explain something…" without a concrete focus.
- Each question must have ONE clear, unambiguous correct answer (or for long answers, a clearly bounded expected response).
- Do NOT duplicate options inside an MCQ. All 4 options must be distinct.
- Spread questions across DIFFERENT sub-strands; do not cluster many questions on the same sub-strand unless its lesson count clearly demands it.

═══ TEXT-ONLY EXAM (CRITICAL — NO PRACTICAL TASKS) ═══
This exam is delivered and auto-marked as TEXT on a screen. The pupil can ONLY type/select an answer.
You MUST NOT generate any question that requires:
  • Drawing, sketching, colouring, shading, or tracing ("Draw the sun…", "Colour the flag…", "Shade half of…")
  • Cutting, pasting, folding, modelling, or any physical craft
  • Singing, reciting aloud, role-play, dancing, or any performance
  • Pointing at, touching, or matching pictures/objects on paper
  • Measuring real objects, observing the weather outside, or any field activity
  • Using a physical ruler, abacus, counters, beads, or any classroom material
  • Group work, pair work, asking a partner, or interviewing someone
  • Looking at a picture/diagram/map (you cannot include images)
If the curriculum sub-strand is fundamentally practical (e.g. "Drawing", "Singing", "Modelling"), assess the
underlying KNOWLEDGE in writing instead — e.g. "Name two colours used to draw the sun." NOT "Draw the sun."

═══ UNAMBIGUOUS MCQs (CRITICAL) ═══
Every MCQ must have EXACTLY ONE option that is correct and THREE options that are clearly, factually wrong.
- Distractors must NOT be "also technically true" or "sometimes true" answers.
- BAD (two valid answers): "What do you see in the sky at night?" → Sun / Clouds / Moon and stars / Birds
   (Clouds CAN be seen at night, so this has two correct answers.)
- GOOD: "Which of these gives light at night?" → Sun / Moon / Table / Chair  (only Moon is correct)
- BAD (subjective): "Which is the best fruit?"  → no objective answer.
- GOOD (objective): "Which of these is a fruit?" → Mango / Carrot / Onion / Cabbage
- Before finalising each MCQ, mentally check each of the 4 options and confirm 3 of them are DEFINITELY wrong.
- If you cannot make 3 clearly-wrong distractors, REWRITE the question — do not ship an ambiguous MCQ.

═══ STRAND/SUB-STRAND LABELS (EXACT) ═══
- The "strand" field MUST be copied EXACTLY as listed above (including leading numbering like "1.0 Numbers").
- The "subStrand" field MUST be copied EXACTLY as listed above (including numbering like "1.4 Subtraction").
- Do NOT shorten, rename, translate or invent labels.

Return ONLY valid JSON of the shape {{"questions": [...]}}, where each question
is one of:
- {{"type": "mcq", "strand": str, "subStrand": str, "question": str, "options": [4 strings], "answerIndex": 0|1|2|3, "marks": 1}}
- {{"type": "short", "strand": str, "subStrand": str, "question": str, "expectedAnswer": str, "acceptableKeywords": [str], "marks": 2}}
- {{"type": "long", "strand": str, "subStrand": str, "question": str, "rubric": str, "marks": 5}}
No prose, no markdown, no code fences."""


# ────────────────────────────────────────────────────────────────────────────
# Normalize / validateScope — verbatim port of TS:215-327.
# ────────────────────────────────────────────────────────────────────────────
_LEADING_NUMBERING_RE = re.compile(r"^[\d.\s]+")
_NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def normalize(s: str) -> str:
    """Lowercase, strip leading numbering (e.g. ``1.2 ``), collapse non-alnum to spaces.

    Source: TS:215-221.
    """
    s = (s or "").lower()
    s = _LEADING_NUMBERING_RE.sub("", s)
    s = _NON_ALNUM_RE.sub(" ", s)
    return s.strip()


# Practical-task regex from TS:261. Compiled once at import.
_PRACTICAL_RE = re.compile(
    r"\b(draw|sketch|colou?r in|colou?r the|shade|trace|cut out|paste|fold|"
    r"model|sing|recite|act out|role[- ]?play|dance|point at|point to|"
    r"touch the|match the picture|measure (?!the length\b)(?:the|your)|observe (?:the )?weather|"
    r"use (?:a|your) ruler|use (?:an )?abacus|use counters?|use beads?|"
    r"ask (?:your|a) (?:partner|friend|parent)|interview)\b",
    re.IGNORECASE,
)


def _coerce_question(q: Dict[str, Any]) -> Optional[ExamQuestion]:
    """Pydantic-validate one question dict; return None on shape mismatch."""
    qtype = q.get("type")
    try:
        if qtype == "mcq":
            return MCQ.model_validate(q)
        if qtype == "short":
            return ShortQ.model_validate(q)
        if qtype == "long":
            return LongQ.model_validate(q)
    except ValidationError as exc:
        log.warning("Dropped Q (schema mismatch): %s — %s", q.get("question", ""), exc)
        return None
    log.warning("Dropped Q (unknown type=%r)", qtype)
    return None


def validate_scope(
    questions: Sequence[Dict[str, Any]],
    allocation: Sequence[StrandAllocation],
) -> List[ExamQuestion]:
    """Filter questions to in-scope strand/sub-strand + enforce answer completeness.

    Mirrors ``validateScope`` (TS:223-327) including:
    - exact-then-substring matching for strand/sub-strand labels
    - practical-task regex filter
    - MCQ ``options.length === 4 && answerIndex in [0..3]``
    - short-answer non-empty + echo-answer detector (≤6 meaningful words AND
      ≥70% overlap with the question)
    - long-answer requires non-empty rubric
    - de-duplication by 80-char normalised question prefix
    """
    strand_map: Dict[str, str] = {}
    sub_strand_map: Dict[str, str] = {}
    for a in allocation:
        strand_map[normalize(a.strandName)] = a.strandName
        for ss in a.subStrands:
            sub_strand_map[normalize(ss.name)] = ss.name

    accepted: List[ExamQuestion] = []
    for raw_q in questions:
        coerced = _coerce_question(raw_q)
        if coerced is None:
            continue

        strand_key = normalize(coerced.strand)
        sub_key = normalize(coerced.subStrand)

        matched_strand = strand_map.get(strand_key)
        if not matched_strand:
            for k, v in strand_map.items():
                if k and strand_key and (k in strand_key or strand_key in k):
                    matched_strand = v
                    break

        matched_sub = sub_strand_map.get(sub_key)
        if not matched_sub:
            for k, v in sub_strand_map.items():
                if k and sub_key and (k in sub_key or sub_key in k):
                    matched_sub = v
                    break

        if not (matched_strand and matched_sub):
            log.warning(
                "Dropped Q — strand=%r sub=%r (no scope match)",
                coerced.strand,
                coerced.subStrand,
            )
            continue

        if _PRACTICAL_RE.search(coerced.question):
            log.warning("Dropped practical Q: %r", coerced.question)
            continue

        if isinstance(coerced, MCQ):
            if len(coerced.options) != 4 or not (0 <= coerced.answerIndex <= 3):
                log.warning(
                    "Dropped MCQ (missing/invalid answerIndex): %r",
                    coerced.question,
                )
                continue
        elif isinstance(coerced, ShortQ):
            ans = (coerced.expectedAnswer or "").strip()
            if not ans:
                log.warning("Dropped short (no expectedAnswer): %r", coerced.question)
                continue
            # Echo detection — TS:286-300.
            q_norm = normalize(coerced.question)
            a_norm = normalize(ans)
            q_words = {w for w in q_norm.split(" ") if len(w) > 3}
            a_words = [w for w in a_norm.split(" ") if len(w) > 3]
            overlap = sum(1 for w in a_words if w in q_words)
            overlap_ratio = (overlap / len(a_words)) if a_words else 0.0
            if len(a_words) <= 6 and overlap_ratio >= 0.7:
                log.warning(
                    "Dropped echo answer — Q: %r | A: %r", coerced.question, ans
                )
                continue
        elif isinstance(coerced, LongQ):
            if not (coerced.rubric or "").strip():
                log.warning("Dropped long (no rubric): %r", coerced.question)
                continue

        # Replace strand/subStrand with the canonical label from allocation.
        updated = coerced.model_copy(
            update={"strand": matched_strand, "subStrand": matched_sub}
        )
        accepted.append(updated)

    # De-duplicate by 80-char normalised question prefix (TS:314-326).
    seen: set[str] = set()
    deduped: List[ExamQuestion] = []
    for q in accepted:
        fingerprint = re.sub(r"\s+", " ", normalize(q.question))[:80]
        if fingerprint in seen:
            log.warning("Dropped duplicate Q: %r", q.question)
            continue
        seen.add(fingerprint)
        deduped.append(q)

    return deduped


# ────────────────────────────────────────────────────────────────────────────
# JSON recovery — same fence stripping as lesson_plan.parse_lesson_plan.
# ────────────────────────────────────────────────────────────────────────────
_FENCE_RE = re.compile(r"^```(?:json)?\n?|\n?```$", re.IGNORECASE)


def _strip_code_fence(raw: str) -> str:
    s = raw.strip()
    if s.startswith("```"):
        s = _FENCE_RE.sub("", s).strip()
    return s


def parse_questions(raw: str) -> List[Dict[str, Any]]:
    """Coerce an LLM response into a list of raw question dicts.

    Accepts either ``{"questions": [...]}`` or a bare ``[...]``. Strips fences
    and falls back to the first ``{...}``/``[...]`` blob if surrounded by
    prose. Returns the raw dicts; pass them through :func:`validate_scope` to
    convert to :class:`ExamQuestion` objects.
    """
    cleaned = _strip_code_fence(raw)
    data: Any
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        for pattern in (r"\{.*\}", r"\[.*\]"):
            match = re.search(pattern, cleaned, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(0))
                    break
                except json.JSONDecodeError:
                    continue
        else:
            log.error("Exam: no JSON found in response (preview=%s)", cleaned[:200])
            raise ExamValidationError("LLM did not return JSON")

    if isinstance(data, dict):
        questions = data.get("questions", [])
    elif isinstance(data, list):
        questions = data
    else:
        raise ExamValidationError("Top-level JSON must be object or array")

    if not isinstance(questions, list):
        raise ExamValidationError("`questions` must be an array")

    return questions


async def generate_exam(
    provider: LLMProvider,
    *,
    grade: str,
    subject: str,
    term: str,
    allocation: Sequence[StrandAllocation],
    counts: Optional[ExamCounts] = None,
) -> List[ExamQuestion]:
    """Generate one end-of-term exam, scope-validated against ``allocation``.

    Returns the list of validated, deduped questions. Raises
    :class:`ExamValidationError` if zero questions survive validation (which
    indicates either an off-topic LLM response or a totally broken JSON
    response — the orchestrator should treat both as retry-or-422).

    Propagates :class:`scheme.batched.RateLimitError` so the orchestrator can
    distinguish "try again" from "broken response".
    """
    if not (grade and subject and term and allocation):
        raise ValueError("grade, subject, term, allocation are required")

    counts = counts or ExamCounts()
    system_prompt = _build_system_prompt(
        grade=grade,
        subject=subject,
        term=term,
        allocation=allocation,
        counts=counts,
    )
    user_prompt = (
        f"Generate the {grade} {subject} {term} exam now. Stay strictly in-scope."
    )

    try:
        raw = await provider.generate(user_prompt, system=system_prompt)
    except RateLimitError:
        raise
    except Exception as exc:
        msg = str(exc).lower()
        if ("rate" in msg and "limit" in msg) or "429" in msg:
            raise RateLimitError("RATE_LIMIT") from exc
        raise

    raw_questions = parse_questions(raw)
    questions = validate_scope(raw_questions, allocation)
    if not questions:
        raise ExamValidationError("No in-scope questions survived validation")
    return questions


__all__ = [
    "ExamCounts",
    "ExamQuestion",
    "ExamValidationError",
    "LongQ",
    "MCQ",
    "ShortQ",
    "StrandAllocation",
    "SubStrandInfo",
    "generate_exam",
    "normalize",
    "parse_questions",
    "validate_scope",
]
