-- Wallet identity mapping for Supabase Web3 Auth.
-- Wallet ownership is proved by Supabase's EIP-4361 verification; the address
-- is an identifier only and never grants learner or parent access.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_chain TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_wallet_address ON public.profiles(lower(wallet_address)) WHERE wallet_address IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_wallet_identity(p_wallet_address TEXT, p_wallet_chain TEXT DEFAULT 'ethereum')
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF lower(trim(coalesce(p_wallet_chain, ''))) NOT IN ('ethereum') THEN RAISE EXCEPTION 'unsupported wallet chain'; END IF;
  IF trim(coalesce(p_wallet_address, '')) !~* '^0x[0-9a-f]{40}$' THEN RAISE EXCEPTION 'invalid wallet address'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(wallet_address) = lower(trim(p_wallet_address)) AND id <> auth.uid()) THEN
    RAISE EXCEPTION 'wallet is already linked to another profile';
  END IF;
  UPDATE public.profiles SET wallet_address = lower(trim(p_wallet_address)), wallet_chain = lower(trim(p_wallet_chain)), updated_at = now() WHERE id = auth.uid() RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'profile setup required before wallet mapping'; END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_wallet_profile(p_wallet_address TEXT, p_role TEXT, p_full_name TEXT DEFAULT NULL)
RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result public.profiles;
  synthetic_email TEXT := lower(trim(p_wallet_address)) || '@wallet.syncsenta.local';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'authentication required'; END IF;
  IF p_role NOT IN ('student','teacher','parent','admin') THEN RAISE EXCEPTION 'invalid role'; END IF;
  IF trim(coalesce(p_wallet_address, '')) !~* '^0x[0-9a-f]{40}$' THEN RAISE EXCEPTION 'invalid wallet address'; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(wallet_address) = lower(trim(p_wallet_address)) AND id <> auth.uid()) THEN RAISE EXCEPTION 'wallet is already linked to another profile'; END IF;
  INSERT INTO public.profiles(id, email, full_name, role, wallet_address, wallet_chain)
  VALUES (auth.uid(), synthetic_email, NULLIF(trim(p_full_name), ''), p_role, lower(trim(p_wallet_address)), 'ethereum')
  ON CONFLICT (id) DO UPDATE SET wallet_address = EXCLUDED.wallet_address, wallet_chain = EXCLUDED.wallet_chain, full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name), updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_wallet_identity(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_wallet_profile(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_wallet_identity(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_wallet_profile(TEXT, TEXT, TEXT) TO authenticated, service_role;
COMMENT ON COLUMN public.profiles.wallet_address IS 'Verified wallet public address from Supabase Web3 Auth; identity only, not an authorization grant.';
COMMENT ON COLUMN public.profiles.wallet_chain IS 'Wallet authentication chain; currently ethereum.';
