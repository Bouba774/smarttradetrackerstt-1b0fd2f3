import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';

export interface AdminUserSession {
  id: string;
  user_id: string;
  session_start: string;
  session_end: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  device_vendor: string | null;
  device_model: string | null;
  browser_name: string | null;
  browser_version: string | null;
  os_name: string | null;
  os_version: string | null;
  is_mobile: boolean | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  timezone: string | null;
  country: string | null;
  country_code: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook sécurisé pour accéder aux sessions d'un utilisateur en mode admin.
 * Utilise l'edge function admin-data-access qui :
 * - Vérifie le rôle admin côté serveur
 * - Journalise tous les accès dans admin_audit_logs
 * - Retourne uniquement des données en lecture seule
 */
export const useAdminSessions = () => {
  const { selectedUser, isAdminVerified } = useAdmin();

  const sessionsQuery = useQuery({
    queryKey: ['admin-sessions-secure', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase.functions.invoke('admin-data-access', {
        body: {
          targetUserId: selectedUser.id,
          dataType: 'sessions',
          action: 'read'
        }
      });

      if (error) {
        console.error('[useAdminSessions] Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Accès refusé');
      }

      return (data.data || []) as AdminUserSession[];
    },
    enabled: !!selectedUser && isAdminVerified,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    error: sessionsQuery.error,
    refetch: sessionsQuery.refetch
  };
};
