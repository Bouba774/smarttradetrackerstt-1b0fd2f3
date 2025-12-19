import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/hooks/useTrades';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { useCurrency } from '@/hooks/useCurrency';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useAdminRole } from '@/hooks/useAdminRole';
import { PDFExportDialog } from '@/components/PDFExportDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useFeedback } from '@/hooks/useFeedback';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import MetaTraderConnection from '@/components/MetaTraderConnection';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  User,
  Mail,
  Trophy,
  LogOut,
  Trash2,
  AlertTriangle,
  Star,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Edit3,
  Check,
  X,
  Calendar,
  Crown,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, profile, signOut, refreshProfile, updateProfile } = useAuth();
  const { trades } = useTrades();
  const { entries: journalEntries } = useJournalEntries();
  const { currency, formatAmount, convertFromBase } = useCurrency();
  const { exportToPDF } = usePDFExport();
  const { triggerFeedback } = useFeedback();
  const { isAdmin, isModerator } = useAdminRole();
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  // Get user level title
  const getLevelTitle = (level: number) => {
    const titles = ['beginner', 'intermediate', 'analyst', 'pro', 'expert', 'legend'];
    const index = Math.min(level - 1, 5);
    return t(titles[index]);
  };

  const handleExportPDF = async (filteredTrades: any[], profileData: any, periodLabel: string) => {
    if (filteredTrades.length === 0) {
      toast.error(t('noDataToExport'));
      return;
    }
    setIsExporting(true);
    await exportToPDF(filteredTrades, profileData, periodLabel);
    setIsExporting(false);
  };

  const handleExportJSON = async () => {
    if (trades.length === 0 && journalEntries.length === 0) {
      toast.error(t('noDataToExport'));
      return;
    }

    setIsExporting(true);
    triggerFeedback('click');

    try {
      // Convert trade amounts to selected currency
      const convertedTrades = trades.map(trade => ({
        ...trade,
        profit_loss: trade.profit_loss ? convertFromBase(trade.profit_loss) : null,
        currency: currency,
      }));

      const exportData = {
        exportDate: new Date().toISOString(),
        currency: currency,
        profile: profile ? {
          nickname: profile.nickname,
          level: profile.level,
          total_points: profile.total_points,
          trading_style: profile.trading_style,
        } : null,
        trades: convertedTrades,
        journalEntries: journalEntries,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-trade-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerFeedback('success');
      toast.success(t('exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      triggerFeedback('error');
      toast.error(t('exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (trades.length === 0) {
      toast.error(t('noDataToExport'));
      return;
    }

    setIsExporting(true);
    triggerFeedback('click');

    try {
      // Create CSV for trades with currency conversion
      const headers = ['Date', 'Asset', 'Direction', 'Entry Price', 'Exit Price', 'Stop Loss', 'Take Profit', 'Lot Size', `PnL (${currency})`, 'Result', 'Setup', 'Emotions', 'Notes'];
      const rows = trades.map(trade => [
        trade.trade_date,
        trade.asset,
        trade.direction,
        trade.entry_price,
        trade.exit_price || '',
        trade.stop_loss || '',
        trade.take_profit || '',
        trade.lot_size,
        trade.profit_loss ? convertFromBase(trade.profit_loss).toFixed(2) : '',
        trade.result || '',
        trade.setup || '',
        trade.emotions || '',
        trade.notes?.replace(/"/g, '""') || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-trade-tracker-trades-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerFeedback('success');
      toast.success(t('exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      triggerFeedback('error');
      toast.error(t('exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;

    setIsDeletingData(true);
    triggerFeedback('click');

    try {
      // Delete trades
      await supabase.from('trades').delete().eq('user_id', user.id);
      
      // Delete journal entries
      await supabase.from('journal_entries').delete().eq('user_id', user.id);
      
      // Delete user challenges
      await supabase.from('user_challenges').delete().eq('user_id', user.id);

      // Clear local storage for video journal
      localStorage.removeItem('smart-trade-tracker-recordings');

      // Reset profile points and level
      await supabase
        .from('profiles')
        .update({ total_points: 0, level: 1 })
        .eq('user_id', user.id);

      await refreshProfile();
      triggerFeedback('success');
      toast.success(t('dataDeleted'));
    } catch (error) {
      console.error('Error deleting data:', error);
      triggerFeedback('error');
      toast.error(t('error'));
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    triggerFeedback('click');

    try {
      // First delete all user data
      await handleDeleteAllData();

      // Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Sign out (account deletion requires admin API, we'll just sign out)
      await signOut();

      triggerFeedback('success');
      toast.success(t('accountDeleted'));
    } catch (error) {
      console.error('Error deleting account:', error);
      triggerFeedback('error');
      toast.error(t('error'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const userLevel = profile?.level || 1;
  const userTitle = getLevelTitle(userLevel);
  const totalPoints = profile?.total_points || 0;

  return (
    <div className="py-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('myProfile')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('manageAccount')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <User className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-8 animate-fade-in">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-primary/30 shadow-neon">
              <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                {profile?.nickname?.charAt(0)?.toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-bold shadow-lg">
              {userLevel}
            </div>
          </div>

          {/* User Info */}
          <div className="space-y-2">
            {isEditingNickname ? (
              <div className="flex items-center justify-center gap-2">
                <Input
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder={profile?.nickname || 'Trader'}
                  className="max-w-[200px] text-center font-display text-xl font-bold"
                  autoFocus
                  disabled={isSavingNickname}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-profit hover:text-profit"
                  onClick={async () => {
                    if (!newNickname.trim()) {
                      toast.error(language === 'fr' ? 'Le pseudo ne peut pas être vide' : 'Nickname cannot be empty');
                      return;
                    }
                    setIsSavingNickname(true);
                    triggerFeedback('click');
                    const { error } = await updateProfile({ nickname: newNickname.trim() });
                    setIsSavingNickname(false);
                    if (error) {
                      triggerFeedback('error');
                      toast.error(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error');
                    } else {
                      triggerFeedback('success');
                      toast.success(language === 'fr' ? 'Pseudo mis à jour!' : 'Nickname updated!');
                      setIsEditingNickname(false);
                    }
                  }}
                  disabled={isSavingNickname}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-loss hover:text-loss"
                  onClick={() => {
                    setIsEditingNickname(false);
                    setNewNickname(profile?.nickname || '');
                  }}
                  disabled={isSavingNickname}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {profile?.nickname || 'Trader'}
                  </h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setNewNickname(profile?.nickname || '');
                      setIsEditingNickname(true);
                      triggerFeedback('click');
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
                {/* Role Badge */}
                {isAdmin && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
                {isModerator && !isAdmin && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Moderator
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            {user?.created_at && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground mt-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {language === 'fr' ? 'Membre depuis le ' : 'Member since '}
                  {format(new Date(user.created_at), 'd MMM yyyy', { locale: language === 'fr' ? fr : enUS })}
                </span>
              </div>
            )}
          </div>

          {/* Level & Title */}
          <div className="glass-card px-6 py-4 bg-primary/5 border border-primary/20 w-full max-w-sm">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">
                  {t('titleLevel')}
                </p>
                <p className="font-display font-bold text-foreground">
                  {userTitle} <span className="text-primary">({t('level')} {userLevel})</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                {totalPoints} {t('points')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Data Card */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('exportData')}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            variant="outline"
            className="flex-1 justify-start gap-3 h-12"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            <FileJson className="w-5 h-5 text-primary" />
            {t('exportJSON')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 justify-start gap-3 h-12"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            <FileSpreadsheet className="w-5 h-5 text-profit" />
            {t('exportCSV')}
          </Button>
        </div>
        <PDFExportDialog
          trades={trades}
          profile={profile ? { nickname: profile.nickname, level: profile.level, total_points: profile.total_points } : null}
          onExport={handleExportPDF}
          isExporting={isExporting}
        />
      </div>

      {/* MetaTrader Connection Card */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '75ms' }}>
        <MetaTraderConnection />
      </div>

      {/* Actions Card */}
      <div className="glass-card p-6 animate-fade-in space-y-4" style={{ animationDelay: '100ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-4">
          {t('actions')}
        </h3>

        {/* Change Photo */}
        <ProfilePhotoUploader
          currentAvatarUrl={profile?.avatar_url}
          nickname={profile?.nickname}
          onPhotoUpdated={refreshProfile}
        />

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12"
          onClick={() => {
            triggerFeedback('click');
            signOut();
          }}
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          {t('signOut')}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 animate-fade-in border-loss/30" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-loss" />
          <h3 className="font-display font-semibold text-loss">
            {t('dangerZone')}
          </h3>
        </div>

        <div className="space-y-3">
          {/* Delete All Data */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 border-loss/30 text-loss hover:bg-loss/10"
                disabled={isDeletingData}
                onClick={() => triggerFeedback('click')}
              >
                <Trash2 className="w-5 h-5" />
                {isDeletingData ? t('loading') : t('deleteAllData')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-loss" />
                  {t('deleteDataConfirm')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteDataDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => triggerFeedback('click')}>
                  {t('cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className="bg-loss hover:bg-loss/90"
                >
                  {t('deleteAll')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Account */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full justify-start gap-3 h-12"
                disabled={isDeletingAccount}
                onClick={() => triggerFeedback('click')}
              >
                <Trash2 className="w-5 h-5" />
                {isDeletingAccount ? t('loading') : t('deleteAccountPermanently')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-loss">
                  <Trash2 className="w-5 h-5" />
                  {t('deleteAccountConfirm')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteAccountDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => triggerFeedback('click')}>
                  {t('cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-loss hover:bg-loss/90"
                >
                  {t('deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default Profile;
