-- These maintenance/telemetry helper RPCs are not client-facing.
-- Keep them available only to trusted server-side workers.
REVOKE EXECUTE ON FUNCTION public.syncsenta_prune_expired_event_receipts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.syncsenta_prune_expired_event_receipts() TO service_role;
ALTER FUNCTION public.syncsenta_prune_expired_event_receipts() SET search_path = public, pg_catalog;

REVOKE EXECUTE ON FUNCTION public.track_material_access(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_material_access(UUID, TEXT, TEXT) TO service_role;
ALTER FUNCTION public.track_material_access(UUID, TEXT, TEXT) SET search_path = public, pg_catalog;
