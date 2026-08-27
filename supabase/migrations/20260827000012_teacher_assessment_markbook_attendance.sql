-- Teacher assessment records, markbook results, and attendance register.
-- Additive, role-scoped, and fail-closed. No seed data is inserted.

CREATE TABLE IF NOT EXISTS public.teacher_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  term TEXT NOT NULL CHECK (term IN ('Term 1', 'Term 2', 'Term 3', 'Term1', 'Term2', 'Term3')),
  assessment_period TEXT NOT NULL CHECK (assessment_period IN ('formative', 'midterm', 'end_of_term')),
  title TEXT NOT NULL,
  instructions TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_marks INTEGER NOT NULL DEFAULT 0 CHECK (total_marks >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_assessments_teacher ON public.teacher_assessments(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_assessments_term ON public.teacher_assessments(grade, subject, term, assessment_period);
ALTER TABLE public.teacher_assessments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.teacher_assessments(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score NUMERIC(7,2) NOT NULL CHECK (score >= 0),
  feedback TEXT,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON public.assessment_results(student_id, marked_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_results_teacher ON public.assessment_results(teacher_id, marked_at DESC);
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_class_attendance_teacher_date ON public.class_attendance(teacher_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_class_attendance_student_date ON public.class_attendance(student_id, attendance_date DESC);
ALTER TABLE public.class_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS teacher_assessments_teacher_manage ON public.teacher_assessments;
CREATE POLICY teacher_assessments_teacher_manage ON public.teacher_assessments
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS assessment_results_teacher_manage ON public.assessment_results;
CREATE POLICY assessment_results_teacher_manage ON public.assessment_results
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.teacher_assessments a WHERE a.id = assessment_results.assessment_id AND a.teacher_id = auth.uid()
  ))
  WITH CHECK (teacher_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.teacher_assessments a WHERE a.id = assessment_results.assessment_id AND a.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS assessment_results_student_read ON public.assessment_results;
CREATE POLICY assessment_results_student_read ON public.assessment_results
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS assessment_results_parent_read ON public.assessment_results;
CREATE POLICY assessment_results_parent_read ON public.assessment_results
  FOR SELECT TO authenticated
  USING (private.syncsenta_is_parent_of(student_id));

DROP POLICY IF EXISTS assessment_results_head_read ON public.assessment_results;
CREATE POLICY assessment_results_head_read ON public.assessment_results
  FOR SELECT TO authenticated
  USING (private.syncsenta_is_head_of(student_id));

DROP POLICY IF EXISTS class_attendance_teacher_manage ON public.class_attendance;
CREATE POLICY class_attendance_teacher_manage ON public.class_attendance
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS class_attendance_student_read ON public.class_attendance;
CREATE POLICY class_attendance_student_read ON public.class_attendance
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS class_attendance_parent_read ON public.class_attendance;
CREATE POLICY class_attendance_parent_read ON public.class_attendance
  FOR SELECT TO authenticated
  USING (private.syncsenta_is_parent_of(student_id));

DROP POLICY IF EXISTS class_attendance_head_read ON public.class_attendance;
CREATE POLICY class_attendance_head_read ON public.class_attendance
  FOR SELECT TO authenticated
  USING (private.syncsenta_is_head_of(student_id));

REVOKE ALL ON public.teacher_assessments, public.assessment_results, public.class_attendance FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_assessments, public.assessment_results, public.class_attendance TO authenticated;
GRANT ALL ON public.teacher_assessments, public.assessment_results, public.class_attendance TO service_role;
