-- Remove the overly permissive policy that exposes rate limit data
DROP POLICY IF EXISTS "Allow rate limit checks" ON public.rate_limit_attempts;

-- Create restrictive policy - no direct access allowed
-- Rate limiting is handled entirely by SECURITY DEFINER functions (check_rate_limit, reset_rate_limit)
CREATE POLICY "No direct access to rate limit data"
ON public.rate_limit_attempts
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);