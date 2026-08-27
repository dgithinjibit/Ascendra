-- Guardian relationships must be created only through the verified code RPC.
-- Prevent client roles from directly editing the compatibility children_ids array.
REVOKE UPDATE (children_ids) ON public.profiles FROM authenticated;
COMMENT ON COLUMN public.profiles.children_ids IS 'Compatibility projection maintained only by verified guardian-link RPCs; direct authenticated updates are denied.';
REVOKE ALL ON FUNCTION public.redeem_student_link_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_student_link_code(TEXT) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_student_link_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_student_link_code() TO authenticated, service_role;
