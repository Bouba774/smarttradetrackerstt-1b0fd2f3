-- Fix security definer views by recreating them with SECURITY INVOKER

-- Drop and recreate user_pin_status view with SECURITY INVOKER
DROP VIEW IF EXISTS public.user_pin_status;

CREATE VIEW public.user_pin_status
WITH (security_invoker = true)
AS
SELECT 
  sc.user_id,
  CASE WHEN sc.pin_hash IS NOT NULL THEN true ELSE false END AS has_pin,
  COALESCE(sc.pin_length, 4) AS pin_length,
  COALESCE(sc.max_attempts, 5) AS max_attempts,
  COALESCE(sc.wipe_on_max_attempts, false) AS wipe_on_max_attempts,
  COALESCE(sc.biometric_enabled, false) AS biometric_enabled
FROM public.secure_credentials sc;

-- Add comment for documentation
COMMENT ON VIEW public.user_pin_status IS 'View for user PIN status - uses SECURITY INVOKER to respect RLS of underlying secure_credentials table';

-- Drop and recreate user_sessions_masked view with SECURITY INVOKER
DROP VIEW IF EXISTS public.user_sessions_masked;

CREATE VIEW public.user_sessions_masked
WITH (security_invoker = true)
AS
SELECT 
  us.id,
  us.user_id,
  us.session_start,
  us.session_end,
  us.browser_name,
  us.browser_version,
  us.os_name,
  us.os_version,
  us.device_type,
  us.is_mobile,
  us.country,
  us.country_code,
  us.created_at,
  us.updated_at
FROM public.user_sessions us;

COMMENT ON VIEW public.user_sessions_masked IS 'Masked view of user sessions - excludes sensitive data like IP, city, region, ISP. Uses SECURITY INVOKER to respect RLS.';