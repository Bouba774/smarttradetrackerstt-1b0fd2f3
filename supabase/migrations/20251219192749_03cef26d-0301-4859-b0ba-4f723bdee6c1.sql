-- Create a separate table for sensitive security credentials
-- This isolates PIN hashes, salts, and security-critical data from general settings

CREATE TABLE public.secure_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  pin_hash TEXT,
  pin_salt TEXT,
  pin_length INTEGER DEFAULT 4 CHECK (pin_length IN (4, 6)),
  max_attempts INTEGER DEFAULT 5,
  wipe_on_max_attempts BOOLEAN DEFAULT false,
  biometric_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.secure_credentials ENABLE ROW LEVEL SECURITY;

-- Create highly restrictive RLS policies
-- Users can only access their own credentials
CREATE POLICY "Users can view their own credentials"
ON public.secure_credentials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own credentials"
ON public.secure_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
ON public.secure_credentials
FOR UPDATE
USING (auth.uid() = user_id);

-- No delete policy - credentials should be cleared via update, not deleted

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_secure_credentials_updated_at
BEFORE UPDATE ON public.secure_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing PIN data from user_settings to secure_credentials
INSERT INTO public.secure_credentials (user_id, pin_hash, pin_salt, pin_length, max_attempts, wipe_on_max_attempts, biometric_enabled)
SELECT 
  user_id,
  pin_hash,
  pin_salt,
  COALESCE(pin_length, 4),
  COALESCE(max_attempts, 5),
  COALESCE(wipe_on_max_attempts, false),
  COALESCE(biometric_enabled, false)
FROM public.user_settings
WHERE pin_hash IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create a security definer function to safely check if user has PIN enabled
-- This prevents direct querying of the secure_credentials table structure
CREATE OR REPLACE FUNCTION public.get_user_pin_status(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'has_pin', CASE WHEN pin_hash IS NOT NULL THEN true ELSE false END,
    'pin_length', COALESCE(pin_length, 4),
    'max_attempts', COALESCE(max_attempts, 5),
    'wipe_on_max_attempts', COALESCE(wipe_on_max_attempts, false),
    'biometric_enabled', COALESCE(biometric_enabled, false)
  ) INTO v_result
  FROM public.secure_credentials
  WHERE user_id = p_user_id;
  
  IF v_result IS NULL THEN
    RETURN json_build_object(
      'has_pin', false,
      'pin_length', 4,
      'max_attempts', 5,
      'wipe_on_max_attempts', false,
      'biometric_enabled', false
    );
  END IF;
  
  RETURN v_result;
END;
$$;