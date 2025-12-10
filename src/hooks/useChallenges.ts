import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrades } from './useTrades';

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  target: number;
  completed: boolean;
  completed_at: string | null;
  points_earned: number;
  popup_shown: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChallengeDefinition {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  target: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: string;
  points: number;
  icon: string;
  calculateProgress: (trades: any[], stats: any) => number;
}

export const CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  // Easy
  {
    id: 'first_trade',
    title: 'Premier Pas',
    titleEn: 'First Step',
    description: 'Enregistrez votre premier trade',
    descriptionEn: 'Record your first trade',
    target: 1,
    difficulty: 'easy',
    reward: '🎯 Badge Premier Trade',
    points: 10,
    icon: 'Target',
    calculateProgress: (trades) => trades.length
  },
  {
    id: 'active_week',
    title: 'Semaine Active',
    titleEn: 'Active Week',
    description: 'Tradez 5 jours différents',
    descriptionEn: 'Trade on 5 different days',
    target: 5,
    difficulty: 'easy',
    reward: '🔥 Badge Régularité',
    points: 25,
    icon: 'Flame',
    calculateProgress: (trades) => {
      const days = new Set(trades.map(t => new Date(t.trade_date).toDateString()));
      return days.size;
    }
  },
  {
    id: 'ten_trades',
    title: 'Débutant Actif',
    titleEn: 'Active Beginner',
    description: 'Atteignez 10 trades enregistrés',
    descriptionEn: 'Record 10 trades',
    target: 10,
    difficulty: 'easy',
    reward: '⭐ Badge Discipline',
    points: 30,
    icon: 'Star',
    calculateProgress: (trades) => trades.length
  },
  // Medium
  {
    id: 'winning_streak',
    title: 'Série Gagnante',
    titleEn: 'Winning Streak',
    description: 'Enchaînez 5 trades gagnants',
    descriptionEn: 'Win 5 trades in a row',
    target: 5,
    difficulty: 'medium',
    reward: '📈 Badge Momentum',
    points: 50,
    icon: 'TrendingUp',
    calculateProgress: (trades) => {
      let maxStreak = 0;
      let currentStreak = 0;
      trades.slice().reverse().forEach(t => {
        if (t.result === 'win') {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else if (t.result === 'loss') {
          currentStreak = 0;
        }
      });
      return maxStreak;
    }
  },
  {
    id: 'fifty_trades',
    title: 'Trader Confirmé',
    titleEn: 'Confirmed Trader',
    description: 'Atteignez 50 trades enregistrés',
    descriptionEn: 'Record 50 trades',
    target: 50,
    difficulty: 'medium',
    reward: '🛡️ Badge Expérience',
    points: 75,
    icon: 'Shield',
    calculateProgress: (trades) => trades.length
  },
  {
    id: 'winrate_55',
    title: 'Performance Stable',
    titleEn: 'Stable Performance',
    description: 'Maintenez un winrate > 55% sur 20 trades',
    descriptionEn: 'Keep winrate > 55% over 20 trades',
    target: 20,
    difficulty: 'medium',
    reward: '⚡ Badge Performance',
    points: 100,
    icon: 'Zap',
    calculateProgress: (trades, stats) => {
      const closedTrades = trades.filter(t => t.result !== 'pending').length;
      if (closedTrades >= 20 && stats.winrate > 55) {
        return 20;
      }
      return Math.min(closedTrades, 19);
    }
  },
  // Hard
  {
    id: 'centurion',
    title: 'Centurion',
    titleEn: 'Centurion',
    description: 'Atteignez 100 trades enregistrés',
    descriptionEn: 'Record 100 trades',
    target: 100,
    difficulty: 'hard',
    reward: '🏅 Badge Expérience',
    points: 150,
    icon: 'Medal',
    calculateProgress: (trades) => trades.length
  },
  {
    id: 'winrate_elite',
    title: 'Winrate Elite',
    titleEn: 'Elite Winrate',
    description: 'Maintenez un winrate > 60% sur 50 trades',
    descriptionEn: 'Keep winrate > 60% over 50 trades',
    target: 50,
    difficulty: 'hard',
    reward: '🏆 Badge Excellence',
    points: 200,
    icon: 'Trophy',
    calculateProgress: (trades, stats) => {
      const closedTrades = trades.filter(t => t.result !== 'pending').length;
      if (closedTrades >= 50 && stats.winrate > 60) {
        return 50;
      }
      return Math.min(closedTrades, 49);
    }
  },
  // Expert
  {
    id: 'legend',
    title: 'Légende du Trading',
    titleEn: 'Trading Legend',
    description: 'Atteignez 1000 trades avec un winrate > 55%',
    descriptionEn: 'Record 1000 trades with winrate > 55%',
    target: 1000,
    difficulty: 'expert',
    reward: '👑 Titre Légende',
    points: 500,
    icon: 'Crown',
    calculateProgress: (trades, stats) => {
      if (stats.winrate > 55) {
        return trades.length;
      }
      return Math.min(trades.length, 999);
    }
  },
];

