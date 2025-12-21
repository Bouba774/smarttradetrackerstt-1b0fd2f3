-- =====================================================
-- SECURITY FIXES & UNAUTHORIZED ACCESS LOGGING
-- =====================================================

-- 1. Create unauthorized access attempts table for logging
CREATE TABLE IF NOT EXISTS public.unauthorized_access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    table_name text NOT NULL,
    operation text NOT NULL,
    attempted_at timestamp with time zone NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text,
    details jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on unauthorized access logs
ALTER TABLE public.unauthorized_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view unauthorized access logs
CREATE POLICY "Admins can view unauthorized access logs"
ON public.unauthorized_access_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- System/service role can insert logs (not regular users)
CREATE POLICY "Service role can insert unauthorized access logs"
ON public.unauthorized_access_logs
FOR INSERT
WITH CHECK (auth.uid() IS NULL OR is_admin(auth.uid()));

-- No updates or deletes allowed
CREATE POLICY "No updates to access logs"
ON public.unauthorized_access_logs
FOR UPDATE
USING (false);

CREATE POLICY "No deletes from access logs"
ON public.unauthorized_access_logs
FOR DELETE
USING (false);

-- =====================================================
-- FIX 1: user_sessions_masked view - add security
-- =====================================================
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
FROM public.user_sessions us
WHERE us.user_id = auth.uid() OR is_admin(auth.uid());

-- =====================================================
-- FIX 2: session_anomalies - restrict INSERT to service role
-- =====================================================
DROP POLICY IF EXISTS "System can insert anomalies" ON public.session_anomalies;

-- Only allow inserts from service role (when auth.uid() is null - called from edge function with service role)
CREATE POLICY "Service role can insert anomalies"
ON public.session_anomalies
FOR INSERT
WITH CHECK (auth.uid() IS NULL);

-- =====================================================
-- FIX 3: connection_logs - restrict INSERT to service role
-- =====================================================
DROP POLICY IF EXISTS "System can insert connection logs" ON public.connection_logs;

-- Only allow inserts from service role
CREATE POLICY "Service role can insert connection logs"
ON public.connection_logs
FOR INSERT
WITH CHECK (auth.uid() IS NULL);

-- =====================================================
-- FIX 4: user_ip_history - restrict ALL to service role
-- =====================================================
DROP POLICY IF EXISTS "System can manage IP history" ON public.user_ip_history;

-- Only service role can insert
CREATE POLICY "Service role can insert IP history"
ON public.user_ip_history
FOR INSERT
WITH CHECK (auth.uid() IS NULL);

-- Only service role can update
CREATE POLICY "Service role can update IP history"
ON public.user_ip_history
FOR UPDATE
USING (auth.uid() IS NULL);

-- Only service role can delete
CREATE POLICY "Service role can delete IP history"
ON public.user_ip_history
FOR DELETE
USING (auth.uid() IS NULL);

-- Users and admins can view IP history (admins all, users own)
CREATE POLICY "Users can view own IP history"
ON public.user_ip_history
FOR SELECT
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- =====================================================
-- FIX 5: email_validation_logs - restrict INSERT to service role
-- =====================================================
DROP POLICY IF EXISTS "System can insert email validation logs" ON public.email_validation_logs;

-- Only service role can insert
CREATE POLICY "Service role can insert email validation logs"
ON public.email_validation_logs
FOR INSERT
WITH CHECK (auth.uid() IS NULL);

-- =====================================================
-- FIX 6: data_processing_registry - restrict SELECT to authenticated users
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view processing registry" ON public.data_processing_registry;

-- Only authenticated users can view (not anonymous)
CREATE POLICY "Authenticated users can view processing registry"
ON public.data_processing_registry
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- =====================================================
-- Function to log unauthorized access attempts
-- =====================================================
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