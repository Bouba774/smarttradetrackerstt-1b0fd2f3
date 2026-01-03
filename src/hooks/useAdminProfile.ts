import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';

export interface AdminUserProfile {
  id: string;
  user_id: string;
  nickname: string;
  bio: string | null;
  trading_style: string | null;
  avatar_url: string | null;
  level: number | null;
  total_points: number | null;
  weekly_objective_trades: number | null;
  monthly_objective_profit: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook sécurisé pour accéder au profil d'un utilisateur en mode admin.
 * Utilise l'edge function admin-data-access qui :
 * - Vérifie le rôle admin côté serveur
 * - Journalise tous les accès dans admin_audit_logs
 * - Retourne uniquement des données en lecture seule
 */
export const useAdminProfile = () => {
  const { selectedUser, isAdminVerified } = useAdmin();

  const profileQuery = useQuery({
    queryKey: ['admin-profile-secure', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return null;
      
      // Utiliser l'edge function sécurisée pour l'accès aux données
      const { data, error } = await supabase.functions.invoke('admin-data-access', {
        body: {
          targetUserId: selectedUser.id,
          dataType: 'profile',
          action: 'read'
        }
      });

      if (error) {
        console.error('[useAdminProfile] Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Accès refusé');
      }

      return data.data as AdminUserProfile | null;
    },
    enabled: !!selectedUser && isAdminVerified,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch
  };
};
