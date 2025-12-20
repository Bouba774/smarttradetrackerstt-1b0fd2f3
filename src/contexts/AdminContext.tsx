import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Json } from '@/integrations/supabase/types';

interface SelectedUser {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
}

interface AdminContextType {
  // État d'authentification admin à deux niveaux
  isAdminVerified: boolean;
  isVerifying: boolean;
  verifyAdminSecret: (secret: string) => Promise<{ success: boolean; message?: string; blocked?: boolean; attemptsRemaining?: number }>;
  
  // Utilisateur sélectionné pour consultation
  selectedUser: SelectedUser | null;
  setSelectedUser: (user: SelectedUser | null) => void;
  
  // Liste des utilisateurs
  allUsers: SelectedUser[];
  isLoadingUsers: boolean;
  refreshUsers: () => Promise<void>;
  
  // Mode admin actif
  isInAdminMode: boolean;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
  
  // Audit logging
  logAdminAction: (action: string, targetUserId?: string, details?: Record<string, unknown>) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [allUsers, setAllUsers] = useState<SelectedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isInAdminMode, setIsInAdminMode] = useState(false);

  // Réinitialiser l'état quand l'utilisateur change
  useEffect(() => {
    if (!user || !isAdmin) {
      setIsAdminVerified(false);
      setSelectedUser(null);
      setIsInAdminMode(false);
    }
  }, [user, isAdmin]);

  const verifyAdminSecret = useCallback(async (secret: string) => {
    if (!user || !isAdmin) {
      return { success: false, message: 'Non autorisé' };
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-admin-secret', {
        body: { secret },
      });

      if (error) {
        return { success: false, message: 'Erreur de vérification' };
      }

      if (data.success) {
        setIsAdminVerified(true);
        setIsInAdminMode(true);
        return { success: true };
      }

      return {
        success: false,
        message: data.message,
        blocked: data.blocked,
        attemptsRemaining: data.attemptsRemaining,
      };
    } catch (err) {
      console.error('Error verifying admin secret:', err);
      return { success: false, message: 'Erreur de connexion' };
    } finally {
      setIsVerifying(false);
    }
  }, [user, isAdmin]);

  const refreshUsers = useCallback(async () => {
    if (!isAdminVerified) return;

    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-users-info');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      // Récupérer les profils pour chaque utilisateur
      const usersWithProfiles = await Promise.all(
        data.users.map(async (authUser: { id: string; email: string; created_at: string }) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('user_id', authUser.id)
            .maybeSingle();

          return {
            id: authUser.id,
            email: authUser.email,
            nickname: profile?.nickname || 'Trader',
            avatar_url: profile?.avatar_url,
            created_at: authUser.created_at,
          };
        })
      );

      setAllUsers(usersWithProfiles);
    } catch (err) {
      console.error('Error refreshing users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [isAdminVerified]);

  const enterAdminMode = useCallback(() => {
    if (isAdminVerified) {
      setIsInAdminMode(true);
    }
  }, [isAdminVerified]);

  const exitAdminMode = useCallback(() => {
    setIsInAdminMode(false);
    setSelectedUser(null);
  }, []);

  const logAdminAction = useCallback(async (
    action: string,
    targetUserId?: string,
    details?: Record<string, unknown>
  ) => {
    if (!user || !isAdminVerified) return;

    try {
      await supabase.from('admin_audit_logs').insert([{
        admin_id: user.id,
        action,
        target_user_id: targetUserId || null,
        details: (details as Json) || null,
        ip_address: null,
      }]);
    } catch (err) {
      console.error('Error logging admin action:', err);
    }
  }, [user, isAdminVerified]);

  // Charger les utilisateurs quand l'admin est vérifié
  useEffect(() => {
    if (isAdminVerified) {
      refreshUsers();
    }
  }, [isAdminVerified, refreshUsers]);

  return (
    <AdminContext.Provider
      value={{
        isAdminVerified,
        isVerifying,
        verifyAdminSecret,
        selectedUser,
        setSelectedUser,
        allUsers,
        isLoadingUsers,
        refreshUsers,
        isInAdminMode,
        enterAdminMode,
        exitAdminMode,
        logAdminAction,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
