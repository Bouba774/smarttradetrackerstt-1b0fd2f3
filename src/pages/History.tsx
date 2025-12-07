import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye,
  ChevronDown,
  ChevronUp,
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
}

const MOCK_TRADES: Trade[] = [
  {
    id: '1',
    date: '2024-03-15',
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
    date: '2024-03-14',
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
    date: '2024-03-14',
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
    date: '2024-03-13',
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
    date: '2024-03-13',
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
];

const History: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  const filteredTrades = MOCK_TRADES
    .filter(trade => {
      const matchesSearch = trade.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trade.setup.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDirection = filterDirection === 'all' || trade.direction === filterDirection;
      return matchesSearch && matchesDirection;
    })
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'date') return modifier * (new Date(b.date).getTime() - new Date(a.date).getTime());
      if (sortBy === 'pnl') return modifier * (a.pnl - b.pnl);
      if (sortBy === 'quality') return modifier * (a.qualityScore - b.qualityScore);
      return 0;
    });

  const totalGains = filteredTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = filteredTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);
  const totalBreakeven = filteredTrades.filter(t => t.pnl === 0).length;

  return (
    <div className="py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('history')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Retrouvez tous vos trades passés
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('totalGains')}</p>
          <p className="font-display text-xl font-bold profit-text">${totalGains}</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: '50ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('totalLosses')}</p>
          <p className="font-display text-xl font-bold loss-text">${Math.abs(totalLosses)}</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('breakeven')}</p>
          <p className="font-display text-xl font-bold text-muted-foreground">{totalBreakeven}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
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
          
          <Select value={filterDirection} onValueChange={setFilterDirection}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder={t('direction')} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="pnl">PnL</SelectItem>
              <SelectItem value="quality">Qualité</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                      <span>{trade.date}</span>
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
              <div className="border-t border-border p-4 bg-background/50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTrades.length === 0 && (
        <div className="glass-card p-12 text-center">
          <p className="text-muted-foreground">{t('noData')}</p>
        </div>
      )}
    </div>
  );
};

export default History;
