-- Syncsenta research foundations
-- Adds consent provenance, data-subject requests, CBC evidence, human review,
-- retention metadata, and idempotent offline-event support.
-- Raw telemetry remains protected by 20260826000002_explicit_telemetry_role_policies.sql.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Consent provenance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learner_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL CHECK (purpose IN (
    'core_learning', 'personalization', 'telemetry', 'ai_processing',
    'voice_media', 'research'
  )),
  policy_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'revoked', 'expired')),
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (revoked_at IS NULL OR status = 'revoked'),
  CHECK (expires_at IS NULL OR expires_at > granted_at)
);

CREATE INDEX IF NOT EXISTS idx_learner_consents_subject_purpose
  ON public.learner_consents(subject_id, purpose, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_learner_consent
  ON public.learner_consents(subject_id, purpose, policy_version)
  WHERE status = 'granted';

-- -----------------------------------------------------------------------------
-- Data-subject rights requests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access', 'rectification', 'erasure', 'portability', 'objection', 'restriction'
  )),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted', 'under_review', 'fulfilled', 'rejected', 'cancelled'
  )),
  reason TEXT,
  resolution_note TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_subject ON public.privacy_requests(subject_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_requester ON public.privacy_requests(requester_id, submitted_at DESC);

-- -----------------------------------------------------------------------------
-- Versioned CBC learning evidence
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  curriculum_design_version TEXT NOT NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  strand TEXT,
  sub_strand TEXT,
  learning_outcome TEXT NOT NULL,
  competency TEXT,
  value TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN (
    'response', 'attempt', 'project', 'observation', 'teacher_review'
  )),
  rubric JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL CHECK (source IN ('student', 'teacher', 'rust_runtime', 'offline_sync')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  event_id UUID UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learning_evidence_student_time
  ON public.learning_evidence(student_profile_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_evidence_curriculum
  ON public.learning_evidence(grade, subject, strand, sub_strand);

-- -----------------------------------------------------------------------------
-- Human escalation and adult review
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.human_review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  initiated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'learning_support', 'safeguarding', 'wellbeing', 'content_correction', 'privacy'
  )),
  severity TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'dismissed')),
  summary TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_human_review_student_status
  ON public.human_review_requests(student_profile_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_human_review_assignee
  ON public.human_review_requests(assigned_to, status, created_at DESC);

-- -----------------------------------------------------------------------------
-- Idempotency and retention metadata for offline/event processing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sync_event_receipts (
  event_id UUID PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_sync_event_receipts_expiry ON public.sync_event_receipts(expires_at);

CREATE OR REPLACE FUNCTION public.syncsenta_prune_expired_event_receipts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sync_event_receipts WHERE expires_at <= now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- Explicit role predicates
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.syncsenta_is_student_profile(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'student' AND p.id = p_subject
  );
$$;

CREATE OR REPLACE FUNCTION public.syncsenta_is_parent_of(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'parent' AND p_subject = ANY(p.children_ids)
  );
$$;

CREATE OR REPLACE FUNCTION public.syncsenta_is_teacher_of(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles teacher
    JOIN public.profiles student ON student.id = p_subject
    WHERE teacher.id = auth.uid()
      AND teacher.role = 'teacher'
      AND student.role = 'student'
      AND student.grade = ANY(teacher.classes)
  );
$$;

CREATE OR REPLACE FUNCTION public.syncsenta_is_head_of(p_subject UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles head
    JOIN public.profiles student ON student.id = p_subject
    WHERE head.id = auth.uid()
      AND (head.role = 'admin' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'head_of_school')
      AND head.school_name IS NOT NULL
      AND head.school_name = student.school_name
  );
$$;

REVOKE ALL ON FUNCTION public.syncsenta_is_student_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_parent_of(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_teacher_of(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_head_of(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_student_profile(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_parent_of(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_teacher_of(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_head_of(UUID) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- RLS helper macros are expressed as explicit policies for auditability.
-- Client writes are permitted only for a student's own privacy request or
-- self-initiated human-review request; all other writes remain service-only.
-- -----------------------------------------------------------------------------
ALTER TABLE public.learner_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_event_receipts ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'learner_consents', 'privacy_requests', 'learning_evidence',
    'human_review_requests', 'sync_event_receipts'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "research_service_role_all" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "research_service_role_all" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

-- Consent is visible to the subject, the parent/guardian, and school leadership.
CREATE POLICY "consent_student_select" ON public.learner_consents
  FOR SELECT TO authenticated USING (public.syncsenta_is_student_profile(subject_id));
CREATE POLICY "consent_parent_select" ON public.learner_consents
  FOR SELECT TO authenticated USING (public.syncsenta_is_parent_of(subject_id));
CREATE POLICY "consent_head_select" ON public.learner_consents
  FOR SELECT TO authenticated USING (public.syncsenta_is_head_of(subject_id));

-- Privacy requests are visible to the requester, subject, and head of school.
CREATE POLICY "privacy_request_subject_select" ON public.privacy_requests
  FOR SELECT TO authenticated USING (
    requester_id = auth.uid() OR subject_id = auth.uid()
    OR public.syncsenta_is_head_of(subject_id)
  );
CREATE POLICY "privacy_request_subject_insert" ON public.privacy_requests
  FOR INSERT TO authenticated WITH CHECK (
    requester_id = auth.uid()
    AND (subject_id = auth.uid() OR public.syncsenta_is_parent_of(subject_id))
  );

-- Evidence is readable by the student, assigned teacher, parent, or head.
CREATE POLICY "evidence_student_select" ON public.learning_evidence
  FOR SELECT TO authenticated USING (public.syncsenta_is_student_profile(student_profile_id));
CREATE POLICY "evidence_teacher_select" ON public.learning_evidence
  FOR SELECT TO authenticated USING (public.syncsenta_is_teacher_of(student_profile_id));
CREATE POLICY "evidence_parent_select" ON public.learning_evidence
  FOR SELECT TO authenticated USING (public.syncsenta_is_parent_of(student_profile_id));
CREATE POLICY "evidence_head_select" ON public.learning_evidence
  FOR SELECT TO authenticated USING (public.syncsenta_is_head_of(student_profile_id));

-- A learner may ask for human support; adults may read only related requests.
CREATE POLICY "review_student_select" ON public.human_review_requests
  FOR SELECT TO authenticated USING (public.syncsenta_is_student_profile(student_profile_id));
CREATE POLICY "review_teacher_select" ON public.human_review_requests
  FOR SELECT TO authenticated USING (public.syncsenta_is_teacher_of(student_profile_id));
CREATE POLICY "review_parent_select" ON public.human_review_requests
  FOR SELECT TO authenticated USING (public.syncsenta_is_parent_of(student_profile_id));
CREATE POLICY "review_head_select" ON public.human_review_requests
  FOR SELECT TO authenticated USING (public.syncsenta_is_head_of(student_profile_id));
CREATE POLICY "review_student_insert" ON public.human_review_requests
  FOR INSERT TO authenticated WITH CHECK (
    initiated_by = auth.uid() AND public.syncsenta_is_student_profile(student_profile_id)
  );

COMMENT ON TABLE public.learner_consents IS 'Versioned consent provenance for child-centred processing.';
COMMENT ON TABLE public.privacy_requests IS 'ODPC-aligned data-subject rights requests.';
COMMENT ON TABLE public.learning_evidence IS 'Versioned CBC-aligned evidence, rubric, and review provenance.';
COMMENT ON TABLE public.human_review_requests IS 'Adult escalation path for learning, safeguarding, wellbeing, correction, and privacy.';
COMMENT ON TABLE public.sync_event_receipts IS 'Idempotency receipts for offline event synchronization; safe to prune after expiry.';
