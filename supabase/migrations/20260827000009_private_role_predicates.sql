-- Move RLS role predicates out of the exposed public API schema.
-- They remain SECURITY DEFINER because they must inspect related rows despite
-- caller-facing RLS; the private schema is not exposed through PostgREST.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.syncsenta_is_student_for(p_student_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='student' AND (p.id::text=p_student_id OR p.student_id=p_student_id));
$$;

CREATE OR REPLACE FUNCTION private.syncsenta_is_teacher_for(p_student_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_student_assignments a JOIN public.profiles p ON p.id=a.teacher_id JOIN public.students s ON s.id=a.student_id WHERE p.id=auth.uid() AND p.role='teacher' AND a.status='active' AND (s.id::text=p_student_id OR s.student_id=p_student_id));
$$;

CREATE OR REPLACE FUNCTION private.syncsenta_is_parent_for(p_student_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN public.students s ON s.id=ANY(p.children_ids) WHERE p.id=auth.uid() AND p.role='parent' AND (s.id::text=p_student_id OR s.student_id=p_student_id));
$$;

CREATE OR REPLACE FUNCTION private.syncsenta_is_head_for(p_student_id TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN public.students s ON s.school_name=p.school_name WHERE p.id=auth.uid() AND (p.role='admin' OR auth.jwt()->'app_metadata'->>'role'='head_of_school') AND p.school_name IS NOT NULL AND (s.id::text=p_student_id OR s.student_id=p_student_id));
$$;

CREATE OR REPLACE FUNCTION private.syncsenta_is_student_profile(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'student' AND p.id = p_subject);
$$;

CREATE OR REPLACE FUNCTION private.syncsenta_is_parent_of(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p_subject = ANY(p.children_ids));
$$;

CREATE OR REPLACE FUNCTION private.syncsenta_is_teacher_of(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles teacher JOIN public.profiles student ON student.id = p_subject WHERE teacher.id = auth.uid() AND teacher.role = 'teacher' AND student.role = 'student' AND student.grade = ANY(teacher.classes));
$$;

CREATE OR REPLACE FUNCTION private.syncsenta_is_head_of(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles head JOIN public.profiles student ON student.id = p_subject WHERE head.id = auth.uid() AND (head.role = 'admin' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'head_of_school') AND head.school_name IS NOT NULL AND head.school_name = student.school_name);
$$;

GRANT EXECUTE ON FUNCTION private.syncsenta_is_student_for(TEXT), private.syncsenta_is_teacher_for(TEXT), private.syncsenta_is_parent_for(TEXT), private.syncsenta_is_head_for(TEXT), private.syncsenta_is_student_profile(UUID), private.syncsenta_is_parent_of(UUID), private.syncsenta_is_teacher_of(UUID), private.syncsenta_is_head_of(UUID) TO authenticated, service_role;

-- Rewrite all existing policies that depend on these helpers.
DO $$
DECLARE
  p RECORD;
  q TEXT;
  c TEXT;
  stmt TEXT;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual::text ILIKE '%syncsenta_is_%' OR with_check::text ILIKE '%syncsenta_is_%')
  LOOP
    q := CASE WHEN p.qual IS NULL THEN NULL ELSE replace(p.qual::text, 'syncsenta_is_', 'private.syncsenta_is_') END;
    c := CASE WHEN p.with_check IS NULL THEN NULL ELSE replace(p.with_check::text, 'syncsenta_is_', 'private.syncsenta_is_') END;
    stmt := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF q IS NOT NULL THEN stmt := stmt || format(' USING (%s)', q); END IF;
    IF c IS NOT NULL THEN stmt := stmt || format(' WITH CHECK (%s)', c); END IF;
    EXECUTE stmt;
  END LOOP;
END $$;

-- The exposed copies are no longer used by policies.
REVOKE ALL ON FUNCTION public.syncsenta_is_student_for(TEXT), public.syncsenta_is_teacher_for(TEXT), public.syncsenta_is_parent_for(TEXT), public.syncsenta_is_head_for(TEXT), public.syncsenta_is_student_profile(UUID), public.syncsenta_is_parent_of(UUID), public.syncsenta_is_teacher_of(UUID), public.syncsenta_is_head_of(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_student_for(TEXT), public.syncsenta_is_teacher_for(TEXT), public.syncsenta_is_parent_for(TEXT), public.syncsenta_is_head_for(TEXT), public.syncsenta_is_student_profile(UUID), public.syncsenta_is_parent_of(UUID), public.syncsenta_is_teacher_of(UUID), public.syncsenta_is_head_of(UUID) TO service_role;

ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_catalog;
