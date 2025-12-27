import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades, Trade } from '@/hooks/useTrades';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatPrice } from '@/lib/utils';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  X,
  Loader2,
  Trash2,
  FileX,
  Pencil,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import EditTradeDialog from '@/components/EditTradeDialog';
import ConfidentialValue from '@/components/ConfidentialValue';
import TradeMediaDisplay from '@/components/TradeMediaDisplay';
import MonthlyPerformanceCalendar from '@/components/MonthlyPerformanceCalendar';

const History: React.FC = () => {
  const { t, language } = useLanguage();
  const { trades, isLoading, deleteTrade, updateTrade } = useTrades();
  const { formatAmount } = useCurrency();
  const locale = language === 'fr' ? fr : enUS;

  // Edit trade state
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
  const uniqueAssets = [...new Set(trades.map(t => t.asset))];
  const uniqueSetups = [...new Set(trades.map(t => t.setup).filter(Boolean))];
  const uniqueEmotions = [...new Set(trades.map(t => t.emotions).filter(Boolean))];

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (periodFilter !== 'all') count++;
    if (filterDirection !== 'all') count++;
    if (filterResult !== 'all') count++;
    if (filterAsset !== 'all') count++;
    if (filterSetup !== 'all') count++;
    return count;
  }, [periodFilter, filterDirection, filterResult, filterAsset, filterSetup]);

  const filteredTrades = useMemo(() => {
    let filtered = [...trades];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(trade => 
        trade.asset.toLowerCase().includes(query) ||
        (trade.setup && trade.setup.toLowerCase().includes(query)) ||
        (trade.notes && trade.notes.toLowerCase().includes(query))
      );
    }

    // Direction filter
    if (filterDirection !== 'all') {
      filtered = filtered.filter(t => t.direction === filterDirection);
    }

    // Result filter
    if (filterResult !== 'all') {
      filtered = filtered.filter(t => t.result === filterResult);
    }

    // Asset filter
    if (filterAsset !== 'all') {
      filtered = filtered.filter(t => t.asset === filterAsset);
    }

    // Setup filter
    if (filterSetup !== 'all') {
      filtered = filtered.filter(t => t.setup === filterSetup);
    }

    // Emotion filter
    if (filterEmotion !== 'all') {
      filtered = filtered.filter(t => t.emotions === filterEmotion);
    }

    // Period filter
    const today = new Date();
    if (periodFilter === 'day') {
      filtered = filtered.filter(t => 
        isWithinInterval(parseISO(t.trade_date), { start: startOfDay(today), end: endOfDay(today) })
      );
    } else if (periodFilter === 'week') {
      filtered = filtered.filter(t => 
        isWithinInterval(parseISO(t.trade_date), { start: startOfWeek(today, { locale }), end: endOfWeek(today, { locale }) })
      );
    } else if (periodFilter === 'month') {
      filtered = filtered.filter(t => 
        isWithinInterval(parseISO(t.trade_date), { start: startOfMonth(today), end: endOfMonth(today) })
      );
    } else if (periodFilter === 'year') {
      filtered = filtered.filter(t => 
        isWithinInterval(parseISO(t.trade_date), { start: startOfYear(today), end: endOfYear(today) })
      );
    } else if (periodFilter === 'custom' && startDate && endDate) {
      filtered = filtered.filter(t => 
        isWithinInterval(parseISO(t.trade_date), { start: startOfDay(startDate), end: endOfDay(endDate) })
      );
    }

    // Sort
    filtered = filtered.sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') return modifier * (new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
      if (sortBy === 'pnl') return modifier * ((a.profit_loss || 0) - (b.profit_loss || 0));
      if (sortBy === 'asset') return modifier * a.asset.localeCompare(b.asset);
      if (sortBy === 'setup') return modifier * ((a.setup || '').localeCompare(b.setup || ''));
      return 0;
    });

    return filtered;
  }, [trades, searchQuery, filterDirection, filterResult, filterAsset, filterSetup, filterEmotion, sortBy, sortOrder, periodFilter, startDate, endDate, locale]);

  // Calculate totals
  const totalGains = filteredTrades.filter(t => t.profit_loss && t.profit_loss > 0).reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const totalLosses = filteredTrades.filter(t => t.profit_loss && t.profit_loss < 0).reduce((sum, t) => sum + Math.abs(t.profit_loss || 0), 0);
  const totalBreakeven = filteredTrades.filter(t => t.result === 'breakeven').length;

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

  const handleDeleteTrade = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce trade?' : 'Are you sure you want to delete this trade?')) {
      try {
        await deleteTrade.mutateAsync(id);
        toast.success(language === 'fr' ? 'Trade supprimé' : 'Trade deleted');
      } catch (error) {
        toast.error(language === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting trade');
      }
    }
  };

  const handleEditTrade = (trade: Trade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrade(trade);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: Partial<Trade>) => {
    await updateTrade.mutateAsync({ id, ...updates });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('history')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' ? `Retrouvez tous vos trades passés (${filteredTrades.length} trades)` : `View all your past trades (${filteredTrades.length} trades)`}
          </p>
        </div>
      </div>

      {/* Monthly Performance Calendar */}
      <MonthlyPerformanceCalendar trades={trades} />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="glass-card p-3 sm:p-4 text-center animate-fade-in overflow-hidden">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">{t('totalGains')}</p>
          <p className="font-display text-sm sm:text-xl font-bold profit-text truncate">
            <ConfidentialValue>{formatAmount(totalGains)}</ConfidentialValue>
          </p>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center animate-fade-in overflow-hidden" style={{ animationDelay: '50ms' }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">{t('totalLosses')}</p>
          <p className="font-display text-sm sm:text-xl font-bold loss-text truncate">
            <ConfidentialValue>{formatAmount(totalLosses)}</ConfidentialValue>
          </p>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center animate-fade-in overflow-hidden" style={{ animationDelay: '100ms' }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide truncate">{t('breakeven')}</p>
          <p className="font-display text-sm sm:text-xl font-bold text-muted-foreground">{totalBreakeven}</p>
        </div>
      </div>

      {/* Compact Filter Bar */}
      <div className="glass-card p-3 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[150px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('search') + '...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filters Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Filtres' : 'Filters'}</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-popover border-border" align="start">
              <div className="space-y-4">
                {/* Period Section */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {language === 'fr' ? 'Période' : 'Period'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 'all', label: t('all') },
                      { value: 'day', label: t('today') },
                      { value: 'week', label: t('thisWeek') },
                      { value: 'month', label: t('thisMonth') },
                      { value: 'year', label: t('thisYear') },
                      { value: 'custom', label: t('custom') },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={periodFilter === option.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPeriodFilter(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom Date Range */}
                  {periodFilter === 'custom' && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-secondary/30 rounded-lg">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                            <CalendarIcon className="w-3 h-3" />
                            {startDate ? format(startDate, 'dd/MM/yy') : t('select')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            locale={locale}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <span className="text-muted-foreground text-xs">→</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                            <CalendarIcon className="w-3 h-3" />
                            {endDate ? format(endDate, 'dd/MM/yy') : t('select')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            locale={locale}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>

                {/* Type Section */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t('direction')}
                  </p>
                  <div className="flex gap-2">
                    {[
                      { value: 'all', label: t('all') },
                      { value: 'long', label: 'Long' },
                      { value: 'short', label: 'Short' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={filterDirection === option.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs flex-1"
                        onClick={() => setFilterDirection(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Result Section */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {language === 'fr' ? 'Résultat' : 'Result'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: 'all', label: t('all') },
                      { value: 'win', label: language === 'fr' ? 'Gain' : 'Win' },
                      { value: 'loss', label: language === 'fr' ? 'Perte' : 'Loss' },
                      { value: 'breakeven', label: t('breakeven') },
                      { value: 'pending', label: language === 'fr' ? 'En cours' : 'Pending' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={filterResult === option.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setFilterResult(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Assets Section */}
                {uniqueAssets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t('asset')}
                    </p>
                    <Select value={filterAsset} onValueChange={setFilterAsset}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={t('all')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">{t('all')}</SelectItem>
                        {uniqueAssets.map(asset => (
                          <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Setups Section */}
                {uniqueSetups.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {t('setup')}
                    </p>
                    <Select value={filterSetup} onValueChange={setFilterSetup}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={t('all')} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">{t('all')}</SelectItem>
                        {uniqueSetups.map(setup => (
                          <SelectItem key={setup as string} value={setup as string}>{setup}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Sort Menu */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-28 h-9">
              <ArrowUpDown className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="pnl">PnL</SelectItem>
              <SelectItem value="asset">{t('asset')}</SelectItem>
              <SelectItem value="setup">{t('setup')}</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order Toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            title={sortOrder === 'asc' ? (language === 'fr' ? 'Croissant' : 'Ascending') : (language === 'fr' ? 'Décroissant' : 'Descending')}
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Active Filters Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-border/50">
            {periodFilter !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs h-6">
                {periodFilter === 'custom' && startDate && endDate 
                  ? `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`
                  : periodFilter === 'day' ? t('today')
                  : periodFilter === 'week' ? t('thisWeek')
                  : periodFilter === 'month' ? t('thisMonth')
                  : t('thisYear')
                }
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => { setPeriodFilter('all'); setStartDate(undefined); setEndDate(undefined); }} />
              </Badge>
            )}
            {filterDirection !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs h-6">
                {filterDirection === 'long' ? 'Long' : 'Short'}
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setFilterDirection('all')} />
              </Badge>
            )}
            {filterResult !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs h-6">
                {filterResult === 'win' ? (language === 'fr' ? 'Gain' : 'Win')
                  : filterResult === 'loss' ? (language === 'fr' ? 'Perte' : 'Loss')
                  : filterResult === 'breakeven' ? t('breakeven')
                  : (language === 'fr' ? 'En cours' : 'Pending')
                }
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setFilterResult('all')} />
              </Badge>
            )}
            {filterAsset !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs h-6">
                {filterAsset}
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setFilterAsset('all')} />
              </Badge>
            )}
            {filterSetup !== 'all' && (
              <Badge variant="secondary" className="gap-1 text-xs h-6">
                {filterSetup}
                <X className="w-3 h-3 cursor-pointer hover:text-foreground" onClick={() => setFilterSetup('all')} />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="w-3 h-3 mr-1" />
              {t('reset')}
            </Button>
          </div>
        )}
      </div>

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <div className="glass-card p-12 text-center animate-fade-in">
          <FileX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-2">
            {language === 'fr' ? 'Aucun trade trouvé' : 'No trades found'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {trades.length === 0 
              ? (language === 'fr' ? 'Commencez à enregistrer vos trades pour les voir ici' : 'Start recording your trades to see them here')
              : (language === 'fr' ? 'Essayez de modifier vos filtres' : 'Try adjusting your filters')
            }
          </p>
          {trades.length > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              {language === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
            </Button>
          )}
        </div>
      ) : (
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
                      trade.direction === 'long' ? "bg-profit/20" : "bg-loss/20"
                    )}>
                      {trade.direction === 'long' ? (
                        <TrendingUp className="w-5 h-5 text-profit" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-loss" />
                      )}
                    </div>

                    {/* Trade Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-semibold text-foreground">{trade.asset}</span>
                        <Badge variant="outline" className="text-xs">
                          {trade.direction === 'long' ? 'LONG' : 'SHORT'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(trade.trade_date), 'dd MMM yyyy HH:mm', { locale })}
                      </p>
                    </div>
                  </div>

                  {/* PnL and Actions */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="text-right min-w-0">
                      <p className={cn(
                        "font-display font-bold text-sm sm:text-lg",
                        trade.profit_loss && trade.profit_loss > 0 ? "profit-text" : 
                        trade.profit_loss && trade.profit_loss < 0 ? "loss-text" : "text-muted-foreground"
                      )}>
                        {trade.profit_loss !== null 
                          ? <ConfidentialValue>{formatAmount(trade.profit_loss, true)}</ConfidentialValue>
                          : (language === 'fr' ? 'En cours' : 'Pending')
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <ConfidentialValue>{trade.lot_size} lots</ConfidentialValue>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => handleEditTrade(trade, e)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-loss"
                        onClick={(e) => handleDeleteTrade(trade.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {expandedTrade === trade.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTrade === trade.id && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('entryPrice')}</p>
                      <p className="font-medium text-foreground">{formatPrice(trade.entry_price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('exitPrice')}</p>
                      <p className="font-medium text-foreground">{trade.exit_price ? formatPrice(trade.exit_price) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('stopLoss')}</p>
                      <p className="font-medium text-loss">{trade.stop_loss ? formatPrice(trade.stop_loss) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('takeProfit')}</p>
                      <p className="font-medium text-profit">{trade.take_profit ? formatPrice(trade.take_profit) : '-'}</p>
                    </div>
                  </div>

                  {/* Trade Media */}
                  <TradeMediaDisplay
                    images={trade.images}
                    videos={trade.videos}
                    audios={trade.audios}
                  />

                  {(trade.setup || trade.emotions || trade.notes) && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      {trade.setup && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t('setup')}</p>
                          <p className="font-medium text-foreground">{trade.setup}</p>
                        </div>
                      )}
                      {trade.emotions && (
                        <div>
                          <p className="text-xs text-muted-foreground">{t('emotion')}</p>
                          <Badge variant="outline" className="capitalize">{trade.emotions}</Badge>
                        </div>
                      )}
                      {trade.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-sm text-muted-foreground">{trade.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Trade Dialog */}
      <EditTradeDialog
        trade={editingTrade}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default History;
