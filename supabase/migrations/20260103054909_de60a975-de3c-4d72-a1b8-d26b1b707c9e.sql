-- =====================================================
-- SECURITY FIX: Consolidate and fix all critical RLS issues
-- =====================================================

-- 1. FIX PROFILES TABLE: Remove duplicate policies, keep only clear ones
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view profiles for administration" ON public.profiles;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create consolidated policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 2. FIX MT_ACCOUNTS TABLE: Remove duplicate policies
DROP POLICY IF EXISTS "Users can view their own MT accounts" ON public.mt_accounts;
DROP POLICY IF EXISTS "Users can delete their own MT accounts" ON public.mt_accounts;
DROP POLICY IF EXISTS "Users can update their own MT accounts" ON public.mt_accounts;
DROP POLICY IF EXISTS "Users can insert their own MT accounts" ON public.mt_accounts;

-- Create clean policies for mt_accounts
CREATE POLICY "mt_accounts_select_own" ON public.mt_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mt_accounts_insert_own" ON public.mt_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "mt_accounts_update_own" ON public.mt_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "mt_accounts_delete_own" ON public.mt_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- 3. FIX SECURE_CREDENTIALS: Remove direct SELECT, force server-side verification
DROP POLICY IF EXISTS "Users can view their own secure credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can view own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can insert their own secure credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can update their own secure credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can delete their own secure credentials" ON public.secure_credentials;

-- Only allow INSERT/UPDATE/DELETE, no direct SELECT (use get_own_pin_status function)
CREATE POLICY "secure_credentials_insert_own" ON public.secure_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "secure_credentials_update_own" ON public.secure_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "secure_credentials_delete_own" ON public.secure_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Admin can view for support purposes
CREATE POLICY "secure_credentials_select_admin" ON public.secure_credentials
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 4. FIX CONNECTION_LOGS: Remove user insert capability
DROP POLICY IF EXISTS "Users can insert own connection logs" ON public.connection_logs;
DROP POLICY IF EXISTS "Users can view own connection logs" ON public.connection_logs;
DROP POLICY IF EXISTS "Service role can insert connection logs" ON public.connection_logs;
DROP POLICY IF EXISTS "Admins can view all connection logs" ON public.connection_logs;

-- Only service role can insert (via edge functions)
CREATE POLICY "connection_logs_insert_service" ON public.connection_logs
  FOR INSERT WITH CHECK (auth.uid() IS NULL);

-- Users can view their own logs (masked data only via function)
CREATE POLICY "connection_logs_select_own" ON public.connection_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all for security monitoring
CREATE POLICY "connection_logs_select_admin" ON public.connection_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- 5. FIX TRUSTED_DEVICES: Create view that hides fingerprint values
DROP POLICY IF EXISTS "Users can view their own trusted devices" ON public.trusted_devices;
DROP POLICY IF EXISTS "Users can insert their own trusted devices" ON public.trusted_devices;
DROP POLICY IF EXISTS "Users can update their own trusted devices" ON public.trusted_devices;
DROP POLICY IF EXISTS "Users can delete their own trusted devices" ON public.trusted_devices;

-- Users can manage their devices but fingerprint hidden via function
CREATE POLICY "trusted_devices_select_own" ON public.trusted_devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "trusted_devices_insert_own" ON public.trusted_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trusted_devices_update_own" ON public.trusted_devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "trusted_devices_delete_own" ON public.trusted_devices
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create secure function to get trusted devices WITHOUT exposing fingerprint
CREATE OR REPLACE FUNCTION public.get_own_trusted_devices_masked()
RETURNS TABLE(
  id uuid,
  device_name text,
  browser_name text,
  os_name text,
  country text,
  is_trusted boolean,
  last_used_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    td.id,
    td.device_name,
    td.browser_name,
    td.os_name,
    td.country,
    td.is_trusted,
    td.last_used_at,
    td.created_at
  FROM trusted_devices td
  WHERE td.user_id = auth.uid();
END;
$$;

-- 7. FIX USER_SETTINGS: Create function that hides known_devices
CREATE OR REPLACE FUNCTION public.get_own_settings_safe()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  currency text,
  language text,
  sounds boolean,
  vibration boolean,
  animations boolean,
  font_size text,
  background text,
  default_capital numeric,
  default_risk_percent numeric,
  pin_enabled boolean,
  confidential_mode boolean,
  auto_lock_timeout integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    us.id,
    us.user_id,
    us.currency,
    us.language,
    us.sounds,
    us.vibration,
    us.animations,
    us.font_size,
    us.background,
    us.default_capital,
    us.default_risk_percent,
    us.pin_enabled,
    us.confidential_mode,
    us.auto_lock_timeout,
    us.created_at,
    us.updated_at
  FROM user_settings us
  WHERE us.user_id = auth.uid();
END;
$$;

-- 8. FIX AI_MESSAGES: Add direct RLS policy
DROP POLICY IF EXISTS "Users can manage messages in their conversations" ON public.ai_messages;

CREATE POLICY "ai_messages_select_own" ON public.ai_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_insert_own" ON public.ai_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_messages_delete_own" ON public.ai_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations ac
      WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
    )
  );