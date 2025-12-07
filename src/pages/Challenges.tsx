import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
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
  Award,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  icon: React.ElementType;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  completed: boolean;
  reward: string;
}

const CHALLENGES: Challenge[] = [
  // Easy
  {
    id: '1',
    title: 'Premier Pas',
    description: 'Enregistrez votre premier trade',
    progress: 1,
    target: 1,
    icon: Target,
    difficulty: 'easy',
    completed: true,
    reward: '🎯 Badge Premier Trade',
  },
  {
    id: '2',
    title: 'Semaine Active',
    description: 'Tradez 5 jours consécutifs',
    progress: 3,
    target: 5,
    icon: Flame,
    difficulty: 'easy',
    completed: false,
    reward: '🔥 Badge Régularité',
  },
  {
    id: '3',
    title: 'Journal Parfait',
    description: 'Complétez votre journal 7 jours de suite',
    progress: 5,
    target: 7,
    icon: Star,
    difficulty: 'easy',
    completed: false,
    reward: '⭐ Badge Discipline',
  },
  // Medium
  {
    id: '4',
    title: 'Série Gagnante',
    description: 'Enchaînez 5 trades gagnants',
    progress: 3,
    target: 5,
    icon: TrendingUp,
    difficulty: 'medium',
    completed: false,
    reward: '📈 Badge Momentum',
  },
  {
    id: '5',
    title: 'Risk Master',
    description: 'Maintenez un risque < 2% pendant 20 trades',
    progress: 14,
    target: 20,
    icon: Shield,
    difficulty: 'medium',
    completed: false,
    reward: '🛡️ Badge Prudence',
  },
  {
    id: '6',
    title: 'Profit Factor',
    description: 'Atteignez un Profit Factor de 2.0',
    progress: 1.8,
    target: 2.0,
    icon: Zap,
    difficulty: 'medium',
    completed: false,
    reward: '⚡ Badge Performance',
  },
  // Hard
  {
    id: '7',
    title: 'Centurion',
    description: 'Atteignez 100 trades enregistrés',
    progress: 78,
    target: 100,
    icon: Medal,
    difficulty: 'hard',
    completed: false,
    reward: '🏅 Badge Expérience',
  },
  {
    id: '8',
    title: 'Winrate Elite',
    description: 'Maintenez un winrate > 60% sur 50 trades',
    progress: 32,
    target: 50,
    icon: Trophy,
    difficulty: 'hard',
    completed: false,
    reward: '🏆 Badge Excellence',
  },
  // Expert
  {
    id: '9',
    title: 'Légende du Trading',
    description: 'Atteignez 1000 trades avec un winrate > 55%',
    progress: 142,
    target: 1000,
    icon: Crown,
    difficulty: 'expert',
    completed: false,
    reward: '👑 Titre Légende',
  },
];

const USER_LEVELS = [
  { level: 1, title: 'Débutant', minPoints: 0, badge: '🌱' },
  { level: 2, title: 'Apprenti', minPoints: 100, badge: '📚' },
  { level: 3, title: 'Trader', minPoints: 300, badge: '📊' },
  { level: 4, title: 'Confirmé', minPoints: 600, badge: '💪' },
  { level: 5, title: 'Expert', minPoints: 1000, badge: '🎯' },
  { level: 6, title: 'Maître', minPoints: 2000, badge: '⭐' },
  { level: 7, title: 'Champion', minPoints: 5000, badge: '🏆' },
  { level: 8, title: 'Légende', minPoints: 10000, badge: '👑' },
];

