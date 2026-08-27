-- Remove anonymous execution from every exposed SECURITY DEFINER function.
-- Preserve existing authenticated/service-role grants because some functions are
-- intentionally used by authenticated RLS policies or server adapters.
DO $$
DECLARE
  fn REGPROC;
BEGIN
  FOR fn IN
    SELECT p.oid::regproc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_catalog', fn);
  END LOOP;
END $$;
