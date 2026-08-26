-- Syncsenta function hardening: role predicates must not be callable anonymously.
REVOKE ALL ON FUNCTION public.syncsenta_is_student_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_teacher_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_parent_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_head_for(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_student_for(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_teacher_for(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_parent_for(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_head_for(TEXT) TO authenticated, service_role;
