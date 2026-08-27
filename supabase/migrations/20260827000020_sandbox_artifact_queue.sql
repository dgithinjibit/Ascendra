-- SyncSenta sandbox artifact queue.
-- Generation is asynchronous and service-role mediated; client writes are limited
-- to self-owned queued requests and cancellation of those requests.

CREATE TABLE IF NOT EXISTS public.sandbox_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('image','video','presentation')),
  prompt TEXT NOT NULL CHECK (char_length(prompt) BETWEEN 1 AND 2000),
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  competency TEXT,
  consent_version TEXT NOT NULL,
  consent_verified BOOLEAN NOT NULL DEFAULT false,
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending','approved','rejected')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','ready','failed','cancelled')),
  provider TEXT NOT NULL DEFAULT 'not_configured',
  storage_path TEXT,
  error_code TEXT,
  cancel_requested_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (student_profile_id IS NULL OR student_profile_id <> requester_id),
  CHECK (status <> 'ready' OR (moderation_status = 'approved' AND storage_path IS NOT NULL)),
  CHECK (status NOT IN ('processing','ready') OR consent_verified = true)
);

CREATE INDEX IF NOT EXISTS idx_sandbox_artifacts_requester ON public.sandbox_artifacts(requester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sandbox_artifacts_student ON public.sandbox_artifacts(student_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sandbox_artifacts_queue ON public.sandbox_artifacts(status, created_at) WHERE status IN ('queued','processing');

ALTER TABLE public.sandbox_artifacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sandbox_artifacts_service_role_all ON public.sandbox_artifacts;
CREATE POLICY sandbox_artifacts_service_role_all ON public.sandbox_artifacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS sandbox_artifacts_requester_insert ON public.sandbox_artifacts;
CREATE POLICY sandbox_artifacts_requester_insert ON public.sandbox_artifacts
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND consent_verified = true
    AND status = 'queued'
    AND moderation_status = 'pending'
    AND provider = 'not_configured'
    AND storage_path IS NULL
  );

DROP POLICY IF EXISTS sandbox_artifacts_requester_select ON public.sandbox_artifacts;
CREATE POLICY sandbox_artifacts_requester_select ON public.sandbox_artifacts
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());

DROP POLICY IF EXISTS sandbox_artifacts_linked_parent_select ON public.sandbox_artifacts;
CREATE POLICY sandbox_artifacts_linked_parent_select ON public.sandbox_artifacts
  FOR SELECT TO authenticated
  USING (
    student_profile_id IS NOT NULL
    AND public.syncsenta_is_parent_for(student_profile_id::text)
    AND status = 'ready'
    AND moderation_status = 'approved'
  );

DROP POLICY IF EXISTS sandbox_artifacts_teacher_select ON public.sandbox_artifacts;
CREATE POLICY sandbox_artifacts_teacher_select ON public.sandbox_artifacts
  FOR SELECT TO authenticated
  USING (
    student_profile_id IS NOT NULL
    AND public.syncsenta_is_teacher_for(student_profile_id::text)
  );

DROP POLICY IF EXISTS sandbox_artifacts_head_select ON public.sandbox_artifacts;
CREATE POLICY sandbox_artifacts_head_select ON public.sandbox_artifacts
  FOR SELECT TO authenticated
  USING (
    student_profile_id IS NOT NULL
    AND public.syncsenta_is_head_for(student_profile_id::text)
    AND status = 'ready'
    AND moderation_status = 'approved'
  );

DROP POLICY IF EXISTS sandbox_artifacts_requester_cancel ON public.sandbox_artifacts;
CREATE POLICY sandbox_artifacts_requester_cancel ON public.sandbox_artifacts
  FOR UPDATE TO authenticated
  USING (requester_id = auth.uid() AND status = 'queued')
  WITH CHECK (
    requester_id = auth.uid()
    AND status = 'cancelled'
    AND cancel_requested_at IS NOT NULL
  );

COMMENT ON TABLE public.sandbox_artifacts IS 'Asynchronous, consent-gated, teacher-reviewed sandbox media artifacts; no child imagery or biometric profiling required.';
