import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, HelpCircle, Shield, Activity, Zap, BarChart3 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RiskIndicator {
  symbol: string;
  name: string;
  value: number;
  change: number;
  weight: number;
  interpretation: 'risk-on' | 'risk-off' | 'neutral';
}

const RiskOnOffIndicator: React.FC = () => {
  // Mock indicator data
  const indicators: RiskIndicator[] = useMemo(() => [
    { symbol: 'DXY', name: 'Dollar Index', value: 103.45, change: -0.35, weight: 25, interpretation: 'risk-on' },
    { symbol: 'VIX', name: 'Indice de Volatilité', value: 18.5, change: 2.5, weight: 25, interpretation: 'risk-off' },
    { symbol: 'SP500', name: 'S&P 500', value: 4720, change: -0.8, weight: 20, interpretation: 'risk-off' },
    { symbol: 'BTC.D', name: 'BTC Dominance', value: 52.3, change: 0.5, weight: 15, interpretation: 'neutral' },
    { symbol: 'XAUUSD', name: 'Or', value: 2148, change: 0.48, weight: 15, interpretation: 'risk-off' },
  ], []);

  // Calculate overall risk score
  const riskScore = useMemo(() => {
    let score = 50; // Start neutral
    
    indicators.forEach(ind => {
      const weightedImpact = ind.weight / 100;
      if (ind.interpretation === 'risk-on') {
        score += 10 * weightedImpact;
      } else if (ind.interpretation === 'risk-off') {
        score -= 10 * weightedImpact;
      }
    });
    
    return Math.max(0, Math.min(100, score));
  }, [indicators]);

  const getRiskStatus = () => {
    if (riskScore >= 60) return { label: 'Risk-On', color: 'text-profit', bgColor: 'bg-profit/20', icon: TrendingUp };
    if (riskScore <= 40) return { label: 'Risk-Off', color: 'text-loss', bgColor: 'bg-loss/20', icon: TrendingDown };
    return { label: 'Incertain', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20', icon: HelpCircle };
  };

  const status = getRiskStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8">
          {/* Main Indicator */}
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl ${status.bgColor} relative`}>
              <StatusIcon className={`h-8 w-8 ${status.color}`} />
              {riskScore >= 60 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-profit rounded-full animate-pulse" />
              )}
              {riskScore <= 40 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-loss rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className={`text-2xl sm:text-3xl font-bold ${status.color}`}>
                  {status.label}
                </h2>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Indicateur composite basé sur DXY, VIX, S&P500, BTC dominance et Or. 
                      Risk-On = sentiment positif (acheter actifs risqués). 
                      Risk-Off = aversion au risque (valeurs refuges).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Score de confiance:</span>
                <span className={`font-bold ${status.color}`}>{Math.round(riskScore)}%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 w-full lg:max-w-md">
            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Risk-Off
              </span>
              <span className="flex items-center gap-1">
                Risk-On
                <Zap className="h-3 w-3" />
              </span>
            </div>
            <div className="relative h-4 bg-secondary rounded-full overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-loss via-yellow-500 to-profit opacity-30"
              />
              <div 
                className={`absolute top-0 h-full w-1 transition-all duration-500 ${
                  riskScore >= 60 ? 'bg-profit' : riskScore <= 40 ? 'bg-loss' : 'bg-yellow-500'
                }`}
                style={{ left: `calc(${riskScore}% - 2px)` }}
              />
              <div 
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 shadow-lg transition-all duration-500 ${
                  riskScore >= 60 ? 'bg-profit border-profit-foreground' : 
                  riskScore <= 40 ? 'bg-loss border-loss-foreground' : 
                  'bg-yellow-500 border-yellow-600'
                }`}
                style={{ left: `calc(${riskScore}% - 8px)` }}
              />
            </div>
          </div>

          {/* Indicators Summary */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3">
            {indicators.map((ind) => (
              <Tooltip key={ind.symbol}>
                <TooltipTrigger>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs cursor-help ${
                      ind.interpretation === 'risk-on' ? 'bg-profit/20 text-profit border-profit/30' :
                      ind.interpretation === 'risk-off' ? 'bg-loss/20 text-loss border-loss/30' :
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-mono mr-1">{ind.symbol}</span>
                    <span className={ind.change >= 0 ? 'text-profit' : 'text-loss'}>
                      {ind.change >= 0 ? '+' : ''}{ind.change.toFixed(2)}%
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">{ind.name}</p>
                  <p className="text-xs text-muted-foreground">Valeur: {ind.value}</p>
                  <p className="text-xs text-muted-foreground">Poids: {ind.weight}%</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskOnOffIndicator;
