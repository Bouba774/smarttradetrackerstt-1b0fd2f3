import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/contexts/AdminContext';
import { UserChallenge, CHALLENGE_DEFINITIONS, USER_LEVELS } from './useChallenges';
import { useAdminTrades } from './useAdminTrades';

/**
 * Hook sécurisé pour accéder aux défis d'un utilisateur en mode admin.
 * Utilise l'edge function admin-data-access qui :
 * - Vérifie le rôle admin côté serveur
 * - Journalise tous les accès dans admin_audit_logs
 * - Retourne uniquement des données en lecture seule
 */
export const useAdminChallenges = () => {
  const { selectedUser, isAdminVerified } = useAdmin();
  const { trades, stats } = useAdminTrades();

  const challengesQuery = useQuery({
    queryKey: ['admin-challenges-secure', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      
      const { data, error } = await supabase.functions.invoke('admin-data-access', {
        body: {
          targetUserId: selectedUser.id,
          dataType: 'challenges',
          action: 'read'
        }
      });

      if (error) {
        console.error('[useAdminChallenges] Edge function error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Accès refusé');
      }

      return (data.data || []) as UserChallenge[];
    },
    enabled: !!selectedUser && isAdminVerified,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Calculate progress for all challenges based on trades
  const challengesWithProgress = CHALLENGE_DEFINITIONS.map(def => {
    const userChallenge = challengesQuery.data?.find(c => c.challenge_id === def.id);
    const calculatedProgress = stats ? def.calculateProgress(trades, stats) : 0;
    const progress = Math.min(calculatedProgress, def.target);
    const completed = progress >= def.target;

    return {
      ...def,
      progress,
      completed,
      userChallenge,
      isNewlyCompleted: false,
      popupShown: userChallenge?.popup_shown || false,
    };
  });

  // Calculate level info from user challenges
  const totalPoints = challengesQuery.data?.reduce((sum, c) => sum + (c.points_earned || 0), 0) || 0;
  
  const currentLevel = USER_LEVELS.find((l, i) => 
    totalPoints >= l.minPoints && 
    (USER_LEVELS[i + 1] ? totalPoints < USER_LEVELS[i + 1].minPoints : true)
  ) || USER_LEVELS[0];

  const nextLevel = USER_LEVELS[USER_LEVELS.indexOf(currentLevel) + 1];
  
  const progressToNextLevel = nextLevel 
    ? ((totalPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 
    : 100;

  const completedCount = challengesWithProgress.filter(c => c.completed).length;

  return {
    challenges: challengesWithProgress,
    userChallenges: challengesQuery.data || [],
    isLoading: challengesQuery.isLoading,
    error: challengesQuery.error,
    currentLevel,
    nextLevel,
    progressToNextLevel,
    totalPoints,
    completedCount,
    USER_LEVELS,
    refetch: challengesQuery.refetch
  };
};
