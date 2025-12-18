import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useExecutionQuality } from '@/hooks/useExecutionQuality';
import { useTraderProfile } from '@/hooks/useTraderProfile';
import { useMentalFatigue } from '@/hooks/useMentalFatigue';
import { useEmotionalMemory } from '@/hooks/useEmotionalMemory';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import GaugeChart from '@/components/ui/GaugeChart';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  Zap,
  Loader2,
  Activity,
  User,
  Coffee,
  Heart,
  Lightbulb,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { parseISO, getDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PsychologicalAnalysis: React.FC = () => {
  const { language, t } = useLanguage();
  const { trades, isLoading } = useTrades();
  
  // New hooks
  const executionQuality = useExecutionQuality(trades, language);
  const traderProfile = useTraderProfile(trades, language);
  const mentalFatigue = useMentalFatigue(trades, language);
  const emotionalMemory = useEmotionalMemory(trades, language);

  // Calculate emotion statistics from real data
  const emotionStats = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const stats: Record<string, { wins: number; losses: number; trades: number }> = {};
    
    trades.forEach(trade => {
      const emotion = trade.emotions || 'Neutre';
      if (!stats[emotion]) stats[emotion] = { wins: 0, losses: 0, trades: 0 };
      stats[emotion].trades++;
      if (trade.result === 'win') stats[emotion].wins++;
      if (trade.result === 'loss') stats[emotion].losses++;
    });

    return Object.entries(stats).map(([emotion, data]) => ({
      emotion,
      wins: data.trades > 0 ? Math.round((data.wins / data.trades) * 100) : 0,
      losses: data.trades > 0 ? Math.round((data.losses / data.trades) * 100) : 0,
      trades: data.trades,
    })).sort((a, b) => b.trades - a.trades);
  }, [trades]);

  // Calculate emotion distribution with unique colors for all emotions
  const emotionDistribution = useMemo(() => {
    if (!trades || trades.length === 0) return [];

    const counts: Record<string, number> = {};
    trades.forEach(trade => {
      const emotion = trade.emotions || 'Neutre';
      counts[emotion] = (counts[emotion] || 0) + 1;
    });

    const colorPalette: Record<string, string> = {
      'Calme': 'hsl(142, 76%, 36%)',
      'Confiant': 'hsl(217, 91%, 60%)',
      'Stressé': 'hsl(0, 84%, 60%)',
      'Impulsif': 'hsl(30, 100%, 50%)',
      'Euphorique': 'hsl(280, 87%, 65%)',
      'Fatigué': 'hsl(45, 93%, 47%)',
      'Frustré': 'hsl(350, 89%, 60%)',
      'Concentré': 'hsl(190, 90%, 50%)',
      'Anxieux': 'hsl(320, 70%, 50%)',
      'Neutre': 'hsl(220, 9%, 46%)',
    };

    const usedHues: number[] = Object.values(colorPalette).map(c => {
      const match = c.match(/hsl\((\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    
    let hueIndex = 0;
    const getColor = (emotion: string): string => {
      if (colorPalette[emotion]) return colorPalette[emotion];
      let hue = (hueIndex * 47 + 60) % 360;
      while (usedHues.includes(hue)) {
        hue = (hue + 30) % 360;
      }
      hueIndex++;
      usedHues.push(hue);
      return `hsl(${hue}, 70%, 55%)`;
    };

    const total = trades.length;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      color: getColor(name),
    })).sort((a, b) => b.value - a.value);
  }, [trades]);

  // Calculate weekly emotion trends with all emotions
  const weeklyEmotionsByType = useMemo(() => {
    if (!trades || trades.length === 0) return { emotions: [], chartData: [] };

    const days = language === 'fr' ? DAYS_FR : DAYS_EN;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const allEmotions = new Set<string>();
    const dayData: Record<number, Record<string, number>> = {};
    const dayTotals: Record<number, number> = {};
    
    for (let i = 0; i < 7; i++) {
      dayData[i] = {};
      dayTotals[i] = 0;
    }

    trades.forEach(trade => {
      const tradeDate = parseISO(trade.trade_date);
      if (isWithinInterval(tradeDate, { start: weekStart, end: weekEnd })) {
        const dayIndex = getDay(tradeDate);
        const emotion = trade.emotions || 'Neutre';
        allEmotions.add(emotion);
        dayData[dayIndex][emotion] = (dayData[dayIndex][emotion] || 0) + 1;
        dayTotals[dayIndex]++;
      }
    });

    const emotions = Array.from(allEmotions);
    
    const colorPalette: Record<string, string> = {
      'Calme': 'hsl(142, 76%, 36%)',
      'Confiant': 'hsl(217, 91%, 60%)',
      'Stressé': 'hsl(0, 84%, 60%)',
      'Impulsif': 'hsl(30, 100%, 50%)',
      'Euphorique': 'hsl(280, 87%, 65%)',
      'Fatigué': 'hsl(45, 93%, 47%)',
      'Frustré': 'hsl(350, 89%, 60%)',
      'Concentré': 'hsl(190, 90%, 50%)',
      'Anxieux': 'hsl(320, 70%, 50%)',
      'Neutre': 'hsl(220, 9%, 46%)',
    };

    const getColor = (emotion: string, index: number): string => {
      if (colorPalette[emotion]) return colorPalette[emotion];
      const hue = (index * 47 + 60) % 360;
      return `hsl(${hue}, 70%, 55%)`;
    };

    const chartData = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
      const result: Record<string, any> = { day: days[dayIndex] };
      emotions.forEach(emotion => {
        result[emotion] = dayTotals[dayIndex] > 0 
          ? Math.round(((dayData[dayIndex][emotion] || 0) / dayTotals[dayIndex]) * 100) 
          : 0;
      });
      return result;
    });

    return { 
      emotions: emotions.map((e, i) => ({ name: e, color: getColor(e, i) })), 
      chartData 
    };
  }, [trades, language]);

  // Calculate discipline score
  const disciplineBreakdown = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        score: 0,
        factors: [
          { name: language === 'fr' ? 'Respect du plan' : 'Following plan', score: 0, icon: Target },
          { name: language === 'fr' ? 'Gestion du risque' : 'Risk management', score: 0, icon: Zap },
          { name: language === 'fr' ? 'Pas d\'overtrading' : 'No overtrading', score: 0, icon: AlertTriangle },
          { name: language === 'fr' ? 'SL toujours en place' : 'SL always set', score: 0, icon: CheckCircle2 },
          { name: language === 'fr' ? 'Pas de revenge trading' : 'No revenge trading', score: 0, icon: TrendingDown },
        ],
      };
    }

    const tradesWithSL = trades.filter(t => t.stop_loss).length;
    const tradesWithTP = trades.filter(t => t.take_profit).length;
    const tradesWithSetup = trades.filter(t => t.setup).length;
    
    const slScore = Math.round((tradesWithSL / trades.length) * 100);
    const tpScore = Math.round((tradesWithTP / trades.length) * 100);
    const setupScore = Math.round((tradesWithSetup / trades.length) * 100);
    
    const tradesByDay: Record<string, number> = {};
    trades.forEach(t => {
      const day = t.trade_date.split('T')[0];
      tradesByDay[day] = (tradesByDay[day] || 0) + 1;
    });
    const avgTradesPerDay = Object.values(tradesByDay).length > 0
      ? Object.values(tradesByDay).reduce((a, b) => a + b, 0) / Object.values(tradesByDay).length
      : 0;
    const overtradingScore = Math.max(0, 100 - (avgTradesPerDay > 5 ? (avgTradesPerDay - 5) * 20 : 0));

    const calmTrades = trades.filter(t => t.emotions === 'Calme' || t.emotions === 'Confiant').length;
    const revengeScore = Math.round((calmTrades / trades.length) * 100);

    const overallScore = Math.round((slScore + tpScore + setupScore + overtradingScore + revengeScore) / 5);

    return {
      score: overallScore,
      factors: [
        { name: language === 'fr' ? 'Respect du plan' : 'Following plan', score: setupScore, icon: Target },
        { name: language === 'fr' ? 'Gestion du risque' : 'Risk management', score: tpScore, icon: Zap },
        { name: language === 'fr' ? 'Pas d\'overtrading' : 'No overtrading', score: Math.round(overtradingScore), icon: AlertTriangle },
        { name: language === 'fr' ? 'SL toujours en place' : 'SL always set', score: slScore, icon: CheckCircle2 },
        { name: language === 'fr' ? 'Pas de revenge trading' : 'No revenge trading', score: revengeScore, icon: TrendingDown },
      ],
    };
  }, [trades, language]);

  // Generate mental summary based on data
  const mentalSummary = useMemo(() => {
    if (!trades || trades.length === 0) {
      return { positives: [], negatives: [] };
    }

    const positives: string[] = [];
    const negatives: string[] = [];

    const tradesWithSL = trades.filter(t => t.stop_loss).length;
    if (tradesWithSL / trades.length >= 0.8) {
      positives.push(language === 'fr' ? 'Excellente gestion du risque avec SL' : 'Excellent risk management with SL');
    } else if (tradesWithSL / trades.length < 0.5) {
      negatives.push(language === 'fr' ? 'Améliorer l\'utilisation du Stop Loss' : 'Improve Stop Loss usage');
    }

    const calmTrades = trades.filter(t => t.emotions === 'Calme').length;
    if (calmTrades / trades.length >= 0.5) {
      positives.push(language === 'fr' ? 'Bonne maîtrise émotionnelle' : 'Good emotional control');
    }

    const stressedTrades = trades.filter(t => t.emotions === 'Stressé' || t.emotions === 'Impulsif').length;
    if (stressedTrades / trades.length >= 0.3) {
      negatives.push(language === 'fr' ? 'Tendance au trading sous stress' : 'Tendency to trade under stress');
    }

    const winrate = trades.filter(t => t.result === 'win').length / trades.length;
    if (winrate >= 0.6) {
      positives.push(language === 'fr' ? 'Excellent taux de réussite' : 'Excellent win rate');
    } else if (winrate < 0.4) {
      negatives.push(language === 'fr' ? 'Revoir la stratégie d\'entrée' : 'Review entry strategy');
    }

    if (positives.length === 0) {
      positives.push(language === 'fr' ? 'Continuez à trader pour générer des insights' : 'Continue trading to generate insights');
    }
    if (negatives.length === 0) {
      negatives.push(language === 'fr' ? 'Aucun point d\'amélioration majeur détecté' : 'No major improvement points detected');
    }

    return { positives, negatives };
  }, [trades, language]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasNoData = !trades || trades.length === 0;

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('psychology')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('understandEmotionsImpact')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <Brain className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {hasNoData ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            {t('noData')}
          </h3>
          <p className="text-muted-foreground">
            {t('addTradesWithEmotions')}
          </p>
        </div>
      ) : (
        <>
          {/* Mental Fatigue Alert */}
          {mentalFatigue.shouldPause && (
            <div className={cn(
              "p-4 rounded-lg border animate-pulse",
              mentalFatigue.level === 'critical' 
                ? "bg-loss/20 border-loss/50" 
                : "bg-yellow-500/20 border-yellow-500/50"
            )}>
              <div className="flex items-center gap-3">
                <Coffee className={cn(
                  "w-6 h-6",
                  mentalFatigue.level === 'critical' ? "text-loss" : "text-yellow-500"
                )} />
                <p className={cn(
                  "font-medium",
                  mentalFatigue.level === 'critical' ? "text-loss" : "text-yellow-500"
                )}>
                  {mentalFatigue.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Top Row: Execution Quality + Mental Fatigue + Trader Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Execution Quality */}
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Qualité d\'exécution' : 'Execution Quality'}
                </h3>
              </div>
              <div className="flex justify-center mb-4">
                <GaugeChart
                  value={executionQuality.overallScore}
                  max={100}
                  label={language === 'fr' ? 'Score global' : 'Overall Score'}
                  size="md"
                  variant="primary"
                />
              </div>
              <div className="space-y-4">
                {/* Entry Timing */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {language === 'fr' ? 'Timing d\'entrée' : 'Entry Timing'}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      executionQuality.entryTiming.score >= 70 ? "bg-profit/20 text-profit" :
                      executionQuality.entryTiming.score >= 40 ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-loss/20 text-loss"
                    )}>
                      {executionQuality.entryTiming.label}
                    </span>
                  </div>
                  <Progress value={executionQuality.entryTiming.score} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{executionQuality.entryTiming.detail}</p>
                </div>
                {/* SL Sizing */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {language === 'fr' ? 'Dimensionnement SL' : 'SL Sizing'}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      executionQuality.slSizing.score >= 60 ? "bg-profit/20 text-profit" :
                      executionQuality.slSizing.score >= 30 ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-loss/20 text-loss"
                    )}>
                      {executionQuality.slSizing.label}
                    </span>
                  </div>
                  <Progress value={executionQuality.slSizing.score} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{executionQuality.slSizing.detail}</p>
                </div>
                {/* TP Optimization */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {language === 'fr' ? 'Optimisation TP' : 'TP Optimization'}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      executionQuality.tpOptimization.score >= 70 ? "bg-profit/20 text-profit" :
                      executionQuality.tpOptimization.score >= 40 ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-loss/20 text-loss"
                    )}>
                      {executionQuality.tpOptimization.label}
                    </span>
                  </div>
                  <Progress value={executionQuality.tpOptimization.score} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{executionQuality.tpOptimization.detail}</p>
                </div>
              </div>
            </div>

            {/* Mental Fatigue Index */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  mentalFatigue.level === 'critical' ? "bg-loss/20" :
                  mentalFatigue.level === 'high' ? "bg-yellow-500/20" :
                  mentalFatigue.level === 'moderate' ? "bg-primary/20" : "bg-profit/20"
                )}>
                  <Activity className={cn(
                    "w-5 h-5",
                    mentalFatigue.level === 'critical' ? "text-loss" :
                    mentalFatigue.level === 'high' ? "text-yellow-500" :
                    mentalFatigue.level === 'moderate' ? "text-primary" : "text-profit"
                  )} />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Indice de fatigue' : 'Fatigue Index'}
                </h3>
              </div>
              <div className="flex justify-center mb-4">
                <GaugeChart
                  value={mentalFatigue.score}
                  max={100}
                  label={language === 'fr' ? 'Fatigue' : 'Fatigue'}
                  size="md"
                  variant={mentalFatigue.level === 'critical' || mentalFatigue.level === 'high' ? 'loss' : 'primary'}
                />
              </div>
              {mentalFatigue.factors.length > 0 ? (
                <div className="space-y-3">
                  {mentalFatigue.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{factor.name}</span>
                      <span className="text-foreground font-medium">{factor.detail}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  {language === 'fr' ? 'Pas de trades aujourd\'hui' : 'No trades today'}
                </p>
              )}
              <div className={cn(
                "mt-4 p-3 rounded-lg text-sm",
                mentalFatigue.level === 'low' ? "bg-profit/10 text-profit" :
                mentalFatigue.level === 'moderate' ? "bg-primary/10 text-primary" :
                mentalFatigue.level === 'high' ? "bg-yellow-500/10 text-yellow-600" :
                "bg-loss/10 text-loss"
              )}>
                {mentalFatigue.recommendation}
              </div>
            </div>

            {/* Trader Profile */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <User className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Profil psychologique' : 'Psychological Profile'}
                </h3>
              </div>
              {traderProfile ? (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{traderProfile.icon}</div>
                    <h4 className="font-display font-bold text-lg text-foreground">{traderProfile.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{traderProfile.description}</p>
                  </div>
                  <div className="h-[180px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={traderProfile.characteristics}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Minimum 5 trades requis' : 'Minimum 5 trades required'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trader Profile Advice */}
          {traderProfile && (
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Conseils personnalisés' : 'Personalized Advice'}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {traderProfile.advice.map((advice, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emotional Memory Section */}
          {(emotionalMemory.warnings.length > 0 || emotionalMemory.insights.length > 0) && (
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-loss" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Mémoire émotionnelle' : 'Emotional Memory'}
                </h3>
              </div>
              
              {/* Warnings */}
              {emotionalMemory.warnings.length > 0 && (
                <div className="space-y-2 mb-4">
                  {emotionalMemory.warnings.map((warning, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-lg",
                        warning.severity === 'danger' ? "bg-loss/10 border border-loss/30" :
                        warning.severity === 'warning' ? "bg-yellow-500/10 border border-yellow-500/30" :
                        "bg-primary/10 border border-primary/30"
                      )}
                    >
                      <ShieldAlert className={cn(
                        "w-4 h-4 mt-0.5 flex-shrink-0",
                        warning.severity === 'danger' ? "text-loss" :
                        warning.severity === 'warning' ? "text-yellow-500" : "text-primary"
                      )} />
                      <p className="text-sm text-foreground">{warning.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Best/Worst Emotions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {emotionalMemory.bestEmotion && (
                  <div className="p-4 rounded-lg bg-profit/10 border border-profit/30">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === 'fr' ? 'Meilleure émotion' : 'Best emotion'}
                    </p>
                    <p className="font-display font-bold text-profit text-lg">{emotionalMemory.bestEmotion}</p>
                  </div>
                )}
                {emotionalMemory.emotionToAvoid && (
                  <div className="p-4 rounded-lg bg-loss/10 border border-loss/30">
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === 'fr' ? 'Émotion à éviter' : 'Emotion to avoid'}
                    </p>
                    <p className="font-display font-bold text-loss text-lg">{emotionalMemory.emotionToAvoid}</p>
                  </div>
                )}
              </div>

              {/* Insights */}
              {emotionalMemory.insights.length > 0 && (
                <div className="space-y-2">
                  {emotionalMemory.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Discipline Score */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <GaugeChart
                  value={disciplineBreakdown.score}
                  max={100}
                  label={language === 'fr' ? 'Discipline' : 'Discipline'}
                  size="lg"
                  variant="primary"
                />
              </div>
              <div className="flex-1 w-full">
                <h3 className="font-display font-semibold text-foreground mb-4">
                  {t('disciplineFactors')}
                </h3>
                <div className="space-y-4">
                  {disciplineBreakdown.factors.map((factor) => {
                    const Icon = factor.icon;
                    return (
                      <div key={factor.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{factor.name}</span>
                          </div>
                          <span className={cn(
                            "text-sm font-medium",
                            factor.score >= 80 ? "text-profit" :
                            factor.score >= 60 ? "text-primary" : "text-loss"
                          )}>
                            {factor.score}%
                          </span>
                        </div>
                        <Progress
                          value={factor.score}
                          className={cn(
                            "h-2",
                            factor.score >= 80 ? "[&>div]:bg-profit" :
                            factor.score >= 60 ? "[&>div]:bg-primary" : "[&>div]:bg-loss"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Emotion Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Winrate by Emotion */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <h3 className="font-display font-semibold text-foreground mb-4">
                {t('winrateByEmotion')}
              </h3>
              {emotionStats.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotionStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="emotion" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value}%`, '']}
                      />
                      <Bar dataKey="wins" fill="hsl(var(--profit))" name={t('gains')} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  {t('noData')}
                </div>
              )}
            </div>

            {/* Emotion Distribution */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '350ms' }}>
              <h3 className="font-display font-semibold text-foreground mb-4">
                {t('emotionDistributionChart')}
              </h3>
              {emotionDistribution.length > 0 ? (
                <>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={emotionDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {emotionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`${value}%`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {emotionDistribution.map((emotion) => (
                      <div key={emotion.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emotion.color }} />
                        <span className="text-xs text-muted-foreground">{emotion.name} ({emotion.value}%)</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  {t('noData')}
                </div>
              )}
            </div>
          </div>

          {/* Weekly Emotion Trend */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <h3 className="font-display font-semibold text-foreground mb-4">
              {t('weeklyEmotionTrends')}
            </h3>
            {weeklyEmotionsByType.emotions.length > 0 ? (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyEmotionsByType.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value}%`, '']}
                      />
                      {weeklyEmotionsByType.emotions.map((emotion) => (
                        <Line
                          key={emotion.name}
                          type="monotone"
                          dataKey={emotion.name}
                          stroke={emotion.color}
                          strokeWidth={2}
                          dot={{ fill: emotion.color, r: 3 }}
                          name={emotion.name}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {weeklyEmotionsByType.emotions.map((emotion) => (
                    <div key={emotion.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emotion.color }} />
                      <span className="text-xs text-muted-foreground">{emotion.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t('noData')}
              </div>
            )}
          </div>

          {/* Emotion Performance Cards */}
          {emotionStats.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {emotionStats.slice(0, 4).map((stat, index) => (
                <div
                  key={stat.emotion}
                  className="glass-card p-4 animate-fade-in"
                  style={{ animationDelay: `${450 + index * 50}ms` }}
                >
                  <p className="text-sm text-muted-foreground mb-2">{stat.emotion}</p>
                  <p className={cn(
                    "font-display text-2xl font-bold",
                    stat.wins >= 60 ? "text-profit" : stat.wins >= 40 ? "text-primary" : "text-loss"
                  )}>
                    {stat.wins}%
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.trades} trades</p>
                </div>
              ))}
            </div>
          )}

          {/* Mental Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positives */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-profit" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {t('positiveSigns')}
                </h3>
              </div>
              <div className="space-y-3">
                {mentalSummary.positives.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-profit/10 border border-profit/30"
                  >
                    <CheckCircle2 className="w-4 h-4 text-profit mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Negatives */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '650ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-loss/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-loss" />
                </div>
                <h3 className="font-display font-semibold text-foreground">
                  {t('areasToImprove')}
                </h3>
              </div>
              <div className="space-y-3">
                {mentalSummary.negatives.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 rounded-lg bg-loss/10 border border-loss/30"
                  >
                    <AlertTriangle className="w-4 h-4 text-loss mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PsychologicalAnalysis;
