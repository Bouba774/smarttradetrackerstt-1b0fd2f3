import { useState, useEffect, useCallback } from 'react';

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

// Fallback rates in case API fails (market rates December 2025)
// These are backup values only - real rates are fetched from API
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.9520,      // 1 USD ≈ 0.952 EUR (Dec 2025)
  GBP: 0.7920,      // 1 USD ≈ 0.792 GBP (Dec 2025)
  JPY: 154.25,      // 1 USD ≈ 154.25 JPY (Dec 2025)
  // XAF and XOF are pegged to EUR: 1 EUR = 655.957 XAF/XOF
  XAF: 624.47,      // 0.952 × 655.957 = 624.47
  XOF: 624.47,      // 0.952 × 655.957 = 624.47
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

      // Try primary API: fawazahmed0/currency-api (free, no limits, CDN hosted)
      let data = null;
      
      try {
        const response = await fetch(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
        );
        if (response.ok) {
          data = await response.json();
        }
      } catch {
        console.log('Primary API failed, trying fallback...');
      }

      // Fallback API: exchangerate-api (free tier)
      if (!data?.usd) {
        try {
          const fallbackResponse = await fetch(
            'https://open.er-api.com/v6/latest/USD'
          );
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.rates) {
              data = { usd: {} };
              // Convert to lowercase keys
              Object.keys(fallbackData.rates).forEach(key => {
                data.usd[key.toLowerCase()] = fallbackData.rates[key];
              });
            }
          }
        } catch {
          console.log('Fallback API also failed');
        }
      }

      if (!data?.usd) {
        throw new Error('All exchange rate APIs failed');
      }

      // Build rates object with USD as base (rate = 1)
      const eurRate = data.usd.eur || FALLBACK_RATES.EUR;
      const newRates: ExchangeRates = {
        USD: 1,
        EUR: eurRate,
        GBP: data.usd.gbp || FALLBACK_RATES.GBP,
        JPY: data.usd.jpy || FALLBACK_RATES.JPY,
        // XAF and XOF are pegged to EUR at fixed rate: 1 EUR = 655.957 XAF/XOF
        XAF: eurRate * 655.957,
        XOF: eurRate * 655.957,
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
    
    // Auto-refresh rates every hour
    const intervalId = setInterval(() => {
      console.log('Auto-refreshing exchange rates...');
      // Clear cache to force refresh
      localStorage.removeItem(CACHE_KEY);
      fetchRates();
    }, CACHE_DURATION);

    return () => clearInterval(intervalId);
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
