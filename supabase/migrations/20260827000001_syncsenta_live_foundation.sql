-- Syncsenta live foundation schema.
-- Additive and idempotent. No learner seed data is inserted.
-- Client writes remain denied for telemetry and derived notifications.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('student','teacher','parent','admin')),
  grade TEXT,
  school_name TEXT,
  student_id TEXT,
  date_of_birth DATE,
  subjects TEXT[] NOT NULL DEFAULT '{}',
  classes TEXT[] NOT NULL DEFAULT '{}',
  children_ids UUID[] NOT NULL DEFAULT '{}',
  language_preference TEXT NOT NULL DEFAULT 'mixed' CHECK (language_preference IN ('english','kiswahili','mixed')),
  region TEXT,
  timezone TEXT NOT NULL DEFAULT 'Africa/Nairobi',
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free','premium','school')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active','cancelled','expired','trial')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school_name);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  student_id TEXT,
  grade TEXT NOT NULL,
  class_name TEXT,
  school_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  preferred_language TEXT NOT NULL DEFAULT 'english' CHECK (preferred_language IN ('english','kiswahili','mixed')),
  learning_style TEXT,
  special_needs TEXT,
  interests TEXT[],
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','graduated','transferred')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_students_student_id ON public.students(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_name);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.teacher_student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT,
  class_name TEXT NOT NULL,
  academic_year TEXT,
  term TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','completed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id, class_name, subject)
);
CREATE INDEX IF NOT EXISTS idx_tsa_teacher ON public.teacher_student_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_tsa_student ON public.teacher_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_tsa_active ON public.teacher_student_assignments(status) WHERE status = 'active';
ALTER TABLE public.teacher_student_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.student_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL, activity_type TEXT NOT NULL, competency TEXT, grade TEXT, subject TEXT,
  activity_data JSONB, event_count INTEGER NOT NULL DEFAULT 0, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id TEXT NOT NULL, student_id TEXT NOT NULL,
  event_index INTEGER NOT NULL, event_type TEXT NOT NULL, target TEXT, event_ts BIGINT NOT NULL,
  payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.behavioral_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id TEXT UNIQUE NOT NULL, student_id TEXT NOT NULL,
  activity_type TEXT, primary_pattern TEXT, engagement_score REAL, mastery_indicator REAL,
  intervention_needed BOOLEAN NOT NULL DEFAULT false, intervention_urgency TEXT, payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.misconceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), misconception_id TEXT UNIQUE NOT NULL, session_id TEXT NOT NULL,
  student_id TEXT NOT NULL, competency TEXT, misconception_type TEXT, description TEXT, confidence REAL,
  severity TEXT, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), intervention_id TEXT UNIQUE NOT NULL, plan_id TEXT,
  session_id TEXT, student_id TEXT NOT NULL, intervention_type TEXT, difficulty_level TEXT, title TEXT,
  objective TEXT, duration_minutes INTEGER, priority TEXT, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.xapi_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), statement_id TEXT UNIQUE NOT NULL, session_id TEXT NOT NULL,
  student_id TEXT NOT NULL, verb_id TEXT NOT NULL, object_id TEXT, statement JSONB NOT NULL,
  stored_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['student_sessions','telemetry_events','behavioral_profiles','misconceptions','interventions','xapi_statements'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS telemetry_service_role_all ON public.%I', t);
    EXECUTE format('CREATE POLICY telemetry_service_role_all ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.learner_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), subject_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL CHECK (purpose IN ('core_learning','personalization','telemetry','ai_processing','voice_media','research')),
  policy_version TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','revoked','expired')),
  scope JSONB NOT NULL DEFAULT '{}', granted_at TIMESTAMPTZ NOT NULL DEFAULT now(), revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_learner_consent ON public.learner_consents(subject_id,purpose,policy_version) WHERE status='granted';
CREATE TABLE IF NOT EXISTS public.learning_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), student_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL, curriculum_design_version TEXT NOT NULL, grade TEXT NOT NULL, subject TEXT NOT NULL,
  strand TEXT, sub_strand TEXT, learning_outcome TEXT NOT NULL, competency TEXT, value TEXT,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('response','attempt','project','observation','teacher_review')),
  rubric JSONB NOT NULL DEFAULT '{}', evidence JSONB NOT NULL DEFAULT '{}', source TEXT NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, reviewed_at TIMESTAMPTZ, event_id UUID UNIQUE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.head_progress_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL, learner_count INTEGER NOT NULL CHECK (learner_count >= 0), progress_band TEXT NOT NULL,
  metric TEXT NOT NULL, aggregate_payload JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_head_notifications_recipient ON public.head_progress_notifications(recipient_id, created_at DESC);
