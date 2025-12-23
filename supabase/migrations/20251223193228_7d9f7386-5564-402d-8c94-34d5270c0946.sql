-- Drop the existing insecure view
DROP VIEW IF EXISTS public.user_pin_status;

-- The secure function get_own_pin_status() already exists and is SECURITY DEFINER
-- It only returns data for auth.uid()
-- Applications should use: SELECT * FROM get_own_pin_status()

-- For admin access to other users' pin status, use get_user_pin_status(user_id)
-- which already has proper authorization checks

-- Add RLS to secure_credentials table if not already done
ALTER TABLE public.secure_credentials ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can insert own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can update own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can delete own credentials" ON public.secure_credentials;

-- Create strict RLS policies for secure_credentials
CREATE POLICY "Users can only view their own credentials"
ON public.secure_credentials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own credentials"
ON public.secure_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own credentials"
ON public.secure_credentials
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own credentials"
ON public.secure_credentials
FOR DELETE
USING (auth.uid() = user_id);