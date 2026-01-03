import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';

export interface AdminUserSettings {
  id: string;
  user_id: string;
  currency: string | null;
  sounds: boolean | null;
  vibration: boolean | null;
  animations: boolean | null;
  font_size: string | null;
  background: string | null;
  confidential_mode: boolean | null;
  pin_enabled: boolean | null;
  pin_length: number | null;
  max_attempts: number | null;
  biometric_enabled: boolean | null;
  wipe_on_max_attempts: boolean | null;
  auto_lock_timeout: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook sécurisé pour accéder aux paramètres d'un utilisateur en mode admin.
 * Utilise l'edge function admin-data-access qui :
 * - Vérifie le rôle admin côté serveur
 * - Journalise tous les accès dans admin_audit_logs
 * - Exclut automatiquement les données sensibles (PIN hash, salt)
 * - Retourne uniquement des données en lecture seule
 */
export const useAdminSettings = () => {
  const { selectedUser, isAdminVerified } = useAdmin();

  const settingsQuery = useQuery({
    queryKey: ['admin-settings-secure', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      
      const { data, error } = await supabase.functions.invoke('admin-data-access', {
        body: {
          targetUserId: selectedUser.id,
          dataType: 'settings',
          action: 'read'
        }
      });

      if (error) {
        console.error('[useAdminSettings] Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Accès refusé');
      }

      return data.data as AdminUserSettings | null;
    },
    enabled: !!selectedUser && isAdminVerified,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch
  };
};
