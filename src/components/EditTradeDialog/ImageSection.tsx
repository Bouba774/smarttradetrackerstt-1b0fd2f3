import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { validateImageFiles } from '@/lib/tradeValidation';

interface ImageSectionProps {
  language: string;
  existingImages: string[];
  imagesToDelete: string[];
  newImageFiles: File[];
  newImagePreviews: string[];
  onNewImageUpload: (files: File[]) => void;
  onRemoveExistingImage: (url: string) => void;
  onRestoreExistingImage: (url: string) => void;
  onRemoveNewImage: (index: number) => void;
}

export const ImageSection: React.FC<ImageSectionProps> = ({
  language,
  existingImages,
  imagesToDelete,
  newImageFiles,
  newImagePreviews,
  onNewImageUpload,
  onRemoveExistingImage,
  onRestoreExistingImage,
  onRemoveNewImage,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = existingImages.length - imagesToDelete.length + newImageFiles.length + newFiles.length;

    if (totalImages > 4) {
      toast.error(language === 'fr' ? 'Maximum 4 images par trade' : 'Maximum 4 images per trade');
      return;
    }

    const validation = validateImageFiles([...newImageFiles, ...newFiles]);
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    onNewImageUpload(newFiles);
  };

  const remainingSlots = 4 - (existingImages.length - imagesToDelete.length + newImageFiles.length);

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4" />
        {language === 'fr' ? 'Images' : 'Images'}
      </Label>

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {language === 'fr' ? 'Images existantes:' : 'Existing images:'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((url, idx) => {
              const isMarkedForDeletion = imagesToDelete.includes(url);
              return (
                <div key={idx} className="relative group">
                  <img
                    src={url}
                    alt={`Trade ${idx + 1}`}
                    className={`w-full h-20 object-cover rounded-lg border border-border ${
                      isMarkedForDeletion ? 'opacity-30 grayscale' : ''
                    }`}
                  />
                  {isMarkedForDeletion ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRestoreExistingImage(url)}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemoveExistingImage(url)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                  {isMarkedForDeletion && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-loss bg-background/80 px-1 rounded">
                        {language === 'fr' ? 'Supprimé' : 'Deleted'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Images Preview */}
      {newImagePreviews.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {language === 'fr' ? 'Nouvelles images:' : 'New images:'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {newImagePreviews.map((preview, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={preview}
                  alt={`New ${idx + 1}`}
                  className="w-full h-20 object-cover rounded-lg border border-profit/30"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveNewImage(idx)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {remainingSlots > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="edit-trade-images"
          />
          <label htmlFor="edit-trade-images">
            <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
              <span>
                <Upload className="w-4 h-4" />
                {language === 'fr' ? 'Ajouter des images' : 'Add images'}
              </span>
            </Button>
          </label>
          <span className="text-xs text-muted-foreground">
            ({remainingSlots} {language === 'fr' ? 'restant(s)' : 'remaining'})
          </span>
        </div>
      )}
    </div>
  );
};
