import React from 'react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { useLanguage } from '@/contexts/LanguageContext';
import { CURRENCIES } from '@/data/currencies';
import { RefreshCw, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExchangeRateIndicatorProps {
  selectedCurrency: string;
}

export const ExchangeRateIndicator: React.FC<ExchangeRateIndicatorProps> = ({ selectedCurrency }) => {
  const { rates, isLoading, error, lastUpdated, refetch } = useExchangeRates();
  const { language } = useLanguage();
  const locale = language === 'fr' ? fr : enUS;

  const formatRate = (rate: number, currency: string): string => {
    const currencyData = CURRENCIES.find(c => c.code === currency);
    const decimals = currencyData?.decimals ?? 2;
    
    if (decimals === 0) {
      return rate.toFixed(0);
    }
    return rate.toFixed(4);
  };

  const getDisplayRates = () => {
    const otherCurrencies = CURRENCIES.filter(c => c.code !== 'USD');
    return otherCurrencies.map(currency => ({
      code: currency.code,
      symbol: currency.symbol,
      rate: rates[currency.code] || 1,
      name: currency.name,
    }));
  };

  const displayRates = getDisplayRates();

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Taux de Change (1 USD)' : 'Exchange Rates (1 USD)'}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-yellow-500 text-xs mb-3">
          <AlertCircle className="w-3 h-3" />
          <span>{language === 'fr' ? 'Utilisation des taux de secours' : 'Using fallback rates'}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayRates.map((rate) => (
          <div
            key={rate.code}
            className={cn(
              "p-3 rounded-lg border transition-all",
              selectedCurrency === rate.code
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/30"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">{rate.code}</span>
              <span className="text-xs text-muted-foreground">{rate.symbol}</span>
            </div>
            <p className={cn(
              "font-display font-bold text-lg",
              selectedCurrency === rate.code ? "text-primary" : "text-foreground"
            )}>
              {formatRate(rate.rate, rate.code)}
            </p>
          </div>
        ))}
      </div>

      {lastUpdated && (
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {language === 'fr' ? 'Mis à jour : ' : 'Updated: '}
            {format(lastUpdated, 'dd MMM yyyy HH:mm', { locale })}
          </span>
        </div>
      )}
    </div>
  );
};

export default ExchangeRateIndicator;
