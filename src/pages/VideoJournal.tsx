import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Video,
  Mic,
  Play,
  Pause,
  Square,
  Trash2,
  Calendar,
  Clock,
  Download,
  SwitchCamera,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface Recording {
  id: string;
  type: 'video' | 'audio';
  date: string;
  duration: number;
  url: string;
  blob?: Blob;
  note?: string;
}

const STORAGE_KEY = 'smart-trade-tracker-recordings';

const VideoJournal: React.FC = () => {
  const { language } = useLanguage();
  
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'video' | 'audio' | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Default back camera
  const [note, setNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const playbackAudioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const MAX_DURATION = 60; // 60 seconds max

  // Load recordings from localStorage on mount
  useEffect(() => {
    const savedRecordings = localStorage.getItem(STORAGE_KEY);
    if (savedRecordings) {
      try {
        const parsed = JSON.parse(savedRecordings);
        setRecordings(parsed.map((r: Recording) => ({ ...r, url: '' })));
      } catch (e) {
        console.error('Error loading recordings:', e);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      recordings.forEach(r => {
        if (r.url) URL.revokeObjectURL(r.url);
      });
    };
  }, [recordings]);

  const saveRecordingsMetadata = (newRecordings: Recording[]) => {
    const metadata = newRecordings.map(r => ({
      id: r.id,
      type: r.type,
      date: r.date,
      duration: r.duration,
      url: '',
      note: r.note || '',
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
  };

  const startRecording = async (type: 'video' | 'audio') => {
    try {
      const constraints = type === 'video'
        ? { 
            video: { 
              facingMode: facingMode, 
              width: { ideal: 1280 }, 
              height: { ideal: 720 } 
            }, 
            audio: true 
          }
        : { audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (type === 'video' && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const mimeType = type === 'video' 
        ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm')
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4');

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: type === 'video' ? 'video/webm' : 'audio/webm',
        });
        const url = URL.createObjectURL(blob);

        const newRecording: Recording = {
          id: Date.now().toString(),
          type,
          date: new Date().toISOString().split('T')[0],
          duration: recordingTime,
          url,
          blob,
          note: note.trim() || undefined,
        };

        setRecordings(prev => {
          const updated = [newRecording, ...prev];
          saveRecordingsMetadata(updated);
          return updated;
        });
        
        setNote('');
        toast.success(
          language === 'fr'
            ? 'Enregistrement sauvegardé!'
            : 'Recording saved!'
        );
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingType(type);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error(
        language === 'fr'
          ? 'Erreur d\'accès à la caméra/micro. Veuillez autoriser l\'accès.'
          : 'Error accessing camera/microphone. Please allow access.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }

    setIsRecording(false);
    setRecordingType(null);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isRecording && recordingType === 'video') {
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: newFacingMode, 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          },
          audio: true
        });
        streamRef.current = stream;
        
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
        
        toast.success(
          language === 'fr'
            ? `Caméra ${newFacingMode === 'user' ? 'avant' : 'arrière'} activée`
            : `${newFacingMode === 'user' ? 'Front' : 'Back'} camera activated`
        );
      } catch (error) {
        console.error('Error switching camera:', error);
        toast.error(
          language === 'fr'
            ? 'Erreur lors du changement de caméra'
            : 'Error switching camera'
        );
      }
    } else {
      toast.info(
        language === 'fr'
          ? `Caméra ${newFacingMode === 'user' ? 'avant' : 'arrière'} sélectionnée`
          : `${newFacingMode === 'user' ? 'Front' : 'Back'} camera selected`
      );
    }
  };

  const deleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }
    
    setRecordings(prev => {
      const updated = prev.filter(r => r.id !== id);
      saveRecordingsMetadata(updated);
      return updated;
    });
    
    if (playingId === id) {
      setPlayingId(null);
    }
    
    toast.success(
      language === 'fr'
        ? 'Enregistrement supprimé'
        : 'Recording deleted'
    );
  };

  const togglePlayback = (recording: Recording) => {
    if (playingId === recording.id) {
      if (playbackVideoRef.current) {
        playbackVideoRef.current.pause();
      }
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
      setPlayingId(null);
    } else {
      if (!recording.url) {
        toast.error(
          language === 'fr'
            ? 'Fichier non disponible (session expirée)'
            : 'File not available (session expired)'
        );
        return;
      }
      setPlayingId(recording.id);
    }
  };

  const downloadRecording = (recording: Recording) => {
    if (!recording.url) {
      toast.error(
        language === 'fr'
          ? 'Fichier non disponible'
          : 'File not available'
      );
      return;
    }
    
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `${recording.type}-${recording.date}-${recording.id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const updateNote = (id: string, newNote: string) => {
    setRecordings(prev => {
      const updated = prev.map(r => 
        r.id === id ? { ...r, note: newNote.trim() || undefined } : r
      );
      saveRecordingsMetadata(updated);
      return updated;
    });
    setEditingNoteId(null);
    setEditingNoteText('');
    toast.success(language === 'fr' ? 'Note mise à jour' : 'Note updated');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === 'fr' ? 'fr-FR' : 'en-US',
      { weekday: 'short', day: 'numeric', month: 'short' }
    );
  };

  const currentPlayingRecording = recordings.find(r => r.id === playingId);

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {language === 'fr' ? 'Journal Vidéo/Audio' : 'Video/Audio Journal'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' ? 'Enregistrez votre ressenti du jour (max 60s)' : 'Record your daily feelings (max 60s)'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <Video className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Recording Section */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Nouvel Enregistrement' : 'New Recording'}
          </h3>
          
          {/* Camera Switch Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={switchCamera}
            className="gap-2"
          >
            <SwitchCamera className="w-4 h-4" />
            {language === 'fr' 
              ? (facingMode === 'user' ? 'Avant' : 'Arrière')
              : (facingMode === 'user' ? 'Front' : 'Back')}
          </Button>
        </div>

        {/* Video Preview */}
        {recordingType === 'video' && (
          <div className="mb-6 rounded-lg overflow-hidden bg-black aspect-video max-w-md mx-auto relative">
            <video
              ref={videoPreviewRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            {/* Recording indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-loss/80">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs text-white font-medium">REC</span>
            </div>
            
            {/* Camera indicator */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80">
              <SwitchCamera className="w-3 h-3 text-foreground" />
              <span className="text-xs text-foreground font-medium">
                {facingMode === 'user' 
                  ? (language === 'fr' ? 'Avant' : 'Front')
                  : (language === 'fr' ? 'Arrière' : 'Back')}
              </span>
            </div>
          </div>
        )}

        {/* Recording Timer */}
        {isRecording && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-loss/20 border border-loss/30">
              <div className="w-3 h-3 rounded-full bg-loss animate-pulse" />
              <span className="font-display text-xl font-bold text-loss">
                {formatDuration(recordingTime)}
              </span>
              <span className="text-sm text-muted-foreground">/ {formatDuration(MAX_DURATION)}</span>
            </div>
          </div>
        )}

        {/* Recording Progress Bar */}
        {isRecording && (
          <div className="w-full max-w-md mx-auto mb-6">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-loss transition-all duration-1000"
                style={{ width: `${(recordingTime / MAX_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Note Input */}
        <div className="mb-6 max-w-md mx-auto">
          <label className="block text-sm font-medium text-foreground mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            {language === 'fr' ? 'Note libre (optionnelle)' : 'Free note (optional)'}
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={language === 'fr' 
              ? 'Ajoutez une note à cet enregistrement...' 
              : 'Add a note to this recording...'}
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Recording Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {!isRecording ? (
            <>
              <Button
                size="lg"
                className="gap-3 w-full sm:w-auto bg-primary hover:bg-primary/90"
                onClick={() => startRecording('video')}
              >
                <Video className="w-5 h-5" />
                {language === 'fr' ? 'Enregistrer Vidéo' : 'Record Video'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="gap-3 w-full sm:w-auto"
                onClick={() => startRecording('audio')}
              >
                <Mic className="w-5 h-5" />
                {language === 'fr' ? 'Enregistrer Audio' : 'Record Audio'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {recordingType === 'video' && (
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-3"
                  onClick={switchCamera}
                >
                  <SwitchCamera className="w-5 h-5" />
                  {language === 'fr' ? 'Changer Caméra' : 'Switch Camera'}
                </Button>
              )}
              <Button
                variant="destructive"
                size="lg"
                className="gap-3"
                onClick={stopRecording}
              >
                <Square className="w-5 h-5" />
                {language === 'fr' ? 'Arrêter' : 'Stop'}
              </Button>
            </div>
          )}
        </div>

        {/* Audio Waveform Visualization */}
        {isRecording && recordingType === 'audio' && (
          <div className="flex items-center justify-center gap-1 h-16 mt-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Playback Modal */}
      {currentPlayingRecording && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="font-display font-semibold text-foreground mb-4">
            {language === 'fr' ? 'Lecture en cours' : 'Now Playing'}
          </h3>
          
          {currentPlayingRecording.type === 'video' ? (
            <div className="rounded-lg overflow-hidden bg-black aspect-video max-w-lg mx-auto">
              <video
                ref={playbackVideoRef}
                src={currentPlayingRecording.url}
                className="w-full h-full object-contain"
                controls
                autoPlay
                onEnded={() => setPlayingId(null)}
              />
            </div>
          ) : (
            <div className="max-w-lg mx-auto">
              <audio
                ref={playbackAudioRef}
                src={currentPlayingRecording.url}
                className="w-full"
                controls
                autoPlay
                onEnded={() => setPlayingId(null)}
              />
            </div>
          )}
          
          {currentPlayingRecording.note && (
            <div className="mt-4 p-3 rounded-lg bg-secondary/30 max-w-lg mx-auto">
              <p className="text-sm text-muted-foreground">
                <FileText className="w-4 h-4 inline mr-2" />
                {currentPlayingRecording.note}
              </p>
            </div>
          )}
          
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => setPlayingId(null)}
            >
              {language === 'fr' ? 'Fermer' : 'Close'}
            </Button>
          </div>
        </div>
      )}

      {/* Recordings List */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-6">
          {language === 'fr' ? 'Mes Enregistrements' : 'My Recordings'}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({recordings.length})
          </span>
        </h3>

        {recordings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{language === 'fr' ? 'Aucun enregistrement' : 'No recordings yet'}</p>
            <p className="text-sm mt-2">
              {language === 'fr' 
                ? 'Commencez à enregistrer vos réflexions de trading'
                : 'Start recording your trading reflections'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((recording, index) => (
              <div
                key={recording.id}
                className={cn(
                  "p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-fade-in",
                  playingId === recording.id && "ring-2 ring-primary"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                    recording.type === 'video' ? "bg-primary/20" : "bg-profit/20"
                  )}>
                    {recording.type === 'video' ? (
                      <Video className="w-6 h-6 text-primary" />
                    ) : (
                      <Mic className="w-6 h-6 text-profit" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {recording.type === 'video'
                        ? (language === 'fr' ? 'Vidéo' : 'Video')
                        : 'Audio'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(recording.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(recording.duration)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePlayback(recording)}
                      className="hover:bg-primary/20"
                      disabled={!recording.url}
                    >
                      {playingId === recording.id ? (
                        <Pause className="w-5 h-5 text-primary" />
                      ) : (
                        <Play className="w-5 h-5 text-primary" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingNoteId(recording.id);
                        setEditingNoteText(recording.note || '');
                      }}
                      className="hover:bg-secondary text-muted-foreground"
                    >
                      <FileText className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadRecording(recording)}
                      className="hover:bg-profit/20 text-muted-foreground hover:text-profit"
                      disabled={!recording.url}
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecording(recording.id)}
                      className="hover:bg-loss/20 text-muted-foreground hover:text-loss"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Note display */}
                {recording.note && editingNoteId !== recording.id && (
                  <div className="mt-3 p-2 rounded bg-secondary/30 text-sm text-muted-foreground">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {recording.note}
                  </div>
                )}

                {/* Note editing */}
                {editingNoteId === recording.id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      placeholder={language === 'fr' ? 'Ajouter une note...' : 'Add a note...'}
                      className="resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateNote(recording.id, editingNoteText)}
                      >
                        {language === 'fr' ? 'Sauvegarder' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteText('');
                        }}
                      >
                        {language === 'fr' ? 'Annuler' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-4">
          💡 {language === 'fr' ? 'Conseils' : 'Tips'}
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• {language === 'fr' ? 'Caméra arrière par défaut, changez avec le bouton "Changer Caméra"' : 'Back camera by default, switch with the "Switch Camera" button'}</p>
          <p>• {language === 'fr' ? 'Parlez de votre état émotionnel avant et après la session de trading' : 'Talk about your emotional state before and after the trading session'}</p>
          <p>• {language === 'fr' ? 'Ajoutez des notes libres à vos enregistrements' : 'Add free notes to your recordings'}</p>
          <p>• {language === 'fr' ? 'Durée maximale: 60 secondes par enregistrement' : 'Maximum duration: 60 seconds per recording'}</p>
          <p>• {language === 'fr' ? 'Les enregistrements sont stockés localement dans cette session' : 'Recordings are stored locally in this session'}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoJournal;
