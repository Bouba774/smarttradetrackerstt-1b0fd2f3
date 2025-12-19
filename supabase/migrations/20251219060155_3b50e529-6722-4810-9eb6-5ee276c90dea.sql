-- Make trade-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'trade-images';

-- Drop existing public policy
DROP POLICY IF EXISTS "Public can view trade images" ON storage.objects;

-- Create secure policies for authenticated users only
CREATE POLICY "Users can view own trade images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own trade images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own trade images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own trade images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);