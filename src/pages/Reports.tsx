import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval, parseISO, getDay, subWeeks } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
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
} from 'lucide-react';

type ViewMode = 'week' | 'month';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Reports: React.FC = () => {
  const { language, t } = useLanguage();
  const { trades, isLoading } = useTrades();
  const { formatAmount, getCurrencySymbol } = useCurrency();
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

  // Calculate statistics from real data
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
        avgRR: 0,
        disciplineScore: 0,
      };
    }

    const winningTrades = periodTrades.filter(t => t.result === 'win').length;
    const losingTrades = periodTrades.filter(t => t.result === 'loss').length;
    const winrate = periodTrades.length > 0 ? Math.round((winningTrades / periodTrades.length) * 100) : 0;
    const pnl = periodTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    // Calculate by day
    const days = language === 'fr' ? DAYS_FR : DAYS_EN;
    const dayStats: Record<number, { pnl: number; count: number }> = {};
    periodTrades.forEach(trade => {
      const dayIndex = getDay(parseISO(trade.trade_date));
      if (!dayStats[dayIndex]) dayStats[dayIndex] = { pnl: 0, count: 0 };
      dayStats[dayIndex].pnl += trade.profit_loss || 0;
      dayStats[dayIndex].count++;
    });

    let bestDay = { day: '-', pnl: 0 };
    let worstDay = { day: '-', pnl: 0 };
    Object.entries(dayStats).forEach(([dayIndex, data]) => {
      if (data.pnl > bestDay.pnl) bestDay = { day: days[parseInt(dayIndex)], pnl: data.pnl };
      if (data.pnl < worstDay.pnl) worstDay = { day: days[parseInt(dayIndex)], pnl: data.pnl };
    });

    // Best setup
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

    // Best asset
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

    // Dominant emotion
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

    // Discipline score (based on having SL and TP)
    const tradesWithSL = periodTrades.filter(t => t.stop_loss).length;
    const tradesWithTP = periodTrades.filter(t => t.take_profit).length;
    const disciplineScore = periodTrades.length > 0
      ? Math.round(((tradesWithSL + tradesWithTP) / (periodTrades.length * 2)) * 100)
      : 0;

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
      avgRR: 0,
      disciplineScore,
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

  // Emotion distribution
  const emotionDistribution = useMemo(() => {
    const emotionCounts: Record<string, number> = {};
    periodTrades.forEach(trade => {
      const emotion = trade.emotions || 'Neutre';
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'Calme': 'hsl(var(--profit))',
      'Confiant': 'hsl(var(--primary))',
      'Stressé': 'hsl(var(--loss))',
      'Impulsif': 'hsl(30, 100%, 50%)',
      'Neutre': 'hsl(var(--muted-foreground))',
    };

    const total = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
    return Object.entries(emotionCounts).map(([name, count]) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: colors[name] || 'hsl(var(--primary))',
    }));
  }, [periodTrades]);

  // Monthly performance (last 4 months)
  const monthlyData = useMemo(() => {
    if (!trades) return [];
    const months: { month: string; pnl: number }[] = [];
    
    for (let i = 3; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTrades = trades.filter(trade => {
        const tradeDate = parseISO(trade.trade_date);
        return isWithinInterval(tradeDate, { start: monthStart, end: monthEnd });
      });
      
      const pnl = monthTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
      months.push({
        month: format(monthDate, 'MMM', { locale }),
        pnl: Math.round(pnl * 100) / 100,
      });
    }
    
    return months;
  }, [trades, locale]);

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
          {/* View Mode Toggle */}
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

          {/* Period Navigation */}
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
                {formatAmount(stats.pnl, true)}
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
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Discipline</span>
              </div>
              <p className="font-display text-2xl font-bold text-primary">{stats.disciplineScore}/100</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily PnL */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
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
                      <Bar 
                        dataKey="pnl" 
                        radius={[4, 4, 0, 0]}
                      >
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

            {/* Emotion Distribution */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
              <h3 className="font-display font-semibold text-foreground mb-4">
                {t('emotionDistribution')}
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
                        <span className="text-xs text-muted-foreground">{emotion.name}</span>
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

          {/* Best/Worst Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-profit" />
                <span className="text-sm font-medium text-foreground">
                  {t('bestDayLabel')}
                </span>
              </div>
              <p className="font-display text-lg font-bold text-profit">{stats.bestDay.day}</p>
              <p className="text-sm text-muted-foreground">+{stats.bestDay.pnl.toFixed(2)}$</p>
            </div>
            <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '350ms' }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-loss" />
                <span className="text-sm font-medium text-foreground">
                  {t('worstDayLabel')}
                </span>
              </div>
              <p className="font-display text-lg font-bold text-loss">{stats.worstDay.day}</p>
              <p className="text-sm text-muted-foreground">{stats.worstDay.pnl.toFixed(2)}$</p>
            </div>
            <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {t('bestSetup')}
                </span>
              </div>
              <p className="font-display text-lg font-bold text-primary">{stats.bestSetup}</p>
              <p className="text-sm text-muted-foreground">{stats.bestAsset}</p>
            </div>
            <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '450ms' }}>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {t('dominantEmotion')}
                </span>
              </div>
              <p className="font-display text-lg font-bold text-foreground">{stats.dominantEmotion}</p>
            </div>
          </div>

          {/* Monthly Performance (visible in month view) */}
          {viewMode === 'month' && monthlyData.length > 0 && (
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <h3 className="font-display font-semibold text-foreground mb-4">
                {t('monthlyPerformance')}
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value >= 0 ? '+' : ''}${value}$`, 'PnL']}
                    />
                    <Bar 
                      dataKey="pnl" 
                      radius={[4, 4, 0, 0]}
                    >
                      {monthlyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.pnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
