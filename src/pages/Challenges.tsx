import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenges, USER_LEVELS } from '@/hooks/useChallenges';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  Flame,
  Star,
  Medal,
  Crown,
  Zap,
  TrendingUp,
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';

const iconMap: { [key: string]: React.ElementType } = {
  Trophy,
  Target,
  Flame,
  Star,
  Medal,
  Crown,
  Zap,
  TrendingUp,
  Shield,
};

const Challenges: React.FC = () => {
  const { language, t } = useLanguage();
  const { profile } = useAuth();
  const {
    challenges,
    isLoading,
    currentLevel,
    nextLevel,
    progressToNextLevel,
    totalPoints,
    syncAllChallenges
  } = useChallenges();

  const [showCongrats, setShowCongrats] = useState(false);
  const [completedChallenge, setCompletedChallenge] = useState<typeof challenges[0] | null>(null);
  const [syncedChallenges, setSyncedChallenges] = useState<Set<string>>(new Set());

  // Sync challenges on mount and when trades change
  useEffect(() => {
    if (!isLoading && challenges.length > 0) {
      syncAllChallenges();
    }
  }, [challenges.length, isLoading]);

  // Check for newly completed challenges
  useEffect(() => {
    const newlyCompleted = challenges.find(c => 
      c.isNewlyCompleted && !syncedChallenges.has(c.id)
    );
    
    if (newlyCompleted) {
      setCompletedChallenge(newlyCompleted);
      setShowCongrats(true);
      setSyncedChallenges(prev => new Set([...prev, newlyCompleted.id]));
    }
  }, [challenges, syncedChallenges]);

  const completedCount = challenges.filter(c => c.completed).length;

  const difficultyColors = {
    easy: 'bg-profit/20 text-profit border-profit/30',
    medium: 'bg-primary/20 text-primary border-primary/30',
    hard: 'bg-loss/20 text-loss border-loss/30',
    expert: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const difficultyLabels = {
    easy: { fr: 'Facile', en: 'Easy' },
    medium: { fr: 'Moyen', en: 'Medium' },
    hard: { fr: 'Difficile', en: 'Hard' },
    expert: { fr: 'Expert', en: 'Expert' },
  };

  if (isLoading) {
    return (
      <div className="py-4 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-primary">
          {t('loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Congratulations Popup */}
      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="bg-background border-border text-center w-[calc(100%-2rem)] max-w-md mx-auto rounded-xl">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-primary flex items-center justify-center animate-pulse-neon">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-display text-center">
              🎉 {t('congratulations')}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 sm:py-4">
            <p className="text-base sm:text-lg text-foreground mb-2">
              {t('youHaveCompleted')}:
            </p>
            <p className="text-lg sm:text-xl font-display font-bold text-primary mb-4 break-words">
              {completedChallenge && (language === 'fr' ? completedChallenge.title : completedChallenge.titleEn)}
            </p>
            <p className="text-muted-foreground text-sm sm:text-base break-words">
              {t('reward')}: {completedChallenge?.reward}
            </p>
            <p className="text-profit font-bold mt-2">
              +{completedChallenge?.points} points!
            </p>
          </div>
          <Button
            onClick={() => setShowCongrats(false)}
            className="w-full bg-gradient-primary hover:opacity-90 font-display touch-target"
          >
            {t('continue')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            {t('challenges')}
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 break-words">
            {t('challengesTakeOn')}
          </p>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon shrink-0">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
        </div>
      </div>

      {/* User Level Card - Mobile Optimized */}
      <div className="glass-card p-4 sm:p-6 animate-fade-in w-full">
        <div className="flex flex-col items-center gap-4 sm:gap-6">
          {/* Level Badge */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon animate-pulse-neon">
              <span className="text-3xl sm:text-4xl">{currentLevel.badge}</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold whitespace-nowrap">
              {t('niv')} {currentLevel.level}
            </div>
          </div>

          {/* Level Info */}
          <div className="w-full text-center">
            <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words">
              {language === 'fr' ? currentLevel.title : currentLevel.titleEn}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm mb-4">
              {totalPoints} {t('points')} • {completedCount} {t('challengesCompleted')}
            </p>
            
            {nextLevel && (
              <div className="space-y-2 w-full">
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span className="truncate max-w-[40%]">{language === 'fr' ? currentLevel.title : currentLevel.titleEn}</span>
                  <span className="truncate max-w-[40%] text-right">{language === 'fr' ? nextLevel.title : nextLevel.titleEn}</span>
                </div>
                <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressToNextLevel}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {nextLevel.minPoints - totalPoints} {t('pointsRemaining')}
                </p>
              </div>
            )}
          </div>

          {/* Stats - Horizontal on mobile */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full text-center">
            <div className="glass-card p-2 sm:p-3 rounded-lg">
              <p className="font-display text-lg sm:text-xl md:text-2xl font-bold text-profit">{completedCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {t('completedLabel')}
              </p>
            </div>
            <div className="glass-card p-2 sm:p-3 rounded-lg">
              <p className="font-display text-lg sm:text-xl md:text-2xl font-bold text-primary">
                {challenges.length - completedCount}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {t('inProgress')}
              </p>
            </div>
            <div className="glass-card p-2 sm:p-3 rounded-lg">
              <p className="font-display text-lg sm:text-xl md:text-2xl font-bold text-foreground">{challenges.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges by Difficulty */}
      {(['easy', 'medium', 'hard', 'expert'] as const).map((difficulty, sectionIndex) => {
        const sectionChallenges = challenges.filter(c => c.difficulty === difficulty);
        if (sectionChallenges.length === 0) return null;

        return (
          <div key={difficulty} className="space-y-3 sm:space-y-4 w-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={cn(
                "px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border whitespace-nowrap shrink-0",
                difficultyColors[difficulty]
              )}>
                {difficultyLabels[difficulty][language]}
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 w-full">
              {sectionChallenges.map((challenge, index) => {
                const Icon = iconMap[challenge.icon] || Target;
                const progressPercent = (challenge.progress / challenge.target) * 100;

                return (
                  <div
                    key={challenge.id}
                    className={cn(
                      "glass-card-hover p-3 sm:p-4 md:p-5 relative overflow-hidden animate-fade-in w-full",
                      challenge.completed && "border-profit/30"
                    )}
                    style={{ animationDelay: `${(sectionIndex * 100) + (index * 50)}ms` }}
                  >
                    {/* Completed overlay */}
                    {challenge.completed && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-profit animate-scale-in" />
                      </div>
                    )}

                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0",
                        challenge.completed ? "bg-profit/20" : "bg-primary/20"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6",
                          challenge.completed ? "text-profit" : "text-primary"
                        )} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Info */}
                        <h3 className="font-display font-semibold text-foreground mb-1 text-sm sm:text-base break-words pr-6">
                          {language === 'fr' ? challenge.title : challenge.titleEn}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 break-words">
                          {language === 'fr' ? challenge.description : challenge.descriptionEn}
                        </p>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] sm:text-xs">
                            <span className="text-muted-foreground">
                              {t('progress')}
                            </span>
                            <span className={cn(
                              "font-medium",
                              challenge.completed ? "text-profit" : "text-primary"
                            )}>
                              {challenge.progress}/{challenge.target}
                            </span>
                          </div>
                          <div className="relative h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
                                challenge.completed ? "bg-profit" : "bg-gradient-primary"
                              )}
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Reward */}
                        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border flex flex-wrap items-center justify-between gap-1">
                          <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
                            {t('reward')}: 
                            <span className="text-foreground ml-1">{challenge.reward}</span>
                          </p>
                          <span className="text-[10px] sm:text-xs font-bold text-profit whitespace-nowrap">
                            +{challenge.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Level Roadmap - Mobile Optimized */}
      <div className="glass-card p-4 sm:p-6 animate-fade-in w-full" style={{ animationDelay: '500ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-4 sm:mb-6 text-sm sm:text-base">
          {t('levelProgression')}
        </h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin -mx-4 px-4 sm:mx-0 sm:px-0">
          {USER_LEVELS.map((level, index) => {
            const isCurrentLevel = level.level === currentLevel.level;
            const isUnlocked = totalPoints >= level.minPoints;

            return (
              <React.Fragment key={level.level}>
                <div className={cn(
                  "flex flex-col items-center min-w-[60px] sm:min-w-[70px] md:min-w-[80px] p-2 sm:p-3 rounded-lg transition-all shrink-0",
                  isCurrentLevel && "bg-primary/20 border border-primary/50 shadow-neon",
                  !isCurrentLevel && isUnlocked && "bg-secondary/30",
                  !isUnlocked && "opacity-50"
                )}>
                  <span className="text-xl sm:text-2xl mb-1">{level.badge}</span>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] md:text-xs font-medium text-center leading-tight",
                    isCurrentLevel ? "text-primary" : isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {language === 'fr' ? level.title : level.titleEn}
                  </span>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground">
                    {level.minPoints}pts
                  </span>
                  {!isUnlocked && (
                    <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground mt-1" />
                  )}
                </div>
                {index < USER_LEVELS.length - 1 && (
                  <div className={cn(
                    "w-4 sm:w-6 md:w-8 h-0.5 shrink-0",
                    isUnlocked ? "bg-primary" : "bg-border"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Challenges;
