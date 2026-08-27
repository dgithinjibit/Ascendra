CREATE TABLE IF NOT EXISTS public.school_review_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.school_onboarding_requests(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  result TEXT NOT NULL CHECK (result IN ('approved', 'rejected')),
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  source_digest TEXT NOT NULL CHECK (source_digest ~ '^[a-f0-9]{64}$'),
  reviewer_ref TEXT NOT NULL DEFAULT 'operator:unknown' CHECK (char_length(reviewer_ref) BETWEEN 1 AND 120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_review_audits_request_created
  ON public.school_review_audits(request_id, created_at DESC);

ALTER TABLE public.school_review_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_review_audits_service_all ON public.school_review_audits;
CREATE POLICY school_review_audits_service_all ON public.school_review_audits
  FOR ALL TO service_role USING (true) WITH CHECK (true);
