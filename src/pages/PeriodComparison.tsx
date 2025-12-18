import React, { useState, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useCurrency } from '@/hooks/useCurrency';
import { useSecurity } from '@/contexts/SecurityContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks, isWithinInterval, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  GitCompare,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ViewMode = 'week' | 'month';

interface PeriodStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winrate: number;
  pnl: number;
  avgProfit: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  disciplineScore: number;
}

const PeriodComparison: React.FC = () => {
  const { language, t } = useLanguage();
  const { trades, isLoading } = useTrades();
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const { settings: securitySettings } = useSecurity();
  const locale = language === 'fr' ? fr : enUS;

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [isExporting, setIsExporting] = useState(false);

  // Period A: Current month/week by default
  const [periodADate, setPeriodADate] = useState<Date>(new Date());
  const [periodAOpen, setPeriodAOpen] = useState(false);

  // Period B: Previous month/week by default
  const [periodBDate, setPeriodBDate] = useState<Date>(subMonths(new Date(), 1));
  const [periodBOpen, setPeriodBOpen] = useState(false);

  // Calculate period boundaries based on view mode
  const periodAStart = viewMode === 'month' 
    ? startOfMonth(periodADate) 
    : startOfWeek(periodADate, { weekStartsOn: 1 });
  const periodAEnd = viewMode === 'month' 
    ? endOfMonth(periodADate) 
    : endOfWeek(periodADate, { weekStartsOn: 1 });
  const periodBStart = viewMode === 'month' 
    ? startOfMonth(periodBDate) 
    : startOfWeek(periodBDate, { weekStartsOn: 1 });
  const periodBEnd = viewMode === 'month' 
    ? endOfMonth(periodBDate) 
    : endOfWeek(periodBDate, { weekStartsOn: 1 });

  // Format period label based on view mode
  const formatPeriodLabel = (date: Date) => {
    if (viewMode === 'month') {
      return format(date, 'MMMM yyyy', { locale });
    }
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    return `${format(weekStart, 'd MMM', { locale })} - ${format(weekEnd, 'd MMM yyyy', { locale })}`;
  };

  const formatPeriodKey = (date: Date) => {
    if (viewMode === 'month') {
      return format(date, 'MMM yyyy', { locale });
    }
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return `S${format(weekStart, 'w', { locale })} ${format(weekStart, 'yyyy', { locale })}`;
  };

  // Calculate stats for a period
  const calculatePeriodStats = (periodStart: Date, periodEnd: Date): PeriodStats => {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winrate: 0,
        pnl: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
        disciplineScore: 0,
      };
    }

    const periodTrades = trades.filter(trade => {
      const tradeDate = parseISO(trade.trade_date);
      return isWithinInterval(tradeDate, { start: periodStart, end: periodEnd });
    });

    if (periodTrades.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winrate: 0,
        pnl: 0,
        avgProfit: 0,
        avgLoss: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
        disciplineScore: 0,
      };
    }

    const winningTrades = periodTrades.filter(t => t.result === 'win');
    const losingTrades = periodTrades.filter(t => t.result === 'loss');
    const winrate = periodTrades.length > 0 
      ? Math.round((winningTrades.length / periodTrades.length) * 100) 
      : 0;
    const pnl = periodTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0));

    const avgProfit = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const allPnL = periodTrades.map(t => t.profit_loss || 0);
    const bestTrade = allPnL.length > 0 ? Math.max(...allPnL) : 0;
    const worstTrade = allPnL.length > 0 ? Math.min(...allPnL) : 0;

    const tradesWithSL = periodTrades.filter(t => t.stop_loss).length;
    const tradesWithTP = periodTrades.filter(t => t.take_profit).length;
    const disciplineScore = periodTrades.length > 0
      ? Math.round(((tradesWithSL + tradesWithTP) / (periodTrades.length * 2)) * 100)
      : 0;

    return {
      totalTrades: periodTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winrate,
      pnl: Math.round(pnl * 100) / 100,
      avgProfit: Math.round(avgProfit * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: profitFactor === Infinity ? 999 : Math.round(profitFactor * 100) / 100,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      disciplineScore,
    };
  };

  const statsA = useMemo(() => calculatePeriodStats(periodAStart, periodAEnd), [trades, periodAStart, periodAEnd]);
  const statsB = useMemo(() => calculatePeriodStats(periodBStart, periodBEnd), [trades, periodBStart, periodBEnd]);

  // Calculate difference percentage
  const getDiff = (a: number, b: number, higherIsBetter: boolean = true) => {
    if (b === 0) return a > 0 ? 100 : 0;
    const diff = ((a - b) / Math.abs(b)) * 100;
    const rounded = Math.round(diff);
    return higherIsBetter ? rounded : -rounded;
  };

  const periodAKey = formatPeriodKey(periodADate);
  const periodBKey = formatPeriodKey(periodBDate);

  // Comparison bar chart data
  const comparisonData = useMemo(() => [
    {
      metric: language === 'fr' ? 'Trades' : 'Trades',
      [periodAKey]: statsA.totalTrades,
      [periodBKey]: statsB.totalTrades,
    },
    {
      metric: language === 'fr' ? 'Winrate %' : 'Winrate %',
      [periodAKey]: statsA.winrate,
      [periodBKey]: statsB.winrate,
    },
    {
      metric: language === 'fr' ? 'Discipline %' : 'Discipline %',
      [periodAKey]: statsA.disciplineScore,
      [periodBKey]: statsB.disciplineScore,
    },
  ], [statsA, statsB, periodAKey, periodBKey, language]);

  // Radar chart data
  const radarData = useMemo(() => {
    const maxTrades = Math.max(statsA.totalTrades, statsB.totalTrades, 1);
    const maxProfitFactor = Math.max(statsA.profitFactor, statsB.profitFactor, 1);
    
    return [
      { metric: 'Winrate', A: statsA.winrate, B: statsB.winrate, fullMark: 100 },
      { metric: language === 'fr' ? 'Volume' : 'Volume', A: (statsA.totalTrades / maxTrades) * 100, B: (statsB.totalTrades / maxTrades) * 100, fullMark: 100 },
      { metric: 'Discipline', A: statsA.disciplineScore, B: statsB.disciplineScore, fullMark: 100 },
      { metric: 'Profit Factor', A: Math.min((statsA.profitFactor / maxProfitFactor) * 100, 100), B: Math.min((statsB.profitFactor / maxProfitFactor) * 100, 100), fullMark: 100 },
    ];
  }, [statsA, statsB, language]);

  // Navigate periods
  const navigatePeriod = (period: 'A' | 'B', direction: 'prev' | 'next') => {
    const setter = period === 'A' ? setPeriodADate : setPeriodBDate;
    if (viewMode === 'month') {
      setter(prev => direction === 'next' ? subMonths(prev, -1) : subMonths(prev, 1));
    } else {
      setter(prev => direction === 'next' ? subWeeks(prev, -1) : subWeeks(prev, 1));
    }
  };

  // Handle view mode change
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Reset period B to previous period based on new mode
    if (mode === 'month') {
      setPeriodBDate(subMonths(periodADate, 1));
    } else {
      setPeriodBDate(subWeeks(periodADate, 1));
    }
  };

  // PDF Export function
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const currency = getCurrencySymbol();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(33, 37, 41);
      doc.text('Smart Trade Tracker', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(16);
      doc.text(language === 'fr' ? 'Rapport de Comparaison' : 'Comparison Report', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      doc.text(`${language === 'fr' ? 'Généré le' : 'Generated on'}: ${format(new Date(), 'PPP', { locale })}`, pageWidth / 2, 38, { align: 'center' });

      // Period info
      doc.setFontSize(12);
      doc.setTextColor(33, 37, 41);
      doc.text(`${language === 'fr' ? 'Période A' : 'Period A'}: ${formatPeriodLabel(periodADate)}`, 14, 52);
      doc.text(`${language === 'fr' ? 'Période B' : 'Period B'}: ${formatPeriodLabel(periodBDate)}`, 14, 60);

      // Comparison Table
      const tableData = [
        [language === 'fr' ? 'Métrique' : 'Metric', periodAKey, periodBKey, language === 'fr' ? 'Variation' : 'Change'],
        [language === 'fr' ? 'Total Trades' : 'Total Trades', String(statsA.totalTrades), String(statsB.totalTrades), `${getDiff(statsA.totalTrades, statsB.totalTrades) >= 0 ? '+' : ''}${getDiff(statsA.totalTrades, statsB.totalTrades)}%`],
        ['Winrate', `${statsA.winrate}%`, `${statsB.winrate}%`, `${getDiff(statsA.winrate, statsB.winrate) >= 0 ? '+' : ''}${getDiff(statsA.winrate, statsB.winrate)}%`],
        ['PnL', `${statsA.pnl >= 0 ? '+' : ''}${statsA.pnl.toFixed(2)} ${currency}`, `${statsB.pnl >= 0 ? '+' : ''}${statsB.pnl.toFixed(2)} ${currency}`, `${getDiff(statsA.pnl, statsB.pnl) >= 0 ? '+' : ''}${getDiff(statsA.pnl, statsB.pnl)}%`],
        [language === 'fr' ? 'Trades Gagnants' : 'Winning Trades', String(statsA.winningTrades), String(statsB.winningTrades), `${getDiff(statsA.winningTrades, statsB.winningTrades) >= 0 ? '+' : ''}${getDiff(statsA.winningTrades, statsB.winningTrades)}%`],
        [language === 'fr' ? 'Trades Perdants' : 'Losing Trades', String(statsA.losingTrades), String(statsB.losingTrades), `${getDiff(statsA.losingTrades, statsB.losingTrades, false) >= 0 ? '+' : ''}${getDiff(statsA.losingTrades, statsB.losingTrades, false)}%`],
        [language === 'fr' ? 'Profit Moyen' : 'Avg Profit', `${statsA.avgProfit.toFixed(2)} ${currency}`, `${statsB.avgProfit.toFixed(2)} ${currency}`, `${getDiff(statsA.avgProfit, statsB.avgProfit) >= 0 ? '+' : ''}${getDiff(statsA.avgProfit, statsB.avgProfit)}%`],
        [language === 'fr' ? 'Perte Moyenne' : 'Avg Loss', `${statsA.avgLoss.toFixed(2)} ${currency}`, `${statsB.avgLoss.toFixed(2)} ${currency}`, `${getDiff(statsA.avgLoss, statsB.avgLoss, false) >= 0 ? '+' : ''}${getDiff(statsA.avgLoss, statsB.avgLoss, false)}%`],
        ['Profit Factor', statsA.profitFactor >= 999 ? 'Inf' : statsA.profitFactor.toFixed(2), statsB.profitFactor >= 999 ? 'Inf' : statsB.profitFactor.toFixed(2), `${getDiff(statsA.profitFactor, statsB.profitFactor) >= 0 ? '+' : ''}${getDiff(statsA.profitFactor, statsB.profitFactor)}%`],
        ['Discipline', `${statsA.disciplineScore}/100`, `${statsB.disciplineScore}/100`, `${getDiff(statsA.disciplineScore, statsB.disciplineScore) >= 0 ? '+' : ''}${getDiff(statsA.disciplineScore, statsB.disciplineScore)}%`],
      ];

      autoTable(doc, {
        startY: 70,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          3: { halign: 'center' },
        },
      });

      // Summary
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.setTextColor(33, 37, 41);
      doc.text(language === 'fr' ? 'Résumé' : 'Summary', 14, finalY);
      
      doc.setFontSize(11);
      const pnlDiff = statsA.pnl - statsB.pnl;
      const winrateDiff = statsA.winrate - statsB.winrate;
      
      doc.setTextColor(pnlDiff >= 0 ? 34 : 220, pnlDiff >= 0 ? 197 : 53, pnlDiff >= 0 ? 94 : 69);
      doc.text(`PnL: ${pnlDiff >= 0 ? '+' : ''}${pnlDiff.toFixed(2)} ${currency}`, 14, finalY + 10);
      
      doc.setTextColor(winrateDiff >= 0 ? 34 : 220, winrateDiff >= 0 ? 197 : 53, winrateDiff >= 0 ? 94 : 69);
      doc.text(`Winrate: ${winrateDiff >= 0 ? '+' : ''}${winrateDiff}%`, 14, finalY + 18);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(108, 117, 125);
      doc.text('Smart Trade Tracker - ALPHA FX', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

      // Save PDF
      const fileName = `comparison_${format(periodADate, 'yyyy-MM')}_vs_${format(periodBDate, 'yyyy-MM')}.pdf`;
      doc.save(fileName);
      
      toast.success(language === 'fr' ? 'PDF exporté avec succès!' : 'PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(language === 'fr' ? 'Erreur lors de l\'export PDF' : 'Error exporting PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Stat comparison card component
  const StatComparisonCard = ({ 
    label, 
    valueA, 
    valueB, 
    formatValue = (v: number) => v.toString(),
    higherIsBetter = true,
    icon: Icon 
  }: { 
    label: string; 
    valueA: number; 
    valueB: number; 
    formatValue?: (v: number) => string;
    higherIsBetter?: boolean;
    icon: React.ElementType;
  }) => {
    const diff = getDiff(valueA, valueB, higherIsBetter);
    const isImproved = diff > 0;
    const isDeclined = diff < 0;

    return (
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{periodAKey}</p>
            <p className="font-display text-xl font-bold text-foreground">
              {securitySettings.confidentialMode ? '****' : formatValue(valueA)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{periodBKey}</p>
            <p className="font-display text-xl font-bold text-foreground">
              {securitySettings.confidentialMode ? '****' : formatValue(valueB)}
            </p>
          </div>
        </div>
        <div className={cn(
          "mt-3 pt-3 border-t border-border flex items-center gap-2",
          isImproved && "text-profit",
          isDeclined && "text-loss",
          !isImproved && !isDeclined && "text-muted-foreground"
        )}>
          {isImproved ? <ArrowUp className="w-4 h-4" /> : isDeclined ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {isImproved ? '+' : ''}{diff}% {language === 'fr' ? 'vs période précédente' : 'vs previous period'}
          </span>
        </div>
      </div>
    );
  };

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
            {t('periodComparison')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('comparePeriods')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!hasNoData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToPDF}
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </Button>
          )}
          <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
            <GitCompare className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="glass-card p-4 animate-fade-in">
        <div className="flex items-center justify-center gap-2 p-1 rounded-lg bg-secondary/50 w-fit mx-auto">
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('week')}
            className={cn(viewMode === 'week' && 'bg-primary text-primary-foreground')}
          >
            {t('week')}
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('month')}
            className={cn(viewMode === 'month' && 'bg-primary text-primary-foreground')}
          >
            {t('month')}
          </Button>
        </div>
      </div>

      {/* Period Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Period A Selector */}
        <div className="glass-card p-4 animate-fade-in">
          <p className="text-sm font-medium text-foreground mb-3">
            {language === 'fr' ? 'Période A (actuelle)' : 'Period A (current)'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigatePeriod('A', 'prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover open={periodAOpen} onOpenChange={setPeriodAOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2 font-display text-xs sm:text-sm">
                  <CalendarIcon className="w-4 h-4" />
                  {formatPeriodLabel(periodADate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="center">
                <Calendar
                  mode="single"
                  selected={periodADate}
                  onSelect={(date) => {
                    if (date) {
                      setPeriodADate(date);
                      setPeriodAOpen(false);
                    }
                  }}
                  locale={locale}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => navigatePeriod('A', 'next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Period B Selector */}
        <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-sm font-medium text-foreground mb-3">
            {language === 'fr' ? 'Période B (comparaison)' : 'Period B (comparison)'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigatePeriod('B', 'prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover open={periodBOpen} onOpenChange={setPeriodBOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2 font-display text-xs sm:text-sm">
                  <CalendarIcon className="w-4 h-4" />
                  {formatPeriodLabel(periodBDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover border-border" align="center">
                <Calendar
                  mode="single"
                  selected={periodBDate}
                  onSelect={(date) => {
                    if (date) {
                      setPeriodBDate(date);
                      setPeriodBOpen(false);
                    }
                  }}
                  locale={locale}
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={() => navigatePeriod('B', 'next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {hasNoData ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <GitCompare className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">
            {t('noData')}
          </h3>
          <p className="text-muted-foreground">
            {t('addTradesToSeeReports')}
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatComparisonCard
              label={t('totalTrades')}
              valueA={statsA.totalTrades}
              valueB={statsB.totalTrades}
              icon={Award}
            />
            <StatComparisonCard
              label={t('winrate')}
              valueA={statsA.winrate}
              valueB={statsB.winrate}
              formatValue={(v) => `${v}%`}
              icon={Target}
            />
            <StatComparisonCard
              label="PnL"
              valueA={statsA.pnl}
              valueB={statsB.pnl}
              formatValue={(v) => formatAmount(v, true)}
              icon={statsA.pnl >= statsB.pnl ? TrendingUp : TrendingDown}
            />
            <StatComparisonCard
              label={t('avgProfit')}
              valueA={statsA.avgProfit}
              valueB={statsB.avgProfit}
              formatValue={(v) => formatAmount(v, true)}
              icon={TrendingUp}
            />
            <StatComparisonCard
              label={t('avgLoss')}
              valueA={statsA.avgLoss}
              valueB={statsB.avgLoss}
              formatValue={(v) => formatAmount(v)}
              higherIsBetter={false}
              icon={TrendingDown}
            />
            <StatComparisonCard
              label={t('discipline')}
              valueA={statsA.disciplineScore}
              valueB={statsB.disciplineScore}
              formatValue={(v) => `${v}/100`}
              icon={Target}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Comparison */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <h3 className="font-display font-semibold text-foreground mb-4">
                {language === 'fr' ? 'Comparaison des Métriques' : 'Metrics Comparison'}
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="metric" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey={periodAKey} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey={periodBKey} fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '250ms' }}>
              <h3 className="font-display font-semibold text-foreground mb-4">
                {language === 'fr' ? 'Profil de Performance' : 'Performance Profile'}
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Radar name={periodAKey} dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name={periodBKey} dataKey="B" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.2} />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${Math.round(value)}%`, '']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h3 className="font-display font-semibold text-foreground mb-4">
              {language === 'fr' ? 'Résumé de la Comparaison' : 'Comparison Summary'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">{periodAKey}</p>
                <div className="space-y-2">
                  <p className="text-foreground">
                    <span className="text-profit font-medium">{statsA.winningTrades}</span> {language === 'fr' ? 'gains' : 'wins'} / 
                    <span className="text-loss font-medium ml-1">{statsA.losingTrades}</span> {language === 'fr' ? 'pertes' : 'losses'}
                  </p>
                  <p className={cn("text-2xl font-display font-bold", statsA.pnl >= 0 ? "text-profit" : "text-loss")}>
                    {securitySettings.confidentialMode ? '****' : formatAmount(statsA.pnl, true)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">{periodBKey}</p>
                <div className="space-y-2">
                  <p className="text-foreground">
                    <span className="text-profit font-medium">{statsB.winningTrades}</span> {language === 'fr' ? 'gains' : 'wins'} / 
                    <span className="text-loss font-medium ml-1">{statsB.losingTrades}</span> {language === 'fr' ? 'pertes' : 'losses'}
                  </p>
                  <p className={cn("text-2xl font-display font-bold", statsB.pnl >= 0 ? "text-profit" : "text-loss")}>
                    {securitySettings.confidentialMode ? '****' : formatAmount(statsB.pnl, true)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PeriodComparison;
