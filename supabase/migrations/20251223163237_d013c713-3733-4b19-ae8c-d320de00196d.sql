-- Secure the user_sessions_masked view by revoking direct access
-- Users must use the get_own_sessions_masked() function instead

-- Revoke all permissions on the view from public and authenticated roles
REVOKE ALL ON public.user_sessions_masked FROM public;
REVOKE ALL ON public.user_sessions_masked FROM authenticated;
REVOKE ALL ON public.user_sessions_masked FROM anon;

-- Also secure user_pin_status view the same way
REVOKE ALL ON public.user_pin_status FROM public;
REVOKE ALL ON public.user_pin_status FROM authenticated;
REVOKE ALL ON public.user_pin_status FROM anon;

-- Grant access only to service_role (for admin functions)
GRANT SELECT ON public.user_sessions_masked TO service_role;
GRANT SELECT ON public.user_pin_status TO service_role;