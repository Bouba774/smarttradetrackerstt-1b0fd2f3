import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const useTradeImages = () => {
  const { user } = useAuth();

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { valid: false, error: `Type de fichier non autorisé: ${file.type}. Utilisez JPEG, PNG, GIF ou WebP.` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 5MB.` };
    }
    return { valid: true };
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file before upload
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`Erreur lors de l'upload: ${file.name}`);
        continue;
      }

      const { data } = supabase.storage
        .from('trade-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Extract the path from the URL
      const urlParts = imageUrl.split('/trade-images/');
      if (urlParts.length < 2) return false;

      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('trade-images')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadImages,
    deleteImage,
  };
};
