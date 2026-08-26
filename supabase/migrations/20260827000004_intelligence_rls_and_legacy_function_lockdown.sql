-- Explicitly document service-only access for intelligence data.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ai_decisions','learned_rules','cultural_patterns','teacher_rule_proposals','rule_votes','rule_ab_tests'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS intelligence_service_role_all ON public.%I', t);
    EXECUTE format('CREATE POLICY intelligence_service_role_all ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Legacy reporting/maintenance functions are not part of the client contract.
REVOKE EXECUTE ON FUNCTION public.get_teacher_feedback_summary(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_top_rules(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_feedback_summary(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_top_rules(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
