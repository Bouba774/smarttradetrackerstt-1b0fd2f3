-- Add pin_salt column to user_settings for secure hashing
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS pin_salt text;