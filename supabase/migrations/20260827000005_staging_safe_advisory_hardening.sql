-- Staging-safe advisory hardening.
-- Legacy functions may not exist on a fresh project, so operations are conditional.
DO $$
DECLARE
  fn_name TEXT;
  fn_oid REGPROC;
BEGIN
  FOREACH fn_name IN ARRAY ARRAY[
    'public.syncsenta_is_student_for(text)',
    'public.syncsenta_is_teacher_for(text)',
    'public.syncsenta_is_parent_for(text)',
    'public.syncsenta_is_head_for(text)'
  ] LOOP
    fn_oid := to_regprocedure(fn_name);
    IF fn_oid IS NULL THEN
      RAISE EXCEPTION 'required Syncsenta role predicate is missing: %', fn_name;
    END IF;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn_oid);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn_oid);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_catalog', fn_oid);
  END LOOP;

  FOREACH fn_name IN ARRAY ARRAY[
    'public.get_teacher_feedback_summary(text)',
    'public.get_top_rules(integer)',
    'public.rls_auto_enable()'
  ] LOOP
    fn_oid := to_regprocedure(fn_name);
    IF fn_oid IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn_oid);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn_oid);
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_catalog', fn_oid);
    END IF;
  END LOOP;
END $$;
