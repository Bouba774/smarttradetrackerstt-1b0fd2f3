import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Zap,
  Globe,
  Vibrate,
  Volume2,
  Type,
  Palette,
  Image,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const PRIMARY_COLORS = [
  { value: 'blue', label: 'Bleu', hsl: '217 91% 60%' },
  { value: 'green', label: 'Vert', hsl: '142 76% 36%' },
  { value: 'red', label: 'Rouge', hsl: '0 84% 60%' },
  { value: 'purple', label: 'Violet', hsl: '270 76% 60%' },
  { value: 'orange', label: 'Orange', hsl: '25 95% 53%' },
  { value: 'cyan', label: 'Cyan', hsl: '188 94% 43%' },
];

const BACKGROUNDS = [
  { value: 'default', label: 'Par défaut' },
  { value: 'gradient-dark', label: 'Dégradé sombre' },
  { value: 'gradient-blue', label: 'Dégradé bleu' },
  { value: 'solid-dark', label: 'Noir uni' },
  { value: 'solid-gray', label: 'Gris uni' },
];

const FONT_SIZES = [
  { value: 'small', label: 'Petite', scale: '0.875' },
  { value: 'standard', label: 'Standard', scale: '1' },
  { value: 'large', label: 'Grande', scale: '1.125' },
];

interface AppSettings {
  displayMode: 'light' | 'dark' | 'neon';
  primaryColor: string;
  fontSize: string;
  vibration: boolean;
  sounds: boolean;
  background: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  displayMode: 'dark',
  primaryColor: 'blue',
  fontSize: 'standard',
  vibration: true,
  sounds: true,
  background: 'default',
};

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme, setTheme } = useTheme();

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    
    // Apply font size
    const fontScale = FONT_SIZES.find(f => f.value === settings.fontSize)?.scale || '1';
    document.documentElement.style.fontSize = `${parseFloat(fontScale) * 16}px`;
    
    // Apply primary color
    const color = PRIMARY_COLORS.find(c => c.value === settings.primaryColor);
    if (color) {
      document.documentElement.style.setProperty('--primary', color.hsl);
    }
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (settings.vibration && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    toast.success(language === 'fr' ? 'Paramètre mis à jour' : 'Setting updated');
  };

  const handleDisplayModeChange = (mode: 'light' | 'dark' | 'neon') => {
    updateSetting('displayMode', mode);
    if (mode === 'light') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    document.documentElement.style.fontSize = '16px';
    document.documentElement.style.removeProperty('--primary');
    toast.success(language === 'fr' ? 'Paramètres réinitialisés' : 'Settings reset');
  };

  return (
    <div className="py-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('settings')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' ? 'Personnalisez votre expérience' : 'Customize your experience'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <SettingsIcon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Display Mode */}
      <div className="glass-card p-6 space-y-4 animate-fade-in">
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          {language === 'fr' ? 'Mode d\'affichage' : 'Display Mode'}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <Button
            variant={settings.displayMode === 'light' ? 'default' : 'outline'}
            className="flex-col h-auto py-4 gap-2"
            onClick={() => handleDisplayModeChange('light')}
          >
            <Sun className="w-6 h-6" />
            <span className="text-xs">{language === 'fr' ? 'Clair' : 'Light'}</span>
          </Button>
          <Button
            variant={settings.displayMode === 'dark' ? 'default' : 'outline'}
            className="flex-col h-auto py-4 gap-2"
            onClick={() => handleDisplayModeChange('dark')}
          >
            <Moon className="w-6 h-6" />
            <span className="text-xs">{language === 'fr' ? 'Sombre' : 'Dark'}</span>
          </Button>
          <Button
            variant={settings.displayMode === 'neon' ? 'default' : 'outline'}
            className="flex-col h-auto py-4 gap-2"
            onClick={() => handleDisplayModeChange('neon')}
          >
            <Zap className="w-6 h-6" />
            <span className="text-xs">High-Tech Neon</span>
          </Button>
        </div>
      </div>

      {/* Primary Color */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          {language === 'fr' ? 'Couleur principale' : 'Primary Color'}
        </h3>

        <div className="flex flex-wrap gap-3">
          {PRIMARY_COLORS.map(color => (
            <button
              key={color.value}
              onClick={() => updateSetting('primaryColor', color.value)}
              className={`w-12 h-12 rounded-lg transition-transform hover:scale-110 ${
                settings.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : ''
              }`}
              style={{ backgroundColor: `hsl(${color.hsl})` }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-foreground">{t('language')}</Label>
              <p className="text-xs text-muted-foreground">
                {language === 'fr' ? 'Français' : 'English'}
              </p>
            </div>
          </div>
          <Select value={language} onValueChange={(v: 'fr' | 'en') => setLanguage(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Font Size */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-foreground">
                {language === 'fr' ? 'Taille de police' : 'Font Size'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {FONT_SIZES.find(f => f.value === settings.fontSize)?.label}
              </p>
            </div>
          </div>
          <Select value={settings.fontSize} onValueChange={(v) => updateSetting('fontSize', v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {FONT_SIZES.map(size => (
                <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vibration & Sounds */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-foreground">{t('vibration')}</Label>
              <p className="text-xs text-muted-foreground">
                {language === 'fr' ? 'Vibration au toucher' : 'Vibration on touch'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.vibration}
            onCheckedChange={(v) => updateSetting('vibration', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-foreground">
                {language === 'fr' ? 'Sons' : 'Sounds'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === 'fr' ? 'Effets sonores' : 'Sound effects'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.sounds}
            onCheckedChange={(v) => updateSetting('sounds', v)}
          />
        </div>
      </div>

      {/* Background */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-foreground">
                {language === 'fr' ? 'Fond d\'écran' : 'Background'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {BACKGROUNDS.find(b => b.value === settings.background)?.label}
              </p>
            </div>
          </div>
          <Select value={settings.background} onValueChange={(v) => updateSetting('background', v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {BACKGROUNDS.map(bg => (
                <SelectItem key={bg.value} value={bg.value}>{bg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reset */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={resetSettings}
      >
        <RotateCcw className="w-4 h-4" />
        {language === 'fr' ? 'Réinitialiser l\'affichage' : 'Reset display'}
      </Button>

      {/* Version Info */}
      <div className="text-center text-xs text-muted-foreground py-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <p>Smart Trade Tracker v1.0.0</p>
        <p className="mt-1">© 2024 ALPHA FX</p>
      </div>
    </div>
  );
};

export default Settings;
