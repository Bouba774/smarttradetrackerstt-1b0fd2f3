import React, { useState } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeedback } from '@/hooks/useFeedback';
import { useTradeFocus } from '@/hooks/useTradeFocus';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useSettings, AppSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
  RotateCcw,
  Coins,
  Focus,
  Target,
  Shield,
  Check,
  ChevronsUpDown,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CURRENCIES, getCurrencyLabel } from '@/data/currencies';
import { SecuritySettings } from '@/components/SecuritySettings';

const Settings: React.FC = () => {
  const { language, setLanguage, t, languages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { triggerFeedback } = useFeedback();
  const { user } = useAuth();
  const tradeFocus = useTradeFocus();
  const { settings, updateSetting: updateSettingHook, resetSettings } = useSettings();
  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem('smart-trade-tracker-primary-color') || 'blue';
  });
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');

  const handleUpdateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettingHook(key, value);
    triggerFeedback('click');
    
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

  const handleReset = async () => {
    await resetSettings();
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

  const selectedLang = languages.find(l => l.code === language);
  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(languageSearch.toLowerCase()) ||
    lang.code.toLowerCase().includes(languageSearch.toLowerCase())
  );

  return (
    <div className="py-4 max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Accordion Settings */}
      <Accordion type="multiple" className="space-y-2" defaultValue={['display']}>
        
        {/* Display Settings */}
        <AccordionItem value="display" className="glass-card border-primary/20 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-foreground">
                {language === 'fr' ? 'Affichage' : 'Display'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-6">
            {/* Theme Mode */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Moon className="w-4 h-4" />
                {t('displayMode')}
              </Label>
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
                        "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                        theme === themeItem.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{themeItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Color */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Palette className="w-4 h-4" />
                {t('primaryColor')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorChange(color.id)}
                    className={cn(
                      "w-10 h-10 rounded-lg transition-all",
                      color.class,
                      primaryColor === color.id
                        ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                        : "opacity-70 hover:opacity-100"
                    )}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Type className="w-4 h-4" />
                {t('fontSize')}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {fontSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleUpdateSetting('fontSize', size.id as AppSettings['fontSize'])}
                    className={cn(
                      "p-3 rounded-lg border transition-all text-center",
                      settings.fontSize === size.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    <span 
                      className="font-medium text-sm"
                      style={{ 
                        fontSize: size.id === 'small' ? '11px' : size.id === 'large' ? '15px' : '13px' 
                      }}
                    >
                      {size.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Regional Settings */}
        <AccordionItem value="regional" className="glass-card border-primary/20 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Languages className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-foreground">
                {language === 'fr' ? 'Région' : 'Region'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-6">
            {/* Currency */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Coins className="w-4 h-4" />
                {language === 'fr' ? 'Devise Principale' : 'Main Currency'}
              </Label>
              <Select 
                value={settings.currency} 
                onValueChange={(value) => handleUpdateSetting('currency', value)}
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
              <p className="text-xs text-muted-foreground">
                {language === 'fr' 
                  ? 'Les valeurs seront converties automatiquement' 
                  : 'Values will be automatically converted'}
              </p>
            </div>

            {/* Language */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Languages className="w-4 h-4" />
                {t('language')}
              </Label>
              <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={languageOpen}
                    className="w-full justify-between h-11 bg-secondary/30 border-border hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{selectedLang?.flag}</span>
                      <span className="font-medium">{selectedLang?.nativeName}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50" align="start">
                  <Command className="bg-popover">
                    <CommandInput 
                      placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'} 
                      value={languageSearch}
                      onValueChange={setLanguageSearch}
                      className="h-10"
                    />
                    <CommandList className="max-h-64">
                      <CommandEmpty>
                        {language === 'fr' ? 'Aucune langue trouvée.' : 'No language found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredLanguages.map((lang) => (
                          <CommandItem
                            key={lang.code}
                            value={`${lang.name} ${lang.nativeName} ${lang.code}`}
                            onSelect={() => {
                              handleLanguageChange(lang.code);
                              setLanguageOpen(false);
                              setLanguageSearch('');
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                language === lang.code ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="text-lg mr-2">{lang.flag}</span>
                            <span className="font-medium">{lang.nativeName}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Options */}
        <AccordionItem value="options" className="glass-card border-primary/20 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-foreground">
                {language === 'fr' ? 'Options' : 'Options'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            {/* Vibration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="w-4 h-4 text-primary" />
                <Label htmlFor="vibration" className="text-foreground text-sm">
                  {t('vibration')}
                </Label>
              </div>
              <Switch
                id="vibration"
                checked={settings.vibration}
                onCheckedChange={(checked) => handleUpdateSetting('vibration', checked)}
              />
            </div>

            {/* Sounds */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-primary" />
                <Label htmlFor="sounds" className="text-foreground text-sm">
                  {t('sounds')}
                </Label>
              </div>
              <Switch
                id="sounds"
                checked={settings.sounds}
                onCheckedChange={(checked) => handleUpdateSetting('sounds', checked)}
              />
            </div>

            {/* Animations */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label htmlFor="animations" className="text-foreground text-sm">
                  {t('animations')}
                </Label>
              </div>
              <Switch
                id="animations"
                checked={settings.animations}
                onCheckedChange={(checked) => handleUpdateSetting('animations', checked)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Focus Mode */}
        <AccordionItem value="focus" className="glass-card border-primary/20 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Focus className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-foreground">
                {language === 'fr' ? 'Mode Focus' : 'Focus Mode'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground text-sm">
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

            {/* Trading Plan */}
            <div className="space-y-2">
              <Label className="text-sm">{language === 'fr' ? 'Plan de trading' : 'Trading Plan'}</Label>
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
            
            {/* Daily Goal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
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
            
            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{language === 'fr' ? 'Max trades/jour' : 'Max trades/day'}</Label>
                <Input
                  type="number"
                  value={tradeFocus.maxTrades}
                  onChange={(e) => tradeFocus.setMaxTrades(Number(e.target.value))}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{language === 'fr' ? 'Perte max ($)' : 'Max loss ($)'}</Label>
                <Input
                  type="number"
                  value={tradeFocus.maxLoss}
                  onChange={(e) => tradeFocus.setMaxLoss(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Security */}
        <AccordionItem value="security" className="glass-card border-primary/20 rounded-lg overflow-hidden">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <span className="font-display font-semibold text-foreground">
                {language === 'fr' ? 'Sécurité' : 'Security'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <SecuritySettings />
            
            {/* Link to Privacy Center */}
            <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground text-sm">
                    {language === 'fr' ? 'Centre de confidentialité' : 'Privacy Center'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'fr' 
                      ? 'Gérez vos données et consentements' 
                      : 'Manage your data and consents'}
                  </p>
                </div>
                <a
                  href="/privacy-center"
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm"
                >
                  <Shield className="w-3 h-3" />
                  {language === 'fr' ? 'Accéder' : 'Access'}
                </a>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Reset Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          className="w-full gap-3 h-11"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4" />
          {t('resetDisplay')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
