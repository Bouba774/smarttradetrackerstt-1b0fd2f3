import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Grid3X3, TrendingUp, TrendingDown } from 'lucide-react';

interface AssetHeat {
  symbol: string;
  name: string;
  change: number;
  volume: 'low' | 'medium' | 'high';
}

type MarketCategory = 'forex' | 'crypto' | 'indices' | 'commodities';

// Mock heatmap data
const heatmapData: Record<MarketCategory, AssetHeat[]> = {
  forex: [
    { symbol: 'EURUSD', name: 'EUR/USD', change: 0.25, volume: 'high' },
    { symbol: 'GBPUSD', name: 'GBP/USD', change: 0.45, volume: 'high' },
    { symbol: 'USDJPY', name: 'USD/JPY', change: -0.15, volume: 'medium' },
    { symbol: 'AUDUSD', name: 'AUD/USD', change: 0.32, volume: 'medium' },
    { symbol: 'USDCAD', name: 'USD/CAD', change: -0.28, volume: 'low' },
    { symbol: 'NZDUSD', name: 'NZD/USD', change: 0.18, volume: 'low' },
    { symbol: 'USDCHF', name: 'USD/CHF', change: -0.12, volume: 'medium' },
    { symbol: 'EURGBP', name: 'EUR/GBP', change: -0.08, volume: 'low' },
    { symbol: 'EURJPY', name: 'EUR/JPY', change: 0.35, volume: 'medium' },
    { symbol: 'GBPJPY', name: 'GBP/JPY', change: 0.52, volume: 'high' },
    { symbol: 'AUDCAD', name: 'AUD/CAD', change: 0.22, volume: 'low' },
    { symbol: 'DXY', name: 'Dollar Index', change: -0.35, volume: 'high' },
  ],
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', change: 2.45, volume: 'high' },
    { symbol: 'ETH', name: 'Ethereum', change: 1.82, volume: 'high' },
    { symbol: 'BNB', name: 'Binance Coin', change: 0.95, volume: 'medium' },
    { symbol: 'SOL', name: 'Solana', change: 4.25, volume: 'high' },
    { symbol: 'XRP', name: 'Ripple', change: -0.45, volume: 'medium' },
    { symbol: 'ADA', name: 'Cardano', change: 1.15, volume: 'low' },
    { symbol: 'DOGE', name: 'Dogecoin', change: -1.25, volume: 'medium' },
    { symbol: 'DOT', name: 'Polkadot', change: 2.10, volume: 'low' },
    { symbol: 'MATIC', name: 'Polygon', change: 3.45, volume: 'medium' },
    { symbol: 'LINK', name: 'Chainlink', change: 1.55, volume: 'medium' },
    { symbol: 'AVAX', name: 'Avalanche', change: -0.85, volume: 'low' },
    { symbol: 'ATOM', name: 'Cosmos', change: 0.65, volume: 'low' },
  ],
  indices: [
    { symbol: 'SP500', name: 'S&P 500', change: -0.82, volume: 'high' },
    { symbol: 'NASDAQ', name: 'Nasdaq 100', change: -1.25, volume: 'high' },
    { symbol: 'DOW', name: 'Dow Jones', change: -0.55, volume: 'high' },
    { symbol: 'DAX', name: 'DAX 40', change: 0.35, volume: 'medium' },
    { symbol: 'CAC', name: 'CAC 40', change: 0.18, volume: 'medium' },
    { symbol: 'FTSE', name: 'FTSE 100', change: -0.22, volume: 'medium' },
    { symbol: 'NIKKEI', name: 'Nikkei 225', change: 1.15, volume: 'high' },
    { symbol: 'HSI', name: 'Hang Seng', change: -0.95, volume: 'medium' },
    { symbol: 'VIX', name: 'VIX', change: 8.50, volume: 'high' },
  ],
  commodities: [
    { symbol: 'XAUUSD', name: 'Or', change: 0.48, volume: 'high' },
    { symbol: 'XAGUSD', name: 'Argent', change: 1.25, volume: 'medium' },
    { symbol: 'WTI', name: 'Pétrole WTI', change: -1.55, volume: 'high' },
    { symbol: 'BRENT', name: 'Brent', change: -1.32, volume: 'high' },
    { symbol: 'NATGAS', name: 'Gaz Naturel', change: -2.85, volume: 'medium' },
    { symbol: 'COPPER', name: 'Cuivre', change: 0.75, volume: 'medium' },
  ],
};

const MarketHeatmap: React.FC = () => {
  const getHeatColor = (change: number) => {
    const absChange = Math.abs(change);
    if (change > 0) {
      if (absChange > 2) return 'bg-profit text-profit-foreground shadow-profit';
      if (absChange > 1) return 'bg-profit/80 text-profit-foreground';
      if (absChange > 0.5) return 'bg-profit/60 text-foreground';
      return 'bg-profit/40 text-foreground';
    } else if (change < 0) {
      if (absChange > 2) return 'bg-loss text-loss-foreground shadow-loss';
      if (absChange > 1) return 'bg-loss/80 text-loss-foreground';
      if (absChange > 0.5) return 'bg-loss/60 text-foreground';
      return 'bg-loss/40 text-foreground';
    }
    return 'bg-secondary text-foreground';
  };

  const getCategoryStats = (category: MarketCategory) => {
    const assets = heatmapData[category];
    const positive = assets.filter(a => a.change > 0).length;
    const negative = assets.filter(a => a.change < 0).length;
    return { positive, negative, total: assets.length };
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Grid3X3 className="h-5 w-5 text-primary" />
          Heatmap Globale des Marchés
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="forex" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            {(['forex', 'crypto', 'indices', 'commodities'] as MarketCategory[]).map((cat) => {
              const stats = getCategoryStats(cat);
              return (
                <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm capitalize">
                  {cat === 'commodities' ? 'Mat.' : cat}
                  <span className="hidden sm:inline ml-1 text-xs">
                    ({stats.positive}↑ {stats.negative}↓)
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(['forex', 'crypto', 'indices', 'commodities'] as MarketCategory[]).map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {heatmapData[category].map((asset) => (
                  <div
                    key={asset.symbol}
                    className={`p-2 sm:p-3 rounded-lg text-center transition-all hover:scale-105 cursor-pointer ${getHeatColor(asset.change)}`}
                  >
                    <div className="font-mono font-bold text-xs sm:text-sm">{asset.symbol}</div>
                    <div className="text-xs font-medium mt-1">
                      {asset.change > 0 ? '+' : ''}{asset.change.toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-loss" />
                  <span>Fort -</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-loss/50" />
                  <span>Faible -</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-profit/50" />
                  <span>Faible +</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-profit" />
                  <span>Fort +</span>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketHeatmap;
