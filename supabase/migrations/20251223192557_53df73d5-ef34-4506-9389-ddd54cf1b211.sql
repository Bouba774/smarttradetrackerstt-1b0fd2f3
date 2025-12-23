-- Remove the security definer view (security issue)
DROP VIEW IF EXISTS public.mt_accounts_secure;

-- The approach is now:
-- 1. Login credentials are encrypted in login_encrypted column via trigger
-- 2. Applications should use decrypt_mt_login function to get real login
-- 3. The plain login column stores '********' after encryption
-- 4. RLS ensures users can only access their own accounts