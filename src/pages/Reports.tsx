import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useCurrency } from '@/hooks/useCurrency';
import { ConfidentialValue } from '@/components/ConfidentialValue';
import { useSessionAnalysis } from '@/hooks/useSessionAnalysis';
import { useStrategyAnalysis } from '@/hooks/useStrategyAnalysis';
import { useSelfSabotage } from '@/hooks/useSelfSabotage';
import { useDisciplineScore } from '@/hooks/useDisciplineScore';
import { usePerformanceHeatmap } from '@/hooks/usePerformanceHeatmap';
import { useEmotionCorrelation } from '@/hooks/useEmotionCorrelation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AIDailySummaryCard from '@/components/AIDailySummaryCard';
import SessionSettingsCard from '@/components/SessionSettingsCard';
import RewardChestsDisplay from '@/components/RewardChestsDisplay';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, parseISO, getDay } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import {
  FileText,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Award,
  AlertTriangle,
  Loader2,
  Globe,
  BarChart3,
  Shield,
  Clock,
  Flame,
  AlertCircle,
  Heart,
} from 'lucide-react';
import GaugeChart from '@/components/ui/GaugeChart';

type ViewMode = 'week' | 'month';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SESSION_NAMES = {
  london: { fr: 'Londres', en: 'London', color: 'hsl(var(--primary))' },
  newYork: { fr: 'New York', en: 'New York', color: 'hsl(var(--profit))' },
  asia: { fr: 'Asie', en: 'Asia', color: 'hsl(217, 91%, 60%)' },
  overlap: { fr: 'Chevauche.', en: 'Overlap', color: 'hsl(280, 70%, 50%)' },
};

