import { useMemo } from 'react';
import { useDisciplineScore } from './useDisciplineScore';
import { Trade } from './useTrades';

export interface RewardChest {
  id: string;
  name: { fr: string; en: string };
  description: { fr: string; en: string };
  requiredDays: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  reward: {
    type: 'badge' | 'title' | 'points';
    value: string | number;
  };
}

const REWARD_CHESTS: Omit<RewardChest, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'chest_3_days',
    name: { fr: 'Coffre du Débutant', en: 'Beginner Chest' },
    description: { fr: '3 jours de discipline', en: '3 days of discipline' },
    requiredDays: 3,
    rarity: 'common',
    icon: '📦',
    reward: { type: 'badge', value: 'Disciplined Starter' },
  },
  {
    id: 'chest_7_days',
    name: { fr: 'Coffre de Bronze', en: 'Bronze Chest' },
    description: { fr: '7 jours de discipline', en: '7 days of discipline' },
    requiredDays: 7,
    rarity: 'common',
    icon: '🥉',
    reward: { type: 'points', value: 100 },
  },
  {
    id: 'chest_14_days',
    name: { fr: 'Coffre d\'Argent', en: 'Silver Chest' },
    description: { fr: '14 jours de discipline', en: '14 days of discipline' },
    requiredDays: 14,
    rarity: 'rare',
    icon: '🥈',
    reward: { type: 'badge', value: 'Consistent Trader' },
  },
  {
    id: 'chest_21_days',
    name: { fr: 'Coffre d\'Or', en: 'Gold Chest' },
    description: { fr: '21 jours de discipline', en: '21 days of discipline' },
    requiredDays: 21,
    rarity: 'rare',
    icon: '🥇',
    reward: { type: 'points', value: 500 },
  },
  {
    id: 'chest_30_days',
    name: { fr: 'Coffre Épique', en: 'Epic Chest' },
    description: { fr: '30 jours de discipline', en: '30 days of discipline' },
    requiredDays: 30,
    rarity: 'epic',
    icon: '💎',
    reward: { type: 'title', value: 'Master of Discipline' },
  },
  {
    id: 'chest_60_days',
    name: { fr: 'Coffre Légendaire', en: 'Legendary Chest' },
    description: { fr: '60 jours de discipline', en: '60 days of discipline' },
    requiredDays: 60,
    rarity: 'legendary',
    icon: '👑',
    reward: { type: 'badge', value: 'Trading Legend' },
  },
  {
    id: 'chest_100_days',
    name: { fr: 'Coffre Mythique', en: 'Mythic Chest' },
    description: { fr: '100 jours de discipline', en: '100 days of discipline' },
    requiredDays: 100,
    rarity: 'legendary',
    icon: '🏆',
    reward: { type: 'title', value: 'Trading God' },
  },
];

export const useRewardChests = (trades: Trade[]) => {
  const disciplineScore = useDisciplineScore(trades);

  return useMemo(() => {
    const currentStreak = disciplineScore.bestStreak;
    
    const chests: RewardChest[] = REWARD_CHESTS.map(chest => ({
      ...chest,
      unlocked: currentStreak >= chest.requiredDays,
      unlockedAt: currentStreak >= chest.requiredDays ? new Date().toISOString() : undefined,
    }));

    const unlockedChests = chests.filter(c => c.unlocked);
    const nextChest = chests.find(c => !c.unlocked);
    const progress = nextChest 
      ? Math.round((currentStreak / nextChest.requiredDays) * 100)
      : 100;

    return {
      chests,
      unlockedChests,
      lockedChests: chests.filter(c => !c.unlocked),
      nextChest,
      currentStreak,
      progress,
      totalUnlocked: unlockedChests.length,
    };
  }, [disciplineScore.bestStreak]);
};
