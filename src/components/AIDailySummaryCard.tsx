import React, { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIDailySummary } from '@/hooks/useAIDailySummary';
import { Trade } from '@/hooks/useTrades';
import { useCurrency } from '@/hooks/useCurrency';
import { Sparkles, TrendingUp, TrendingDown, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIDailySummaryCardProps {
  trades: Trade[];
}

const AIDailySummaryCard: React.FC<AIDailySummaryCardProps> = ({ trades }) => {
  const { t, language } = useLanguage();
  const { formatAmount } = useCurrency();
  const { summary, isLoading, error, generateSummary } = useAIDailySummary(trades, language);

  useEffect(() => {
    if (trades.length > 0 && !summary) {
      generateSummary();
    }
  }, [trades.length]);

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">
              {language === 'fr' ? 'Résumé IA du Jour' : 'AI Daily Summary'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Analyse personnalisée' : 'Personalized analysis'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={generateSummary}
          disabled={isLoading}
          className="h-8 w-8"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {isLoading && !summary && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {summary && (
        <div className="space-y-4">
          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/30">
            <div className="text-center">
              <p className="text-2xl font-display font-bold text-foreground">{summary.todayStats.trades}</p>
              <p className="text-xs text-muted-foreground">Trades</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-2xl font-display font-bold",
                summary.todayStats.winRate >= 50 ? "text-profit" : "text-loss"
              )}>
                {summary.todayStats.winRate}%
              </p>
              <p className="text-xs text-muted-foreground">Winrate</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-2xl font-display font-bold",
                summary.todayStats.pnl >= 0 ? "text-profit" : "text-loss"
              )}>
                {formatAmount(summary.todayStats.pnl, true)}
              </p>
              <p className="text-xs text-muted-foreground">PnL</p>
            </div>
          </div>

          {/* Strengths */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-profit" />
              <span className="text-sm font-medium text-foreground">
                {language === 'fr' ? 'Points forts' : 'Strengths'}
              </span>
            </div>
            <ul className="space-y-1">
              {summary.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-muted-foreground pl-6 relative">
                  <span className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-profit" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {language === 'fr' ? 'À améliorer' : 'To Improve'}
              </span>
            </div>
            <ul className="space-y-1">
              {summary.improvements.map((improvement, idx) => (
                <li key={idx} className="text-sm text-muted-foreground pl-6 relative">
                  <span className="absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                  {improvement}
                </li>
              ))}
            </ul>
          </div>

          {/* Encouragement */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <p className="text-sm text-foreground italic text-center">
              "{summary.encouragement}"
            </p>
          </div>
        </div>
      )}

      {!summary && !isLoading && trades.length === 0 && (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm">
            {language === 'fr' 
              ? 'Ajoute des trades pour obtenir ton résumé IA' 
              : 'Add trades to get your AI summary'}
          </p>
        </div>
      )}

      {error && !summary && (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-2">
            {language === 'fr' 
              ? 'Erreur lors de la génération' 
              : 'Error generating summary'}
          </p>
          <Button variant="outline" size="sm" onClick={generateSummary}>
            {language === 'fr' ? 'Réessayer' : 'Retry'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIDailySummaryCard;
