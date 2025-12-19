import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, CheckCircle2, XCircle, AlertCircle, Compass } from 'lucide-react';

interface DirectionalBiasProps {
  favoriteAssets: string[];
}

interface AssetBias {
  symbol: string;
  name: string;
  dailyBias: 'bull' | 'bear' | 'neutral';
  h4Bias: 'bull' | 'bear' | 'neutral';
  h1Bias: 'bull' | 'bear' | 'neutral';
  confluence: {
    structure: boolean;
    liquidity: boolean;
    news: boolean;
  };
  status: 'aligned' | 'neutral' | 'misaligned';
  confidence: number;
}

// Mock bias data
const generateBiasData = (): AssetBias[] => [
  {
    symbol: 'EURUSD',
    name: 'EUR/USD',
    dailyBias: 'bull',
    h4Bias: 'bull',
    h1Bias: 'neutral',
    confluence: { structure: true, liquidity: true, news: false },
    status: 'aligned',
    confidence: 75,
  },
  {
    symbol: 'XAUUSD',
    name: 'Or',
    dailyBias: 'bull',
    h4Bias: 'bull',
    h1Bias: 'bull',
    confluence: { structure: true, liquidity: true, news: true },
    status: 'aligned',
    confidence: 92,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    dailyBias: 'bull',
    h4Bias: 'bull',
    h1Bias: 'bear',
    confluence: { structure: true, liquidity: false, news: true },
    status: 'neutral',
    confidence: 62,
  },
  {
    symbol: 'SP500',
    name: 'S&P 500',
    dailyBias: 'bear',
    h4Bias: 'bear',
    h1Bias: 'bear',
    confluence: { structure: true, liquidity: true, news: true },
    status: 'aligned',
    confidence: 85,
  },
  {
    symbol: 'GBPUSD',
    name: 'GBP/USD',
    dailyBias: 'bull',
    h4Bias: 'bear',
    h1Bias: 'bull',
    confluence: { structure: false, liquidity: true, news: false },
    status: 'misaligned',
    confidence: 35,
  },
  {
    symbol: 'DXY',
    name: 'Dollar Index',
    dailyBias: 'bear',
    h4Bias: 'bear',
    h1Bias: 'neutral',
    confluence: { structure: true, liquidity: true, news: false },
    status: 'aligned',
    confidence: 78,
  },
];

const DirectionalBias: React.FC<DirectionalBiasProps> = ({ favoriteAssets }) => {
  const allBias = useMemo(() => generateBiasData(), []);
  
  // Show favorites first
  const biasData = useMemo(() => {
    const favorites = allBias.filter(b => favoriteAssets.includes(b.symbol));
    const others = allBias.filter(b => !favoriteAssets.includes(b.symbol));
    return [...favorites, ...others];
  }, [allBias, favoriteAssets]);

  const getBiasIcon = (bias: string, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
    switch (bias) {
      case 'bull': return <TrendingUp className={`${sizeClass} text-profit`} />;
      case 'bear': return <TrendingDown className={`${sizeClass} text-loss`} />;
      default: return <Minus className={`${sizeClass} text-muted-foreground`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aligned':
        return (
          <Badge className="text-xs bg-profit/20 text-profit border-profit/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aligné
          </Badge>
        );
      case 'misaligned':
        return (
          <Badge className="text-xs bg-loss/20 text-loss border-loss/30">
            <XCircle className="h-3 w-3 mr-1" />
            Désaligné
          </Badge>
        );
      default:
        return (
          <Badge className="text-xs bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Neutre
          </Badge>
        );
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-profit';
    if (confidence >= 50) return 'text-yellow-500';
    return 'text-loss';
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Compass className="h-5 w-5 text-primary" />
          Biais Directionnel (ICT/SMC)
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Analyse multi-timeframe avec confluence
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {biasData.map((asset) => (
          <div
            key={asset.symbol}
            className={`p-3 rounded-lg border transition-colors ${
              asset.status === 'aligned' 
                ? 'bg-profit/5 border-profit/20' 
                : asset.status === 'misaligned'
                ? 'bg-loss/5 border-loss/20'
                : 'bg-secondary/30 border-border'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm">{asset.symbol}</span>
                {favoriteAssets.includes(asset.symbol) && <span>⭐</span>}
              </div>
              {getStatusBadge(asset.status)}
            </div>

            {/* Timeframe Bias */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 rounded bg-secondary/50">
                <div className="text-xs text-muted-foreground mb-1">Daily</div>
                <div className="flex items-center justify-center gap-1">
                  {getBiasIcon(asset.dailyBias, 'md')}
                  <span className={`text-xs font-medium ${
                    asset.dailyBias === 'bull' ? 'text-profit' :
                    asset.dailyBias === 'bear' ? 'text-loss' : 'text-muted-foreground'
                  }`}>
                    {asset.dailyBias === 'bull' ? 'Bull' : asset.dailyBias === 'bear' ? 'Bear' : 'Neutre'}
                  </span>
                </div>
              </div>
              <div className="text-center p-2 rounded bg-secondary/50">
                <div className="text-xs text-muted-foreground mb-1">H4</div>
                <div className="flex items-center justify-center gap-1">
                  {getBiasIcon(asset.h4Bias, 'md')}
                  <span className={`text-xs font-medium ${
                    asset.h4Bias === 'bull' ? 'text-profit' :
                    asset.h4Bias === 'bear' ? 'text-loss' : 'text-muted-foreground'
                  }`}>
                    {asset.h4Bias === 'bull' ? 'Bull' : asset.h4Bias === 'bear' ? 'Bear' : 'Neutre'}
                  </span>
                </div>
              </div>
              <div className="text-center p-2 rounded bg-secondary/50">
                <div className="text-xs text-muted-foreground mb-1">H1</div>
                <div className="flex items-center justify-center gap-1">
                  {getBiasIcon(asset.h1Bias, 'md')}
                  <span className={`text-xs font-medium ${
                    asset.h1Bias === 'bull' ? 'text-profit' :
                    asset.h1Bias === 'bear' ? 'text-loss' : 'text-muted-foreground'
                  }`}>
                    {asset.h1Bias === 'bull' ? 'Bull' : asset.h1Bias === 'bear' ? 'Bear' : 'Neutre'}
                  </span>
                </div>
              </div>
            </div>

            {/* Confluence Indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${asset.confluence.structure ? 'bg-profit/20 text-profit' : 'bg-muted text-muted-foreground'}`}
                >
                  Structure {asset.confluence.structure ? '✓' : '✗'}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${asset.confluence.liquidity ? 'bg-profit/20 text-profit' : 'bg-muted text-muted-foreground'}`}
                >
                  Liquidité {asset.confluence.liquidity ? '✓' : '✗'}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${asset.confluence.news ? 'bg-profit/20 text-profit' : 'bg-muted text-muted-foreground'}`}
                >
                  News {asset.confluence.news ? '✓' : '✗'}
                </Badge>
              </div>
              <span className={`text-sm font-bold ${getConfidenceColor(asset.confidence)}`}>
                {asset.confidence}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DirectionalBias;
