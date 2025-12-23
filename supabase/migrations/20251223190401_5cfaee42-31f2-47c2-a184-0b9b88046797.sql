-- Drop the insecure view
DROP VIEW IF EXISTS public.user_sessions_masked;

-- Create a security definer function to replace the view
-- This function only returns sessions for the authenticated user, or all for admins
CREATE OR REPLACE FUNCTION public.get_user_sessions_masked(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  session_start timestamp with time zone,
  session_end timestamp with time zone,
  device_type text,
  browser_name text,
  browser_version text,
  os_name text,
  os_version text,
  country text,
  country_code text,
  is_mobile boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no target specified, return current user's sessions
  -- Admins can query any user's sessions by passing target_user_id
  IF target_user_id IS NULL THEN
    RETURN QUERY
    SELECT 
      us.id,
      us.user_id,
      us.session_start,
      us.session_end,
      us.device_type,
      us.browser_name,
      us.browser_version,
      us.os_name,
      us.os_version,
      us.country,
      us.country_code,
      us.is_mobile,
      us.created_at,
      us.updated_at
    FROM public.user_sessions us
    WHERE us.user_id = auth.uid();
  ELSIF is_admin(auth.uid()) THEN
    -- Admin can view any user's masked sessions
    RETURN QUERY
    SELECT 
      us.id,
      us.user_id,
      us.session_start,
      us.session_end,
      us.device_type,
      us.browser_name,
      us.browser_version,
      us.os_name,
      us.os_version,
      us.country,
      us.country_code,
      us.is_mobile,
      us.created_at,
      us.updated_at
    FROM public.user_sessions us
    WHERE us.user_id = target_user_id;
  ELSE
    -- Non-admin trying to access other user's data - return empty
    RETURN;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_sessions_masked(uuid) TO authenticated;