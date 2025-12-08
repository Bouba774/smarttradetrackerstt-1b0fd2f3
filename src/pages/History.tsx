import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface Trade {
  id: string;
  date: string;
  time: string;
  asset: string;
  direction: 'buy' | 'sell';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  pnl: number;
  setup: string;
  timeframe: string;
  emotion: string;
  qualityScore: number;
  tags: string[];
  images?: string[];
}

const MOCK_TRADES: Trade[] = [
  {
    id: '1',
    date: '2024-12-05',
    time: '10:30',
    asset: 'EUR/USD',
    direction: 'buy',
    entryPrice: 1.0850,
    stopLoss: 1.0800,
    takeProfit: 1.0950,
    lotSize: 0.5,
    pnl: 250,
    setup: 'Breakout',
    timeframe: 'H1',
    emotion: 'calm',
    qualityScore: 85,
    tags: ['A+ Setup', 'Plan Respecté'],
  },
  {
    id: '2',
    date: '2024-12-04',
    time: '14:45',
    asset: 'GBP/JPY',
    direction: 'sell',
    entryPrice: 189.50,
    stopLoss: 190.20,
    takeProfit: 188.00,
    lotSize: 0.3,
    pnl: -120,
    setup: 'Reversal',
    timeframe: 'M30',
    emotion: 'stressed',
    qualityScore: 55,
    tags: ['FOMO', 'Early Entry'],
  },
  {
    id: '3',
    date: '2024-12-04',
    time: '09:15',
    asset: 'XAU/USD',
    direction: 'buy',
    entryPrice: 2145.00,
    stopLoss: 2135.00,
    takeProfit: 2165.00,
    lotSize: 0.2,
    pnl: 180,
    setup: 'Trend Following',
    timeframe: 'H4',
    emotion: 'confident',
    qualityScore: 92,
    tags: ['High Probability', 'Perfect Execution'],
  },
  {
    id: '4',
    date: '2024-12-03',
    time: '16:00',
    asset: 'US100',
    direction: 'buy',
    entryPrice: 18250,
    stopLoss: 18200,
    takeProfit: 18350,
    lotSize: 0.1,
    pnl: 75,
    setup: 'Support/Resistance',
    timeframe: 'M15',
    emotion: 'calm',
    qualityScore: 78,
    tags: ['Plan Respecté'],
  },
  {
    id: '5',
    date: '2024-11-28',
    time: '11:30',
    asset: 'BTC/USD',
    direction: 'sell',
    entryPrice: 71500,
    stopLoss: 72500,
    takeProfit: 69500,
    lotSize: 0.05,
    pnl: -200,
    setup: 'Reversal',
    timeframe: 'H1',
    emotion: 'impulsive',
    qualityScore: 35,
    tags: ['Revenge Trading', 'FOMO'],
  },
  {
    id: '6',
    date: '2024-11-25',
    time: '08:00',
    asset: 'EUR/GBP',
    direction: 'buy',
    entryPrice: 0.8550,
    stopLoss: 0.8520,
    takeProfit: 0.8600,
    lotSize: 0.4,
    pnl: 0,
    setup: 'Range',
    timeframe: 'H1',
    emotion: 'calm',
    qualityScore: 70,
    tags: ['Break-even'],
  },
];

