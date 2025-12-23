-- Enable RLS on user_pin_status view (it's already a view with SECURITY DEFINER)
-- We need to add RLS policies to the underlying secure_credentials table if not already done

-- Check and add RLS policy for user_pin_status view access
-- Since user_pin_status is a view, we ensure the underlying table has proper RLS

-- Add policy to restrict user_pin_status access through a security definer function
CREATE OR REPLACE FUNCTION public.get_own_pin_status()
RETURNS TABLE (
  user_id uuid,
  has_pin boolean,
  pin_length integer,
  biometric_enabled boolean,
  max_attempts integer,
  wipe_on_max_attempts boolean
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    has_pin,
    pin_length,
    biometric_enabled,
    max_attempts,
    wipe_on_max_attempts
  FROM user_pin_status
  WHERE user_id = auth.uid();
$$;

-- Add policy to restrict user_sessions_masked access through a security definer function
CREATE OR REPLACE FUNCTION public.get_own_sessions_masked()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  session_start timestamptz,
  session_end timestamptz,
  browser_name text,
  browser_version text,
  os_name text,
  os_version text,
  device_type text,
  is_mobile boolean,
  country text,
  country_code text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
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
    country,
    country_code,
    created_at,
    updated_at
  FROM user_sessions_masked
  WHERE user_id = auth.uid();
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_own_pin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_own_sessions_masked() TO authenticated;

-- Revoke direct access to the views for anonymous users
REVOKE SELECT ON public.user_pin_status FROM anon;
REVOKE SELECT ON public.user_sessions_masked FROM anon;