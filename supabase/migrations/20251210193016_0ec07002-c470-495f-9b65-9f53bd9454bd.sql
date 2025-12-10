-- Update the trade-images bucket with file restrictions
UPDATE storage.buckets 
SET 
  file_size_limit = 5242880, -- 5MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'trade-images';

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own trade images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view trade images" ON storage.objects;

-- Create RLS policy for uploading images (user can only upload to their own folder)
CREATE POLICY "Users can upload their own trade images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'trade-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policy for viewing images (public access for display)
CREATE POLICY "Public can view trade images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'trade-images');

-- Create RLS policy for deleting images (user can only delete their own)
CREATE POLICY "Users can delete their own trade images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'trade-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);