import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  BarChart3,
  Activity,
  Award,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MetaStatsMetricsProps {
  metaApiAccountId: string;
  accountName?: string;
}

interface Metrics {
  // Performance metrics
  absoluteGain?: number;
  gain?: number;
  profit?: number;
  balance?: number;
  equity?: number;
  
  // Risk metrics
  maxDrawdown?: number;
  maxRelativeDrawdown?: number;
  
  // Trading metrics
  trades?: number;
  wonTrades?: number;
  lostTrades?: number;
  wonTradesPercent?: number;
  lostTradesPercent?: number;
  
  // Profitability
  profitFactor?: number;
  expectancy?: number;
  averageWin?: number;
  averageLoss?: number;
  
  // Risk-adjusted
  sharpeRatio?: number;
  sortinoRatio?: number;
  
  // Other
  bestTrade?: number;
  worstTrade?: number;
  averageTradeLengthInMinutes?: number;
  longPositions?: number;
  shortPositions?: number;
  longWonTrades?: number;
  shortWonTrades?: number;
}

const MetaStatsMetrics: React.FC<MetaStatsMetricsProps> = ({ 
  metaApiAccountId, 
  accountName 
}) => {
  const { language } = useLanguage();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = {
    fr: {
      title: 'Métriques de Performance',
      refresh: 'Actualiser',
      loading: 'Chargement des métriques...',
      processing: 'Calcul en cours...',
      error: 'Erreur lors du chargement',
      retry: 'Réessayer',
      
      // Sections
      performance: 'Performance',
      risk: 'Risque',
      trading: 'Trading',
      
      // Metrics
      totalGain: 'Gain Total',
      absoluteGain: 'Gain Absolu',
      balance: 'Balance',
      equity: 'Équité',
      profit: 'Profit Total',
      
      maxDrawdown: 'Drawdown Max',
      relativeDrawdown: 'Drawdown Relatif',
      
      totalTrades: 'Trades Total',
      winRate: 'Taux de Réussite',
      profitFactor: 'Profit Factor',
      expectancy: 'Espérance',
      avgWin: 'Gain Moyen',
      avgLoss: 'Perte Moyenne',
      bestTrade: 'Meilleur Trade',
      worstTrade: 'Pire Trade',
      avgDuration: 'Durée Moyenne',
      
      sharpeRatio: 'Ratio de Sharpe',
      sortinoRatio: 'Ratio de Sortino',
      
      longPositions: 'Positions Long',
      shortPositions: 'Positions Short',
      minutes: 'min',
      
      noData: 'Aucune donnée disponible',
    },
    en: {
      title: 'Performance Metrics',
      refresh: 'Refresh',
      loading: 'Loading metrics...',
      processing: 'Processing...',
      error: 'Error loading metrics',
      retry: 'Retry',
      
      // Sections
      performance: 'Performance',
      risk: 'Risk',
      trading: 'Trading',
      
      // Metrics
      totalGain: 'Total Gain',
      absoluteGain: 'Absolute Gain',
      balance: 'Balance',
      equity: 'Equity',
      profit: 'Total Profit',
      
      maxDrawdown: 'Max Drawdown',
      relativeDrawdown: 'Relative Drawdown',
      
      totalTrades: 'Total Trades',
      winRate: 'Win Rate',
      profitFactor: 'Profit Factor',
      expectancy: 'Expectancy',
      avgWin: 'Avg Win',
      avgLoss: 'Avg Loss',
      bestTrade: 'Best Trade',
      worstTrade: 'Worst Trade',
      avgDuration: 'Avg Duration',
      
      sharpeRatio: 'Sharpe Ratio',
      sortinoRatio: 'Sortino Ratio',
      
      longPositions: 'Long Positions',
      shortPositions: 'Short Positions',
      minutes: 'min',
      
      noData: 'No data available',
    },
  };

  const texts = t[language as keyof typeof t] || t.en;

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('metatrader-connect', {
        body: { 
          action: 'metrics', 
          metaApiAccountId 
        },
      });

      if (fetchError) throw fetchError;

      if (data.processing) {
        setError(texts.processing);
        // Retry after a few seconds
        setTimeout(fetchMetrics, 3000);
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setMetrics(data.metrics);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(texts.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (metaApiAccountId) {
      fetchMetrics();
    }
  }, [metaApiAccountId]);

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value?: number, decimals = 2) => {
    if (value === undefined || value === null) return '-';
    return value.toFixed(decimals);
  };

  if (isLoading && !metrics) {
    return (
      <Card className="bg-card/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">{texts.loading}</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !metrics) {
    return (
      <Card className="bg-card/50 border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchMetrics} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {texts.retry}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="bg-card/50">
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">{texts.noData}</p>
        </CardContent>
      </Card>
    );
  }

  const winRate = metrics.wonTradesPercent || 
    (metrics.trades && metrics.wonTrades ? (metrics.wonTrades / metrics.trades) * 100 : 0);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="gap-2 p-0 h-auto hover:bg-transparent">
                <BarChart3 className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">
                  {texts.title}
                  {accountName && <span className="text-muted-foreground font-normal ml-2">- {accountName}</span>}
                </CardTitle>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchMetrics}
              disabled={isLoading}
              className="gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              {texts.refresh}
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Performance Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                {texts.performance}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Total Gain */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.totalGain}</p>
                  <p className={`text-lg font-bold ${(metrics.gain || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatPercent(metrics.gain)}
                  </p>
                </div>

                {/* Absolute Gain */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.absoluteGain}</p>
                  <p className={`text-lg font-bold ${(metrics.absoluteGain || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(metrics.absoluteGain)}
                  </p>
                </div>

                {/* Balance */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.balance}</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(metrics.balance)}
                  </p>
                </div>

                {/* Equity */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.equity}</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(metrics.equity)}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
                {texts.risk}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Max Drawdown */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.maxDrawdown}</p>
                  <p className="text-lg font-bold text-loss">
                    {formatPercent(metrics.maxRelativeDrawdown ? -Math.abs(metrics.maxRelativeDrawdown) : metrics.maxDrawdown ? -Math.abs(metrics.maxDrawdown) : 0)}
                  </p>
                  {metrics.maxDrawdown && (
                    <Progress 
                      value={Math.min(Math.abs(metrics.maxRelativeDrawdown || metrics.maxDrawdown || 0), 100)} 
                      className="h-1 mt-2"
                    />
                  )}
                </div>

                {/* Sharpe Ratio */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.sharpeRatio}</p>
                  <p className={`text-lg font-bold ${(metrics.sharpeRatio || 0) >= 1 ? 'text-profit' : (metrics.sharpeRatio || 0) >= 0 ? 'text-foreground' : 'text-loss'}`}>
                    {formatNumber(metrics.sharpeRatio)}
                  </p>
                </div>

                {/* Sortino Ratio */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.sortinoRatio}</p>
                  <p className={`text-lg font-bold ${(metrics.sortinoRatio || 0) >= 1 ? 'text-profit' : (metrics.sortinoRatio || 0) >= 0 ? 'text-foreground' : 'text-loss'}`}>
                    {formatNumber(metrics.sortinoRatio)}
                  </p>
                </div>

                {/* Profit Factor */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.profitFactor}</p>
                  <p className={`text-lg font-bold ${(metrics.profitFactor || 0) >= 1.5 ? 'text-profit' : (metrics.profitFactor || 0) >= 1 ? 'text-foreground' : 'text-loss'}`}>
                    {formatNumber(metrics.profitFactor)}
                  </p>
                </div>
              </div>
            </div>

            {/* Trading Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Activity className="w-4 h-4" />
                {texts.trading}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Total Trades */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.totalTrades}</p>
                  <p className="text-lg font-bold text-foreground">
                    {metrics.trades || 0}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <Badge variant="outline" className="text-xs text-profit">
                      {metrics.wonTrades || 0} W
                    </Badge>
                    <Badge variant="outline" className="text-xs text-loss">
                      {metrics.lostTrades || 0} L
                    </Badge>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.winRate}</p>
                  <div className="flex items-center gap-2">
                    <Target className={`w-4 h-4 ${winRate >= 50 ? 'text-profit' : 'text-loss'}`} />
                    <p className={`text-lg font-bold ${winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                      {winRate.toFixed(1)}%
                    </p>
                  </div>
                  <Progress 
                    value={winRate} 
                    className="h-1 mt-2"
                  />
                </div>

                {/* Avg Win */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.avgWin}</p>
                  <p className="text-lg font-bold text-profit">
                    {formatCurrency(metrics.averageWin)}
                  </p>
                </div>

                {/* Avg Loss */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.avgLoss}</p>
                  <p className="text-lg font-bold text-loss">
                    {formatCurrency(metrics.averageLoss ? -Math.abs(metrics.averageLoss) : 0)}
                  </p>
                </div>

                {/* Best Trade */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.bestTrade}</p>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-profit" />
                    <p className="text-lg font-bold text-profit">
                      {formatCurrency(metrics.bestTrade)}
                    </p>
                  </div>
                </div>

                {/* Worst Trade */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.worstTrade}</p>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-loss" />
                    <p className="text-lg font-bold text-loss">
                      {formatCurrency(metrics.worstTrade)}
                    </p>
                  </div>
                </div>

                {/* Expectancy */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.expectancy}</p>
                  <p className={`text-lg font-bold ${(metrics.expectancy || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {formatCurrency(metrics.expectancy)}
                  </p>
                </div>

                {/* Avg Duration */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">{texts.avgDuration}</p>
                  <p className="text-lg font-bold text-foreground">
                    {metrics.averageTradeLengthInMinutes 
                      ? `${Math.round(metrics.averageTradeLengthInMinutes)} ${texts.minutes}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Long/Short Distribution */}
            {(metrics.longPositions || metrics.shortPositions) && (
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{texts.longPositions}</span>
                    <span className="font-medium">{metrics.longPositions || 0} ({metrics.longWonTrades || 0} W)</span>
                  </div>
                  <Progress 
                    value={metrics.longPositions && metrics.trades 
                      ? (metrics.longPositions / metrics.trades) * 100 
                      : 0} 
                    className="h-2"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{texts.shortPositions}</span>
                    <span className="font-medium">{metrics.shortPositions || 0} ({metrics.shortWonTrades || 0} W)</span>
                  </div>
                  <Progress 
                    value={metrics.shortPositions && metrics.trades 
                      ? (metrics.shortPositions / metrics.trades) * 100 
                      : 0} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default MetaStatsMetrics;
