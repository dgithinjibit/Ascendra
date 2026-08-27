-- Privacy-first student-to-guardian linking.
-- Raw codes are returned once to the authenticated student and never stored.
-- Parent access remains denied until redeem_student_link_code succeeds.

CREATE TABLE IF NOT EXISTS public.student_link_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS idx_student_link_codes_student ON public.student_link_codes(student_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_link_codes_active ON public.student_link_codes(code_hash, expires_at)
  WHERE redeemed_at IS NULL AND revoked_at IS NULL;
ALTER TABLE public.student_link_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(parent_profile_id, student_profile_id),
  CHECK (parent_profile_id <> student_profile_id)
);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON public.parent_student_links(parent_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON public.parent_student_links(student_profile_id, status);
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS student_link_codes_student_select ON public.student_link_codes;
CREATE POLICY student_link_codes_student_select ON public.student_link_codes
  FOR SELECT TO authenticated
  USING (student_profile_id = auth.uid());
DROP POLICY IF EXISTS parent_student_links_parent_select ON public.parent_student_links;
CREATE POLICY parent_student_links_parent_select ON public.parent_student_links
  FOR SELECT TO authenticated
  USING (parent_profile_id = auth.uid() AND status = 'active');
DROP POLICY IF EXISTS parent_student_links_student_select ON public.parent_student_links;
CREATE POLICY parent_student_links_student_select ON public.parent_student_links
  FOR SELECT TO authenticated
  USING (student_profile_id = auth.uid() AND status = 'active');
DROP POLICY IF EXISTS guardian_link_service_role_all ON public.student_link_codes;
CREATE POLICY guardian_link_service_role_all ON public.student_link_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS guardian_link_service_role_all ON public.parent_student_links;
CREATE POLICY guardian_link_service_role_all ON public.parent_student_links
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.create_student_link_code()
RETURNS TABLE (code TEXT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  student_role TEXT;
  raw_code TEXT;
  code_expiry TIMESTAMPTZ := now() + interval '15 minutes';
BEGIN
  SELECT role INTO student_role FROM public.profiles WHERE id = auth.uid();
  IF student_role IS DISTINCT FROM 'student' THEN
    RAISE EXCEPTION 'only student accounts can create guardian link codes';
  END IF;

  UPDATE public.student_link_codes
  SET revoked_at = now()
  WHERE student_profile_id = auth.uid() AND redeemed_at IS NULL AND revoked_at IS NULL;

  raw_code := upper(encode(gen_random_bytes(5), 'hex'));
  INSERT INTO public.student_link_codes(student_profile_id, code_hash, expires_at)
  VALUES (auth.uid(), encode(digest(raw_code, 'sha256'), 'hex'), code_expiry);

  RETURN QUERY SELECT raw_code, code_expiry;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_student_link_code(p_code TEXT)
RETURNS TABLE (student_profile_id UUID, linked_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  parent_role TEXT;
  code_row public.student_link_codes%ROWTYPE;
  normalized_code TEXT := upper(regexp_replace(coalesce(p_code, ''), '[^A-Z0-9]', '', 'g'));
BEGIN
  SELECT role INTO parent_role FROM public.profiles WHERE id = auth.uid();
  IF parent_role IS DISTINCT FROM 'parent' THEN
    RAISE EXCEPTION 'only parent accounts can redeem guardian link codes';
  END IF;
  IF length(normalized_code) < 12 THEN
    RAISE EXCEPTION 'invalid guardian link code';
  END IF;

  SELECT * INTO code_row
  FROM public.student_link_codes
  WHERE code_hash = encode(digest(normalized_code, 'sha256'), 'hex')
    AND redeemed_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid, expired, or already used guardian link code';
  END IF;

  INSERT INTO public.parent_student_links(parent_profile_id, student_profile_id, status)
  VALUES (auth.uid(), code_row.student_profile_id, 'active')
  ON CONFLICT (parent_profile_id, student_profile_id)
  DO UPDATE SET status = 'active', revoked_at = NULL, linked_at = now();

  -- Preserve compatibility with existing private predicates while the link table
  -- is the authoritative relationship record for future policy migrations.
  UPDATE public.profiles
  SET children_ids = CASE
    WHEN code_row.student_profile_id = ANY(children_ids) THEN children_ids
    ELSE array_append(children_ids, code_row.student_profile_id)
  END,
  updated_at = now()
  WHERE id = auth.uid();

  UPDATE public.student_link_codes SET redeemed_at = now() WHERE id = code_row.id;
  RETURN QUERY SELECT code_row.student_profile_id, now();
END;
$$;

REVOKE ALL ON FUNCTION public.create_student_link_code() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_student_link_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_student_link_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_student_link_code(TEXT) TO authenticated, service_role;

COMMENT ON TABLE public.student_link_codes IS 'Short-lived, one-time, hashed guardian-link codes. Raw codes are never stored.';
COMMENT ON TABLE public.parent_student_links IS 'Explicit revocable guardian relationships. Learner data policies must require active links.';
DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY['student_link_codes','parent_student_links'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
  END LOOP;
END $$;
