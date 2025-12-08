import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Zap,
  Palette,
  Languages,
  Type,
  Vibrate,
  Volume2,
  Sparkles,
  Image,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SETTINGS_STORAGE_KEY = 'smart-trade-tracker-settings';

interface AppSettings {
  vibration: boolean;
  sounds: boolean;
  animations: boolean;
  fontSize: 'small' | 'standard' | 'large';
  background: 'default' | 'gradient' | 'dark' | 'light';
}

const defaultSettings: AppSettings = {
  vibration: true,
  sounds: true,
  animations: true,
  fontSize: 'standard',
  background: 'default',
};

const Settings: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [primaryColor, setPrimaryColor] = useState('blue');

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
    
    const savedColor = localStorage.getItem('smart-trade-tracker-primary-color');
    if (savedColor) {
      setPrimaryColor(savedColor);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    
    // Apply font size
    if (key === 'fontSize') {
      const root = document.documentElement;
      switch (value) {
        case 'small':
          root.style.fontSize = '14px';
          break;
        case 'standard':
          root.style.fontSize = '16px';
          break;
        case 'large':
          root.style.fontSize = '18px';
          break;
      }
    }

    toast.success(language === 'fr' ? 'Paramètre mis à jour' : 'Setting updated');
  };

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem('smart-trade-tracker-primary-color', color);
    
    // Apply color to CSS variables (you can extend this)
    const root = document.documentElement;
    const colorMap: Record<string, string> = {
      blue: '217 91% 60%',
      green: '142 71% 45%',
      red: '0 84% 60%',
      purple: '263 70% 50%',
      orange: '25 95% 53%',
      cyan: '189 94% 43%',
    };
    
    if (colorMap[color]) {
      root.style.setProperty('--primary', colorMap[color]);
    }
    
    toast.success(language === 'fr' ? 'Couleur mise à jour' : 'Color updated');
  };

  const handleReset = () => {
    saveSettings(defaultSettings);
    setPrimaryColor('blue');
    localStorage.removeItem('smart-trade-tracker-primary-color');
    document.documentElement.style.fontSize = '16px';
    document.documentElement.style.removeProperty('--primary');
    setTheme('dark');
    
    toast.success(
      language === 'fr' 
        ? 'Interface réinitialisée' 
        : 'Interface reset'
    );
  };

  const colors = [
    { id: 'blue', label: language === 'fr' ? 'Bleu' : 'Blue', class: 'bg-blue-500' },
    { id: 'green', label: language === 'fr' ? 'Vert' : 'Green', class: 'bg-green-500' },
    { id: 'red', label: language === 'fr' ? 'Rouge' : 'Red', class: 'bg-red-500' },
    { id: 'purple', label: language === 'fr' ? 'Violet' : 'Purple', class: 'bg-purple-500' },
    { id: 'orange', label: language === 'fr' ? 'Orange' : 'Orange', class: 'bg-orange-500' },
    { id: 'cyan', label: language === 'fr' ? 'Cyan' : 'Cyan', class: 'bg-cyan-500' },
  ];

  const themes = [
    { id: 'light' as const, label: language === 'fr' ? 'Clair' : 'Light', icon: Sun },
    { id: 'dark' as const, label: language === 'fr' ? 'Sombre' : 'Dark', icon: Moon },
  ];

  const fontSizes = [
    { id: 'small', label: language === 'fr' ? 'Petite' : 'Small' },
    { id: 'standard', label: 'Standard' },
    { id: 'large', label: language === 'fr' ? 'Grande' : 'Large' },
  ];

  const backgrounds = [
    { id: 'default', label: language === 'fr' ? 'Par défaut' : 'Default' },
    { id: 'gradient', label: 'Gradient' },
    { id: 'dark', label: language === 'fr' ? 'Sombre uni' : 'Solid dark' },
    { id: 'light', label: language === 'fr' ? 'Clair uni' : 'Solid light' },
  ];

  return (
    <div className="py-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {language === 'fr' ? 'Paramètres' : 'Settings'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' ? 'Personnalisez votre expérience' : 'Customize your experience'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <SettingsIcon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Theme Mode */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Moon className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Mode d\'affichage' : 'Display Mode'}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                  theme === t.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Color */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Couleur principale' : 'Primary Color'}
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => handleColorChange(color.id)}
              className={cn(
                "w-12 h-12 rounded-lg transition-all",
                color.class,
                primaryColor === color.id
                  ? "ring-4 ring-offset-2 ring-offset-background ring-primary scale-110"
                  : "opacity-70 hover:opacity-100"
              )}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Languages className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Langue' : 'Language'}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setLanguage('fr')}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-lg border transition-all",
              language === 'fr'
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
            )}
          >
            <span className="text-xl">🇫🇷</span>
            <span className="font-medium">Français</span>
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "flex items-center justify-center gap-2 p-4 rounded-lg border transition-all",
              language === 'en'
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
            )}
          >
            <span className="text-xl">🇬🇧</span>
            <span className="font-medium">English</span>
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Type className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Taille de police' : 'Font Size'}
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {fontSizes.map((size) => (
            <button
              key={size.id}
              onClick={() => updateSetting('fontSize', size.id as AppSettings['fontSize'])}
              className={cn(
                "p-4 rounded-lg border transition-all text-center",
                settings.fontSize === size.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
              )}
            >
              <span 
                className="font-medium"
                style={{ 
                  fontSize: size.id === 'small' ? '12px' : size.id === 'large' ? '18px' : '14px' 
                }}
              >
                {size.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="glass-card p-6 animate-fade-in space-y-6" style={{ animationDelay: '200ms' }}>
        <h3 className="font-display font-semibold text-foreground">
          {language === 'fr' ? 'Options' : 'Options'}
        </h3>

        {/* Vibration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate className="w-5 h-5 text-primary" />
            <Label htmlFor="vibration" className="text-foreground">
              {language === 'fr' ? 'Vibration' : 'Vibration'}
            </Label>
          </div>
          <Switch
            id="vibration"
            checked={settings.vibration}
            onCheckedChange={(checked) => updateSetting('vibration', checked)}
          />
        </div>

        {/* Sounds */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-primary" />
            <Label htmlFor="sounds" className="text-foreground">
              {language === 'fr' ? 'Sons' : 'Sounds'}
            </Label>
          </div>
          <Switch
            id="sounds"
            checked={settings.sounds}
            onCheckedChange={(checked) => updateSetting('sounds', checked)}
          />
        </div>

        {/* Animations */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <Label htmlFor="animations" className="text-foreground">
              Animations
            </Label>
          </div>
          <Switch
            id="animations"
            checked={settings.animations}
            onCheckedChange={(checked) => updateSetting('animations', checked)}
          />
        </div>
      </div>

      {/* Background Selector */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Fond d\'écran' : 'Background'}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {backgrounds.map((bg) => (
            <button
              key={bg.id}
              onClick={() => updateSetting('background', bg.id as AppSettings['background'])}
              className={cn(
                "p-4 rounded-lg border transition-all text-center",
                settings.background === bg.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
              )}
            >
              <span className="font-medium text-sm">{bg.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <Button
          variant="outline"
          className="w-full gap-3 h-12"
          onClick={handleReset}
        >
          <RotateCcw className="w-5 h-5" />
          {language === 'fr' ? 'Réinitialiser l\'affichage' : 'Reset display'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
