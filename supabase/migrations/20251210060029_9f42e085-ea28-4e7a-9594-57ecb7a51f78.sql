-- Add exit_timestamp and exit_method columns to trades table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS exit_timestamp TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS exit_method TEXT CHECK (exit_method IN ('sl', 'tp', 'manual')),
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS timeframe TEXT;

-- Add rating column to journal_entries table
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 0 AND rating <= 5);

-- Add popup_shown to user_challenges to prevent duplicate popups
ALTER TABLE public.user_challenges
ADD COLUMN IF NOT EXISTS popup_shown BOOLEAN DEFAULT FALSE;