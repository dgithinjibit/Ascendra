-- Consent-aware attendance integrity boundary.
-- Stores token hashes and event proofs only; never stores raw tokens or biometric data.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.attendance_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  consent_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > issued_at)
);

CREATE INDEX IF NOT EXISTS idx_attendance_tokens_teacher_class
  ON public.attendance_tokens(teacher_id, class_name, expires_at DESC);

ALTER TABLE public.class_attendance
  ADD COLUMN IF NOT EXISTS event_id TEXT,
  ADD COLUMN IF NOT EXISTS token_id UUID REFERENCES public.attendance_tokens(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS previous_ledger_digest TEXT,
  ADD COLUMN IF NOT EXISTS ledger_digest TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_class_attendance_event_id
  ON public.class_attendance(event_id)
  WHERE event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.attendance_ledger (
  sequence_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attendance_id UUID NOT NULL UNIQUE REFERENCES public.class_attendance(id) ON DELETE RESTRICT,
  event_digest TEXT NOT NULL,
  previous_digest TEXT NOT NULL,
  chain_digest TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_tokens_teacher_manage ON public.attendance_tokens;
CREATE POLICY attendance_tokens_teacher_manage ON public.attendance_tokens
  FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS attendance_ledger_teacher_read ON public.attendance_ledger;
CREATE POLICY attendance_ledger_teacher_read ON public.attendance_ledger
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.class_attendance a
    WHERE a.id = attendance_ledger.attendance_id
      AND a.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS attendance_ledger_student_read ON public.attendance_ledger;
CREATE POLICY attendance_ledger_student_read ON public.attendance_ledger
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.class_attendance a
    WHERE a.id = attendance_ledger.attendance_id
      AND a.student_id = auth.uid()
  ));

DROP POLICY IF EXISTS attendance_ledger_parent_read ON public.attendance_ledger;
CREATE POLICY attendance_ledger_parent_read ON public.attendance_ledger
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.class_attendance a
    WHERE a.id = attendance_ledger.attendance_id
      AND private.syncsenta_is_parent_of(a.student_id)
  ));

DROP POLICY IF EXISTS attendance_ledger_head_read ON public.attendance_ledger;
CREATE POLICY attendance_ledger_head_read ON public.attendance_ledger
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.class_attendance a
    WHERE a.id = attendance_ledger.attendance_id
      AND private.syncsenta_is_head_of(a.student_id)
  ));

REVOKE ALL ON public.attendance_tokens, public.attendance_ledger FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_tokens TO authenticated;
GRANT SELECT ON public.attendance_ledger TO authenticated;
GRANT ALL ON public.attendance_tokens, public.attendance_ledger TO service_role;

COMMENT ON TABLE public.attendance_tokens IS 'Short-lived hashed attendance tokens; raw token values are never persisted.';
COMMENT ON TABLE public.attendance_ledger IS 'Append-only attendance integrity proofs; learner content is excluded.';
