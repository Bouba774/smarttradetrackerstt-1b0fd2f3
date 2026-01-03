import React, { useRef, useState, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedback } from '@/hooks/useFeedback';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, Trash2, X, Loader2, Crop as CropIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ProfilePhotoUploaderProps {
  currentAvatarUrl?: string | null;
  nickname?: string;
  onPhotoUpdated: () => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  canvas.width = crop.width;
  canvas.height = crop.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas is empty'));
      },
      'image/jpeg',
      0.9
    );
  });
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentAvatarUrl,
  nickname,
  onPhotoUpdated,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { triggerFeedback } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(language === 'fr' ? 'Veuillez sélectionner une image' : 'Please select an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'fr' ? 'Image trop volumineuse (max 5MB)' : 'Image too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string);
      setIsCropping(true);
      setCroppedPreview(null);
    };
    reader.readAsDataURL(file);
    
    triggerFeedback('click');
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const blob = await getCroppedImg(imgRef.current, completedCrop);
      const previewUrl = URL.createObjectURL(blob);
      setCroppedBlob(blob);
      setCroppedPreview(previewUrl);
      setIsCropping(false);
      triggerFeedback('click');
    } catch (error) {
      console.error('Crop error:', error);
      toast.error(language === 'fr' ? 'Erreur lors du recadrage' : 'Crop error');
    }
  };

  const handleUpload = async () => {
    if (!croppedBlob || !user) return;

    setIsUploading(true);
    triggerFeedback('click');

    try {
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get signed URL for private bucket (1 year validity)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('trade-images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw signedUrlError || new Error('Failed to create signed URL');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: signedUrlData.signedUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdated();
      setIsOpen(false);
      resetSelection();
      triggerFeedback('success');
      toast.success(language === 'fr' ? 'Photo mise à jour!' : 'Photo updated!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      triggerFeedback('error');
      toast.error(language === 'fr' ? 'Erreur lors du téléchargement' : 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user || !currentAvatarUrl) return;

    setIsDeleting(true);
    triggerFeedback('click');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdated();
      setIsOpen(false);
      triggerFeedback('success');
      toast.success(language === 'fr' ? 'Photo supprimée!' : 'Photo removed!');
    } catch (error) {
      console.error('Error removing photo:', error);
      triggerFeedback('error');
      toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Delete error');
    } finally {
      setIsDeleting(false);
    }
  };

  const resetSelection = () => {
    setImageUrl(null);
    setCroppedPreview(null);
    setCroppedBlob(null);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setIsCropping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetSelection();
    }}>
      <DialogTrigger asChild>
        <button
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors z-10"
          onClick={() => triggerFeedback('click')}
        >
          <Camera className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {language === 'fr' ? 'Photo de profil' : 'Profile photo'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Cropping View */}
          {isCropping && imageUrl && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                {language === 'fr' ? 'Recadrez votre photo' : 'Crop your photo'}
              </p>
              <div className="max-w-full overflow-hidden rounded-lg border border-border">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt="Crop"
                    onLoad={onImageLoad}
                    className="max-h-[300px] w-auto"
                  />
                </ReactCrop>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={resetSelection}
                >
                  <X className="w-4 h-4" />
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleCropComplete}
                  disabled={!completedCrop}
                >
                  <Check className="w-4 h-4" />
                  {language === 'fr' ? 'Valider' : 'Confirm'}
                </Button>
              </div>
            </div>
          )}

          {/* Preview View */}
          {!isCropping && (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary/30">
                    <AvatarImage src={croppedPreview || currentAvatarUrl || ''} alt="Profile preview" />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl font-bold">
                      {nickname?.charAt(0)?.toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  {croppedPreview && (
                    <button
                      onClick={resetSelection}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-loss text-white flex items-center justify-center shadow-lg hover:bg-loss/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {croppedPreview && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Aperçu de la nouvelle photo' : 'Preview of new photo'}
                  </p>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Actions */}
              <div className="space-y-3">
                {croppedPreview ? (
                  <>
                    <Button
                      className="w-full gap-2"
                      onClick={handleUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isUploading
                        ? (language === 'fr' ? 'Téléchargement...' : 'Uploading...')
                        : (language === 'fr' ? 'Enregistrer' : 'Save')
                      }
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setIsCropping(true)}
                    >
                      <CropIcon className="w-4 h-4" />
                      {language === 'fr' ? 'Recadrer à nouveau' : 'Crop again'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {language === 'fr' ? 'Choisir une image' : 'Choose an image'}
                  </Button>
                )}

                {currentAvatarUrl && !croppedPreview && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-loss hover:text-loss border-loss/30 hover:border-loss"
                    onClick={handleDeletePhoto}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {language === 'fr' ? 'Supprimer la photo' : 'Remove photo'}
                  </Button>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                {language === 'fr' 
                  ? 'Formats acceptés: JPG, PNG, GIF (max 5MB)'
                  : 'Accepted formats: JPG, PNG, GIF (max 5MB)'
                }
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePhotoUploader;
