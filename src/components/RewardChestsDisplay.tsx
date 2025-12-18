import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRewardChests, RewardChest } from '@/hooks/useRewardChests';
import { Trade } from '@/hooks/useTrades';
import { Gift, Lock, Unlock, Trophy, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface RewardChestsDisplayProps {
  trades: Trade[];
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

const RARITY_BORDERS = {
  common: 'border-gray-500/30',
  rare: 'border-blue-500/30',
  epic: 'border-purple-500/30',
  legendary: 'border-yellow-500/30',
};

const RARITY_GLOW = {
  common: '',
  rare: 'shadow-blue-500/20',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-yellow-500/40',
};

const RewardChestsDisplay: React.FC<RewardChestsDisplayProps> = ({ trades }) => {
  const { language } = useLanguage();
  const { chests, nextChest, currentStreak, progress, totalUnlocked } = useRewardChests(trades);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Gift className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Coffres de Récompenses' : 'Reward Chests'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Débloqués par la discipline' : 'Unlocked by discipline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {currentStreak} {language === 'fr' ? 'jours' : 'days'}
          </span>
        </div>
      </div>

      {/* Progress to next chest */}
      {nextChest && (
        <div className="mb-4 p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {language === 'fr' ? 'Prochain coffre' : 'Next chest'}
            </span>
            <span className="text-sm font-medium text-foreground">
              {nextChest.name[language as 'fr' | 'en']}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {currentStreak}/{nextChest.requiredDays} {language === 'fr' ? 'jours' : 'days'}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-muted-foreground">
          {language === 'fr' ? 'Coffres débloqués' : 'Chests unlocked'}
        </span>
        <span className="font-medium text-foreground">
          {totalUnlocked}/{chests.length}
        </span>
      </div>

      {/* Chests Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {chests.map((chest) => (
          <ChestItem key={chest.id} chest={chest} language={language} />
        ))}
      </div>
    </div>
  );
};

interface ChestItemProps {
  chest: RewardChest;
  language: string;
}

const ChestItem: React.FC<ChestItemProps> = ({ chest, language }) => {
  return (
    <div
      className={cn(
        "relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all",
        RARITY_BORDERS[chest.rarity],
        chest.unlocked 
          ? `bg-gradient-to-br ${RARITY_COLORS[chest.rarity]} shadow-lg ${RARITY_GLOW[chest.rarity]}`
          : "bg-secondary/30 opacity-50"
      )}
      title={`${chest.name[language as 'fr' | 'en']} - ${chest.description[language as 'fr' | 'en']}`}
    >
      <span className="text-lg">{chest.icon}</span>
      {!chest.unlocked && (
        <Lock className="w-3 h-3 text-muted-foreground absolute bottom-1 right-1" />
      )}
      {chest.unlocked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-profit flex items-center justify-center">
          <Unlock className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      <span className="text-[8px] text-center text-white/80 mt-0.5 leading-tight">
        {chest.requiredDays}j
      </span>
    </div>
  );
};

export default RewardChestsDisplay;
