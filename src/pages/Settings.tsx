import React, { useState } from 'react';
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
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Vibrate,
  Bell,
  Download,
  LogOut,
  Trash2,
  User,
  BookOpen,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState({
    vibration: true,
    journalReminder: true,
    weeklyReport: true,
    overtradingAlert: true,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Paramètre mis à jour');
  };

  const handleExport = (format: 'json' | 'csv') => {
    toast.success(`Export ${format.toUpperCase()} en cours...`);
  };

  const handleLogout = () => {
    toast.success('Déconnexion...');
  };

  const handleDeleteAccount = () => {
    toast.error('Cette action est irréversible!');
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
            Personnalisez votre expérience
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <SettingsIcon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card p-6 space-y-6 animate-fade-in">
        <h3 className="font-display font-semibold text-foreground">Apparence</h3>

        {/* Theme */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-primary" />
            )}
            <div>
              <Label className="text-foreground">{t('theme')}</Label>
              <p className="text-xs text-muted-foreground">
                {theme === 'dark' ? t('dark') : t('light')}
              </p>
            </div>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </div>

        {/* Language */}
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
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vibration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate className="w-5 h-5 text-primary" />
            <div>
              <Label className="text-foreground">{t('vibration')}</Label>
              <p className="text-xs text-muted-foreground">
                Vibration au toucher
              </p>
            </div>
          </div>
          <Switch
            checked={settings.vibration}
            onCheckedChange={(v) => updateSetting('vibration', v)}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-6 space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">{t('notifications')}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-foreground">{t('journalReminder')}</Label>
                <p className="text-xs text-muted-foreground">Rappel quotidien à 20h</p>
              </div>
            </div>
            <Switch
              checked={settings.journalReminder}
              onCheckedChange={(v) => updateSetting('journalReminder', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-foreground">{t('weeklyReport')}</Label>
                <p className="text-xs text-muted-foreground">Bilan chaque dimanche</p>
              </div>
            </div>
            <Switch
              checked={settings.weeklyReport}
              onCheckedChange={(v) => updateSetting('weeklyReport', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <div>
                <Label className="text-foreground">{t('overtradingAlert')}</Label>
                <p className="text-xs text-muted-foreground">Alerte après 5 trades/jour</p>
              </div>
            </div>
            <Switch
              checked={settings.overtradingAlert}
              onCheckedChange={(v) => updateSetting('overtradingAlert', v)}
            />
          </div>
        </div>
      </div>

      {/* Data */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">{t('exportData')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleExport('json')}
          >
            <Download className="w-4 h-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => handleExport('csv')}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Account */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Compte</h3>
        </div>

        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={handleLogout}
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          className="w-full justify-between border-loss/30 text-loss hover:bg-loss/10 hover:text-loss"
          onClick={handleDeleteAccount}
        >
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            {t('deleteAccount')}
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Version Info */}
      <div className="text-center text-xs text-muted-foreground py-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <p>Smart Trade Tracker v1.0.0</p>
        <p className="mt-1">© 2024 ALPHA FX</p>
      </div>
    </div>
  );
};

export default Settings;
