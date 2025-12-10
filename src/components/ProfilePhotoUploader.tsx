import React, { useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedback } from '@/hooks/useFeedback';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Upload, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfilePhotoUploaderProps {
  currentAvatarUrl?: string | null;
  nickname?: string;
  onPhotoUpdated: () => void;
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
  
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'fr' ? 'Veuillez sélectionner une image' : 'Please select an image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'fr' ? 'Image trop volumineuse (max 5MB)' : 'Image too large (max 5MB)');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    triggerFeedback('click');
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    triggerFeedback('click');

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trade-images')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onPhotoUpdated();
      setIsOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);
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
      // Update profile to remove avatar URL
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
    setPreviewUrl(null);
    setSelectedFile(null);
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
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12"
          onClick={() => triggerFeedback('click')}
        >
          <Camera className="w-5 h-5 text-primary" />
          {language === 'fr' ? 'Changer la photo' : 'Change photo'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {language === 'fr' ? 'Photo de profil' : 'Profile photo'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-primary/30">
                <AvatarImage src={previewUrl || currentAvatarUrl || ''} alt="Profile preview" />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-4xl font-bold">
                  {nickname?.charAt(0)?.toUpperCase() || 'T'}
                </AvatarFallback>
              </Avatar>
              {previewUrl && (
                <button
                  onClick={resetSelection}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-loss text-white flex items-center justify-center shadow-lg hover:bg-loss/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {previewUrl && (
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
            {previewUrl ? (
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

            {currentAvatarUrl && !previewUrl && (
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePhotoUploader;
