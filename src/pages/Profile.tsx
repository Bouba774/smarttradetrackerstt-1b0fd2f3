import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from '@/hooks/useTrades';
import { useChallenges } from '@/hooks/useChallenges';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/alert-dialog';
import {
  User,
  Camera,
  LogOut,
  Trash2,
  Database,
  Mail,
  Award,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const USER_LEVELS = [
  { level: 1, title: 'Débutant', badge: '🌱', minPoints: 0 },
  { level: 2, title: 'Apprenti', badge: '📚', minPoints: 100 },
  { level: 3, title: 'Trader', badge: '📊', minPoints: 300 },
  { level: 4, title: 'Confirmé', badge: '💪', minPoints: 600 },
  { level: 5, title: 'Expert', badge: '🎯', minPoints: 1000 },
  { level: 6, title: 'Maître', badge: '⭐', minPoints: 1500 },
  { level: 7, title: 'Champion', badge: '🏆', minPoints: 2500 },
  { level: 8, title: 'Légende', badge: '👑', minPoints: 5000 },
];

const Profile: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, profile, signOut, updateProfile } = useAuth();
  const { trades } = useTrades();
  const { userChallenges } = useChallenges();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Calculate user level from profile points
  const totalPoints = profile?.total_points || 0;
  const currentLevel = USER_LEVELS.reduce((prev, curr) => 
    totalPoints >= curr.minPoints ? curr : prev, USER_LEVELS[0]);
  
  const completedChallenges = userChallenges.filter(c => c.completed).length;

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(language === 'fr' ? 'Image trop grande (max 2MB)' : 'Image too large (max 2MB)');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage (would need avatar bucket)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await updateProfile({ avatar_url: base64 });
        toast.success(language === 'fr' ? 'Photo mise à jour!' : 'Photo updated!');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'upload' : 'Upload error');
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    
    setIsDeletingData(true);
    try {
      // Delete all trades
      await supabase.from('trades').delete().eq('user_id', user.id);
      
      // Delete all journal entries
      await supabase.from('journal_entries').delete().eq('user_id', user.id);
      
      // Delete all challenges
      await supabase.from('user_challenges').delete().eq('user_id', user.id);
      
      // Reset profile points
      await updateProfile({ total_points: 0, level: 1 });
      
      toast.success(language === 'fr' ? 'Toutes les données ont été supprimées' : 'All data has been deleted');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Delete error');
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeletingAccount(true);
    try {
      // Delete all user data first
      await handleDeleteAllData();
      
      // Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);
      
      // Sign out
      await signOut();
      
      toast.success(language === 'fr' ? 'Compte supprimé' : 'Account deleted');
      navigate('/auth');
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la suppression du compte' : 'Account deletion error');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="py-4 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('profile')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' ? 'Gérez votre compte' : 'Manage your account'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <User className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex flex-col items-center text-center">
          {/* Photo */}
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-full bg-secondary/50 border-4 border-primary/50 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              disabled={isUploading}
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name & Level */}
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            {profile?.nickname || 'Trader'}
            <span className="text-2xl">{currentLevel.badge}</span>
          </h2>
          <p className="text-primary font-medium">
            {currentLevel.title} — {language === 'fr' ? 'Niveau' : 'Level'} {currentLevel.level}
          </p>
          
          {/* Email */}
          <div className="flex items-center gap-2 mt-3 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{user?.email}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <p className="font-display text-xl font-bold text-foreground">{trades.length}</p>
              <p className="text-xs text-muted-foreground">Trades</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-bold text-primary">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl font-bold text-profit">{completedChallenges}</p>
              <p className="text-xs text-muted-foreground">{language === 'fr' ? 'Défis' : 'Challenges'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Photo Button */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        {language === 'fr' ? 'Changer la photo' : 'Change photo'}
      </Button>

      {/* Account Actions */}
      <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          {language === 'fr' ? 'Actions du compte' : 'Account Actions'}
        </h3>

        {/* Delete All Data */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-warning/30 text-warning hover:bg-warning/10"
              disabled={isDeletingData}
            >
              {isDeletingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {language === 'fr' ? 'Supprimer toutes mes données' : 'Delete all my data'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'fr' ? 'Supprimer toutes les données?' : 'Delete all data?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'fr' 
                  ? 'Cette action supprimera tous vos trades, journaux, routines, vidéos, analyses psychologiques et défis. Cette action est irréversible.'
                  : 'This action will delete all your trades, journals, routines, videos, psychological analyses and challenges. This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAllData}
                className="bg-warning hover:bg-warning/90 text-warning-foreground"
              >
                {language === 'fr' ? 'Supprimer tout' : 'Delete all'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 border-loss/30 text-loss hover:bg-loss/10"
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {language === 'fr' ? 'Supprimer définitivement le compte' : 'Permanently delete account'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-background border-border">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === 'fr' ? 'Supprimer le compte?' : 'Delete account?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'fr' 
                  ? 'Cette action est irréversible. Votre compte et toutes vos données seront supprimés définitivement.'
                  : 'This action cannot be undone. Your account and all data will be permanently deleted.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-loss hover:bg-loss/90 text-loss-foreground"
              >
                {language === 'fr' ? 'Supprimer le compte' : 'Delete account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </Button>
      </div>

      {/* Member Info */}
      <div className="text-center text-xs text-muted-foreground py-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <p>Smart Trade Tracker — ALPHA FX</p>
      </div>
    </div>
  );
};

export default Profile;