CREATE TABLE IF NOT EXISTS public.parent_performance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, school_name TEXT NOT NULL,
  subject TEXT NOT NULL, mastery_percentage INTEGER NOT NULL CHECK (mastery_percentage BETWEEN 0 AND 100),
  performance_band TEXT NOT NULL, teacher_feedback_summary TEXT NOT NULL, next_step TEXT NOT NULL,
  consent_id UUID REFERENCES public.learner_consents(id) ON DELETE RESTRICT,
  report_payload JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), read_at TIMESTAMPTZ,
  CHECK (parent_id <> child_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_parent_reports_parent ON public.parent_performance_reports(parent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parent_reports_child ON public.parent_performance_reports(child_profile_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.syncsenta_is_student_for(p_student_id TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='student' AND (p.id::text=p_student_id OR p.student_id=p_student_id));
$$;
CREATE OR REPLACE FUNCTION public.syncsenta_is_teacher_for(p_student_id TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_student_assignments a JOIN public.profiles p ON p.id=a.teacher_id JOIN public.students s ON s.id=a.student_id WHERE p.id=auth.uid() AND p.role='teacher' AND a.status='active' AND (s.id::text=p_student_id OR s.student_id=p_student_id));
$$;
CREATE OR REPLACE FUNCTION public.syncsenta_is_parent_for(p_student_id TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN public.students s ON s.id=ANY(p.children_ids) WHERE p.id=auth.uid() AND p.role='parent' AND (s.id::text=p_student_id OR s.student_id=p_student_id));
$$;
CREATE OR REPLACE FUNCTION public.syncsenta_is_head_for(p_student_id TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p JOIN public.students s ON s.school_name=p.school_name WHERE p.id=auth.uid() AND (p.role='admin' OR auth.jwt()->'app_metadata'->>'role'='head_of_school') AND p.school_name IS NOT NULL AND (s.id::text=p_student_id OR s.student_id=p_student_id));
$$;
REVOKE ALL ON FUNCTION public.syncsenta_is_student_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_teacher_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_parent_for(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.syncsenta_is_head_for(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_student_for(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_teacher_for(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_parent_for(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.syncsenta_is_head_for(TEXT) TO authenticated, service_role;

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','students','teacher_student_assignments','learner_consents','learning_evidence','head_progress_notifications','parent_performance_reports'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS syncsenta_service_role_all ON public.%I', t);
    EXECUTE format('CREATE POLICY syncsenta_service_role_all ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

CREATE POLICY syncsenta_profile_self_select ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid());
CREATE POLICY syncsenta_profile_self_update ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid());
CREATE POLICY syncsenta_student_self_select ON public.students FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY syncsenta_assignment_teacher_select ON public.teacher_student_assignments FOR SELECT TO authenticated USING (teacher_id=auth.uid());
CREATE POLICY syncsenta_consent_subject_select ON public.learner_consents FOR SELECT TO authenticated USING (subject_id=auth.uid());
CREATE POLICY syncsenta_consent_parent_select ON public.learner_consents FOR SELECT TO authenticated USING (public.syncsenta_is_parent_for(subject_id::text));
CREATE POLICY syncsenta_evidence_student_select ON public.learning_evidence FOR SELECT TO authenticated USING (public.syncsenta_is_student_for(student_profile_id::text));
CREATE POLICY syncsenta_evidence_parent_select ON public.learning_evidence FOR SELECT TO authenticated USING (public.syncsenta_is_parent_for(student_profile_id::text));
CREATE POLICY syncsenta_evidence_head_select ON public.learning_evidence FOR SELECT TO authenticated USING (public.syncsenta_is_head_for(student_profile_id::text));
CREATE POLICY syncsenta_head_notification_select ON public.head_progress_notifications FOR SELECT TO authenticated USING (recipient_id=auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));
CREATE POLICY syncsenta_parent_report_select ON public.parent_performance_reports FOR SELECT TO authenticated USING (parent_id=auth.uid() AND public.syncsenta_is_parent_for(child_profile_id::text));

COMMENT ON TABLE public.head_progress_notifications IS 'Aggregate same-school Head-of-School notifications; no learner-level payloads.';
COMMENT ON TABLE public.parent_performance_reports IS 'Consent-gated parent-facing performance summaries; no raw chat or telemetry.';
