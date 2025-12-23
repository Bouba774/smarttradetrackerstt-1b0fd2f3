import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Trade } from '@/hooks/useTrades';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ConfidentialValue from '@/components/ConfidentialValue';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { 
  parseISO, 
  getMonth, 
  getYear, 
  getDate,
  startOfYear, 
  endOfYear, 
  startOfMonth,
  endOfMonth,
  isWithinInterval, 
  format,
  getDaysInMonth,
  isSameDay,
} from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, TrendingUp, Lightbulb, Calendar } from 'lucide-react';

interface MonthlyPerformanceCalendarProps {
  trades: Trade[];
  initialCapital?: number;
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTHS_FULL_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TRADING_TIPS = [
  { fr: "Ne tentez pas d'attraper un couteau qui tombe. Attendez la stabilité.", en: "Don't try to catch a falling knife. Wait for stability." },
  { fr: "Le marché a toujours raison, jamais votre ego.", en: "The market is always right, never your ego." },
  { fr: "Coupez vos pertes rapidement, laissez courir vos gains.", en: "Cut your losses quickly, let your profits run." },
  { fr: "La patience est la clé du succès en trading.", en: "Patience is the key to trading success." },
  { fr: "Ne risquez jamais plus que ce que vous pouvez vous permettre de perdre.", en: "Never risk more than you can afford to lose." },
  { fr: "Suivez votre plan de trading, pas vos émotions.", en: "Follow your trading plan, not your emotions." },
  { fr: "La discipline bat l'intelligence dans le trading.", en: "Discipline beats intelligence in trading." },
  { fr: "Un trade manqué n'est pas une perte.", en: "A missed trade is not a loss." },
  { fr: "Protégez votre capital, les opportunités reviendront.", en: "Protect your capital, opportunities will come again." },
  { fr: "Tradez ce que vous voyez, pas ce que vous pensez.", en: "Trade what you see, not what you think." },
];

const MonthlyPerformanceCalendar: React.FC<MonthlyPerformanceCalendarProps> = ({ 
  trades, 
  initialCapital = 10000 
}) => {
  const { language } = useLanguage();
  const { formatAmount } = useCurrency();
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  const months = language === 'fr' ? MONTHS_FR : MONTHS_EN;
  const monthsFull = language === 'fr' ? MONTHS_FULL_FR : MONTHS_FULL_EN;
  const days = language === 'fr' ? DAYS_FR : DAYS_EN;
  const locale = language === 'fr' ? fr : enUS;

  // Get available years from trades
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    trades.forEach(trade => {
      years.add(getYear(parseISO(trade.trade_date)));
    });
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [trades]);

