-- Explicit privilege hardening for exposed SECURITY DEFINER functions.
-- Keep role predicates available to authenticated/service_role only.
DO $$
BEGIN
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.syncsenta_is_student_for(text) FROM PUBLIC, anon';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.syncsenta_is_teacher_for(text) FROM PUBLIC, anon';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.syncsenta_is_parent_for(text) FROM PUBLIC, anon';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.syncsenta_is_head_for(text) FROM PUBLIC, anon';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.syncsenta_is_student_for(text) TO authenticated, service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.syncsenta_is_teacher_for(text) TO authenticated, service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.syncsenta_is_parent_for(text) TO authenticated, service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.syncsenta_is_head_for(text) TO authenticated, service_role';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_teacher_feedback_summary(text) FROM PUBLIC, anon';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.get_top_rules(integer) FROM PUBLIC, anon';
  EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_teacher_feedback_summary(text) TO service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_top_rules(integer) TO service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role';
END $$;

ALTER FUNCTION public.syncsenta_is_student_for(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.syncsenta_is_teacher_for(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.syncsenta_is_parent_for(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.syncsenta_is_head_for(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_teacher_feedback_summary(text) SET search_path = public, pg_catalog;
ALTER FUNCTION public.get_top_rules(integer) SET search_path = public, pg_catalog;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public, pg_catalog;
