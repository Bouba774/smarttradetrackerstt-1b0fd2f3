-- ============================================================
-- CONSOLIDATED RLS POLICIES CLEANUP
-- Remove duplicate policies for profiles and secure_credentials
-- ============================================================

-- ========== PROFILES TABLE ==========
-- Keep only: profiles_select_own and profiles_select_admin (consolidated)
-- Remove duplicates

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only delete their own profile" ON public.profiles;

-- Create clean, consolidated policies for profiles
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ========== SECURE_CREDENTIALS TABLE ==========
-- Keep only: Block SELECT (except admin), allow CUD for own user
-- Remove all existing policies first

DROP POLICY IF EXISTS "Block all direct select on secure_credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can view their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can view own secure credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can create their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only view their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only insert their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only update their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only delete their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "secure_credentials_select_own" ON public.secure_credentials;
DROP POLICY IF EXISTS "secure_credentials_insert_own" ON public.secure_credentials;
DROP POLICY IF EXISTS "secure_credentials_update_own" ON public.secure_credentials;
DROP POLICY IF EXISTS "secure_credentials_delete_own" ON public.secure_credentials;
DROP POLICY IF EXISTS "secure_credentials_select_admin" ON public.secure_credentials;
DROP POLICY IF EXISTS "Admins can view all credentials" ON public.secure_credentials;

-- Create clean, consolidated policies for secure_credentials
-- IMPORTANT: Block direct SELECT for all users (use get_own_pin_status function instead)
-- Only admins can SELECT for audit purposes

CREATE POLICY "secure_credentials_no_direct_select" ON public.secure_credentials
  FOR SELECT USING (false);

CREATE POLICY "secure_credentials_admin_select" ON public.secure_credentials
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "secure_credentials_insert" ON public.secure_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_credentials_update" ON public.secure_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "secure_credentials_delete" ON public.secure_credentials
  FOR DELETE USING (auth.uid() = user_id);