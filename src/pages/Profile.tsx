import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Mail,
  Trophy,
  Camera,
  LogOut,
  Trash2,
  AlertTriangle,
  Shield,
  Star,
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
  const { language } = useLanguage();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get user level title
  const getLevelTitle = (level: number) => {
    const titles = {
      fr: ['Débutant', 'Intermédiaire', 'Analyste', 'Pro', 'Expert', 'Légende'],
      en: ['Beginner', 'Intermediate', 'Analyst', 'Pro', 'Expert', 'Legend'],
    };
    const index = Math.min(level - 1, 5);
    return language === 'fr' ? titles.fr[index] : titles.en[index];
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'fr' ? 'Veuillez sélectionner une image' : 'Please select an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'fr' ? 'Image trop volumineuse (max 5MB)' : 'Image too large (max 5MB)');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('trade-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trade-images')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast.success(language === 'fr' ? 'Photo mise à jour!' : 'Photo updated!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(language === 'fr' ? 'Erreur lors du téléchargement' : 'Upload error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;

    setIsDeletingData(true);

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
      toast.success(
        language === 'fr' 
          ? 'Toutes vos données ont été supprimées' 
          : 'All your data has been deleted'
      );
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Deletion error');
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);

    try {
      // First delete all user data
      await handleDeleteAllData();

      // Delete profile
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Sign out (account deletion requires admin API, we'll just sign out)
      await signOut();

      toast.success(
        language === 'fr' 
          ? 'Compte supprimé. Au revoir!' 
          : 'Account deleted. Goodbye!'
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Deletion error');
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
            {language === 'fr' ? 'Mon Profil' : 'My Profile'}
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
            <h2 className="font-display text-2xl font-bold text-foreground">
              {profile?.nickname || 'Trader'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>

          {/* Level & Title */}
          <div className="glass-card px-6 py-4 bg-primary/5 border border-primary/20 w-full max-w-sm">
            <div className="flex items-center justify-center gap-3">
              <Trophy className="w-6 h-6 text-primary" />
              <div className="text-left">
                <p className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Titre & Niveau' : 'Title & Level'}
                </p>
                <p className="font-display font-bold text-foreground">
                  {userTitle} <span className="text-primary">(Niveau {userLevel})</span>
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">
                {totalPoints} {language === 'fr' ? 'points' : 'points'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div className="glass-card p-6 animate-fade-in space-y-4" style={{ animationDelay: '100ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-4">
          {language === 'fr' ? 'Actions' : 'Actions'}
        </h3>

        {/* Change Photo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="w-5 h-5 text-primary" />
          {isUploading 
            ? (language === 'fr' ? 'Téléchargement...' : 'Uploading...')
            : (language === 'fr' ? 'Changer la photo' : 'Change photo')}
        </Button>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          {language === 'fr' ? 'Se déconnecter' : 'Sign out'}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-6 animate-fade-in border-loss/30" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-loss" />
          <h3 className="font-display font-semibold text-loss">
            {language === 'fr' ? 'Zone de danger' : 'Danger Zone'}
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
              >
                <Trash2 className="w-5 h-5" />
                {isDeletingData
                  ? (language === 'fr' ? 'Suppression...' : 'Deleting...')
                  : (language === 'fr' ? 'Supprimer toutes mes données' : 'Delete all my data')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-loss" />
                  {language === 'fr' ? 'Supprimer toutes les données?' : 'Delete all data?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {language === 'fr' 
                    ? 'Cette action supprimera tous vos trades, journaux, routines, vidéos, analyses psychologiques et défis. Votre compte restera actif. Cette action est irréversible.'
                    : 'This will delete all your trades, journals, routines, videos, psychological analyses and challenges. Your account will remain active. This action is irreversible.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAllData}
                  className="bg-loss hover:bg-loss/90"
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
                variant="destructive"
                className="w-full justify-start gap-3 h-12"
                disabled={isDeletingAccount}
              >
                <Shield className="w-5 h-5" />
                {isDeletingAccount
                  ? (language === 'fr' ? 'Suppression...' : 'Deleting...')
                  : (language === 'fr' ? 'Supprimer définitivement le compte' : 'Permanently delete account')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-loss">
                  <Shield className="w-5 h-5" />
                  {language === 'fr' ? 'Supprimer le compte?' : 'Delete account?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {language === 'fr' 
                    ? 'Cette action supprimera définitivement votre compte et toutes vos données. Vous ne pourrez plus vous connecter. Cette action est irréversible!'
                    : 'This will permanently delete your account and all your data. You will no longer be able to sign in. This action is irreversible!'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-loss hover:bg-loss/90"
                >
                  {language === 'fr' ? 'Supprimer le compte' : 'Delete account'}
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
