-- Atomic service-role claims for the sandbox artifact worker.
ALTER TABLE public.sandbox_artifacts
  ADD COLUMN IF NOT EXISTS claimed_by TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_sandbox_artifacts_claimable
  ON public.sandbox_artifacts(status, created_at)
  WHERE status = 'queued' AND moderation_status = 'approved';

CREATE OR REPLACE FUNCTION public.claim_sandbox_artifact(p_worker_id TEXT)
RETURNS SETOF public.sandbox_artifacts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_worker_id IS NULL OR char_length(trim(p_worker_id)) NOT BETWEEN 1 AND 120 THEN
    RAISE EXCEPTION 'invalid_worker_id';
  END IF;

  RETURN QUERY
  WITH next_job AS (
    SELECT id
    FROM public.sandbox_artifacts
    WHERE status = 'queued'
      AND moderation_status = 'approved'
      AND consent_verified = true
      AND expires_at > now()
      AND attempt_count < 3
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.sandbox_artifacts a
  SET status = 'processing',
      claimed_by = trim(p_worker_id),
      claimed_at = now(),
      attempt_count = a.attempt_count + 1,
      updated_at = now()
  FROM next_job
  WHERE a.id = next_job.id
  RETURNING a.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_sandbox_artifact(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_sandbox_artifact(TEXT) TO service_role;

COMMENT ON FUNCTION public.claim_sandbox_artifact(TEXT) IS 'Service-role-only atomic claim for approved, consented sandbox artifacts; uses row locks and caps attempts at three.';
