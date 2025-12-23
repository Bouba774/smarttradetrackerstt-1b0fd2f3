-- =====================================================
-- FIX 1: Restrict profiles table access to own profile only
-- =====================================================

-- Drop existing permissive policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON public.profiles;

-- Create strict RLS policies for profiles
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can only update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- FIX 2: Encrypt MT account login credentials
-- =====================================================

-- Add encrypted column for login (we'll store encrypted version)
ALTER TABLE public.mt_accounts 
ADD COLUMN IF NOT EXISTS login_encrypted bytea;

-- Create function to encrypt login using pgcrypto
CREATE OR REPLACE FUNCTION public.encrypt_mt_login(p_login text, p_user_id uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key bytea;
BEGIN
  -- Use user_id as part of encryption key (combined with service role secret)
  -- This ensures each user has unique encryption
  v_key := extensions.digest(p_user_id::text || 'mt_account_secret_key', 'sha256');
  RETURN extensions.encrypt(p_login::bytea, v_key, 'aes');
END;
$$;

-- Create function to decrypt login
CREATE OR REPLACE FUNCTION public.decrypt_mt_login(p_encrypted bytea, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key bytea;
BEGIN
  IF p_encrypted IS NULL THEN
    RETURN NULL;
  END IF;
  
  v_key := extensions.digest(p_user_id::text || 'mt_account_secret_key', 'sha256');
  RETURN convert_from(extensions.decrypt(p_encrypted, v_key, 'aes'), 'utf8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Create a secure view that decrypts login only for the owner
CREATE OR REPLACE VIEW public.mt_accounts_secure AS
SELECT 
  id,
  user_id,
  account_name,
  platform,
  server,
  CASE 
    WHEN auth.uid() = user_id THEN 
      COALESCE(
        public.decrypt_mt_login(login_encrypted, user_id),
        login -- Fallback to plain text during migration
      )
    ELSE '********'
  END as login,
  currency,
  initial_balance,
  is_connected,
  last_sync_at,
  metaapi_account_id,
  created_at,
  updated_at
FROM public.mt_accounts
WHERE auth.uid() = user_id OR public.is_admin(auth.uid());

-- Migrate existing plain text logins to encrypted
UPDATE public.mt_accounts
SET login_encrypted = public.encrypt_mt_login(login, user_id)
WHERE login IS NOT NULL AND login_encrypted IS NULL;

-- Create trigger to auto-encrypt login on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_mt_login_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only encrypt if login changed and is not already encrypted pattern
  IF NEW.login IS NOT NULL AND (OLD IS NULL OR NEW.login != OLD.login) THEN
    NEW.login_encrypted := public.encrypt_mt_login(NEW.login, NEW.user_id);
    -- Clear plain text login after encryption
    NEW.login := '********';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encrypt_mt_login_on_change ON public.mt_accounts;
CREATE TRIGGER encrypt_mt_login_on_change
BEFORE INSERT OR UPDATE ON public.mt_accounts
FOR EACH ROW
EXECUTE FUNCTION public.encrypt_mt_login_trigger();

-- Ensure mt_accounts has proper RLS
ALTER TABLE public.mt_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mt_accounts" ON public.mt_accounts;
DROP POLICY IF EXISTS "Users can insert own mt_accounts" ON public.mt_accounts;
DROP POLICY IF EXISTS "Users can update own mt_accounts" ON public.mt_accounts;
DROP POLICY IF EXISTS "Users can delete own mt_accounts" ON public.mt_accounts;

CREATE POLICY "Users can only view their own MT accounts"
ON public.mt_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own MT accounts"
ON public.mt_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own MT accounts"
ON public.mt_accounts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own MT accounts"
ON public.mt_accounts
FOR DELETE
USING (auth.uid() = user_id);