-- Create a new bucket for trade media (videos and audio)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('trade-media', 'trade-media', false, 104857600)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for trade-media bucket
CREATE POLICY "Users can upload their own trade media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own trade media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own trade media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add media columns to trades table
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS videos text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS audios text[] DEFAULT NULL;