const Reports: React.FC = () => {
  const { language, t } = useLanguage();
  const { trades, isLoading } = useTrades();
  const { formatAmount } = useCurrency();
  const locale = language === 'fr' ? fr : enUS;
  
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const periodStart = viewMode === 'week' 
    ? startOfWeek(selectedDate, { weekStartsOn: 1 })
    : startOfMonth(selectedDate);
  const periodEnd = viewMode === 'week'
    ? endOfWeek(selectedDate, { weekStartsOn: 1 })
    : endOfMonth(selectedDate);

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      setSelectedDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        return newDate;
      });
    } else {
      setSelectedDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }
  };

  const formatPeriod = () => {
    if (viewMode === 'week') {
      return `${format(periodStart, 'd MMM', { locale })} - ${format(periodEnd, 'd MMM yyyy', { locale })}`;
    }
    return format(selectedDate, 'MMMM yyyy', { locale });
  };

  // Filter trades for selected period
  const periodTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date);
      return isWithinInterval(tradeDate, { start: periodStart, end: periodEnd });
    });
  }, [trades, periodStart, periodEnd]);

  // Use new analysis hooks
  const sessionAnalysis = useSessionAnalysis(periodTrades, language);
  const strategyAnalysis = useStrategyAnalysis(periodTrades);
  const selfSabotage = useSelfSabotage(periodTrades, language);
  const disciplineScore = useDisciplineScore(periodTrades);
  const heatmap = usePerformanceHeatmap(periodTrades, language);
  const emotionCorrelation = useEmotionCorrelation(periodTrades);

  // Calculate basic statistics
  const stats = useMemo(() => {
    if (periodTrades.length === 0) {
      return {
        winrate: 0,
        pnl: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        bestSetup: '-',
        bestAsset: '-',
        dominantEmotion: '-',
        bestDay: { day: '-', pnl: 0 },
        worstDay: { day: '-', pnl: 0 },
      };
    }

    const winningTrades = periodTrades.filter(t => t.result === 'win').length;
    const losingTrades = periodTrades.filter(t => t.result === 'loss').length;
    const winrate = periodTrades.length > 0 ? Math.round((winningTrades / periodTrades.length) * 100) : 0;
    const pnl = periodTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    const days = language === 'fr' ? DAYS_FR : DAYS_EN;
    const dayStats: Record<number, { pnl: number }> = {};
    periodTrades.forEach(trade => {
      const dayIndex = getDay(parseISO(trade.trade_date));
      if (!dayStats[dayIndex]) dayStats[dayIndex] = { pnl: 0 };
      dayStats[dayIndex].pnl += trade.profit_loss || 0;
    });

    let bestDay = { day: '-', pnl: 0 };
    let worstDay = { day: '-', pnl: 0 };
    Object.entries(dayStats).forEach(([dayIndex, data]) => {
      if (data.pnl > bestDay.pnl) bestDay = { day: days[parseInt(dayIndex)], pnl: data.pnl };
      if (data.pnl < worstDay.pnl) worstDay = { day: days[parseInt(dayIndex)], pnl: data.pnl };
    });

    const setupStats: Record<string, { wins: number; total: number }> = {};
    periodTrades.forEach(trade => {
      const setup = trade.setup || 'Other';
      if (!setupStats[setup]) setupStats[setup] = { wins: 0, total: 0 };
      setupStats[setup].total++;
      if (trade.result === 'win') setupStats[setup].wins++;
    });
    let bestSetup = '-';
    let bestSetupWinrate = 0;
    Object.entries(setupStats).forEach(([setup, data]) => {
      const wr = data.total > 0 ? data.wins / data.total : 0;
      if (wr > bestSetupWinrate && data.total >= 2) {
        bestSetupWinrate = wr;
        bestSetup = setup;
      }
    });

    const assetStats: Record<string, number> = {};
    periodTrades.forEach(trade => {
      if (!assetStats[trade.asset]) assetStats[trade.asset] = 0;
      assetStats[trade.asset] += trade.profit_loss || 0;
    });
    let bestAsset = '-';
    let bestAssetPnl = -Infinity;
    Object.entries(assetStats).forEach(([asset, pnlVal]) => {
      if (pnlVal > bestAssetPnl) {
        bestAssetPnl = pnlVal;
        bestAsset = asset;
      }
    });

    const emotionCounts: Record<string, number> = {};
    periodTrades.forEach(trade => {
      const emotion = trade.emotions || 'Neutre';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    let dominantEmotion = '-';
    let maxEmotionCount = 0;
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      if (count > maxEmotionCount) {
        maxEmotionCount = count;
        dominantEmotion = emotion;
      }
    });

    return {
      winrate,
      pnl,
      totalTrades: periodTrades.length,
      winningTrades,
      losingTrades,
      bestSetup,
      bestAsset,
      dominantEmotion,
      bestDay,
      worstDay,
    };
  }, [periodTrades, language]);

  // Daily PnL data
  const dailyPnL = useMemo(() => {
    const days = language === 'fr' ? DAYS_FR : DAYS_EN;
    const dayData: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    
    periodTrades.forEach(trade => {
      const dayIndex = getDay(parseISO(trade.trade_date));
      dayData[dayIndex] += trade.profit_loss || 0;
    });

    return [1, 2, 3, 4, 5, 6, 0].map(dayIndex => ({
      day: days[dayIndex],
      pnl: Math.round(dayData[dayIndex] * 100) / 100,
    }));
  }, [periodTrades, language]);

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
            {t('reports')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('performanceAnalysis')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <FileText className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Period Selector */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 rounded-lg bg-secondary/50">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className={cn(viewMode === 'week' && 'bg-primary text-primary-foreground')}
            >
              {t('week')}
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className={cn(viewMode === 'month' && 'bg-primary text-primary-foreground')}
            >
              {t('month')}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigatePeriod('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] gap-2 font-display">
                  <CalendarIcon className="w-4 h-4" />
                  {formatPeriod()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  locale={locale}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => navigatePeriod('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {hasNoData ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            {t('noData')}
          </h3>
          <p className="text-muted-foreground">
            {t('addTradesToSeeReports')}
          </p>
        </div>
      ) : (
        <>
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Winrate</span>
              </div>
              <p className={cn("font-display text-2xl font-bold", stats.winrate >= 50 ? "text-profit" : "text-loss")}>
                {stats.winrate}%
              </p>
            </div>
            <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-profit" />
                <span className="text-xs text-muted-foreground">PnL</span>
              </div>
              <p className={cn("font-display text-2xl font-bold", stats.pnl >= 0 ? "text-profit" : "text-loss")}>
                <ConfidentialValue>{formatAmount(stats.pnl, true)}</ConfidentialValue>
              </p>
            </div>
            <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Trades</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{stats.totalTrades}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-profit">{stats.winningTrades}W</span> / <span className="text-loss">{stats.losingTrades}L</span>
              </p>
            </div>
            <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{t('discipline')}</span>
              </div>
              <p className={cn(
                "font-display text-2xl font-bold",
                disciplineScore.overallScore >= 70 ? "text-profit" : disciplineScore.overallScore >= 50 ? "text-primary" : "text-loss"
              )}>
                {disciplineScore.overallScore}/100
              </p>
              <p className="text-xs text-muted-foreground">
                {t('disciplineGrade')}: {disciplineScore.grade}
              </p>
            </div>
          </div>

          {/* Session Analysis */}
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground">{t('sessionAnalysis')}</h3>
                <SessionSettingsCard />
              </div>
              {sessionAnalysis.bestSessionBadge && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                  {sessionAnalysis.bestSessionBadge}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sessionAnalysis.sessions.map(session => (
                <div key={session.session} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SESSION_NAMES[session.session].color }} />
                    <span className="text-sm font-medium text-foreground">
                      {SESSION_NAMES[session.session][language as 'fr' | 'en']}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Winrate</span>
                      <span className={cn(session.winRate >= 50 ? "text-profit" : "text-loss")}>{session.winRate}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">PnL</span>
                      <span className={cn(session.pnl >= 0 ? "text-profit" : "text-loss")}><ConfidentialValue>{formatAmount(session.pnl, true)}</ConfidentialValue></span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Trades</span>
                      <span className="text-foreground">{session.trades}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Analysis */}
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">{t('strategyAnalysis')}</h3>
            </div>
            {strategyAnalysis.strategies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-muted-foreground font-medium">Stratégie</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">Trades</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">Winrate</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">PF</th>
                      <th className="text-center py-2 px-2 text-muted-foreground font-medium">{t('expectancy')}</th>
                      <th className="text-right py-2 px-2 text-muted-foreground font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strategyAnalysis.strategies.slice(0, 6).map(strat => (
                      <tr key={strat.strategy} className="border-b border-border/50 hover:bg-secondary/20">
                        <td className="py-2 px-2">
                          <span className={cn(
                            "text-foreground",
                            strat.strategy === strategyAnalysis.bestStrategy && "text-profit font-medium",
                            strat.strategy === strategyAnalysis.worstStrategy && "text-loss"
                          )}>
                            {strat.strategy}
                          </span>
                        </td>
                        <td className="text-center py-2 px-2 text-muted-foreground">{strat.trades}</td>
                        <td className="text-center py-2 px-2">
                          <span className={cn(strat.winRate >= 50 ? "text-profit" : "text-loss")}>{strat.winRate}%</span>
                        </td>
                        <td className="text-center py-2 px-2">
                          <span className={cn(strat.profitFactor >= 1 ? "text-profit" : "text-loss")}>
                            {strat.profitFactor === Infinity ? '∞' : strat.profitFactor.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-center py-2 px-2">
                          <span className={cn(strat.expectancy >= 0 ? "text-profit" : "text-loss")}>
                            <ConfidentialValue>{formatAmount(strat.expectancy, true)}</ConfidentialValue>
                          </span>
                        </td>
                        <td className="text-right py-2 px-2">
                          <span className={cn(strat.totalPnl >= 0 ? "text-profit" : "text-loss")}>
                            <ConfidentialValue>{formatAmount(strat.totalPnl, true)}</ConfidentialValue>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">{t('noData')}</p>
            )}
          </div>

          {/* Self Sabotage Alerts & Discipline Score */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Self Sabotage */}
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-loss" />
                <h3 className="font-display font-semibold text-foreground">{t('selfSabotage')}</h3>
              </div>
              
              {selfSabotage.alerts.length > 0 ? (
                <div className="space-y-3">
                  {selfSabotage.alerts.map((alert, idx) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border",
                        alert.severity === 'danger' ? "bg-loss/10 border-loss/30" : "bg-yellow-500/10 border-yellow-500/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className={cn("w-4 h-4", alert.severity === 'danger' ? "text-loss" : "text-yellow-500")} />
                        <span className="text-sm font-medium text-foreground">
                          {alert.message[language as 'fr' | 'en']}
                        </span>
                        <span className="text-xs bg-secondary px-1.5 py-0.5 rounded">x{alert.count}</span>
                      </div>
                      {alert.details.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 pl-6">
                          {alert.details.slice(0, 2).join(' • ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Shield className="w-12 h-12 mx-auto text-profit/50 mb-2" />
                  <p className="text-profit font-medium">{t('noSabotageDetected')}</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('sabotageScore')}</span>
                  <span className={cn(
                    "font-display font-bold",
                    selfSabotage.sabotageScore <= 30 ? "text-profit" : selfSabotage.sabotageScore <= 60 ? "text-yellow-500" : "text-loss"
                  )}>
                    {selfSabotage.sabotageScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Discipline Score */}
            <div className="glass-card p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">{t('disciplineScore')}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{disciplineScore.streak} {t('daysStreak')}</span>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <GaugeChart 
                  value={disciplineScore.overallScore} 
                  max={100} 
                  label={t('discipline')}
                  size="md"
                  variant={disciplineScore.overallScore >= 70 ? 'profit' : disciplineScore.overallScore >= 50 ? 'primary' : 'loss'}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-secondary/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('slRespect')}</span>
                    <span className={cn(disciplineScore.metrics.slRespect >= 70 ? "text-profit" : "text-loss")}>
                      {disciplineScore.metrics.slRespect}%
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-secondary/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('tpRespect')}</span>
                    <span className={cn(disciplineScore.metrics.tpRespect >= 70 ? "text-profit" : "text-loss")}>
                      {disciplineScore.metrics.tpRespect}%
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-secondary/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('planRespect')}</span>
                    <span className={cn(disciplineScore.metrics.planRespect >= 70 ? "text-profit" : "text-loss")}>
                      {disciplineScore.metrics.planRespect}%
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-secondary/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('riskManagement')}</span>
                    <span className={cn(disciplineScore.metrics.riskManagement >= 70 ? "text-profit" : "text-loss")}>
                      {disciplineScore.metrics.riskManagement}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Heatmap */}
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">{t('performanceHeatmap')}</h3>
            </div>

            {/* Best/Worst indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-2 rounded bg-profit/10 border border-profit/30">
                <span className="text-xs text-muted-foreground">{t('bestTradingDay')}</span>
                <p className="text-sm font-medium text-profit">{heatmap.bestDay?.day || '-'}</p>
                <p className="text-xs text-profit">{heatmap.bestDay ? formatAmount(heatmap.bestDay.pnl, true) : ''}</p>
              </div>
              <div className="p-2 rounded bg-loss/10 border border-loss/30">
                <span className="text-xs text-muted-foreground">{t('worstTradingDay')}</span>
                <p className="text-sm font-medium text-loss">{heatmap.worstDay?.day || '-'}</p>
                <p className="text-xs text-loss">{heatmap.worstDay ? formatAmount(heatmap.worstDay.pnl, true) : ''}</p>
              </div>
              <div className="p-2 rounded bg-profit/10 border border-profit/30">
                <span className="text-xs text-muted-foreground">{t('bestTradingHour')}</span>
                <p className="text-sm font-medium text-profit">{heatmap.bestHour?.hour || '-'}</p>
                <p className="text-xs text-profit">{heatmap.bestHour ? formatAmount(heatmap.bestHour.pnl, true) : ''}</p>
              </div>
              <div className="p-2 rounded bg-loss/10 border border-loss/30">
                <span className="text-xs text-muted-foreground">{t('worstTradingHour')}</span>
                <p className="text-sm font-medium text-loss">{heatmap.worstHour?.hour || '-'}</p>
                <p className="text-xs text-loss">{heatmap.worstHour ? formatAmount(heatmap.worstHour.pnl, true) : ''}</p>
              </div>
            </div>

            {/* Day of Week Chart */}
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmap.byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dayName" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'pnl') return [formatAmount(value, true), 'PnL'];
                      if (name === 'winRate') return [`${value}%`, 'Winrate'];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {heatmap.byDay.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hour Heatmap Grid */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">{t('byHour')}</p>
              <div className="flex flex-wrap gap-1">
                {heatmap.byHour.filter(h => h.trades > 0).map(hour => {
                  const intensity = hour.pnl > 0 ? Math.min(hour.pnl / 100, 1) : Math.max(hour.pnl / 100, -1);
                  const bgColor = intensity > 0 
                    ? `hsla(var(--profit), ${0.2 + Math.abs(intensity) * 0.6})` 
                    : `hsla(var(--loss), ${0.2 + Math.abs(intensity) * 0.6})`;
                  
                  return (
                    <div
                      key={hour.hour}
                      className="w-10 h-10 rounded flex flex-col items-center justify-center text-xs border border-border/50"
                      style={{ backgroundColor: bgColor }}
                      title={`${hour.hourLabel}: ${formatAmount(hour.pnl)} (${hour.trades} trades)`}
                    >
                      <span className="font-medium text-foreground">{hour.hour}</span>
                      <span className="text-[10px] text-muted-foreground">{hour.trades}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Emotion Correlation */}
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-500" />
              <h3 className="font-display font-semibold text-foreground">{t('emotionCorrelation')}</h3>
            </div>

            {/* Calm vs Stress Comparison */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-profit/10 border border-profit/30">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'fr' ? 'Calme' : 'Calm'}
                </p>
                <p className={cn(
                  "text-xl font-display font-bold",
                  emotionCorrelation.calmPnl >= 0 ? "text-profit" : "text-loss"
                )}>
                  {formatAmount(emotionCorrelation.calmPnl, true)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Winrate: {emotionCorrelation.calmWinRate}%
                </p>
              </div>
              <div className="p-4 rounded-lg bg-loss/10 border border-loss/30">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'fr' ? 'Stressé' : 'Stressed'}
                </p>
                <p className={cn(
                  "text-xl font-display font-bold",
                  emotionCorrelation.stressPnl >= 0 ? "text-profit" : "text-loss"
                )}>
                  {formatAmount(emotionCorrelation.stressPnl, true)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Winrate: {emotionCorrelation.stressWinRate}%
                </p>
              </div>
            </div>

            {/* Emotion Chart */}
            {emotionCorrelation.correlations.length > 0 && (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={emotionCorrelation.correlations.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="emotion" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'winRate') return [`${value}%`, 'Winrate'];
                        if (name === 'avgPnl') return [formatAmount(value, true), 'PnL Moyen'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="winRate" name="winRate" radius={[0, 4, 4, 0]}>
                      {emotionCorrelation.correlations.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Best/Worst Emotion */}
            {(emotionCorrelation.bestEmotion || emotionCorrelation.worstEmotion) && (
              <div className="flex gap-4 mt-4">
                {emotionCorrelation.bestEmotion && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-profit" />
                    <span className="text-muted-foreground">{language === 'fr' ? 'Meilleure' : 'Best'}:</span>
                    <span className="font-medium text-profit">{emotionCorrelation.bestEmotion}</span>
                  </div>
                )}
                {emotionCorrelation.worstEmotion && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingDown className="w-4 h-4 text-loss" />
                    <span className="text-muted-foreground">{language === 'fr' ? 'Pire' : 'Worst'}:</span>
                    <span className="font-medium text-loss">{emotionCorrelation.worstEmotion}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Summary & Reward Chests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIDailySummaryCard trades={trades} />
            <RewardChestsDisplay trades={trades} />
          </div>

          {/* Daily PnL */}
          <div className="glass-card p-6 animate-fade-in">
            <h3 className="font-display font-semibold text-foreground mb-4">
              {t('dailyPnL')}
            </h3>
            {periodTrades.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyPnL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatAmount(value, true), 'PnL']}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {dailyPnL.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                {t('noTradesInPeriod')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
