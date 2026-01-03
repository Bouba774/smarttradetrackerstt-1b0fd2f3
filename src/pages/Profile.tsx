import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useFeedback } from '@/hooks/useFeedback';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import MTTradeImporter from '@/components/MTTradeImporter';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { formatPrice, formatPriceForExport } from '@/lib/utils';
import {
  User,
  Mail,
  DoorOpen,
  Trash2,
  AlertTriangle,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Edit3,
  Check,
  X,
  Calendar,
  Eye,
  EyeOff,
  Lock,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user, profile, signOut, refreshProfile, updateProfile } = useAuth();
  const { trades } = useTrades();
  const { entries: journalEntries } = useJournalEntries();
  const { currency, formatAmount, convertFromBase } = useCurrency();
  const { exportToPDF } = usePDFExport();
  const { triggerFeedback } = useFeedback();
  const { isAdmin } = useAdminRole();
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  
  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Password confirmation for deletion
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<'deleteData' | 'deleteAccount' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      // Convert trade amounts to selected currency and preserve price precision
      const convertedTrades = trades.map(trade => ({
        ...trade,
        entry_price: formatPriceForExport(trade.entry_price),
        exit_price: formatPriceForExport(trade.exit_price),
        stop_loss: formatPriceForExport(trade.stop_loss),
        take_profit: formatPriceForExport(trade.take_profit),
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
      // Create CSV for trades with currency conversion and proper price formatting
      const headers = ['Date', 'Asset', 'Direction', 'Entry Price', 'Exit Price', 'Stop Loss', 'Take Profit', 'Lot Size', `PnL (${currency})`, 'Result', 'Setup', 'Emotions', 'Notes'];
      const rows = trades.map(trade => [
        trade.trade_date,
        trade.asset,
        trade.direction,
        formatPrice(trade.entry_price),
        trade.exit_price ? formatPrice(trade.exit_price) : '',
        trade.stop_loss ? formatPrice(trade.stop_loss) : '',
        trade.take_profit ? formatPrice(trade.take_profit) : '',
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

  // Password verification for destructive actions
  const handlePasswordVerification = async () => {
    if (!user?.email || !passwordInput) return;
    
    setIsVerifyingPassword(true);
    setPasswordError('');
    
    try {
      // Try to sign in with the password to verify it
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordInput,
      });
      
      if (error) {
        setPasswordError(language === 'fr' ? 'Mot de passe incorrect' : 'Incorrect password');
        triggerFeedback('error');
        return;
      }
      
      // Password verified, execute pending action
      setShowPasswordConfirm(false);
      setPasswordInput('');
      
      if (pendingAction === 'deleteData') {
        await executeDeleteAllData();
      } else if (pendingAction === 'deleteAccount') {
        await executeDeleteAccount();
      }
      
      setPendingAction(null);
    } catch (error) {
      console.error('Password verification error:', error);
      setPasswordError(language === 'fr' ? 'Erreur de vérification' : 'Verification error');
      triggerFeedback('error');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const executeDeleteAllData = async () => {
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

  const handleDeleteAllData = () => {
    setPendingAction('deleteData');
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordConfirm(true);
  };

  const executeDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    triggerFeedback('click');

    try {
      // First delete all user data
      await executeDeleteAllData();

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

  const handleDeleteAccount = () => {
    setPendingAction('deleteAccount');
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordConfirm(true);
  };

  const userLevel = profile?.level || 1;
  const userTitle = getLevelTitle(userLevel);
  const totalPoints = profile?.total_points || 0;

  return (
    <div className="py-4 max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-6">
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
      <div className="glass-card p-8 animate-fade-in relative">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-primary/30 shadow-neon">
              <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                {profile?.nickname?.charAt(0)?.toUpperCase() || 'T'}
              </AvatarFallback>
            </Avatar>
            {/* Photo edit button - positioned at bottom right */}
            <ProfilePhotoUploader
              currentAvatarUrl={profile?.avatar_url}
              nickname={profile?.nickname}
              onPhotoUpdated={refreshProfile}
            />
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
                {/* No role badges visible to users - admin mode is secret */}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
            {user?.created_at && (
              <button
                onClick={() => {
                  if (isAdmin) {
                    triggerFeedback('click');
                    navigate('/admin-verify');
                  }
                }}
                className={`flex items-center justify-center gap-2 text-muted-foreground mt-2 ${isAdmin ? "cursor-pointer hover:text-primary transition-colors" : "cursor-default"}`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {language === 'fr' ? 'Membre depuis le ' : 'Member since '}
                  {format(new Date(user.created_at), 'd MMM yyyy', { locale: language === 'fr' ? fr : enUS })}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Logout button - bottom right corner */}
        <button
          onClick={() => {
            triggerFeedback('click');
            setShowLogoutConfirm(true);
          }}
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-muted/50 hover:bg-loss/20 flex items-center justify-center text-muted-foreground hover:text-loss transition-colors"
          title={t('signOut')}
        >
          <DoorOpen className="w-5 h-5" />
        </button>
      </div>

      {/* Export Data Card */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {t('exportData')}
          </h3>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 justify-center gap-2 h-10"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            <FileJson className="w-4 h-4 text-primary" />
            JSON
          </Button>
          <Button
            variant="outline"
            className="flex-1 justify-center gap-2 h-10"
            onClick={handleExportCSV}
            disabled={isExporting}
          >
            <FileSpreadsheet className="w-4 h-4 text-profit" />
            CSV
          </Button>
          <PDFExportDialog
            trades={trades}
            profile={profile ? { nickname: profile.nickname, level: profile.level, total_points: profile.total_points } : null}
            onExport={handleExportPDF}
            isExporting={isExporting}
            compact
          />
        </div>
      </div>

      {/* MetaTrader Import Card */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '75ms' }}>
        <MTTradeImporter />
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

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-loss" />
              {language === 'fr' ? 'Confirmer la déconnexion' : 'Confirm logout'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? 'Êtes-vous sûr de vouloir vous déconnecter ?' 
                : 'Are you sure you want to log out?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowLogoutConfirm(false);
                triggerFeedback('click');
                signOut();
              }}
            >
              {t('signOut')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Confirmation Dialog for Deletion */}
      <Dialog open={showPasswordConfirm} onOpenChange={(open) => {
        if (!open) {
          setShowPasswordConfirm(false);
          setPasswordInput('');
          setPasswordError('');
          setPendingAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-loss">
              <Lock className="w-5 h-5" />
              {language === 'fr' ? 'Vérification du mot de passe' : 'Password verification'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? 'Entrez votre mot de passe pour confirmer cette action.' 
                : 'Enter your password to confirm this action.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError('');
                }}
                placeholder={language === 'fr' ? 'Votre mot de passe' : 'Your password'}
                className={passwordError ? 'border-loss' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && passwordInput) {
                    handlePasswordVerification();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-sm text-loss mt-2">{passwordError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordConfirm(false);
                setPasswordInput('');
                setPasswordError('');
                setPendingAction(null);
              }}
              disabled={isVerifyingPassword}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handlePasswordVerification}
              disabled={!passwordInput || isVerifyingPassword}
            >
              {isVerifyingPassword 
                ? (language === 'fr' ? 'Vérification...' : 'Verifying...') 
                : (language === 'fr' ? 'Confirmer' : 'Confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
