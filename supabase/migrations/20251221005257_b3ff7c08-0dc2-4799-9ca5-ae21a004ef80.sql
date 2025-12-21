-- 1. Add DELETE policy for user_sessions - Users should be able to delete their sessions
CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add DELETE policy for user_settings - Users should be able to reset their settings
CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Add strict INSERT policy for admin_audit_logs - Only via SECURITY DEFINER functions
-- First drop any existing insert policy
DROP POLICY IF EXISTS "No direct insert to audit logs" ON public.admin_audit_logs;

-- Create restrictive INSERT policy (only via security definer functions)
CREATE POLICY "No direct insert to audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (false);

-- Create restrictive UPDATE policy - audit logs should never be updated
CREATE POLICY "No updates to audit logs"
ON public.admin_audit_logs
FOR UPDATE
USING (false);

-- Create restrictive DELETE policy - audit logs should never be deleted
CREATE POLICY "No deletes from audit logs"
ON public.admin_audit_logs
FOR DELETE
USING (false);

-- 4. Add strict policies for admin_login_attempts
-- Create restrictive INSERT policy
CREATE POLICY "No direct insert to login attempts"
ON public.admin_login_attempts
FOR INSERT
WITH CHECK (false);

-- Create restrictive UPDATE policy
CREATE POLICY "No updates to login attempts"
ON public.admin_login_attempts
FOR UPDATE
USING (false);

-- Create restrictive DELETE policy
CREATE POLICY "No deletes from login attempts"
ON public.admin_login_attempts
FOR DELETE
USING (false);

-- 5. Create a secure view for user_sessions that masks sensitive data
CREATE OR REPLACE VIEW public.user_sessions_masked AS
SELECT 
  id,
  user_id,
  session_start,
  session_end,
  browser_name,
  browser_version,
  os_name,
  os_version,
  device_type,
  is_mobile,
  country_code,
  country,
  -- Don't expose: ip_address, city, region, isp, device_vendor, device_model
  created_at,
  updated_at
FROM public.user_sessions
WHERE user_id = auth.uid();

GRANT SELECT ON public.user_sessions_masked TO authenticated;

COMMENT ON VIEW public.user_sessions_masked IS 'Masked view of user sessions that hides sensitive location data (IP, city, region, ISP) from client access';

-- 6. Create a secure view for secure_credentials that never exposes hashes
CREATE OR REPLACE VIEW public.user_pin_status AS
SELECT 
  user_id,
  CASE WHEN pin_hash IS NOT NULL THEN true ELSE false END as has_pin,
  pin_length,
  max_attempts,
  biometric_enabled,
  wipe_on_max_attempts
  -- Never expose: pin_hash, pin_salt
FROM public.secure_credentials
WHERE user_id = auth.uid();

GRANT SELECT ON public.user_pin_status TO authenticated;

COMMENT ON VIEW public.user_pin_status IS 'Safe view of PIN status that never exposes hash or salt values';