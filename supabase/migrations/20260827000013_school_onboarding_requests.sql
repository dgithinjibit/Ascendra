-- Manual school registration intake. Requests are pending and never part of the public directory.
CREATE TABLE IF NOT EXISTS public.school_onboarding_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL CHECK (char_length(contact_name) BETWEEN 2 AND 120),
  contact_email TEXT NOT NULL CHECK (char_length(contact_email) BETWEEN 5 AND 254),
  school_name TEXT NOT NULL CHECK (char_length(school_name) BETWEEN 2 AND 200),
  county TEXT NOT NULL CHECK (char_length(county) BETWEEN 2 AND 80),
  school_code TEXT,
  school_type TEXT NOT NULL CHECK (school_type IN ('primary', 'junior_secondary', 'senior_secondary', 'integrated', 'special')),
  classes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source TEXT NOT NULL DEFAULT 'manual_school_onboarding',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_status_created
  ON public.school_onboarding_requests(status, created_at DESC);

ALTER TABLE public.school_onboarding_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS school_onboarding_public_insert ON public.school_onboarding_requests;
CREATE POLICY school_onboarding_public_insert ON public.school_onboarding_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND source = 'manual_school_onboarding');

DROP POLICY IF EXISTS school_onboarding_service_all ON public.school_onboarding_requests;
CREATE POLICY school_onboarding_service_all ON public.school_onboarding_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
