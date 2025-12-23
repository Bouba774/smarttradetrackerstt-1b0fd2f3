-- Drop and recreate the user_sessions_masked view with security invoker
-- This ensures the view respects the RLS policies of the underlying user_sessions table

DROP VIEW IF EXISTS public.user_sessions_masked;

CREATE VIEW public.user_sessions_masked
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  session_start,
  session_end,
  device_type,
  browser_name,
  browser_version,
  os_name,
  os_version,
  is_mobile,
  country,
  country_code,
  created_at,
  updated_at
FROM public.user_sessions;

-- Add comment for documentation
COMMENT ON VIEW public.user_sessions_masked IS 'Masked view of user sessions that respects RLS policies - hides sensitive data like IP addresses';

-- Grant appropriate permissions
GRANT SELECT ON public.user_sessions_masked TO authenticated;