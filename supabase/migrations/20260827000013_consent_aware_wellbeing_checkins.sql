-- Consent-aware learner wellbeing check-ins.
-- Stores voluntary self-report only; no camera, face, voice, or inferred emotion data.

CREATE TABLE IF NOT EXISTS public.wellbeing_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  state TEXT NOT NULL CHECK (state IN ('ready', 'unsure', 'tired', 'upset', 'needs_help', 'prefer_not_to_say')),
  note TEXT,
  support_requested BOOLEAN NOT NULL DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'student_only' CHECK (visibility IN ('student_only', 'teacher', 'teacher_and_parent', 'safeguarding_team')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wellbeing_checkins_student_time ON public.wellbeing_checkins(student_id, created_at DESC);
ALTER TABLE public.wellbeing_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wellbeing_student_insert ON public.wellbeing_checkins;
CREATE POLICY wellbeing_student_insert ON public.wellbeing_checkins FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND consented_at <= now());

DROP POLICY IF EXISTS wellbeing_student_read ON public.wellbeing_checkins;
CREATE POLICY wellbeing_student_read ON public.wellbeing_checkins FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS wellbeing_teacher_read ON public.wellbeing_checkins;
CREATE POLICY wellbeing_teacher_read ON public.wellbeing_checkins FOR SELECT TO authenticated
  USING (visibility IN ('teacher', 'teacher_and_parent', 'safeguarding_team') AND private.syncsenta_is_teacher_of(student_id));

DROP POLICY IF EXISTS wellbeing_parent_read ON public.wellbeing_checkins;
CREATE POLICY wellbeing_parent_read ON public.wellbeing_checkins FOR SELECT TO authenticated
  USING (visibility = 'teacher_and_parent' AND private.syncsenta_is_parent_of(student_id));

DROP POLICY IF EXISTS wellbeing_head_read ON public.wellbeing_checkins;
CREATE POLICY wellbeing_head_read ON public.wellbeing_checkins FOR SELECT TO authenticated
  USING (visibility = 'safeguarding_team' AND private.syncsenta_is_head_of(student_id));

REVOKE ALL ON public.wellbeing_checkins FROM anon;
GRANT SELECT, INSERT ON public.wellbeing_checkins TO authenticated;
GRANT ALL ON public.wellbeing_checkins TO service_role;
