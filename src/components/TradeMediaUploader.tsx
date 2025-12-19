import React, { useRef } from 'react';
import { X, Image as ImageIcon, Video, Mic, Upload, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getMediaType, type MediaType } from '@/hooks/useTradeMedia';
import { Button } from '@/components/ui/button';

export interface MediaItem {
  file: File;
  type: MediaType;
  preview: string;
}

interface TradeMediaUploaderProps {
  mediaItems: MediaItem[];
  onMediaChange: (items: MediaItem[]) => void;
  onError: (error: string) => void;
}

const TradeMediaUploader: React.FC<TradeMediaUploaderProps> = ({
  mediaItems,
  onMediaChange,
  onError,
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playingAudio, setPlayingAudio] = React.useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: MediaItem[] = [];

    for (const file of Array.from(files)) {
      const type = getMediaType(file);
      if (!type) {
        onError(language === 'fr' 
          ? `Type de fichier non supporté: ${file.name}` 
          : `Unsupported file type: ${file.name}`);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      newItems.push({ file, type, preview });
    }

    onMediaChange([...mediaItems, ...newItems]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    const item = mediaItems[index];
    URL.revokeObjectURL(item.preview);
    onMediaChange(mediaItems.filter((_, i) => i !== index));
  };

  const toggleAudioPlay = (preview: string) => {
    const audio = audioRefs.current.get(preview);
    if (!audio) return;

    if (playingAudio === preview) {
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Pause any currently playing audio
      if (playingAudio) {
        const currentAudio = audioRefs.current.get(playingAudio);
        currentAudio?.pause();
      }
      audio.play();
      setPlayingAudio(preview);
    }
  };

  const handleAudioEnded = (preview: string) => {
    if (playingAudio === preview) {
      setPlayingAudio(null);
    }
  };

  const images = mediaItems.filter(m => m.type === 'image');
  const videos = mediaItems.filter(m => m.type === 'video');
  const audios = mediaItems.filter(m => m.type === 'audio');

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          {images.length} {language === 'fr' ? 'image(s)' : 'image(s)'}
        </span>
        <span className="flex items-center gap-1">
          <Video className="w-3 h-3" />
          {videos.length} {language === 'fr' ? 'vidéo(s)' : 'video(s)'}
        </span>
        <span className="flex items-center gap-1">
          <Mic className="w-3 h-3" />
          {audios.length} {language === 'fr' ? 'audio(s)' : 'audio(s)'}
        </span>
      </div>

      {/* Media Grid */}
      {mediaItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {mediaItems.map((item, index) => (
            <div
              key={item.preview}
              className={cn(
                "relative rounded-lg overflow-hidden border border-border bg-secondary/30",
                item.type === 'audio' ? "aspect-[2/1]" : "aspect-video"
              )}
            >
              {item.type === 'image' && (
                <img
                  src={item.preview}
                  alt={`Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}

              {item.type === 'video' && (
                <video
                  src={item.preview}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              )}

              {item.type === 'audio' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <audio
                    ref={(el) => {
                      if (el) audioRefs.current.set(item.preview, el);
                    }}
                    src={item.preview}
                    onEnded={() => handleAudioEnded(item.preview)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleAudioPlay(item.preview)}
                    className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30"
                  >
                    {playingAudio === item.preview ? (
                      <Pause className="w-5 h-5 text-primary" />
                    ) : (
                      <Play className="w-5 h-5 text-primary" />
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 truncate max-w-full px-2">
                    {item.file.name}
                  </p>
                </div>
              )}

              {/* Type Badge */}
              <div className="absolute top-1 left-1">
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                  item.type === 'image' && "bg-blue-500/80 text-white",
                  item.type === 'video' && "bg-purple-500/80 text-white",
                  item.type === 'audio' && "bg-amber-500/80 text-white"
                )}>
                  {item.type === 'image' && <ImageIcon className="w-3 h-3" />}
                  {item.type === 'video' && <Video className="w-3 h-3" />}
                  {item.type === 'audio' && <Mic className="w-3 h-3" />}
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-loss/80 text-loss-foreground hover:bg-loss transition-colors"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Play overlay for videos */}
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                    <Play className="w-5 h-5 text-black ml-0.5" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <label className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {language === 'fr' 
            ? 'Cliquez ou glissez vos fichiers (images, vidéos, audios)' 
            : 'Click or drag your files (images, videos, audio)'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {language === 'fr' 
            ? 'Images: 10MB max • Vidéos: 100MB max • Audio: 50MB max' 
            : 'Images: 10MB max • Videos: 100MB max • Audio: 50MB max'}
        </p>
      </label>
    </div>
  );
};

export default TradeMediaUploader;