-- EXPLICIT TELEMETRY ROLE POLICIES
--
-- Preconditions:
--   * 20260523000002_telemetry_tables.sql has created the six tables.
--   * 001_core_schema.sql has created profiles with roles student/teacher/parent/admin.
--   * 20260524000001_teacher_student_management.sql has created students and
--     teacher_student_assignments.
--
-- Head-of-school access is represented by profiles.role = 'admin' or the
-- server-controlled JWT app_metadata role = 'head_of_school'. Do not use
-- user_metadata for authorization: it is user-editable.
--
-- This migration grants SELECT only. Telemetry ingestion and derived writes
-- remain server-side/service-role operations. No client INSERT/UPDATE/DELETE
-- policy is created.

-- Keep RLS enabled even if this migration is applied without the prior lock.
ALTER TABLE public.student_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misconceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xapi_statements ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.syncsenta_is_student_for(p_student_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'student'
      AND (p.id::TEXT = p_student_id OR p.student_id = p_student_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.syncsenta_is_teacher_for(p_student_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles teacher
    JOIN public.teacher_student_assignments tsa
      ON tsa.teacher_id = teacher.id
     AND tsa.status = 'active'
    JOIN public.students s ON s.id = tsa.student_id
    WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND (s.id::TEXT = p_student_id OR s.student_id = p_student_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.syncsenta_is_parent_for(p_student_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles parent
    JOIN public.students s ON s.id = ANY(parent.children_ids)
    WHERE parent.id = auth.uid()
      AND parent.role = 'parent'
      AND (s.id::TEXT = p_student_id OR s.student_id = p_student_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.syncsenta_is_head_for(p_student_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles head
    JOIN public.students s ON s.school_name = head.school_name
    WHERE head.id = auth.uid()
      AND (
        head.role = 'admin'
        OR auth.jwt() -> 'app_metadata' ->> 'role' = 'head_of_school'
      )
      AND head.school_name IS NOT NULL
      AND s.school_name IS NOT NULL
      AND (s.id::TEXT = p_student_id OR s.student_id = p_student_id)
  );
$$;

REVOKE ALL ON FUNCTION public.syncsenta_is_student_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_teacher_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_parent_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_head_for(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_student_for(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_teacher_for(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_parent_for(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_head_for(TEXT) TO authenticated;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'student_sessions',
    'telemetry_events',
    'behavioral_profiles',
    'misconceptions',
    'interventions',
    'xapi_statements'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "telemetry_service_role_all" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "telemetry_student_select" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "telemetry_teacher_select" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "telemetry_head_select" ON public.%I', table_name);
    EXECUTE format('DROP POLICY IF EXISTS "telemetry_parent_select" ON public.%I', table_name);

    EXECUTE format(
      'CREATE POLICY "telemetry_service_role_all" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "telemetry_student_select" ON public.%I FOR SELECT TO authenticated USING (public.syncsenta_is_student_for(student_id))',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "telemetry_teacher_select" ON public.%I FOR SELECT TO authenticated USING (public.syncsenta_is_teacher_for(student_id))',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "telemetry_head_select" ON public.%I FOR SELECT TO authenticated USING (public.syncsenta_is_head_for(student_id))',
      table_name
    );
    EXECUTE format(
      'CREATE POLICY "telemetry_parent_select" ON public.%I FOR SELECT TO authenticated USING (public.syncsenta_is_parent_for(student_id))',
      table_name
    );
  END LOOP;
END
$$;

COMMENT ON FUNCTION public.syncsenta_is_student_for(TEXT) IS 'Fail-closed student self-access predicate for telemetry.';
COMMENT ON FUNCTION public.syncsenta_is_teacher_for(TEXT) IS 'Fail-closed active teacher assignment predicate for telemetry.';
COMMENT ON FUNCTION public.syncsenta_is_parent_for(TEXT) IS 'Fail-closed parent-to-child predicate for telemetry.';
COMMENT ON FUNCTION public.syncsenta_is_head_for(TEXT) IS 'Fail-closed same-school head/admin predicate for telemetry.';
