import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useSessionSettings, 
  DEFAULT_SESSION_SETTINGS,
  SessionMode,
  ClassicSessions,
  KillzoneSessions,
  SessionRange 
} from '@/hooks/useSessionSettings';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Clock, RotateCcw, Settings2, Zap, TrendingUp } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SessionSettingsCardProps {
  onUpdate?: () => void;
}

const SessionSettingsCard: React.FC<SessionSettingsCardProps> = ({ onUpdate }) => {
  const { language } = useLanguage();
  const { settings, saveSettings, resetSettings } = useSessionSettings();
  const [open, setOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  const classicSessions: { key: keyof ClassicSessions; label: string; color: string }[] = [
    { key: 'sydney', label: 'Sydney', color: 'bg-purple-500' },
    { key: 'tokyo', label: 'Tokyo', color: 'bg-yellow-500' },
    { key: 'london', label: language === 'fr' ? 'Londres' : 'London', color: 'bg-blue-500' },
    { key: 'newYork', label: 'New York', color: 'bg-green-500' },
  ];

  const killzoneSessions: { key: keyof KillzoneSessions; label: string; color: string }[] = [
    { key: 'asia', label: language === 'fr' ? 'Asie KZ' : 'Asia KZ', color: 'bg-yellow-500' },
    { key: 'london', label: language === 'fr' ? 'Londres KZ' : 'London KZ', color: 'bg-blue-500' },
    { key: 'newYork', label: 'NY KZ', color: 'bg-green-500' },
    { key: 'londonClose', label: 'London Close', color: 'bg-orange-500' },
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

  const handleSave = () => {
    saveSettings(localSettings);
    setOpen(false);
    toast.success(language === 'fr' 
      ? 'Paramètres de session mis à jour' 
      : 'Session settings updated');
    onUpdate?.();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_SESSION_SETTINGS);
    resetSettings();
    toast.success(language === 'fr' 
      ? 'Paramètres réinitialisés' 
      : 'Settings reset to defaults');
    onUpdate?.();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalSettings(settings);
    }
    setOpen(newOpen);
  };

  const updateClassicRange = (session: keyof ClassicSessions, field: 'start' | 'end', value: number) => {
    setLocalSettings({
      ...localSettings,
      classic: {
        ...localSettings.classic,
        [session]: {
          ...localSettings.classic[session],
          [field]: value,
        },
      },
    });
  };

  const updateKillzoneRange = (session: keyof KillzoneSessions, field: 'start' | 'end', value: number) => {
    setLocalSettings({
      ...localSettings,
      killzones: {
        ...localSettings.killzones,
        [session]: {
          ...localSettings.killzones[session],
          [field]: value,
        },
      },
    });
  };

  const renderSessionRow = (
    session: { key: string; label: string; color: string },
    range: SessionRange,
    onChange: (field: 'start' | 'end', value: number) => void
  ) => (
    <div key={session.key} className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${session.color}`} />
        <Label className="font-medium">{session.label}</Label>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1 block">
            {language === 'fr' ? 'Début' : 'Start'}
          </Label>
          <Select
            value={range.start.toString()}
            onValueChange={(value) => onChange('start', parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {formatHour(hour)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground pt-5">→</span>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1 block">
            {language === 'fr' ? 'Fin' : 'End'}
          </Label>
          <Select
            value={range.end.toString()}
            onValueChange={(value) => onChange('end', parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {hours.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {formatHour(hour)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-xs text-muted-foreground pt-5 font-medium">NY</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {language === 'fr' ? 'Sessions de Trading' : 'Trading Sessions'}
          </DialogTitle>
          <DialogDescription>
            {language === 'fr' 
              ? 'Horaires basés sur New York Time (EST/EDT) comme référence' 
              : 'Times are based on New York Time (EST/EDT) as reference'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={localSettings.mode} 
          onValueChange={(v) => setLocalSettings({ ...localSettings, mode: v as SessionMode })}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="classic" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              {language === 'fr' ? 'Classique' : 'Classic'}
            </TabsTrigger>
            <TabsTrigger value="killzones" className="gap-2">
              <Zap className="w-4 h-4" />
              ICT Killzones
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="classic" className="space-y-4 mt-4">
            <div className="p-3 rounded-lg bg-secondary/30 text-sm text-muted-foreground mb-4">
              {language === 'fr' 
                ? 'Sessions de marché classiques avec détection automatique des chevauchements.' 
                : 'Classic market sessions with automatic overlap detection.'}
            </div>
            {classicSessions.map((session) => 
              renderSessionRow(
                session,
                localSettings.classic[session.key],
                (field, value) => updateClassicRange(session.key, field, value)
              )
            )}
          </TabsContent>
          
          <TabsContent value="killzones" className="space-y-4 mt-4">
            <div className="p-3 rounded-lg bg-primary/10 text-sm mb-4">
              <p className="font-medium text-primary mb-1">ICT Killzones</p>
              {language === 'fr' 
                ? 'Plages horaires optimales pour le trading institutionnel selon la méthodologie ICT.' 
                : 'Optimal trading windows based on ICT (Inner Circle Trader) methodology.'}
            </div>
            {killzoneSessions.map((session) => 
              renderSessionRow(
                session,
                localSettings.killzones[session.key],
                (field, value) => updateKillzoneRange(session.key, field, value)
              )
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 mt-6">
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