const Challenges: React.FC = () => {
  const { t } = useLanguage();

  // Mock user data
  const userPoints = 450;
  const currentLevel = USER_LEVELS.find((l, i) => 
    userPoints >= l.minPoints && (USER_LEVELS[i + 1] ? userPoints < USER_LEVELS[i + 1].minPoints : true)
  ) || USER_LEVELS[0];
  const nextLevel = USER_LEVELS[USER_LEVELS.indexOf(currentLevel) + 1];
  const progressToNext = nextLevel 
    ? ((userPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100 
    : 100;

  const completedChallenges = CHALLENGES.filter(c => c.completed).length;

  const difficultyColors = {
    easy: 'bg-profit/20 text-profit border-profit/30',
    medium: 'bg-primary/20 text-primary border-primary/30',
    hard: 'bg-loss/20 text-loss border-loss/30',
    expert: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  const difficultyLabels = {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    expert: 'Expert',
  };

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('challenges')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Relevez des défis et montez en niveau
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <Trophy className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* User Level Card */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Level Badge */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center shadow-neon animate-pulse-neon">
              <span className="text-4xl">{currentLevel.badge}</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              Niv. {currentLevel.level}
            </div>
          </div>

          {/* Level Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-display text-2xl font-bold text-foreground">
              {currentLevel.title}
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              {userPoints} points • {completedChallenges} défis complétés
            </p>
            
            {nextLevel && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currentLevel.title}</span>
                  <span>{nextLevel.title}</span>
                </div>
                <Progress value={progressToNext} className="h-3" />
                <p className="text-xs text-muted-foreground text-center">
                  {nextLevel.minPoints - userPoints} points restants
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-display text-2xl font-bold text-profit">{completedChallenges}</p>
              <p className="text-xs text-muted-foreground">Complétés</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-primary">{CHALLENGES.length - completedChallenges}</p>
              <p className="text-xs text-muted-foreground">En cours</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground">{CHALLENGES.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges by Difficulty */}
      {(['easy', 'medium', 'hard', 'expert'] as const).map((difficulty, sectionIndex) => {
        const sectionChallenges = CHALLENGES.filter(c => c.difficulty === difficulty);
        if (sectionChallenges.length === 0) return null;

        return (
          <div key={difficulty} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                difficultyColors[difficulty]
              )}>
                {difficultyLabels[difficulty]}
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionChallenges.map((challenge, index) => {
                const Icon = challenge.icon;
                const progress = (challenge.progress / challenge.target) * 100;

                return (
                  <div
                    key={challenge.id}
                    className={cn(
                      "glass-card-hover p-5 relative overflow-hidden animate-fade-in",
                      challenge.completed && "border-profit/30"
                    )}
                    style={{ animationDelay: `${(sectionIndex * 100) + (index * 50)}ms` }}
                  >
                    {/* Completed overlay */}
                    {challenge.completed && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-6 h-6 text-profit" />
                      </div>
                    )}

                    {/* Icon */}
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
                      challenge.completed ? "bg-profit/20" : "bg-primary/20"
                    )}>
                      <Icon className={cn(
                        "w-6 h-6",
                        challenge.completed ? "text-profit" : "text-primary"
                      )} />
                    </div>

                    {/* Info */}
                    <h3 className="font-display font-semibold text-foreground mb-1">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {challenge.description}
                    </p>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progression</span>
                        <span className={cn(
                          "font-medium",
                          challenge.completed ? "text-profit" : "text-primary"
                        )}>
                          {challenge.progress}/{challenge.target}
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={cn(
                          "h-2",
                          challenge.completed && "[&>div]:bg-profit"
                        )} 
                      />
                    </div>

                    {/* Reward */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Récompense: <span className="text-foreground">{challenge.reward}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Level Roadmap */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
        <h3 className="font-display font-semibold text-foreground mb-6">Progression des Niveaux</h3>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {USER_LEVELS.map((level, index) => {
            const isCurrentLevel = level.level === currentLevel.level;
            const isUnlocked = userPoints >= level.minPoints;

            return (
              <React.Fragment key={level.level}>
                <div className={cn(
                  "flex flex-col items-center min-w-[80px] p-3 rounded-lg transition-all",
                  isCurrentLevel && "bg-primary/20 border border-primary/50 shadow-neon",
                  !isCurrentLevel && isUnlocked && "bg-secondary/30",
                  !isUnlocked && "opacity-50"
                )}>
                  <span className="text-2xl mb-1">{level.badge}</span>
                  <span className={cn(
                    "text-xs font-medium",
                    isCurrentLevel ? "text-primary" : isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {level.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {level.minPoints}pts
                  </span>
                  {!isUnlocked && (
                    <Lock className="w-3 h-3 text-muted-foreground mt-1" />
                  )}
                </div>
                {index < USER_LEVELS.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5",
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
