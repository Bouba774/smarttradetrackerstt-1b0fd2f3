-- Fix 1: Enable RLS on user_pin_status view
-- Note: user_pin_status is a VIEW, we need to ensure it only shows the authenticated user's data
-- First, let's drop and recreate the view with proper security

DROP VIEW IF EXISTS public.user_pin_status;

CREATE VIEW public.user_pin_status 
WITH (security_invoker = true)
AS
SELECT 
  sc.user_id,
  CASE WHEN sc.pin_hash IS NOT NULL THEN true ELSE false END as has_pin,
  COALESCE(sc.pin_length, 4) as pin_length,
  COALESCE(sc.max_attempts, 5) as max_attempts,
  COALESCE(sc.wipe_on_max_attempts, false) as wipe_on_max_attempts,
  COALESCE(sc.biometric_enabled, false) as biometric_enabled
FROM public.secure_credentials sc
WHERE sc.user_id = auth.uid();

-- Fix 2: Add explicit RESTRICTIVE policies for data_processing_registry
-- Drop the existing ALL policy and replace with specific ones

DROP POLICY IF EXISTS "Admins can manage processing registry" ON public.data_processing_registry;

-- Explicit INSERT policy for admins only
CREATE POLICY "Admins can insert processing registry"
ON public.data_processing_registry
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Explicit UPDATE policy for admins only  
CREATE POLICY "Admins can update processing registry"
ON public.data_processing_registry
FOR UPDATE
USING (is_admin(auth.uid()));

-- Explicit DELETE policy for admins only
CREATE POLICY "Admins can delete processing registry"
ON public.data_processing_registry
FOR DELETE
USING (is_admin(auth.uid()));