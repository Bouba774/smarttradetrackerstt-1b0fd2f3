import React, { useState, useEffect } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeedback } from '@/hooks/useFeedback';
import { useTradeFocus } from '@/hooks/useTradeFocus';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Palette,
  Languages,
  Type,
  Vibrate,
  Volume2,
  Sparkles,
  Image,
  RotateCcw,
  Coins,
  Focus,
  Target,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CURRENCIES, getCurrencyLabel } from '@/data/currencies';
import { SecuritySettings } from '@/components/SecuritySettings';

const SETTINGS_STORAGE_KEY = 'smart-trade-tracker-settings';

interface AppSettings {
  vibration: boolean;
  sounds: boolean;
  animations: boolean;
  fontSize: 'small' | 'standard' | 'large';
  background: 'default' | 'gradient' | 'dark' | 'light';
  currency: string;
}

const defaultSettings: AppSettings = {
  vibration: true,
  sounds: true,
  animations: true,
  fontSize: 'standard',
  background: 'default',
  currency: 'USD',
};

const Settings: React.FC = () => {
  const { language, setLanguage, t, languages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { triggerFeedback } = useFeedback();
  const { user } = useAuth();
  const tradeFocus = useTradeFocus();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [primaryColor, setPrimaryColor] = useState('blue');

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
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
    triggerFeedback('click');
    
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

    toast.success(t('settingUpdated'));
  };

  const handleColorChange = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem('smart-trade-tracker-primary-color', color);
    triggerFeedback('click');
    
    // Apply color to CSS variables
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
    
    toast.success(t('colorUpdated'));
  };

  const handleReset = () => {
    saveSettings(defaultSettings);
    setPrimaryColor('blue');
    localStorage.removeItem('smart-trade-tracker-primary-color');
    document.documentElement.style.fontSize = '16px';
    document.documentElement.style.removeProperty('--primary');
    setTheme('dark');
    triggerFeedback('success');
    
    toast.success(t('interfaceReset'));
  };

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    triggerFeedback('click');
    
    // Sync to database if user is logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            language: lang,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) {
          console.error('Error syncing language:', error);
        }
      } catch (e) {
        console.error('Error syncing language:', e);
      }
    }
    
    toast.success(t('settingUpdated'));
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
    { id: 'light' as const, label: t('light'), icon: Sun },
    { id: 'dark' as const, label: t('dark'), icon: Moon },
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

      {/* Currency Selection */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Devise Principale' : 'Main Currency'}
          </h3>
        </div>
        <Select 
          value={settings.currency} 
          onValueChange={(value) => updateSetting('currency', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={language === 'fr' ? 'Sélectionner une devise' : 'Select currency'} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-80">
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency.code} value={currency.code}>
                {getCurrencyLabel(currency, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          {language === 'fr' 
            ? 'Toutes les valeurs seront converties automatiquement avec les taux de change actuels' 
            : 'All values will be automatically converted using current exchange rates'}
        </p>
      </div>

      {/* Theme Mode */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Moon className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('displayMode')}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {themes.map((themeItem) => {
            const Icon = themeItem.icon;
            return (
              <button
                key={themeItem.id}
                onClick={() => {
                  setTheme(themeItem.id);
                  triggerFeedback('click');
                }}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg border transition-all",
                  theme === themeItem.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{themeItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Color */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('primaryColor')}
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
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Languages className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('language')}
          </h3>
        </div>
        <Select 
          value={language} 
          onValueChange={(value) => handleLanguageChange(value as Language)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span className="text-lg">{languages.find(l => l.code === language)?.flag}</span>
                <span>{languages.find(l => l.code === language)?.nativeName}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-80 z-50">
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.nativeName}</span>
                  <span className="text-muted-foreground text-xs ml-1">({lang.name})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          {language === 'fr' 
            ? 'Sélectionnez votre langue préférée pour l\'interface' 
            : 'Select your preferred language for the interface'}
        </p>
      </div>

      {/* Font Size */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Type className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('fontSize')}
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
      <div className="glass-card p-6 animate-fade-in space-y-6" style={{ animationDelay: '250ms' }}>
        <h3 className="font-display font-semibold text-foreground">
          {language === 'fr' ? 'Options' : 'Options'}
        </h3>

        {/* Vibration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate className="w-5 h-5 text-primary" />
            <Label htmlFor="vibration" className="text-foreground">
              {t('vibration')}
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
              {t('sounds')}
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
              {t('animations')}
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
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Image className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('background')}
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

      {/* Focus Mode Settings */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '350ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Focus className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Mode Focus' : 'Focus Mode'}
          </h3>
        </div>
        
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Label className="text-foreground">
              {language === 'fr' ? 'Activer le mode focus' : 'Enable focus mode'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === 'fr' 
                ? 'Cache les statistiques et montre uniquement votre plan' 
                : 'Hides statistics and shows only your plan'}
            </p>
          </div>
          <Switch
            checked={tradeFocus.isEnabled}
            onCheckedChange={() => {
              tradeFocus.toggle();
              triggerFeedback('click');
              toast.success(tradeFocus.isEnabled 
                ? (language === 'fr' ? 'Mode Focus désactivé' : 'Focus Mode disabled')
                : (language === 'fr' ? 'Mode Focus activé' : 'Focus Mode enabled'));
            }}
          />
        </div>

        {/* Focus Mode Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{language === 'fr' ? 'Plan de trading' : 'Trading Plan'}</Label>
            <Textarea
              value={tradeFocus.tradingPlan}
              onChange={(e) => tradeFocus.setTradingPlan(e.target.value)}
              placeholder={language === 'fr' 
                ? 'Décrivez votre plan de trading...' 
                : 'Describe your trading plan...'}
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              {language === 'fr' ? 'Objectif du jour' : 'Daily Goal'}
            </Label>
            <Input
              value={tradeFocus.dailyGoal}
              onChange={(e) => tradeFocus.setDailyGoal(e.target.value)}
              placeholder={language === 'fr' 
                ? 'Ex: 2 trades gagnants, +50$' 
                : 'Ex: 2 winning trades, +$50'}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Max trades/jour' : 'Max trades/day'}</Label>
              <Input
                type="number"
                value={tradeFocus.maxTrades}
                onChange={(e) => tradeFocus.setMaxTrades(Number(e.target.value))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Perte max ($)' : 'Max loss ($)'}</Label>
              <Input
                type="number"
                value={tradeFocus.maxLoss}
                onChange={(e) => tradeFocus.setMaxLoss(Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">
            {language === 'fr' ? 'Sécurité Renforcée' : 'Enhanced Security'}
          </h2>
        </div>
        <SecuritySettings />
      </div>

      {/* Reset Button */}
      <div className="glass-card p-6 animate-fade-in mt-6" style={{ animationDelay: '400ms' }}>
        <Button
          variant="outline"
          className="w-full gap-3 h-12"
          onClick={handleReset}
        >
          <RotateCcw className="w-5 h-5" />
          {t('resetDisplay')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;