import { useState, useEffect, useCallback } from 'react';
import { BASE_CURRENCY } from '@/data/currencies';

interface ExchangeRates {
  [key: string]: number;
}

interface UseExchangeRatesReturn {
  rates: ExchangeRates;
  isLoading: boolean;
  error: string | null;
  convert: (amount: number, fromCurrency: string, toCurrency: string) => number;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const CACHE_KEY = 'exchange-rates-cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Fallback rates in case API fails (approximate rates as of December 2024)
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.95,
  GBP: 0.79,
  JPY: 153.50,
  XAF: 623.30,
  XOF: 623.30,
};

export const useExchangeRates = (): UseExchangeRatesReturn => {
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates: cachedRates, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        
        if (cacheAge < CACHE_DURATION) {
          setRates(cachedRates);
          setLastUpdated(new Date(timestamp));
          setIsLoading(false);
          return;
        }
      }

      // Fetch from frankfurter.app (free, no API key required)
      const response = await fetch(
        `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}&to=EUR,GBP,JPY`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const data = await response.json();
      
      // Build rates object with USD as base (rate = 1)
      const newRates: ExchangeRates = {
        USD: 1,
        EUR: data.rates.EUR || FALLBACK_RATES.EUR,
        GBP: data.rates.GBP || FALLBACK_RATES.GBP,
        JPY: data.rates.JPY || FALLBACK_RATES.JPY,
        // XAF and XOF are pegged to EUR at fixed rate: 1 EUR = 655.957 XAF/XOF
        XAF: (data.rates.EUR || FALLBACK_RATES.EUR) * 655.957,
        XOF: (data.rates.EUR || FALLBACK_RATES.EUR) * 655.957,
      };

      // Cache the rates
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: newRates,
        timestamp: Date.now(),
      }));

      setRates(newRates);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Exchange rate fetch error:', err);
      setError('Unable to fetch live rates, using cached/fallback rates');
      
      // Try to use cached rates even if expired
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates: cachedRates, timestamp } = JSON.parse(cached);
        setRates(cachedRates);
        setLastUpdated(new Date(timestamp));
      } else {
        setRates(FALLBACK_RATES);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const convert = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    if (amount === null || amount === undefined || isNaN(amount)) return 0;
    if (fromCurrency === toCurrency) return amount;

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // Convert to USD first (base), then to target currency
    const amountInBase = amount / fromRate;
    const convertedAmount = amountInBase * toRate;

    return convertedAmount;
  }, [rates]);

  return {
    rates,
    isLoading,
    error,
    convert,
    lastUpdated,
    refetch: fetchRates,
  };
};

export default useExchangeRates;
