-- Create storage bucket for trade images
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-images', 'trade-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for trade images bucket
CREATE POLICY "Users can upload their own trade images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own trade images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own trade images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Trade images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'trade-images');

-- Create table for journal entries (daily lessons, checklist, objectives)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  daily_objective TEXT,
  lessons TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own journal entries"
ON public.journal_entries
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
ON public.journal_entries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();