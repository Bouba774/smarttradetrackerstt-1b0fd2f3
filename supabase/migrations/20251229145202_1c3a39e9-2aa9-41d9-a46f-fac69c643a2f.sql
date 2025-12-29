-- Drop duplicate and restrictive policies on secure_credentials
DROP POLICY IF EXISTS "Users can create their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only insert their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only delete their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only update their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can only view their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can update their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Users can view their own credentials" ON public.secure_credentials;
DROP POLICY IF EXISTS "Admins can view all credentials" ON public.secure_credentials;

-- Create PERMISSIVE policies (default behavior - any passing policy allows the operation)
CREATE POLICY "Users can view own credentials"
ON public.secure_credentials
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
ON public.secure_credentials
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
ON public.secure_credentials
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own credentials"
ON public.secure_credentials
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credentials"
ON public.secure_credentials
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Also fix the pin_length constraint to allow 4, 5, and 6 digits
ALTER TABLE public.secure_credentials DROP CONSTRAINT IF EXISTS secure_credentials_pin_length_check;
ALTER TABLE public.secure_credentials ADD CONSTRAINT secure_credentials_pin_length_check CHECK (pin_length >= 4 AND pin_length <= 6);