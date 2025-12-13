import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades, Trade } from '@/hooks/useTrades';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { toast } from 'sonner';
import EditTradeDialog from '@/components/EditTradeDialog';

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

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('totalGains')}</p>
          <p className="font-display text-xl font-bold profit-text">{formatAmount(totalGains)}</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('totalLosses')}</p>
          <p className="font-display text-xl font-bold loss-text">{formatAmount(totalLosses)}</p>
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
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="day">{t('today')}</SelectItem>
              <SelectItem value="week">{t('thisWeek')}</SelectItem>
              <SelectItem value="month">{t('thisMonth')}</SelectItem>
              <SelectItem value="year">{t('thisYear')}</SelectItem>
              <SelectItem value="custom">{t('custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range */}
        {periodFilter === 'custom' && (
          <div className="flex flex-wrap gap-4 p-4 bg-secondary/30 rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{language === 'fr' ? 'Date début' : 'Start date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : t('select')}
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
              <Label className="text-xs text-muted-foreground">{language === 'fr' ? 'Date fin' : 'End date'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : t('select')}
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
              <SelectValue placeholder={t('direction')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="long">Long</SelectItem>
              <SelectItem value="short">Short</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={language === 'fr' ? 'Résultat' : 'Result'} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">{t('all')}</SelectItem>
              <SelectItem value="win">{language === 'fr' ? 'Gain' : 'Win'}</SelectItem>
              <SelectItem value="loss">{language === 'fr' ? 'Perte' : 'Loss'}</SelectItem>
              <SelectItem value="breakeven">{t('breakeven')}</SelectItem>
              <SelectItem value="pending">{language === 'fr' ? 'En cours' : 'Pending'}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAsset} onValueChange={setFilterAsset}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t('asset')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">{t('all')}</SelectItem>
              {uniqueAssets.map(asset => (
                <SelectItem key={asset} value={asset}>{asset}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSetup} onValueChange={setFilterSetup}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder={t('setup')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">{t('all')}</SelectItem>
              {uniqueSetups.map(setup => (
                <SelectItem key={setup as string} value={setup as string}>{setup}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={language === 'fr' ? 'Trier par' : 'Sort by'} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="date">{language === 'fr' ? 'Date' : 'Date'}</SelectItem>
              <SelectItem value="pnl">PnL</SelectItem>
              <SelectItem value="asset">{t('asset')}</SelectItem>
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
            {t('reset')}
          </Button>
        </div>
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
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "font-display font-bold text-lg",
                        trade.profit_loss && trade.profit_loss > 0 ? "profit-text" : 
                        trade.profit_loss && trade.profit_loss < 0 ? "loss-text" : "text-muted-foreground"
                      )}>
                        {trade.profit_loss !== null 
                          ? formatAmount(trade.profit_loss, true)
                          : (language === 'fr' ? 'En cours' : 'Pending')
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trade.lot_size} lots
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => handleEditTrade(trade, e)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-loss"
                      onClick={(e) => handleDeleteTrade(trade.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
                <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('entryPrice')}</p>
                      <p className="font-medium text-foreground">{trade.entry_price}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('exitPrice')}</p>
                      <p className="font-medium text-foreground">{trade.exit_price || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('stopLoss')}</p>
                      <p className="font-medium text-loss">{trade.stop_loss || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('takeProfit')}</p>
                      <p className="font-medium text-profit">{trade.take_profit || '-'}</p>
                    </div>
                  </div>

                  {/* Trade Images */}
                  {trade.images && trade.images.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">{language === 'fr' ? 'Captures' : 'Screenshots'} ({trade.images.length})</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {trade.images.map((imageUrl, imgIndex) => (
                          <a
                            key={imgIndex}
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                          >
                            <img
                              src={imageUrl}
                              alt={`Trade capture ${imgIndex + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

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