const History: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'fr' ? fr : enUS;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [filterSetup, setFilterSetup] = useState<string>('all');
  const [filterEmotion, setFilterEmotion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  
  // Date range filter
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Get unique values for filters
  const uniqueAssets = [...new Set(MOCK_TRADES.map(t => t.asset))];
  const uniqueSetups = [...new Set(MOCK_TRADES.map(t => t.setup))];
  const uniqueEmotions = [...new Set(MOCK_TRADES.map(t => t.emotion))];

  const filteredTrades = useMemo(() => {
    let trades = MOCK_TRADES;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      trades = trades.filter(trade => 
        trade.asset.toLowerCase().includes(query) ||
        trade.setup.toLowerCase().includes(query) ||
        trade.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Direction filter
    if (filterDirection !== 'all') {
      trades = trades.filter(t => t.direction === filterDirection);
    }

    // Result filter
    if (filterResult !== 'all') {
      if (filterResult === 'win') trades = trades.filter(t => t.pnl > 0);
      else if (filterResult === 'loss') trades = trades.filter(t => t.pnl < 0);
      else if (filterResult === 'breakeven') trades = trades.filter(t => t.pnl === 0);
    }

    // Asset filter
    if (filterAsset !== 'all') {
      trades = trades.filter(t => t.asset === filterAsset);
    }

    // Setup filter
    if (filterSetup !== 'all') {
      trades = trades.filter(t => t.setup === filterSetup);
    }

    // Emotion filter
    if (filterEmotion !== 'all') {
      trades = trades.filter(t => t.emotion === filterEmotion);
    }

    // Period filter
    const today = new Date();
    if (periodFilter === 'day') {
      trades = trades.filter(t => 
        isWithinInterval(parseISO(t.date), { start: startOfDay(today), end: endOfDay(today) })
      );
    } else if (periodFilter === 'week') {
      trades = trades.filter(t => 
        isWithinInterval(parseISO(t.date), { start: startOfWeek(today, { locale }), end: endOfWeek(today, { locale }) })
      );
    } else if (periodFilter === 'month') {
      trades = trades.filter(t => 
        isWithinInterval(parseISO(t.date), { start: startOfMonth(today), end: endOfMonth(today) })
      );
    } else if (periodFilter === 'year') {
      trades = trades.filter(t => 
        isWithinInterval(parseISO(t.date), { start: startOfYear(today), end: endOfYear(today) })
      );
    } else if (periodFilter === 'custom' && startDate && endDate) {
      trades = trades.filter(t => 
        isWithinInterval(parseISO(t.date), { start: startOfDay(startDate), end: endOfDay(endDate) })
      );
    }

    // Sort
    trades = [...trades].sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') return modifier * (new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortBy === 'pnl') return modifier * (a.pnl - b.pnl);
      if (sortBy === 'quality') return modifier * (a.qualityScore - b.qualityScore);
      if (sortBy === 'asset') return modifier * a.asset.localeCompare(b.asset);
      return 0;
    });

    return trades;
  }, [searchQuery, filterDirection, filterResult, filterAsset, filterSetup, filterEmotion, sortBy, sortOrder, periodFilter, startDate, endDate, locale]);

  // Calculate totals
  const totalGains = filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + Math.abs(t.pnl), 0);
  const totalBreakeven = filteredTrades.filter(t => t.pnl === 0).length;

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDirection('all');
    setFilterResult('all');
    setFilterAsset('all');
    setFilterSetup('all');
    setFilterEmotion('all');
    setPeriodFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('history')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Retrouvez tous vos trades passés ({filteredTrades.length} trades)
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('totalGains')}</p>
          <p className="font-display text-xl font-bold profit-text">${totalGains.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('totalLosses')}</p>
          <p className="font-display text-xl font-bold loss-text">${totalLosses.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('breakeven')}</p>
          <p className="font-display text-xl font-bold text-muted-foreground">{totalBreakeven}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 space-y-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
        {/* Search & Period */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="day">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
              <SelectItem value="custom">Personnalisé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        {periodFilter === 'custom' && (
          <div className="flex flex-wrap gap-4 p-4 bg-secondary/30 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Date début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={locale}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end pb-2 text-muted-foreground">→</div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Date fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={locale}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={filterDirection} onValueChange={setFilterDirection}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Résultat" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="win">Gain</SelectItem>
              <SelectItem value="loss">Perte</SelectItem>
              <SelectItem value="breakeven">Break-even</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAsset} onValueChange={setFilterAsset}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Actif" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tous</SelectItem>
              {uniqueAssets.map(asset => (
                <SelectItem key={asset} value={asset}>{asset}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSetup} onValueChange={setFilterSetup}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Setup" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tous</SelectItem>
              {uniqueSetups.map(setup => (
                <SelectItem key={setup} value={setup}>{setup}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterEmotion} onValueChange={setFilterEmotion}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Émotion" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tous</SelectItem>
              {uniqueEmotions.map(emotion => (
                <SelectItem key={emotion} value={emotion} className="capitalize">{emotion}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="pnl">PnL</SelectItem>
              <SelectItem value="quality">Qualité</SelectItem>
              <SelectItem value="asset">Actif</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-3">
        {filteredTrades.map((trade, index) => (
          <div
            key={trade.id}
            className="glass-card-hover overflow-hidden animate-fade-in"
            style={{ animationDelay: `${200 + index * 50}ms` }}
          >
            {/* Main Row */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedTrade(expandedTrade === trade.id ? null : trade.id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Direction Icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    trade.direction === 'buy' ? "bg-profit/20" : "bg-loss/20"
                  )}>
                    {trade.direction === 'buy' ? (
                      <TrendingUp className="w-5 h-5 text-profit" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-loss" />
                    )}
                  </div>

                  {/* Trade Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-foreground">
                        {trade.asset}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {trade.timeframe}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(parseISO(trade.date), 'dd MMM yyyy', { locale })}</span>
                      <span>•</span>
                      <span>{trade.time}</span>
                      <span>•</span>
                      <span>{trade.setup}</span>
                    </div>
                  </div>
                </div>

                {/* PnL & Score */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className={cn(
                      "font-display font-bold",
                      trade.pnl > 0 ? "profit-text" : trade.pnl < 0 ? "loss-text" : "text-muted-foreground"
                    )}>
                      {trade.pnl > 0 ? '+' : ''}{trade.pnl}$
                    </p>
                    <p className="text-xs text-muted-foreground">{trade.lotSize} lots</p>
                  </div>

                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2",
                    trade.qualityScore >= 80 ? "border-profit text-profit" :
                    trade.qualityScore >= 60 ? "border-primary text-primary" :
                    "border-loss text-loss"
                  )}>
                    <span className="font-display font-bold text-sm">{trade.qualityScore}</span>
                  </div>

                  {expandedTrade === trade.id ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedTrade === trade.id && (
              <div className="border-t border-border p-4 bg-background/50 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('entryPrice')}</p>
                    <p className="font-medium text-foreground">{trade.entryPrice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('stopLoss')}</p>
                    <p className="font-medium text-loss">{trade.stopLoss}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('takeProfit')}</p>
                    <p className="font-medium text-profit">{trade.takeProfit}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('emotion')}</p>
                    <p className="font-medium text-foreground capitalize">{trade.emotion}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {trade.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Images if any */}
                {trade.images && trade.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {trade.images.map((img, idx) => (
                      <div key={idx} className="aspect-video rounded-lg overflow-hidden border border-border">
                        <img src={img} alt={`Capture ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTrades.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">{t('noData')}</p>
          <Button variant="ghost" onClick={clearFilters} className="mt-4">
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
};

// Add missing Label import
const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn("text-sm font-medium", className)}>{children}</span>
);

export default History;
