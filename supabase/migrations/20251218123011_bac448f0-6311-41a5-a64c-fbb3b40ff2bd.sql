-- Create user_settings table for cross-device synchronization
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  
  -- Security settings
  pin_enabled BOOLEAN DEFAULT false,
  pin_hash TEXT,
  pin_length INTEGER DEFAULT 4,
  auto_lock_timeout INTEGER DEFAULT 0,
  confidential_mode BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 5,
  wipe_on_max_attempts BOOLEAN DEFAULT false,
  biometric_enabled BOOLEAN DEFAULT false,
  
  -- App settings
  vibration BOOLEAN DEFAULT true,
  sounds BOOLEAN DEFAULT true,
  animations BOOLEAN DEFAULT true,
  font_size TEXT DEFAULT 'standard',
  background TEXT DEFAULT 'default',
  currency TEXT DEFAULT 'USD',
  
  -- Known devices (JSON array of fingerprints)
  known_devices JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_settings
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();