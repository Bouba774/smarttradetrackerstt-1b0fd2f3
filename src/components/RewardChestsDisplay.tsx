import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRewardChests, RewardChest } from '@/hooks/useRewardChests';
import { Trade } from '@/hooks/useTrades';
import { Gift, Lock, Unlock, Flame, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

const RARITY_BG = {
  common: 'from-gray-500/20 to-gray-700/20',
  rare: 'from-blue-500/20 to-blue-700/20',
  epic: 'from-purple-500/20 to-purple-700/20',
  legendary: 'from-yellow-500/20 to-orange-500/20',
};

const RewardChestsDisplay: React.FC<RewardChestsDisplayProps> = ({ trades }) => {
  const { language } = useLanguage();
  const { chests, nextChest, currentStreak, progress, totalUnlocked } = useRewardChests(trades);
  const [newlyUnlocked, setNewlyUnlocked] = useState<RewardChest | null>(null);
  const [previousUnlocked, setPreviousUnlocked] = useState<string[]>([]);

  // Detect newly unlocked chests
  useEffect(() => {
    const unlockedIds = chests.filter(c => c.unlocked).map(c => c.id);
    const newUnlock = unlockedIds.find(id => !previousUnlocked.includes(id));
    
    if (newUnlock && previousUnlocked.length > 0) {
      const chest = chests.find(c => c.id === newUnlock);
      if (chest) {
        setNewlyUnlocked(chest);
      }
    }
    
    setPreviousUnlocked(unlockedIds);
  }, [chests]);

  return (
    <>
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center animate-pulse">
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
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
            <Flame className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {currentStreak} {language === 'fr' ? 'jours' : 'days'}
            </span>
          </div>
        </div>

        {/* Progress to next chest */}
        {nextChest && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-secondary/30 to-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {language === 'fr' ? 'Prochain coffre' : 'Next chest'}
              </span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1">
                <span className="text-lg">{nextChest.icon}</span>
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
          {chests.map((chest, index) => (
            <ChestItem 
              key={chest.id} 
              chest={chest} 
              language={language} 
              index={index}
              isNew={newlyUnlocked?.id === chest.id}
            />
          ))}
        </div>
      </div>

      {/* Unlock celebration modal */}
      <Dialog open={!!newlyUnlocked} onOpenChange={() => setNewlyUnlocked(null)}>
        <DialogContent className="bg-gradient-to-br from-background to-secondary/50 border-primary/30 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-xl">
              {language === 'fr' ? '🎉 Coffre Débloqué !' : '🎉 Chest Unlocked!'}
            </DialogTitle>
          </DialogHeader>
          
          {newlyUnlocked && (
            <div className="flex flex-col items-center py-6 space-y-4">
              {/* Animated chest */}
              <div className={cn(
                "relative w-24 h-24 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br",
                RARITY_COLORS[newlyUnlocked.rarity],
                "animate-bounce shadow-2xl",
                newlyUnlocked.rarity === 'legendary' && "shadow-yellow-500/50",
                newlyUnlocked.rarity === 'epic' && "shadow-purple-500/50",
                newlyUnlocked.rarity === 'rare' && "shadow-blue-500/50"
              )}>
                <span className="text-5xl">{newlyUnlocked.icon}</span>
                
                {/* Sparkles */}
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                <Star className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-400 animate-spin" />
                <Sparkles className="absolute top-0 left-0 w-4 h-4 text-white/80 animate-ping" />
              </div>
              
              {/* Chest name and description */}
              <div className="text-center space-y-2">
                <h3 className="font-display text-2xl font-bold text-foreground">
                  {newlyUnlocked.name[language as 'fr' | 'en']}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {newlyUnlocked.description[language as 'fr' | 'en']}
                </p>
                <div className={cn(
                  "inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider",
                  newlyUnlocked.rarity === 'common' && "bg-gray-500/20 text-gray-400",
                  newlyUnlocked.rarity === 'rare' && "bg-blue-500/20 text-blue-400",
                  newlyUnlocked.rarity === 'epic' && "bg-purple-500/20 text-purple-400",
                  newlyUnlocked.rarity === 'legendary' && "bg-yellow-500/20 text-yellow-400"
                )}>
                  {newlyUnlocked.rarity}
                </div>
              </div>
              
              {/* Reward */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-profit/20 border border-profit/30">
                <span className="text-profit font-bold">
                  {newlyUnlocked.reward.type === 'points' 
                    ? `+${newlyUnlocked.reward.value}` 
                    : newlyUnlocked.reward.value}
                </span>
                <span className="text-sm text-muted-foreground">
                  {newlyUnlocked.reward.type === 'points' 
                    ? (language === 'fr' ? 'points' : 'points')
                    : newlyUnlocked.reward.type === 'badge' 
                      ? (language === 'fr' ? 'badge' : 'badge')
                      : (language === 'fr' ? 'titre' : 'title')}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

interface ChestItemProps {
  chest: RewardChest;
  language: string;
  index: number;
  isNew?: boolean;
}

const ChestItem: React.FC<ChestItemProps> = ({ chest, language, index, isNew }) => {
  return (
    <div
      className={cn(
        "relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all duration-300",
        RARITY_BORDERS[chest.rarity],
        chest.unlocked 
          ? `bg-gradient-to-br ${RARITY_COLORS[chest.rarity]} shadow-lg ${RARITY_GLOW[chest.rarity]}`
          : "bg-secondary/30 opacity-50 hover:opacity-70",
        chest.unlocked && "hover:scale-110 cursor-pointer",
        isNew && "animate-bounce ring-2 ring-yellow-400 ring-offset-2 ring-offset-background"
      )}
      style={{ 
        animationDelay: `${index * 50}ms`,
      }}
      title={`${chest.name[language as 'fr' | 'en']} - ${chest.description[language as 'fr' | 'en']}`}
    >
      <span className={cn(
        "text-lg transition-transform",
        chest.unlocked && "hover:scale-125"
      )}>
        {chest.icon}
      </span>
      {!chest.unlocked && (
        <Lock className="w-3 h-3 text-muted-foreground absolute bottom-1 right-1" />
      )}
      {chest.unlocked && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-profit flex items-center justify-center animate-pulse">
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
