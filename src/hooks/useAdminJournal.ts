import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { JournalEntry } from './useJournalEntries';

/**
 * Hook sécurisé pour accéder aux entrées journal d'un utilisateur en mode admin.
 * Utilise l'edge function admin-data-access qui :
 * - Vérifie le rôle admin côté serveur
 * - Journalise tous les accès dans admin_audit_logs
 * - Retourne uniquement des données en lecture seule
 */
export const useAdminJournal = () => {
  const { selectedUser, isAdminVerified } = useAdmin();

  const journalQuery = useQuery({
    queryKey: ['admin-journal-secure', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase.functions.invoke('admin-data-access', {
        body: {
          targetUserId: selectedUser.id,
          dataType: 'journal',
          action: 'read'
        }
      });

      if (error) {
        console.error('[useAdminJournal] Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Accès refusé');
      }

      // Parse checklist JSON for each entry
      return ((data.data || []) as any[]).map(entry => ({
        ...entry,
        checklist: Array.isArray(entry.checklist) 
          ? entry.checklist 
          : JSON.parse(entry.checklist as string || '[]'),
      })) as JournalEntry[];
    },
    enabled: !!selectedUser && isAdminVerified,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    entries: journalQuery.data || [],
    isLoading: journalQuery.isLoading,
    error: journalQuery.error,
    refetch: journalQuery.refetch
  };
};
