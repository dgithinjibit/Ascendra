-- SECURITY GATE: review policy semantics before applying.
-- Enables RLS on the four tables flagged by Supabase.
-- The policies use the existing teacher_id/user_id ownership contracts.

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Learning progress: the learner owns their own progress; teachers can read
-- progress for assigned learners through the canonical student relationship.
CREATE POLICY syncsenta_learning_progress_student_select
  ON public.learning_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY syncsenta_learning_progress_teacher_select
  ON public.learning_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_student_assignments a
        ON a.student_id = s.id
      WHERE s.user_id = learning_progress.user_id
        AND a.teacher_id = auth.uid()
    )
  );

CREATE POLICY syncsenta_learning_progress_student_insert
  ON public.learning_progress FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY syncsenta_learning_progress_student_update
  ON public.learning_progress FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Teaching materials are teacher-owned. Service-role workers retain access.
CREATE POLICY syncsenta_schemes_teacher_owner
  ON public.schemes FOR ALL TO authenticated
  USING (teacher_id::text = auth.uid()::text)
  WITH CHECK (teacher_id::text = auth.uid()::text);

CREATE POLICY syncsenta_lesson_plans_teacher_owner
  ON public.lesson_plans FOR ALL TO authenticated
  USING (teacher_id::text = auth.uid()::text)
  WITH CHECK (teacher_id::text = auth.uid()::text);

CREATE POLICY syncsenta_exams_teacher_owner
  ON public.exams FOR ALL TO authenticated
  USING (teacher_id::text = auth.uid()::text)
  WITH CHECK (teacher_id::text = auth.uid()::text);

-- Trusted server operations only; no anonymous access.
GRANT ALL ON public.learning_progress, public.schemes, public.lesson_plans, public.exams TO service_role;
