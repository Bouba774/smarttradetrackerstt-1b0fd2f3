import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type MediaType = 'image' | 'video' | 'audio';

interface MediaFile {
  file: File;
  type: MediaType;
  preview?: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a'];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

export const getMediaType = (file: File): MediaType | null => {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image';
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video';
  if (ALLOWED_AUDIO_TYPES.includes(file.type)) return 'audio';
  return null;
};

export const useTradeMedia = () => {
  const { user } = useAuth();

  const validateFile = (file: File): { valid: boolean; error?: string; type?: MediaType } => {
    const mediaType = getMediaType(file);
    
    if (!mediaType) {
      return { 
        valid: false, 
        error: `Type de fichier non supporté: ${file.type}. Images (JPEG, PNG, GIF, WebP), Vidéos (MP4, WebM, MOV, AVI), Audio (MP3, WAV, OGG, M4A).` 
      };
    }

    let maxSize: number;
    let maxSizeLabel: string;

    switch (mediaType) {
      case 'image':
        maxSize = MAX_IMAGE_SIZE;
        maxSizeLabel = '10MB';
        break;
      case 'video':
        maxSize = MAX_VIDEO_SIZE;
        maxSizeLabel = '100MB';
        break;
      case 'audio':
        maxSize = MAX_AUDIO_SIZE;
        maxSizeLabel = '50MB';
        break;
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `${file.name} trop volumineux: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum pour ${mediaType}: ${maxSizeLabel}.` 
      };
    }

    return { valid: true, type: mediaType };
  };

  const uploadMedia = async (files: File[]): Promise<{ images: string[]; videos: string[]; audios: string[] }> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const result = { images: [] as string[], videos: [] as string[], audios: [] as string[] };

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid || !validation.type) {
        toast.error(validation.error);
        continue;
      }

      const mediaType = validation.type;
      const bucket = mediaType === 'image' ? 'trade-images' : 'trade-media';
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error(`Erreur lors de l'upload: ${file.name}`);
        continue;
      }

      // Get signed URL for private bucket
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year validity

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Error creating signed URL:', signedUrlError);
        toast.error(`Erreur lors de la génération de l'URL: ${file.name}`);
        continue;
      }

      switch (mediaType) {
        case 'image':
          result.images.push(signedUrlData.signedUrl);
          break;
        case 'video':
          result.videos.push(signedUrlData.signedUrl);
          break;
        case 'audio':
          result.audios.push(signedUrlData.signedUrl);
          break;
      }
    }

    return result;
  };

  const deleteMedia = async (url: string, type: MediaType): Promise<boolean> => {
    if (!user) return false;

    try {
      const bucket = type === 'image' ? 'trade-images' : 'trade-media';
      const urlParts = url.split(`/${bucket}/`);
      if (urlParts.length < 2) return false;

      // Extract path before query params
      const filePath = urlParts[1].split('?')[0];

      const { error } = await supabase.storage
        .from(bucket)
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
    validateFile,
    uploadMedia,
    deleteMedia,
    getMediaType,
  };
};