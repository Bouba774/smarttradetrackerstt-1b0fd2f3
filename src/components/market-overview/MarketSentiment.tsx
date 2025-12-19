import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Activity, Gauge } from 'lucide-react';

interface AssetSentiment {
  symbol: string;
  name: string;
  trend: 'bullish' | 'bearish' | 'range';
  strength: number; // 0-100
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  dominantTimeframe: string;
  price?: number;
  change24h?: number;
}

interface MarketSentimentProps {
  favoriteAssets: string[];
}

// Mock sentiment data
const generateSentimentData = (): AssetSentiment[] => [
  { symbol: 'BTC', name: 'Bitcoin', trend: 'bullish', strength: 72, volatility: 'medium', dominantTimeframe: 'Daily', price: 45250, change24h: 2.4 },
  { symbol: 'ETH', name: 'Ethereum', trend: 'bullish', strength: 65, volatility: 'medium', dominantTimeframe: 'H4', price: 2450, change24h: 1.8 },
  { symbol: 'XAUUSD', name: 'Or', trend: 'bullish', strength: 78, volatility: 'high', dominantTimeframe: 'Daily', price: 2148, change24h: 0.5 },
  { symbol: 'EURUSD', name: 'EUR/USD', trend: 'range', strength: 45, volatility: 'low', dominantTimeframe: 'H1', price: 1.0892, change24h: -0.1 },
  { symbol: 'SP500', name: 'S&P 500', trend: 'bearish', strength: 58, volatility: 'medium', dominantTimeframe: 'Daily', price: 4720, change24h: -0.8 },
  { symbol: 'NASDAQ', name: 'Nasdaq', trend: 'bearish', strength: 62, volatility: 'high', dominantTimeframe: 'H4', price: 16450, change24h: -1.2 },
  { symbol: 'DXY', name: 'Dollar Index', trend: 'bearish', strength: 55, volatility: 'medium', dominantTimeframe: 'Daily', price: 103.45, change24h: -0.3 },
  { symbol: 'GBPUSD', name: 'GBP/USD', trend: 'bullish', strength: 68, volatility: 'medium', dominantTimeframe: 'H4', price: 1.2715, change24h: 0.4 },
  { symbol: 'USDJPY', name: 'USD/JPY', trend: 'range', strength: 42, volatility: 'low', dominantTimeframe: 'H1', price: 148.25, change24h: 0.1 },
  { symbol: 'OIL', name: 'Pétrole WTI', trend: 'bearish', strength: 54, volatility: 'high', dominantTimeframe: 'Daily', price: 72.50, change24h: -1.5 },
];

const MarketSentiment: React.FC<MarketSentimentProps> = ({ favoriteAssets }) => {
  const allSentiments = useMemo(() => generateSentimentData(), []);
  
  // Show favorites first, then others
  const sentiments = useMemo(() => {
    const favorites = allSentiments.filter(s => favoriteAssets.includes(s.symbol));
    const others = allSentiments.filter(s => !favoriteAssets.includes(s.symbol));
    return [...favorites, ...others].slice(0, 8);
  }, [allSentiments, favoriteAssets]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-profit" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-loss" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-profit';
      case 'bearish': return 'text-loss';
      default: return 'text-yellow-500';
    }
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'extreme': return 'bg-loss/20 text-loss border-loss/30';
      case 'high': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'medium': return 'bg-primary/20 text-primary border-primary/30';
      default: return 'bg-profit/20 text-profit border-profit/30';
    }
  };

  const getStrengthGradient = (strength: number, trend: string) => {
    if (trend === 'range') return 'bg-yellow-500';
    return trend === 'bullish' ? 'bg-profit' : 'bg-loss';
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Gauge className="h-5 w-5 text-primary" />
          Sentiment de Marché
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {sentiments.map((asset) => (
          <div
            key={asset.symbol}
            className="p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">{asset.symbol}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">{asset.name}</span>
                {favoriteAssets.includes(asset.symbol) && (
                  <span className="text-xs">⭐</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(asset.trend)}
                <span className={`text-xs font-medium capitalize ${getTrendColor(asset.trend)}`}>
                  {asset.trend === 'bullish' ? 'Haussier' : asset.trend === 'bearish' ? 'Baissier' : 'Range'}
                </span>
              </div>
            </div>

            {/* Strength Bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Force: {asset.strength}%</span>
                <span className="text-muted-foreground">{asset.dominantTimeframe}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getStrengthGradient(asset.strength, asset.trend)}`}
                  style={{ width: `${asset.strength}%` }}
                />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="flex items-center justify-between">
              <Badge className={`text-xs ${getVolatilityColor(asset.volatility)}`}>
                <Activity className="h-3 w-3 mr-1" />
                Vol. {asset.volatility}
              </Badge>
              {asset.price && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono">{asset.price.toLocaleString()}</span>
                  {asset.change24h !== undefined && (
                    <span className={asset.change24h >= 0 ? 'text-profit' : 'text-loss'}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MarketSentiment;
