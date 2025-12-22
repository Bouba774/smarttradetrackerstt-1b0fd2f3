import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSessionSettings, DEFAULT_SESSION_HOURS, SessionHours } from '@/hooks/useSessionSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, RotateCcw, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SessionSettingsCardProps {
  onUpdate?: () => void;
}

const SessionSettingsCard: React.FC<SessionSettingsCardProps> = ({ onUpdate }) => {
  const { language } = useLanguage();
  const { sessionHours, saveSessionHours, resetSessionHours } = useSessionSettings();
  const [open, setOpen] = useState(false);
  const [localHours, setLocalHours] = useState<SessionHours>(sessionHours);

  const sessions = [
    { 
      key: 'asia' as const, 
      label: language === 'fr' ? 'Asie' : 'Asia',
      color: 'bg-yellow-500'
    },
    { 
      key: 'london' as const, 
      label: language === 'fr' ? 'Londres' : 'London',
      color: 'bg-blue-500'
    },
    { 
      key: 'newYork' as const, 
      label: 'New York',
      color: 'bg-green-500'
    },
  ];

  const handleSave = () => {
    // Validate hours
    for (const session of sessions) {
      const hours = localHours[session.key];
      if (hours.start < 0 || hours.start > 23 || hours.end < 0 || hours.end > 23) {
        toast.error(language === 'fr' 
          ? 'Les heures doivent être entre 0 et 23' 
          : 'Hours must be between 0 and 23');
        return;
      }
    }

    saveSessionHours(localHours);
    setOpen(false);
    toast.success(language === 'fr' 
      ? 'Horaires des sessions mis à jour' 
      : 'Session hours updated');
    onUpdate?.();
  };

  const handleReset = () => {
    setLocalHours(DEFAULT_SESSION_HOURS);
    resetSessionHours();
    toast.success(language === 'fr' 
      ? 'Horaires réinitialisés par défaut' 
      : 'Hours reset to defaults');
    onUpdate?.();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalHours(sessionHours);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {language === 'fr' ? 'Horaires des Sessions' : 'Session Hours'}
          </DialogTitle>
          <DialogDescription>
            {language === 'fr' 
              ? 'Personnalisez les plages horaires des sessions de marché (UTC)' 
              : 'Customize market session time ranges (UTC)'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {sessions.map((session) => (
            <div key={session.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${session.color}`} />
                <Label className="font-medium">{session.label}</Label>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'fr' ? 'Début' : 'Start'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={localHours[session.key].start}
                    onChange={(e) => setLocalHours({
                      ...localHours,
                      [session.key]: {
                        ...localHours[session.key],
                        start: parseInt(e.target.value) || 0,
                      },
                    })}
                    className="mt-1"
                  />
                </div>
                <span className="text-muted-foreground pt-6">-</span>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'fr' ? 'Fin' : 'End'}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={localHours[session.key].end}
                    onChange={(e) => setLocalHours({
                      ...localHours,
                      [session.key]: {
                        ...localHours[session.key],
                        end: parseInt(e.target.value) || 0,
                      },
                    })}
                    className="mt-1"
                  />
                </div>
                <span className="text-xs text-muted-foreground pt-6">UTC</span>
              </div>
            </div>
          ))}

          <div className="p-3 rounded-lg bg-secondary/30 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">
              {language === 'fr' ? 'Chevauchement' : 'Overlap'}
            </p>
            {language === 'fr' 
              ? 'Les périodes où deux sessions se chevauchent seront automatiquement détectées.' 
              : 'Periods where two sessions overlap will be automatically detected.'}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            {language === 'fr' ? 'Défaut' : 'Reset'}
          </Button>
          <Button onClick={handleSave}>
            {language === 'fr' ? 'Enregistrer' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionSettingsCard;
