"""Repository for lesson planning data persistence.

Handles all database operations for schemes, lesson plans, exams, worksheets,
and related artifacts. Encapsulates Supabase client usage to decouple
business logic from infrastructure.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from ...core.logging import AgentLogger


class LessonArchitectRepository:
    """Repository for lesson planning artifacts.
    
    Provides a clean interface for persisting and retrieving schemes,
    lesson plans, exams, worksheets, and related content. All operations
    are best-effort — failures are logged but don't raise exceptions,
    allowing the application to continue serving content even when
    persistence is unavailable.
    """

    def __init__(self, supabase_client=None) -> None:
        """Initialize repository with optional Supabase client.
        
        Args:
            supabase_client: Supabase client instance. If None, all save
                operations will log warnings and skip persistence.
        """
        self.supabase = supabase_client
        self.logger = AgentLogger("lesson_architect_repository")

    # -------------------------------------------------------------------------
    # Schemes
    # -------------------------------------------------------------------------

    async def save_scheme(self, scheme: Dict[str, Any]) -> None:
        """Save scheme to database (best-effort).
        
        Args:
            scheme: Scheme dictionary containing scheme_id, title, grade,
                subject, term, mode, teacher_id, language, total_weeks,
                lessons_per_week, rows, created_at.
        """
        if not self.supabase:
            self.logger.warning("Supabase not configured, scheme not saved")
            return

        try:
            self.logger.info(
                "Saving scheme",
                scheme_id=scheme.get("scheme_id"),
                teacher_id=scheme.get("teacher_id"),
            )

            self.supabase.table("schemes").insert({
                "scheme_id": scheme["scheme_id"],
                "title": scheme["title"],
                "grade": scheme["grade"],
                "subject": scheme["subject"],
                "term": scheme["term"],
                "mode": scheme["mode"],
                "teacher_id": scheme["teacher_id"],
                "language": scheme["language"],
                "total_weeks": scheme["total_weeks"],
                "lessons_per_week": scheme["lessons_per_week"],
                "rows": scheme["rows"],
                "created_at": scheme["created_at"],
            }).execute()

            self.logger.info("Scheme saved successfully", scheme_id=scheme["scheme_id"])

        except Exception as exc:
            import traceback
            self.logger.error(
                "Failed to save scheme",
                error=str(exc),
                error_type=type(exc).__name__,
                scheme_id=scheme.get("scheme_id"),
                teacher_id=scheme.get("teacher_id"),
                traceback=traceback.format_exc(),
            )

    async def load_scheme(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        """Load scheme from database by ID.
        
        Args:
            scheme_id: Unique scheme identifier.
            
        Returns:
            Scheme dictionary if found, None otherwise.
        """
        if not self.supabase:
            self.logger.warning("Supabase not configured")
            return None

        try:
            response = self.supabase.table("schemes").select("*").eq(
                "scheme_id", scheme_id
            ).execute()

            if response and hasattr(response, "data") and response.data:
                return response.data[0]

            return None

        except Exception as exc:
            self.logger.error("Failed to load scheme", error=str(exc))
            return None

    async def list_schemes(
        self,
        *,
        teacher_id: str,
        grade: Optional[str] = None,
        subject: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List schemes for a teacher with optional filters.
        
        Args:
            teacher_id: Teacher's unique identifier.
            grade: Optional grade filter (e.g., "Grade 4").
            subject: Optional subject filter (e.g., "Mathematics").
            
        Returns:
            List of scheme dictionaries matching the filters.
        """
        if not self.supabase:
            self.logger.warning("Database not configured")
            return []

        try:
            query = self.supabase.table("schemes").select("*").eq("teacher_id", teacher_id)

            if grade:
                query = query.eq("grade", grade)
            if subject:
                query = query.eq("subject", subject)

            response = query.execute()

            schemes = []
            if response and hasattr(response, "data"):
                schemes = response.data or []

            self.logger.info("Listed schemes", count=len(schemes), teacher_id=teacher_id)
            return schemes

        except Exception as exc:
            self.logger.error(
                "List schemes failed",
                error=str(exc),
                error_type=type(exc).__name__,
            )
            return []

    # -------------------------------------------------------------------------
    # Lesson Plans
    # -------------------------------------------------------------------------

    async def save_lesson_plan(self, lesson_plan: Dict[str, Any]) -> None:
        """Save lesson plan to database (best-effort).
        
        The full validated LessonPlan goes into the plan JSONB column;
        only scalars used for filtering/indexing get their own columns.
        
        Args:
            lesson_plan: Lesson plan dictionary with lesson_plan_id,
                scheme_id, teacher_id, week, lesson, created_at, and
                plan content fields.
        """
        if not self.supabase:
            self.logger.warning("Supabase not configured, lesson plan not saved")
            return

        # Separate persistence metadata from validated plan payload
        plan_payload = {
            k: v
            for k, v in lesson_plan.items()
            if k
            not in {
                "lesson_plan_id",
                "scheme_id",
                "teacher_id",
                "week",
                "lesson",
                "created_at",
            }
        }

        row = {
            "lesson_plan_id": lesson_plan["lesson_plan_id"],
            "scheme_id": lesson_plan.get("scheme_id"),
            "teacher_id": lesson_plan["teacher_id"],
            "grade": plan_payload.get("grade", ""),
            "subject": plan_payload.get("subject", ""),
            "strand": plan_payload.get("strand"),
            "sub_strand": plan_payload.get("subStrand"),
            "week": lesson_plan["week"],
            "lesson": lesson_plan["lesson"],
            "plan": plan_payload,
            "created_at": lesson_plan["created_at"],
        }

        try:
            self.supabase.table("lesson_plans").insert(row).execute()
            self.logger.info("Lesson plan saved", lesson_plan_id=row["lesson_plan_id"])
        except Exception as exc:
            self.logger.error(
                "Failed to save lesson plan",
                error=str(exc),
                error_type=type(exc).__name__,
                lesson_plan_id=row["lesson_plan_id"],
            )

    # -------------------------------------------------------------------------
    # Exams
    # -------------------------------------------------------------------------

    async def save_exam(
        self,
        *,
        exam_id: str,
        teacher_id: str,
        grade: str,
        subject: str,
        term: str,
        questions: List[Dict[str, Any]],
        total_marks: int,
    ) -> None:
        """Persist an exam paper (best-effort).
        
        Args:
            exam_id: Unique exam identifier.
            teacher_id: Teacher who created the exam.
            grade: Grade level (e.g., "Grade 4").
            subject: Subject name (e.g., "Mathematics").
            term: Term identifier (e.g., "Term 1").
            questions: List of exam question dictionaries.
            total_marks: Total marks for the exam.
        """
        if not self.supabase:
            return

        row = {
            "exam_id": exam_id,
            "created_by": teacher_id,
            "grade": grade,
            "subject": subject,
            "term": term,
            "questions": questions,
            "total_marks": total_marks,
            "created_at": datetime.now().isoformat(),
        }

        try:
            self.supabase.table("exams").insert(row).execute()
            self.logger.info("Exam saved", exam_id=exam_id)
        except Exception as exc:
            self.logger.error(
                "Failed to save exam",
                error=str(exc),
                error_type=type(exc).__name__,
                exam_id=exam_id,
            )

    # -------------------------------------------------------------------------
    # Worksheets
    # -------------------------------------------------------------------------

    async def save_worksheet(
        self,
        *,
        worksheet_id: str,
        teacher_id: str,
        grade: str,
        subject: str,
        term: Optional[str],
        payload: Dict[str, Any],
    ) -> None:
        """Persist a worksheet (best-effort).
        
        Args:
            worksheet_id: Unique worksheet identifier.
            teacher_id: Teacher who created the worksheet.
            grade: Grade level.
            subject: Subject name.
            term: Optional term identifier.
            payload: Worksheet content dictionary.
        """
        if not self.supabase:
            return

        row = {
            "worksheet_id": worksheet_id,
            "teacher_id": teacher_id,
            "grade": grade,
            "subject": subject,
            "term": term,
            "strand": payload.get("strand"),
            "sub_strand": payload.get("subStrand"),
            "payload": payload,
            "created_at": datetime.now().isoformat(),
        }

        try:
            self.supabase.table("worksheets").insert(row).execute()
            self.logger.info("Worksheet saved", worksheet_id=worksheet_id)
        except Exception as exc:
            self.logger.error(
                "Failed to save worksheet",
                error=str(exc),
                error_type=type(exc).__name__,
                worksheet_id=worksheet_id,
            )

    # -------------------------------------------------------------------------
    # Unpacked Outcomes
    # -------------------------------------------------------------------------

    async def save_unpacked_outcome(
        self,
        *,
        unpacked_id: str,
        teacher_id: str,
        grade: str,
        subject: str,
        outcome: str,
        payload: Dict[str, Any],
    ) -> None:
        """Persist an unpacked outcome (best-effort).
        
        Args:
            unpacked_id: Unique unpacked outcome identifier.
            teacher_id: Teacher who requested the unpacking.
            grade: Grade level.
            subject: Subject name.
            outcome: Original KICD learning outcome text.
            payload: Unpacked outcome content dictionary.
        """
        if not self.supabase:
            return

        row = {
            "unpacked_id": unpacked_id,
            "teacher_id": teacher_id,
            "grade": grade,
            "subject": subject,
            "outcome": outcome,
            "payload": payload,
            "created_at": datetime.now().isoformat(),
        }

        try:
            self.supabase.table("unpacked_outcomes").insert(row).execute()
            self.logger.info("Unpacked outcome saved", unpacked_id=unpacked_id)
        except Exception as exc:
            self.logger.error(
                "Failed to save unpacked outcome",
                error=str(exc),
                error_type=type(exc).__name__,
                unpacked_id=unpacked_id,
            )

    # -------------------------------------------------------------------------
    # Differentiation
    # -------------------------------------------------------------------------

    async def save_differentiation(
        self,
        *,
        differentiation_id: str,
        teacher_id: str,
        lesson_plan_id: Optional[str],
        payload: Dict[str, Any],
    ) -> None:
        """Persist a differentiation block (best-effort).
        
        Args:
            differentiation_id: Unique differentiation identifier.
            teacher_id: Teacher who requested differentiation.
            lesson_plan_id: Optional lesson plan ID this differenti ation is for.
            payload: Differentiation content dictionary.
        """
        if not self.supabase:
            return

        row = {
            "differentiation_id": differentiation_id,
            "teacher_id": teacher_id,
            "lesson_plan_id": lesson_plan_id,
            "grade": payload.get("grade"),
            "subject": payload.get("subject"),
            "strand": payload.get("strand"),
            "sub_strand": payload.get("subStrand"),
            "payload": payload,
            "created_at": datetime.now().isoformat(),
        }

        try:
            self.supabase.table("differentiations").insert(row).execute()
            self.logger.info("Differentiation saved", differentiation_id=differentiation_id)
        except Exception as exc:
            self.logger.error(
                "Failed to save differentiation",
                error=str(exc),
                error_type=type(exc).__name__,
                differentiation_id=differentiation_id,
            )
