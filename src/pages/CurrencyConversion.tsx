import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, RefreshCw, Clock, TrendingUp, AlertCircle, Search, Star, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Currency {
  code: string;
  name: string;
  nameFr: string;
  symbol: string;
  decimals: number;
}

interface ConversionHistory {
  id: string;
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: Date;
}

// Complete currency list
const CURRENCIES: Currency[] = [
  // Major currencies
  { code: 'USD', name: 'US Dollar', nameFr: 'Dollar américain', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', nameFr: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', nameFr: 'Livre sterling', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', nameFr: 'Yen japonais', symbol: '¥', decimals: 0 },
  { code: 'CHF', name: 'Swiss Franc', nameFr: 'Franc suisse', symbol: 'CHF', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', nameFr: 'Dollar canadien', symbol: 'CA$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', nameFr: 'Dollar australien', symbol: 'A$', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', nameFr: 'Dollar néo-zélandais', symbol: 'NZ$', decimals: 2 },
  { code: 'CNY', name: 'Chinese Yuan', nameFr: 'Yuan chinois', symbol: '¥', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', nameFr: 'Dollar de Hong Kong', symbol: 'HK$', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', nameFr: 'Dollar de Singapour', symbol: 'S$', decimals: 2 },
  
  // African currencies
  { code: 'XAF', name: 'CFA Franc BEAC', nameFr: 'Franc CFA BEAC', symbol: 'FCFA', decimals: 0 },
  { code: 'XOF', name: 'CFA Franc BCEAO', nameFr: 'Franc CFA BCEAO', symbol: 'FCFA', decimals: 0 },
  { code: 'ZAR', name: 'South African Rand', nameFr: 'Rand sud-africain', symbol: 'R', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', nameFr: 'Naira nigérian', symbol: '₦', decimals: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', nameFr: 'Cedi ghanéen', symbol: '₵', decimals: 2 },
  { code: 'KES', name: 'Kenyan Shilling', nameFr: 'Shilling kényan', symbol: 'KSh', decimals: 2 },
  { code: 'UGX', name: 'Ugandan Shilling', nameFr: 'Shilling ougandais', symbol: 'USh', decimals: 0 },
  { code: 'EGP', name: 'Egyptian Pound', nameFr: 'Livre égyptienne', symbol: 'E£', decimals: 2 },
  { code: 'MAD', name: 'Moroccan Dirham', nameFr: 'Dirham marocain', symbol: 'MAD', decimals: 2 },
  { code: 'TND', name: 'Tunisian Dinar', nameFr: 'Dinar tunisien', symbol: 'DT', decimals: 3 },
  
  // Middle East
  { code: 'AED', name: 'UAE Dirham', nameFr: 'Dirham des Émirats', symbol: 'AED', decimals: 2 },
  { code: 'SAR', name: 'Saudi Riyal', nameFr: 'Riyal saoudien', symbol: 'SAR', decimals: 2 },
  { code: 'QAR', name: 'Qatari Riyal', nameFr: 'Riyal qatari', symbol: 'QAR', decimals: 2 },
  { code: 'ILS', name: 'Israeli Shekel', nameFr: 'Shekel israélien', symbol: '₪', decimals: 2 },
  
  // Asia
  { code: 'INR', name: 'Indian Rupee', nameFr: 'Roupie indienne', symbol: '₹', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', nameFr: 'Won sud-coréen', symbol: '₩', decimals: 0 },
  { code: 'THB', name: 'Thai Baht', nameFr: 'Baht thaïlandais', symbol: '฿', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', nameFr: 'Ringgit malaisien', symbol: 'RM', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', nameFr: 'Roupie indonésienne', symbol: 'Rp', decimals: 0 },
  { code: 'PHP', name: 'Philippine Peso', nameFr: 'Peso philippin', symbol: '₱', decimals: 2 },
  { code: 'VND', name: 'Vietnamese Dong', nameFr: 'Dong vietnamien', symbol: '₫', decimals: 0 },
  { code: 'BDT', name: 'Bangladeshi Taka', nameFr: 'Taka bangladais', symbol: '৳', decimals: 2 },
  
  // Europe
  { code: 'SEK', name: 'Swedish Krona', nameFr: 'Couronne suédoise', symbol: 'kr', decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', nameFr: 'Couronne norvégienne', symbol: 'kr', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', nameFr: 'Couronne danoise', symbol: 'kr', decimals: 2 },
  { code: 'PLN', name: 'Polish Zloty', nameFr: 'Zloty polonais', symbol: 'zł', decimals: 2 },
  { code: 'CZK', name: 'Czech Koruna', nameFr: 'Couronne tchèque', symbol: 'Kč', decimals: 2 },
  { code: 'HUF', name: 'Hungarian Forint', nameFr: 'Forint hongrois', symbol: 'Ft', decimals: 0 },
  { code: 'RON', name: 'Romanian Leu', nameFr: 'Leu roumain', symbol: 'lei', decimals: 2 },
  { code: 'BGN', name: 'Bulgarian Lev', nameFr: 'Lev bulgare', symbol: 'лв', decimals: 2 },
  { code: 'ISK', name: 'Icelandic Krona', nameFr: 'Couronne islandaise', symbol: 'kr', decimals: 0 },
  { code: 'RUB', name: 'Russian Ruble', nameFr: 'Rouble russe', symbol: '₽', decimals: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', nameFr: 'Hryvnia ukrainienne', symbol: '₴', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', nameFr: 'Livre turque', symbol: '₺', decimals: 2 },
  
  // Americas
  { code: 'MXN', name: 'Mexican Peso', nameFr: 'Peso mexicain', symbol: 'MX$', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', nameFr: 'Réal brésilien', symbol: 'R$', decimals: 2 },
  { code: 'ARS', name: 'Argentine Peso', nameFr: 'Peso argentin', symbol: 'AR$', decimals: 2 },
  { code: 'CLP', name: 'Chilean Peso', nameFr: 'Peso chilien', symbol: 'CL$', decimals: 0 },
  { code: 'COP', name: 'Colombian Peso', nameFr: 'Peso colombien', symbol: 'CO$', decimals: 0 },
  { code: 'PEN', name: 'Peruvian Sol', nameFr: 'Sol péruvien', symbol: 'S/', decimals: 2 },
];

const CACHE_KEY = 'extended-exchange-rates-cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const HISTORY_KEY = 'currency-conversion-history';

const CurrencyConversion: React.FC = () => {
  const { t, language } = useLanguage();
  
  const [amount, setAmount] = useState<string>('1000');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['USD', 'EUR', 'GBP', 'XAF', 'XOF']);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((h: any) => ({ ...h, timestamp: new Date(h.timestamp) })));
    }
  }, []);

  // Fetch exchange rates
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

      // Primary API
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

      // Fallback API
      if (!data?.usd) {
        try {
          const fallbackResponse = await fetch('https://open.er-api.com/v6/latest/USD');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.rates) {
              data = { usd: {} };
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

      // Build rates object
      const newRates: Record<string, number> = { USD: 1 };
      const eurRate = data.usd.eur || 0.92;
      
      CURRENCIES.forEach(currency => {
        const code = currency.code.toLowerCase();
        if (code === 'usd') {
          newRates[currency.code] = 1;
        } else if (code === 'xaf' || code === 'xof') {
          // XAF/XOF are pegged to EUR at 655.957
          newRates[currency.code] = eurRate * 655.957;
        } else if (data.usd[code]) {
          newRates[currency.code] = data.usd[code];
        }
      });

      // Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: newRates,
        timestamp: Date.now(),
      }));

      setRates(newRates);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Exchange rate fetch error:', err);
      setError(language === 'fr' 
        ? 'Impossible de récupérer les taux. Utilisation des taux en cache.'
        : 'Unable to fetch rates. Using cached rates.');
      
      // Try cached rates
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates: cachedRates, timestamp } = JSON.parse(cached);
        setRates(cachedRates);
        setLastUpdated(new Date(timestamp));
      }
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Auto-convert on change
  useEffect(() => {
    if (amount && rates[fromCurrency] && rates[toCurrency]) {
      const numAmount = parseFloat(amount.replace(/,/g, ''));
      if (!isNaN(numAmount)) {
        setIsConverting(true);
        const timeout = setTimeout(() => {
          const amountInUSD = numAmount / rates[fromCurrency];
          const converted = amountInUSD * rates[toCurrency];
          setResult(converted);
          setIsConverting(false);
        }, 150);
        return () => clearTimeout(timeout);
      }
    }
    setResult(null);
  }, [amount, fromCurrency, toCurrency, rates]);

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Save to history
  const saveToHistory = () => {
    if (result === null) return;
    
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    const rate = rates[toCurrency] / rates[fromCurrency];
    
    const newEntry: ConversionHistory = {
      id: Date.now().toString(),
      from: fromCurrency,
      to: toCurrency,
      amount: numAmount,
      result: result,
      rate: rate,
      timestamp: new Date(),
    };

    const newHistory = [newEntry, ...history.slice(0, 9)];
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  // Get currency details
  const getCurrency = (code: string) => CURRENCIES.find(c => c.code === code);
  const getCurrencyName = (code: string) => {
    const currency = getCurrency(code);
    return language === 'fr' ? currency?.nameFr : currency?.name;
  };

  // Filter currencies
  const filterCurrencies = (search: string) => {
    const term = search.toLowerCase();
    return CURRENCIES.filter(c => 
      c.code.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.nameFr.toLowerCase().includes(term)
    );
  };

  const filteredFromCurrencies = useMemo(() => filterCurrencies(searchFrom), [searchFrom]);
  const filteredToCurrencies = useMemo(() => filterCurrencies(searchTo), [searchTo]);

  // Format number
  const formatNumber = (num: number, decimals: number) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const fromCurrencyData = getCurrency(fromCurrency);
  const toCurrencyData = getCurrency(toCurrency);
  const currentRate = rates[fromCurrency] && rates[toCurrency] 
    ? rates[toCurrency] / rates[fromCurrency] 
    : null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-neon">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {language === 'fr' ? 'Conversion des devises' : 'Currency Conversion'}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">
          {language === 'fr' 
            ? 'Convertissez vos montants avec les taux de change en temps réel'
            : 'Convert your amounts with real-time exchange rates'}
        </p>
      </div>

      {/* Main Conversion Card */}
      <Card className="glass-card border-primary/20 overflow-hidden">
        <CardHeader className="border-b border-primary/20 pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg">
              {language === 'fr' ? 'Convertisseur' : 'Converter'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRates}
              disabled={isLoading}
              className="text-primary hover:bg-primary/10"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
              {language === 'fr' ? 'Actualiser' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-[1fr,auto,1fr]">
            {/* From Currency */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                {language === 'fr' ? 'De' : 'From'}
              </label>
              <Input
                type="text"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '');
                  setAmount(val);
                }}
                className="text-2xl font-semibold h-14 bg-secondary/50"
                placeholder="0"
              />
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="h-12 bg-secondary/50">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{fromCurrency}</span>
                      <span className="text-muted-foreground text-sm truncate">
                        {getCurrencyName(fromCurrency)}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="p-2 sticky top-0 bg-popover">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
                        value={searchFrom}
                        onChange={(e) => setSearchFrom(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  {favorites.length > 0 && !searchFrom && (
                    <div className="px-2 py-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'fr' ? 'Favoris' : 'Favorites'}
                      </p>
                      {favorites.map(code => {
                        const c = getCurrency(code);
                        if (!c) return null;
                        return (
                          <SelectItem key={`fav-from-${code}`} value={code}>
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium">{code}</span>
                              <span className="text-muted-foreground text-xs">
                                {language === 'fr' ? c.nameFr : c.name}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </div>
                  )}
                  {filteredFromCurrencies.map((currency) => (
                    <SelectItem key={`from-${currency.code}`} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-muted-foreground text-xs">
                          {language === 'fr' ? currency.nameFr : currency.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center md:mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="rounded-full w-12 h-12 border-primary/30 hover:bg-primary/20 hover:border-primary"
              >
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                {language === 'fr' ? 'Vers' : 'To'}
              </label>
              <div className={cn(
                "text-2xl font-semibold h-14 flex items-center px-3 rounded-md bg-primary/10 border border-primary/30",
                isConverting && "animate-pulse"
              )}>
                {result !== null && toCurrencyData
                  ? formatNumber(result, toCurrencyData.decimals)
                  : '—'}
              </div>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="h-12 bg-secondary/50">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{toCurrency}</span>
                      <span className="text-muted-foreground text-sm truncate">
                        {getCurrencyName(toCurrency)}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="p-2 sticky top-0 bg-popover">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
                        value={searchTo}
                        onChange={(e) => setSearchTo(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  {favorites.length > 0 && !searchTo && (
                    <div className="px-2 py-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === 'fr' ? 'Favoris' : 'Favorites'}
                      </p>
                      {favorites.map(code => {
                        const c = getCurrency(code);
                        if (!c) return null;
                        return (
                          <SelectItem key={`fav-to-${code}`} value={code}>
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="font-medium">{code}</span>
                              <span className="text-muted-foreground text-xs">
                                {language === 'fr' ? c.nameFr : c.name}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </div>
                  )}
                  {filteredToCurrencies.map((currency) => (
                    <SelectItem key={`to-${currency.code}`} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{currency.code}</span>
                        <span className="text-muted-foreground text-xs">
                          {language === 'fr' ? currency.nameFr : currency.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rate Info */}
          {currentRate && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Taux de change' : 'Exchange Rate'}
                </span>
                <span className="font-mono text-sm">
                  1 {fromCurrency} = {formatNumber(currentRate, 6)} {toCurrency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Taux inverse' : 'Inverse Rate'}
                </span>
                <span className="font-mono text-sm">
                  1 {toCurrency} = {formatNumber(1 / currentRate, 6)} {fromCurrency}
                </span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button 
            onClick={saveToHistory} 
            disabled={result === null}
            className="w-full h-12 bg-gradient-primary hover:opacity-90"
          >
            <History className="w-4 h-4 mr-2" />
            {language === 'fr' ? 'Sauvegarder la conversion' : 'Save Conversion'}
          </Button>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>
            {language === 'fr' ? 'Mis à jour le' : 'Updated on'}{' '}
            {lastUpdated.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground">
        {language === 'fr' 
          ? 'Les taux sont indicatifs et peuvent varier selon les marchés.'
          : 'Rates are indicative and may vary depending on markets.'}
      </p>

      {/* Recent Conversions */}
      {history.length > 0 && (
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              {language === 'fr' ? 'Conversions récentes' : 'Recent Conversions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((item) => {
              const fromData = getCurrency(item.from);
              const toData = getCurrency(item.to);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setAmount(item.amount.toString());
                    setFromCurrency(item.from);
                    setToCurrency(item.to);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="font-semibold">
                        {formatNumber(item.amount, fromData?.decimals || 2)} {item.from}
                      </span>
                      <ArrowRightLeft className="w-3 h-3 mx-2 inline text-muted-foreground" />
                      <span className="font-semibold text-primary">
                        {formatNumber(item.result, toData?.decimals || 2)} {item.to}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurrencyConversion;
