-- Fix RLS policies for connection_logs table
-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own connection logs" ON public.connection_logs;
DROP POLICY IF EXISTS "Users can insert own connection logs" ON public.connection_logs;
DROP POLICY IF EXISTS "Admins can view all connection logs" ON public.connection_logs;

-- Create proper RLS policies for connection_logs
CREATE POLICY "Users can view own connection logs" 
ON public.connection_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connection logs" 
ON public.connection_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all connection logs" 
ON public.connection_logs 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Fix RLS policies for profiles table
-- Drop existing policies if any
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create proper RLS policies for profiles (require authentication)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Fix RLS policies for user_consents table - add DELETE policy
DROP POLICY IF EXISTS "Users can delete own consents" ON public.user_consents;

CREATE POLICY "Users can delete own consents" 
ON public.user_consents 
FOR DELETE 
USING (auth.uid() = user_id);