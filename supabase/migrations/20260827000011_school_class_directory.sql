-- Canonical school/class directory for consent-based onboarding.
-- No fabricated school rows are seeded; approved school data must be loaded by
-- a trusted service or Head-of-School workflow.
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  county TEXT,
  code TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, county)
);

CREATE TABLE IF NOT EXISTS public.school_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  academic_year TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, name, academic_year)
);

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS classroom_id UUID REFERENCES public.school_classes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_classroom_id ON public.students(classroom_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_school_grade ON public.school_classes(school_id, grade);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS school_directory_active_select ON public.schools;
CREATE POLICY school_directory_active_select ON public.schools
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS school_directory_service_all ON public.schools;
CREATE POLICY school_directory_service_all ON public.schools
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS school_class_directory_active_select ON public.school_classes;
CREATE POLICY school_class_directory_active_select ON public.school_classes
  FOR SELECT TO anon, authenticated
  USING (
    status = 'active'
    AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_classes.school_id AND s.status = 'active')
  );

DROP POLICY IF EXISTS school_class_directory_service_all ON public.school_classes;
CREATE POLICY school_class_directory_service_all ON public.school_classes
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS students_insert_own_profile ON public.students;
CREATE POLICY students_insert_own_profile ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS students_update_own_profile ON public.students;
CREATE POLICY students_update_own_profile ON public.students
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.syncsenta_touch_school_directory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.syncsenta_touch_school_directory() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.syncsenta_touch_school_directory() TO service_role;

DROP TRIGGER IF EXISTS schools_updated_at ON public.schools;
CREATE TRIGGER schools_updated_at BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.syncsenta_touch_school_directory();
DROP TRIGGER IF EXISTS school_classes_updated_at ON public.school_classes;
CREATE TRIGGER school_classes_updated_at BEFORE UPDATE ON public.school_classes
FOR EACH ROW EXECUTE FUNCTION public.syncsenta_touch_school_directory();
