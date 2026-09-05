"""Lesson Plan generator - Detailed lesson planning from scheme rows.

Generates comprehensive, CBC-compliant lesson plans with activities,
assessments, and resources based on scheme of work guardrails.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional, Protocol

from ...core.exceptions import AgentError
from ...core.logging import AgentLogger
from ..scheme.lesson_plan import (
    LessonPlanValidationError,
    generate_lesson_plan as _gen_lesson_plan,
)


class LLMProvider(Protocol):
    """Protocol for LLM providers."""

    async def generate(self, prompt: str, *, system: str | None = None) -> str:
        ...


class LessonPlanGenerator:
    """Generates detailed CBC-compliant lesson plans.
    
    Takes scheme row content as guardrails and generates comprehensive
    lesson plans with structured activities, assessments, and resources
    aligned with KICD standards.
    """

    def __init__(self, llm_provider: LLMProvider) -> None:
        """Initialize lesson plan generator.
        
        Args:
            llm_provider: LLM provider instance for content generation.
        """
        self.llm_provider = llm_provider
        self.logger = AgentLogger("lesson_plan_generator")

    async def generate_lesson_plan(
        self,
        *,
        week: int,
        lesson: int,
        teacher_id: str,
        scheme_row: Dict[str, Any],
        grade: str,
        subject: str,
        term: Optional[str] = None,
        additional_notes: Optional[str] = None,
        language: str = "english",
    ) -> Dict[str, Any]:
        """Generate a detailed lesson plan.

        Args:
            week: Week number in the scheme.
            lesson: Lesson number within the week.
            teacher_id: Teacher's unique identifier.
            scheme_row: Scheme row content to use as guardrails.
            grade: Grade level.
            subject: Subject name.
            term: Optional term identifier.
            additional_notes: Optional teacher notes/preferences.
            language: Content language (english or kiswahili).

        Returns:
            Lesson plan dictionary with metadata and content.

        Raises:
            AgentError: If generation fails.
        """
        try:
            self.logger.info(
                "Generating lesson plan",
                week=week,
                lesson=lesson,
                grade=grade,
                subject=subject,
            )

            # Extract guardrail content from scheme row
            strand = self._pick(scheme_row, "strand", "Strand") or ""
            sub_strand = self._pick(scheme_row, "subStrand", "sub_strand", "SubStrand") or ""
            slo = self._as_text(
                self._pick(
                    scheme_row,
                    "specificLearningOutcome",
                    "specific_learning_outcomes",
                    "specific_learning_outcome",
                )
            )
            learning_experiences = self._as_text(
                self._pick(scheme_row, "learningExperiences", "learning_experiences")
            )
            kiq = self._as_text(
                self._pick(
                    scheme_row,
                    "keyInquiryQuestion",
                    "key_inquiry_questions",
                    "key_inquiry_question",
                )
            )
            resources = self._as_text(
                self._pick(
                    scheme_row,
                    "learningResources",
                    "learning_resources",
                    "resources",
                )
            )

            # Generate lesson plan using ported pipeline
            try:
                plan = await _gen_lesson_plan(
                    self.llm_provider,
                    grade=grade,
                    subject=subject,
                    strand=strand,
                    sub_strand=sub_strand,
                    slo=slo,
                    learning_experiences=learning_experiences,
                    key_inquiry_question=kiq,
                    learning_resources=resources,
                    term=term,
                    additional_notes=additional_notes,
                )
            except LessonPlanValidationError as exc:
                raise AgentError(f"Lesson plan validation failed: {exc}") from exc

            # Stamp persistence metadata
            lesson_plan = plan.model_dump()
            lesson_plan_id = f"lesson_{uuid.uuid4().hex[:12]}"
            lesson_plan["lesson_plan_id"] = lesson_plan_id
            lesson_plan["teacher_id"] = teacher_id
            lesson_plan["week"] = week
            lesson_plan["lesson"] = lesson
            lesson_plan["created_at"] = datetime.now().isoformat()

            self.logger.info("Lesson plan generated", lesson_plan_id=lesson_plan_id)

            return {
                "agent": "lesson_architect",
                "action": "generate_lesson_plan",
                "response": f"Generated lesson plan for Week {week}, Lesson {lesson}",
                "lesson_plan_id": lesson_plan_id,
                "lesson_plan": lesson_plan,
            }

        except Exception as exc:
            self.logger.error("Lesson plan generation failed", error=str(exc))
            raise AgentError(f"Lesson plan generation failed: {exc}") from exc

    @staticmethod
    def _pick(row: Dict[str, Any], *keys: str) -> Any:
        """Pick first non-empty value from row by trying multiple keys."""
        for k in keys:
            v = row.get(k)
            if v not in (None, "", []):
                return v
        return None

    @staticmethod
    def _as_text(value: Any) -> Optional[str]:
        """Convert value to text representation."""
        if value is None:
            return None
        if isinstance(value, (list, tuple)):
            return "; ".join(str(v) for v in value if v)
        return str(value)
