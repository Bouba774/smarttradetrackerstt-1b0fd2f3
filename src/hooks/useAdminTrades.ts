import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { Trade } from './useTrades';

/**
 * Hook sécurisé pour accéder aux trades d'un utilisateur en mode admin.
 * Utilise l'edge function admin-data-access qui :
 * - Vérifie le rôle admin côté serveur
 * - Journalise tous les accès dans admin_audit_logs
 * - Retourne uniquement des données en lecture seule
 */
export const useAdminTrades = () => {
  const { selectedUser, isAdminVerified } = useAdmin();

  const tradesQuery = useQuery({
    queryKey: ['admin-trades-secure', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      // Utiliser l'edge function sécurisée pour l'accès aux données
      const { data, error } = await supabase.functions.invoke('admin-data-access', {
        body: {
          targetUserId: selectedUser.id,
          dataType: 'trades',
          action: 'read'
        }
      });

      if (error) {
        console.error('[useAdminTrades] Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Accès refusé');
      }

      return (data.data || []) as Trade[];
    },
    enabled: !!selectedUser && isAdminVerified,
    staleTime: 0, // Toujours refetch quand la query est invalidée
    gcTime: 5 * 60 * 1000, // 5 minutes de cache garbage collection
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Calculate statistics
  const stats = tradesQuery.data ? {
    totalTrades: tradesQuery.data.length,
    winningTrades: tradesQuery.data.filter(t => t.result === 'win').length,
    losingTrades: tradesQuery.data.filter(t => t.result === 'loss').length,
    breakeven: tradesQuery.data.filter(t => t.result === 'breakeven').length,
    totalProfit: tradesQuery.data
      .filter(t => t.profit_loss && t.profit_loss > 0)
      .reduce((sum, t) => sum + (t.profit_loss || 0), 0),
    totalLoss: tradesQuery.data
      .filter(t => t.profit_loss && t.profit_loss < 0)
      .reduce((sum, t) => sum + Math.abs(t.profit_loss || 0), 0),
    winrate: tradesQuery.data.length > 0 
      ? (tradesQuery.data.filter(t => t.result === 'win').length / 
         tradesQuery.data.filter(t => t.result !== 'pending').length) * 100 
      : 0
  } : null;

  return {
    trades: tradesQuery.data || [],
    isLoading: tradesQuery.isLoading,
    error: tradesQuery.error,
    stats,
    refetch: tradesQuery.refetch
  };
};