  // Get random trading tip
  const tradingTip = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * TRADING_TIPS.length);
    return TRADING_TIPS[randomIndex];
  }, []);

  // Calculate monthly performance data for selected year
  const monthlyData = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    
    const yearTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date);
      return isWithinInterval(tradeDate, { start: yearStart, end: yearEnd });
    });

    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const monthTrades = yearTrades.filter(trade => {
        const tradeDate = parseISO(trade.trade_date);
        return getMonth(tradeDate) === i;
      });

      const pnl = monthTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
      const tradeCount = monthTrades.length;

      return {
        month: i,
        monthName: months[i],
        pnl,
        tradeCount,
        percentChange: initialCapital > 0 ? (pnl / initialCapital) * 100 : 0,
        isPositive: pnl >= 0,
      };
    });

    return monthlyStats;
  }, [trades, selectedYear, months, initialCapital]);

  // Calculate daily performance data for selected month
  const dailyData = useMemo(() => {
    const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
    const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth, 1));
    
    const monthTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date);
      return isWithinInterval(tradeDate, { start: monthStart, end: monthEnd });
    });

    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    // Convert to Monday-based (0 = Monday)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const dailyStats = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(selectedYear, selectedMonth, day);
      
      const dayTrades = monthTrades.filter(trade => {
        const tradeDate = parseISO(trade.trade_date);
        return isSameDay(tradeDate, date);
      });

      const pnl = dayTrades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0);
      const tradeCount = dayTrades.length;

      return {
        day,
        date,
        pnl,
        tradeCount,
        isPositive: pnl >= 0,
        hasData: tradeCount > 0,
      };
    });

    return { dailyStats, startOffset };
  }, [trades, selectedYear, selectedMonth]);

  // Calculate yearly totals for selected year
  const yearlyStats = useMemo(() => {
    const totalPnl = monthlyData.reduce((sum, m) => sum + m.pnl, 0);
    const totalTrades = monthlyData.reduce((sum, m) => sum + m.tradeCount, 0);
    const roi = initialCapital > 0 ? (totalPnl / initialCapital) * 100 : 0;
    return { totalPnl, roi, totalTrades };
  }, [monthlyData, initialCapital]);

  // Generate mini equity curve data
  const equityCurveData = useMemo(() => {
    let runningTotal = initialCapital;
    const sortedTrades = [...trades]
      .filter(t => {
        const tradeDate = parseISO(t.trade_date);
        return getYear(tradeDate) === selectedYear;
      })
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

    if (sortedTrades.length === 0) {
      return [{ value: initialCapital }, { value: initialCapital }];
    }

    return sortedTrades.map(trade => {
      runningTotal += trade.profit_loss || 0;
      return { value: runningTotal };
    });
  }, [trades, selectedYear, initialCapital]);

  // Format amount for display (compact)
  const formatCompact = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    setSelectedYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    }
  };

  return (
    <div className="glass-card p-4 space-y-4 animate-fade-in">
      {/* Header - Yearly Performance Summary */}
      <div 
        className={cn(
          "rounded-lg p-4 cursor-pointer border transition-all",
          yearlyStats.totalPnl >= 0 
            ? "bg-gradient-to-r from-profit/10 to-profit/5 border-profit/20 hover:border-profit/40" 
            : "bg-gradient-to-r from-loss/10 to-loss/5 border-loss/20 hover:border-loss/40"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); navigateYear('prev'); }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <p className="text-sm font-semibold text-foreground">
                {selectedYear} {language === 'fr' ? 'PERFORMANCE' : 'PERFORMANCE'}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); navigateYear('next'); }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <span className={cn(
                "font-display text-xl sm:text-2xl font-bold truncate",
                yearlyStats.totalPnl >= 0 ? "text-profit" : "text-loss"
              )}>
                <ConfidentialValue>
                  {yearlyStats.totalPnl >= 0 ? '+' : ''}{formatCompact(yearlyStats.totalPnl)}
                </ConfidentialValue>
              </span>
              <span className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full shrink-0",
                yearlyStats.roi >= 0 ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
              )}>
                <TrendingUp className="w-3 h-3" />
                {yearlyStats.roi >= 0 ? '+' : ''}{yearlyStats.roi.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {yearlyStats.totalTrades} trades
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mini Equity Curve */}
            <div className="w-16 sm:w-24 h-10 sm:h-12 hidden xs:block">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData}>
                  <defs>
                    <linearGradient id="equityGradientCalendar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={yearlyStats.totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={yearlyStats.totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={yearlyStats.totalPnl >= 0 ? "hsl(var(--profit))" : "hsl(var(--loss))"}
                    strokeWidth={2}
                    fill="url(#equityGradientCalendar)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          {/* View Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'monthly' | 'yearly')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
              <TabsTrigger value="calendar" className="text-xs gap-1">
                <Calendar className="w-3 h-3" />
                {language === 'fr' ? 'Calendrier' : 'Calendar'}
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">
                {language === 'fr' ? 'Mensuel' : 'Monthly'}
              </TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs">
                {language === 'fr' ? 'Classement' : 'Ranking'}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Calendar View - Daily */}
          {viewMode === 'calendar' && (
            <div className="space-y-3">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-semibold text-foreground">
                  {monthsFull[selectedMonth]} {selectedYear}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1">
                {days.map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: dailyData.startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Day cells */}
                {dailyData.dailyStats.map((day) => (
                  <div
                    key={day.day}
                    className={cn(
                      "aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all p-0.5",
                      day.hasData
                        ? day.isPositive
                          ? "bg-profit/20 border border-profit/40 hover:bg-profit/30"
                          : "bg-loss/20 border border-loss/40 hover:bg-loss/30"
                        : "bg-secondary/30 hover:bg-secondary/50"
                    )}
                    title={day.hasData ? `${day.tradeCount} trade(s): ${formatAmount(day.pnl)}` : ''}
                  >
                    <span className={cn(
                      "font-medium",
                      day.hasData ? (day.isPositive ? "text-profit" : "text-loss") : "text-muted-foreground"
                    )}>
                      {day.day}
                    </span>
                    {day.hasData && (
                      <span className={cn(
                        "text-[8px] sm:text-[10px] font-semibold truncate max-w-full",
                        day.isPositive ? "text-profit" : "text-loss"
                      )}>
                        {day.pnl >= 0 ? '+' : ''}{formatCompact(day.pnl)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Month Summary */}
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Total du mois' : 'Month total'}
                </span>
                <span className={cn(
                  "font-bold",
                  monthlyData[selectedMonth].pnl >= 0 ? "text-profit" : "text-loss"
                )}>
                  <ConfidentialValue>
                    {monthlyData[selectedMonth].pnl >= 0 ? '+' : ''}{formatAmount(monthlyData[selectedMonth].pnl)}
                  </ConfidentialValue>
                </span>
              </div>
            </div>
          )}

          {/* Monthly Grid */}
          {viewMode === 'monthly' && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {monthlyData.map((month) => (
                <button
                  key={month.month}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(month.month);
                    setViewMode('calendar');
                  }}
                  className={cn(
                    "rounded-lg p-3 text-center transition-all border-2 hover:scale-[1.02]",
                    month.pnl > 0 
                      ? "border-profit/50 bg-profit/5 hover:bg-profit/15" 
                      : month.pnl < 0 
                        ? "border-loss/50 bg-loss/5 hover:bg-loss/15"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                  )}
                >
                  <p className="font-semibold text-foreground text-sm">{month.monthName}</p>
                  <p className={cn(
                    "font-display font-bold text-sm mt-1 truncate",
                    month.pnl > 0 ? "text-profit" : month.pnl < 0 ? "text-loss" : "text-muted-foreground"
                  )}>
                    <ConfidentialValue>
                      {month.pnl !== 0 ? (month.pnl > 0 ? '+' : '') + formatCompact(month.pnl) : '-'}
                    </ConfidentialValue>
                  </p>
                  <p className={cn(
                    "text-xs mt-0.5",
                    month.percentChange > 0 ? "text-profit" : month.percentChange < 0 ? "text-loss" : "text-muted-foreground"
                  )}>
                    {month.percentChange !== 0 
                      ? `${month.percentChange > 0 ? '+' : ''}${month.percentChange.toFixed(1)}%` 
                      : '-'}
                  </p>
                  {month.tradeCount > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {month.tradeCount} {month.tradeCount === 1 ? 'trade' : 'trades'}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Yearly View - Ranking */}
          {viewMode === 'yearly' && (
            <div className="space-y-2">
              {monthlyData.filter(m => m.tradeCount > 0).length > 0 ? (
                monthlyData
                  .filter(m => m.tradeCount > 0)
                  .sort((a, b) => b.pnl - a.pnl)
                  .map((month, index) => (
                    <button
                      key={month.month}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(month.month);
                        setViewMode('calendar');
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-[1.01]",
                        month.pnl > 0 ? "border-profit/30 bg-profit/5 hover:bg-profit/10" : "border-loss/30 bg-loss/5 hover:bg-loss/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                          index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                          index === 1 ? "bg-gray-400/20 text-gray-400" :
                          index === 2 ? "bg-amber-600/20 text-amber-600" :
                          "bg-secondary text-muted-foreground"
                        )}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-foreground">{monthsFull[month.month]}</span>
                        <span className="text-xs text-muted-foreground">
                          ({month.tradeCount} trades)
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "font-bold",
                          month.pnl > 0 ? "text-profit" : "text-loss"
                        )}>
                          <ConfidentialValue>
                            {month.pnl > 0 ? '+' : ''}{formatAmount(month.pnl)}
                          </ConfidentialValue>
                        </p>
                        <p className={cn(
                          "text-xs",
                          month.percentChange > 0 ? "text-profit" : "text-loss"
                        )}>
                          {month.percentChange > 0 ? '+' : ''}{month.percentChange.toFixed(1)}%
                        </p>
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">
                    {language === 'fr' ? 'Aucun trade cette année' : 'No trades this year'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Trading Tip */}
          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
                  {language === 'fr' ? 'Conseil Trading' : 'Trading Tip'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'fr' ? tradingTip.fr : tradingTip.en}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MonthlyPerformanceCalendar;