export const USER_LEVELS = [
  { level: 1, title: 'Débutant', titleEn: 'Beginner', minPoints: 0, badge: '🌱' },
  { level: 2, title: 'Apprenti', titleEn: 'Apprentice', minPoints: 100, badge: '📚' },
  { level: 3, title: 'Trader', titleEn: 'Trader', minPoints: 300, badge: '📊' },
  { level: 4, title: 'Confirmé', titleEn: 'Confirmed', minPoints: 600, badge: '💪' },
  { level: 5, title: 'Expert', titleEn: 'Expert', minPoints: 1000, badge: '🎯' },
  { level: 6, title: 'Maître', titleEn: 'Master', minPoints: 2000, badge: '⭐' },
  { level: 7, title: 'Champion', titleEn: 'Champion', minPoints: 5000, badge: '🏆' },
  { level: 8, title: 'Légende', titleEn: 'Legend', minPoints: 10000, badge: '👑' },
];

export const useChallenges = () => {
  const { user, profile, updateProfile } = useAuth();
  const { trades, stats } = useTrades();
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ['user_challenges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserChallenge[];
    },
    enabled: !!user
  });

  // Calculate progress for all challenges
  const challengesWithProgress = CHALLENGE_DEFINITIONS.map(def => {
    const userChallenge = challengesQuery.data?.find(c => c.challenge_id === def.id);
    const calculatedProgress = stats ? def.calculateProgress(trades, stats) : 0;
    const progress = Math.min(calculatedProgress, def.target);
    const completed = progress >= def.target;
    // Only mark as newly completed if not already marked as popup_shown in DB
    const popupShown = userChallenge?.popup_shown || false;

    return {
      ...def,
      progress,
      completed,
      userChallenge,
      isNewlyCompleted: completed && !userChallenge?.completed && !popupShown,
      popupShown,
    };
  });

  // Sync challenges with database
  const syncChallenge = useMutation({
    mutationFn: async (challenge: typeof challengesWithProgress[0]) => {
      if (!user) throw new Error('Not authenticated');

      const existingChallenge = challenge.userChallenge;

      if (existingChallenge) {
        // Update existing
        const { error } = await supabase
          .from('user_challenges')
          .update({
            progress: challenge.progress,
            completed: challenge.completed,
            completed_at: challenge.completed && !existingChallenge.completed ? new Date().toISOString() : existingChallenge.completed_at,
            points_earned: challenge.completed ? challenge.points : 0,
            popup_shown: challenge.completed ? true : existingChallenge.popup_shown || false,
          })
          .eq('id', existingChallenge.id);

        if (error) throw error;

        // If newly completed, update user points
        if (challenge.completed && !existingChallenge.completed) {
          const newPoints = (profile?.total_points || 0) + challenge.points;
          const newLevel = USER_LEVELS.reduce((acc, lvl) => 
            newPoints >= lvl.minPoints ? lvl.level : acc
          , 1);

          await updateProfile({ 
            total_points: newPoints,
            level: newLevel
          });
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('user_challenges')
          .insert({
            user_id: user.id,
            challenge_id: challenge.id,
            progress: challenge.progress,
            target: challenge.target,
            completed: challenge.completed,
            completed_at: challenge.completed ? new Date().toISOString() : null,
            points_earned: challenge.completed ? challenge.points : 0,
            popup_shown: challenge.completed ? true : false,
          });

        if (error) throw error;

        // If completed on first create, update user points
        if (challenge.completed) {
          const newPoints = (profile?.total_points || 0) + challenge.points;
          const newLevel = USER_LEVELS.reduce((acc, lvl) => 
            newPoints >= lvl.minPoints ? lvl.level : acc
          , 1);

          await updateProfile({ 
            total_points: newPoints,
            level: newLevel
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_challenges', user?.id] });
    }
  });

  // Sync all challenges
  const syncAllChallenges = async () => {
    for (const challenge of challengesWithProgress) {
      await syncChallenge.mutateAsync(challenge);
    }
  };

  // Get current level info
  const currentLevel = USER_LEVELS.find((l, i) => 
    (profile?.total_points || 0) >= l.minPoints && 
    (USER_LEVELS[i + 1] ? (profile?.total_points || 0) < USER_LEVELS[i + 1].minPoints : true)
  ) || USER_LEVELS[0];

  const nextLevel = USER_LEVELS[USER_LEVELS.indexOf(currentLevel) + 1];
  
  const progressToNextLevel = nextLevel 
    ? (((profile?.total_points || 0) - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 
    : 100;

  return {
    challenges: challengesWithProgress,
    userChallenges: challengesQuery.data || [],
    isLoading: challengesQuery.isLoading,
    currentLevel,
    nextLevel,
    progressToNextLevel,
    totalPoints: profile?.total_points || 0,
    syncAllChallenges,
    syncChallenge,
    USER_LEVELS
  };
};
