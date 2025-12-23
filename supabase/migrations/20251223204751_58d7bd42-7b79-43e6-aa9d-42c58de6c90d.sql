-- ============================================
-- SECURITY FIX 1: Remove plain text login from mt_accounts
-- The login_encrypted column should be used instead
-- ============================================

-- Drop the plain text login column (security vulnerability)
ALTER TABLE public.mt_accounts DROP COLUMN IF EXISTS login;

-- ============================================
-- SECURITY FIX 2: Restrict profiles visibility
-- Users should only see their own profile
-- Admins access should be through secure admin functions only
-- ============================================

-- Drop the existing permissive SELECT policy that allows admin access
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;

-- Create strict policy: users can ONLY view their own profile
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Create separate admin policy with audit trail requirement
-- Admins must access through dedicated admin functions, not direct table access
CREATE POLICY "Admins can view profiles for administration"
ON public.profiles
FOR SELECT
USING (
  is_admin(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM admin_audit_logs 
    WHERE admin_id = auth.uid() 
    AND action = 'view_profile' 
    AND created_at > NOW() - INTERVAL '1 minute'
  )
);