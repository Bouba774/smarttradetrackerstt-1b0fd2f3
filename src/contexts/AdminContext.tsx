import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
  
  // Session management
  sessionExpiresAt: Date | null;
  resetSessionTimer: () => void;
}

// Session timeout: 30 minutes
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const queryClient = useQueryClient();
  
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedUser, setSelectedUserState] = useState<SelectedUser | null>(null);
  const [allUsers, setAllUsers] = useState<SelectedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isInAdminMode, setIsInAdminMode] = useState(false);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  
  // Timer refs
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasWarnedRef = useRef(false);

  // Invalider les queries admin
  const invalidateAdminQueries = useCallback((userId?: string) => {
    const adminQueryKeys = [
      'admin-trades-secure',
      'admin-profile-secure',
      'admin-journal-secure',
      'admin-challenges-secure',
      'admin-settings-secure',
      'admin-sessions-secure',
    ];

    adminQueryKeys.forEach((key) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [key, userId], refetchType: 'active' });
      } else {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    });
  }, [queryClient]);

  // Setter pour selectedUser avec invalidation du cache
  const setSelectedUser = useCallback((user: SelectedUser | null) => {
    setSelectedUserState(user);
    if (user) {
      // Invalider les anciennes données et refetch les nouvelles
      invalidateAdminQueries(user.id);
    }
  }, [invalidateAdminQueries]);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    hasWarnedRef.current = false;
  }, []);

  // Handle session expiry
  const handleSessionExpiry = useCallback(() => {
    clearTimers();
    setIsAdminVerified(false);
    setIsInAdminMode(false);
    setSelectedUser(null);
    setSessionExpiresAt(null);
    toast.error('Session admin expirée. Veuillez vous reconnecter.', {
      duration: 5000,
    });
  }, [clearTimers]);

  // Start session timer
  const startSessionTimer = useCallback(() => {
    clearTimers();
    
    const expiryTime = new Date(Date.now() + SESSION_TIMEOUT_MS);
    setSessionExpiresAt(expiryTime);
    
    // Warning timeout (5 min before expiry)
    warningTimeoutRef.current = setTimeout(() => {
      if (!hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast.warning('Votre session admin expire dans 5 minutes. Continuez à utiliser l\'interface pour la maintenir.', {
          duration: 10000,
        });
      }
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_EXPIRY_MS);
    
    // Session expiry timeout
    sessionTimeoutRef.current = setTimeout(() => {
      handleSessionExpiry();
    }, SESSION_TIMEOUT_MS);
  }, [clearTimers, handleSessionExpiry]);

  // Reset session timer on activity
  const resetSessionTimer = useCallback(() => {
    if (isAdminVerified && isInAdminMode) {
      hasWarnedRef.current = false;
      startSessionTimer();
    }
  }, [isAdminVerified, isInAdminMode, startSessionTimer]);

  // Track user activity to reset timer
  useEffect(() => {
    if (!isAdminVerified || !isInAdminMode) return;

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    let lastActivity = Date.now();
    const throttleMs = 60000; // Only reset every minute max

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivity > throttleMs) {
        lastActivity = now;
        resetSessionTimer();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAdminVerified, isInAdminMode, resetSessionTimer]);

  // Réinitialiser l'état quand l'utilisateur change
  useEffect(() => {
    if (!user || !isAdmin) {
      clearTimers();
      setIsAdminVerified(false);
      setSelectedUser(null);
      setIsInAdminMode(false);
      setSessionExpiresAt(null);
    }
  }, [user, isAdmin, clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

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
        startSessionTimer();
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
  }, [user, isAdmin, startSessionTimer]);

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
      startSessionTimer();
    }
  }, [isAdminVerified, startSessionTimer]);

  const exitAdminMode = useCallback(() => {
    clearTimers();
    setIsInAdminMode(false);
    setSelectedUser(null);
    setSessionExpiresAt(null);
  }, [clearTimers]);

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
        sessionExpiresAt,
        resetSessionTimer,
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
