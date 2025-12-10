import { useSettings } from './useSettings';
import { useExchangeRates } from './useExchangeRates';
import { useCallback, useMemo } from 'react';
import { getCurrencyDecimals, BASE_CURRENCY } from '@/data/currencies';

export const useCurrency = () => {
  const { settings } = useSettings();
  const { convert, rates, isLoading: isLoadingRates, lastUpdated } = useExchangeRates();
  
  const currency = settings.currency || 'USD';
  const decimals = getCurrencyDecimals(currency);

  // Convert amount from base currency (USD) to selected currency
  const convertFromBase = useCallback((amount: number | null | undefined): number => {
    if (amount === null || amount === undefined) return 0;
    return convert(amount, BASE_CURRENCY, currency);
  }, [convert, currency]);

  // Format amount with proper currency formatting
  const formatAmount = useCallback((amount: number | null | undefined, showSign = false, convertValue = true): string => {
    if (amount === null || amount === undefined) return '-';
    
    // Convert if needed (from base USD to selected currency)
    const displayAmount = convertValue ? convertFromBase(amount) : amount;
    
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Math.abs(displayAmount));

    if (showSign && displayAmount !== 0) {
      return displayAmount > 0 ? `+${formatted}` : `-${formatted}`;
    }
    
    return displayAmount < 0 ? `-${formatted}` : formatted;
  }, [currency, decimals, convertFromBase]);

  // Format amount in short form (K, M)
  const formatAmountShort = useCallback((amount: number | null | undefined, showSign = false, convertValue = true): string => {
    if (amount === null || amount === undefined) return '-';
    
    const displayAmount = convertValue ? convertFromBase(amount) : amount;
    const absAmount = Math.abs(displayAmount);
    let formatted: string;

    if (absAmount >= 1000000) {
      formatted = `${(absAmount / 1000000).toFixed(1)}M ${currency}`;
    } else if (absAmount >= 1000) {
      formatted = `${(absAmount / 1000).toFixed(1)}K ${currency}`;
    } else {
      formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(absAmount);
    }

    if (showSign && displayAmount !== 0) {
      return displayAmount > 0 ? `+${formatted}` : `-${formatted}`;
    }
    
    return displayAmount < 0 ? `-${formatted}` : formatted;
  }, [currency, decimals, convertFromBase]);

  // Get currency symbol
  const getCurrencySymbol = useCallback((): string => {
    try {
      const formatter = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol',
      });
      const parts = formatter.formatToParts(0);
      const symbolPart = parts.find(p => p.type === 'currency');
      return symbolPart?.value || currency;
    } catch {
      return currency;
    }
  }, [currency]);

  // Format raw number without currency symbol (for inputs, calculations display)
  const formatNumber = useCallback((amount: number | null | undefined, convertValue = true): string => {
    if (amount === null || amount === undefined) return '-';
    
    const displayAmount = convertValue ? convertFromBase(amount) : amount;
    
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(displayAmount);
  }, [decimals, convertFromBase]);

  // Get current exchange rate from USD to selected currency
  const currentRate = useMemo(() => {
    return rates[currency] || 1;
  }, [rates, currency]);

  return {
    currency,
    decimals,
    formatAmount,
    formatAmountShort,
    formatNumber,
    getCurrencySymbol,
    convertFromBase,
    currentRate,
    isLoadingRates,
    lastUpdated,
    baseCurrency: BASE_CURRENCY,
  };
};

export default useCurrency;
