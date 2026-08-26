-- TELEMETRY SECURITY LOCKDOWN
--
-- The telemetry tables contain student-identifying data, but the legacy schema
-- uses school-assigned TEXT IDs and does not yet define a complete guardian
-- relationship model. Until those relationships are explicit, fail closed:
-- authenticated/anonymous clients receive no direct table access through RLS.
-- Trusted server-side service-role processing remains available because the
-- Supabase service role bypasses RLS.

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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format(
      'COMMENT ON TABLE public.%I IS %L',
      table_name,
      'Student-identifying telemetry is fail-closed for client roles; access requires trusted server-side processing until explicit relationship policies are added.'
    );
  END LOOP;
END
$$;

-- Intentionally no SELECT/INSERT/UPDATE/DELETE policies are created here.
-- An RLS-enabled table with no matching policy denies client-role access.
