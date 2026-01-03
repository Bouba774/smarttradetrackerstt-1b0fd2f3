-- =====================================================
-- SECURITY FIX: Final fixes for remaining vulnerabilities
-- =====================================================

-- 1. FIX SECURE_CREDENTIALS: Ensure NO direct SELECT for users
-- First, check and drop any remaining user SELECT policy
DROP POLICY IF EXISTS "Users can view their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can view own secure credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "secure_credentials_select_own" ON public.secure_credentials;

-- 2. FIX USER_CHALLENGES: Make table read-only for users, updates via server
DROP POLICY IF EXISTS "Users can update their own challenges" ON public.user_challenges;
DROP POLICY IF EXISTS "Users can delete their own challenges" ON public.user_challenges;

-- Create server-only update function for challenges
CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  p_challenge_id text,
  p_progress integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_challenge RECORD;
  v_completed boolean;
  v_points integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get current challenge state
  SELECT * INTO v_challenge
  FROM public.user_challenges
  WHERE user_id = v_user_id AND challenge_id = p_challenge_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;
  
  -- Prevent manipulation: progress can only increase by 1
  IF p_progress > v_challenge.progress + 1 THEN
    RAISE EXCEPTION 'Invalid progress update';
  END IF;
  
  -- Check if challenge is now completed
  v_completed := p_progress >= v_challenge.target;
  
  -- Update challenge
  UPDATE public.user_challenges
  SET 
    progress = LEAST(p_progress, target),
    completed = v_completed,
    completed_at = CASE WHEN v_completed AND completed_at IS NULL THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE user_id = v_user_id AND challenge_id = p_challenge_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'progress', LEAST(p_progress, v_challenge.target),
    'completed', v_completed
  );
END;
$$;

-- 3. Add authorization checks to logging functions
CREATE OR REPLACE FUNCTION public.log_admin_data_access(
  p_admin_id uuid, 
  p_target_user_id uuid, 
  p_action text, 
  p_table_name text, 
  p_ip_address text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin or service role
  IF NOT (public.is_admin(auth.uid()) OR auth.uid() IS NULL) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can log admin data access';
  END IF;

  INSERT INTO public.admin_audit_logs (
    admin_id,
    target_user_id,
    action,
    ip_address,
    details
  ) VALUES (
    p_admin_id,
    p_target_user_id,
    p_action,
    p_ip_address,
    jsonb_build_object('table', p_table_name, 'timestamp', now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.log_unauthorized_access(
  p_table_name text, 
  p_operation text, 
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow any authenticated user to log unauthorized access attempts
  -- This is intentional to track security events
  INSERT INTO public.unauthorized_access_logs (
    user_id,
    table_name,
    operation,
    details
  ) VALUES (
    auth.uid(),
    p_table_name,
    p_operation,
    p_details
  );
END;
$$;