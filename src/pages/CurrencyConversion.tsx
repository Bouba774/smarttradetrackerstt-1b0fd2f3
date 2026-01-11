import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  RefreshCw, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Asset {
  code: string;
  name: string;
  nameFr: string;
  symbol: string;
  decimals: number;
  type: 'fiat' | 'crypto';
  flag?: string;
}

// Fiat currencies with flag emojis
const FIAT_CURRENCIES: Asset[] = [
  { code: 'USD', name: 'US Dollar', nameFr: 'Dollar américain', symbol: '$', decimals: 2, type: 'fiat', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', nameFr: 'Euro', symbol: '€', decimals: 2, type: 'fiat', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', nameFr: 'Livre sterling', symbol: '£', decimals: 2, type: 'fiat', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', nameFr: 'Yen japonais', symbol: '¥', decimals: 0, type: 'fiat', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', nameFr: 'Franc suisse', symbol: 'CHF', decimals: 2, type: 'fiat', flag: '🇨🇭' },
  { code: 'CAD', name: 'Canadian Dollar', nameFr: 'Dollar canadien', symbol: 'CA$', decimals: 2, type: 'fiat', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', nameFr: 'Dollar australien', symbol: 'A$', decimals: 2, type: 'fiat', flag: '🇦🇺' },
  { code: 'NZD', name: 'New Zealand Dollar', nameFr: 'Dollar néo-zélandais', symbol: 'NZ$', decimals: 2, type: 'fiat', flag: '🇳🇿' },
  { code: 'CNY', name: 'Chinese Yuan', nameFr: 'Yuan chinois', symbol: '¥', decimals: 2, type: 'fiat', flag: '🇨🇳' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameFr: 'Dollar de Hong Kong', symbol: 'HK$', decimals: 2, type: 'fiat', flag: '🇭🇰' },
  { code: 'SGD', name: 'Singapore Dollar', nameFr: 'Dollar de Singapour', symbol: 'S$', decimals: 2, type: 'fiat', flag: '🇸🇬' },
  { code: 'XAF', name: 'CFA Franc (CEMAC)', nameFr: 'Franc CFA (CEMAC)', symbol: 'FCFA', decimals: 0, type: 'fiat', flag: '🌍' },
  { code: 'XOF', name: 'CFA Franc (UEMOA)', nameFr: 'Franc CFA (UEMOA)', symbol: 'FCFA', decimals: 0, type: 'fiat', flag: '🌍' },
  { code: 'ZAR', name: 'South African Rand', nameFr: 'Rand sud-africain', symbol: 'R', decimals: 2, type: 'fiat', flag: '🇿🇦' },
  { code: 'NGN', name: 'Nigerian Naira', nameFr: 'Naira nigérian', symbol: '₦', decimals: 2, type: 'fiat', flag: '🇳🇬' },
  { code: 'GHS', name: 'Ghanaian Cedi', nameFr: 'Cedi ghanéen', symbol: '₵', decimals: 2, type: 'fiat', flag: '🇬🇭' },
  { code: 'KES', name: 'Kenyan Shilling', nameFr: 'Shilling kényan', symbol: 'KSh', decimals: 2, type: 'fiat', flag: '🇰🇪' },
  { code: 'EGP', name: 'Egyptian Pound', nameFr: 'Livre égyptienne', symbol: 'E£', decimals: 2, type: 'fiat', flag: '🇪🇬' },
  { code: 'MAD', name: 'Moroccan Dirham', nameFr: 'Dirham marocain', symbol: 'MAD', decimals: 2, type: 'fiat', flag: '🇲🇦' },
  { code: 'AED', name: 'UAE Dirham', nameFr: 'Dirham des Émirats', symbol: 'AED', decimals: 2, type: 'fiat', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', nameFr: 'Riyal saoudien', symbol: 'SAR', decimals: 2, type: 'fiat', flag: '🇸🇦' },
  { code: 'INR', name: 'Indian Rupee', nameFr: 'Roupie indienne', symbol: '₹', decimals: 2, type: 'fiat', flag: '🇮🇳' },
  { code: 'KRW', name: 'South Korean Won', nameFr: 'Won sud-coréen', symbol: '₩', decimals: 0, type: 'fiat', flag: '🇰🇷' },
  { code: 'THB', name: 'Thai Baht', nameFr: 'Baht thaïlandais', symbol: '฿', decimals: 2, type: 'fiat', flag: '🇹🇭' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameFr: 'Ringgit malaisien', symbol: 'RM', decimals: 2, type: 'fiat', flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah', nameFr: 'Roupie indonésienne', symbol: 'Rp', decimals: 0, type: 'fiat', flag: '🇮🇩' },
  { code: 'PHP', name: 'Philippine Peso', nameFr: 'Peso philippin', symbol: '₱', decimals: 2, type: 'fiat', flag: '🇵🇭' },
  { code: 'VND', name: 'Vietnamese Dong', nameFr: 'Dong vietnamien', symbol: '₫', decimals: 0, type: 'fiat', flag: '🇻🇳' },
  { code: 'SEK', name: 'Swedish Krona', nameFr: 'Couronne suédoise', symbol: 'kr', decimals: 2, type: 'fiat', flag: '🇸🇪' },
  { code: 'NOK', name: 'Norwegian Krone', nameFr: 'Couronne norvégienne', symbol: 'kr', decimals: 2, type: 'fiat', flag: '🇳🇴' },
  { code: 'DKK', name: 'Danish Krone', nameFr: 'Couronne danoise', symbol: 'kr', decimals: 2, type: 'fiat', flag: '🇩🇰' },
  { code: 'PLN', name: 'Polish Zloty', nameFr: 'Zloty polonais', symbol: 'zł', decimals: 2, type: 'fiat', flag: '🇵🇱' },
  { code: 'CZK', name: 'Czech Koruna', nameFr: 'Couronne tchèque', symbol: 'Kč', decimals: 2, type: 'fiat', flag: '🇨🇿' },
  { code: 'HUF', name: 'Hungarian Forint', nameFr: 'Forint hongrois', symbol: 'Ft', decimals: 0, type: 'fiat', flag: '🇭🇺' },
  { code: 'RON', name: 'Romanian Leu', nameFr: 'Leu roumain', symbol: 'lei', decimals: 2, type: 'fiat', flag: '🇷🇴' },
  { code: 'RUB', name: 'Russian Ruble', nameFr: 'Rouble russe', symbol: '₽', decimals: 2, type: 'fiat', flag: '🇷🇺' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', nameFr: 'Hryvnia ukrainienne', symbol: '₴', decimals: 2, type: 'fiat', flag: '🇺🇦' },
  { code: 'TRY', name: 'Turkish Lira', nameFr: 'Livre turque', symbol: '₺', decimals: 2, type: 'fiat', flag: '🇹🇷' },
  { code: 'MXN', name: 'Mexican Peso', nameFr: 'Peso mexicain', symbol: 'MX$', decimals: 2, type: 'fiat', flag: '🇲🇽' },
  { code: 'BRL', name: 'Brazilian Real', nameFr: 'Réal brésilien', symbol: 'R$', decimals: 2, type: 'fiat', flag: '🇧🇷' },
  { code: 'ARS', name: 'Argentine Peso', nameFr: 'Peso argentin', symbol: 'AR$', decimals: 2, type: 'fiat', flag: '🇦🇷' },
  { code: 'CLP', name: 'Chilean Peso', nameFr: 'Peso chilien', symbol: 'CL$', decimals: 0, type: 'fiat', flag: '🇨🇱' },
  { code: 'COP', name: 'Colombian Peso', nameFr: 'Peso colombien', symbol: 'CO$', decimals: 0, type: 'fiat', flag: '🇨🇴' },
  { code: 'PEN', name: 'Peruvian Sol', nameFr: 'Sol péruvien', symbol: 'S/', decimals: 2, type: 'fiat', flag: '🇵🇪' },
];

// Cryptocurrencies with icons
const CRYPTOCURRENCIES: Asset[] = [
  { code: 'BTC', name: 'Bitcoin', nameFr: 'Bitcoin', symbol: '₿', decimals: 8, type: 'crypto', flag: '🪙' },
  { code: 'ETH', name: 'Ethereum', nameFr: 'Ethereum', symbol: 'Ξ', decimals: 8, type: 'crypto', flag: '💎' },
  { code: 'USDT', name: 'Tether', nameFr: 'Tether', symbol: '₮', decimals: 6, type: 'crypto', flag: '💵' },
  { code: 'USDC', name: 'USD Coin', nameFr: 'USD Coin', symbol: '$', decimals: 6, type: 'crypto', flag: '💰' },
  { code: 'BNB', name: 'Binance Coin', nameFr: 'Binance Coin', symbol: 'BNB', decimals: 8, type: 'crypto', flag: '🔶' },
  { code: 'SOL', name: 'Solana', nameFr: 'Solana', symbol: 'SOL', decimals: 9, type: 'crypto', flag: '☀️' },
  { code: 'XRP', name: 'Ripple', nameFr: 'Ripple', symbol: 'XRP', decimals: 6, type: 'crypto', flag: '💧' },
  { code: 'ADA', name: 'Cardano', nameFr: 'Cardano', symbol: 'ADA', decimals: 6, type: 'crypto', flag: '🔷' },
  { code: 'DOGE', name: 'Dogecoin', nameFr: 'Dogecoin', symbol: 'Ð', decimals: 8, type: 'crypto', flag: '🐕' },
  { code: 'TRX', name: 'Tron', nameFr: 'Tron', symbol: 'TRX', decimals: 6, type: 'crypto', flag: '⚡' },
  { code: 'MATIC', name: 'Polygon', nameFr: 'Polygon', symbol: 'MATIC', decimals: 8, type: 'crypto', flag: '🔮' },
  { code: 'LTC', name: 'Litecoin', nameFr: 'Litecoin', symbol: 'Ł', decimals: 8, type: 'crypto', flag: '🥈' },
  { code: 'DOT', name: 'Polkadot', nameFr: 'Polkadot', symbol: 'DOT', decimals: 10, type: 'crypto', flag: '⚪' },
  { code: 'AVAX', name: 'Avalanche', nameFr: 'Avalanche', symbol: 'AVAX', decimals: 9, type: 'crypto', flag: '🔺' },
  { code: 'LINK', name: 'Chainlink', nameFr: 'Chainlink', symbol: 'LINK', decimals: 8, type: 'crypto', flag: '🔗' },
  { code: 'SHIB', name: 'Shiba Inu', nameFr: 'Shiba Inu', symbol: 'SHIB', decimals: 8, type: 'crypto', flag: '🐶' },
  { code: 'TON', name: 'Toncoin', nameFr: 'Toncoin', symbol: 'TON', decimals: 9, type: 'crypto', flag: '💠' },
  { code: 'NEAR', name: 'Near Protocol', nameFr: 'Near Protocol', symbol: 'NEAR', decimals: 8, type: 'crypto', flag: '🌐' },
];

const ALL_ASSETS: Asset[] = [...FIAT_CURRENCIES, ...CRYPTOCURRENCIES];

const CACHE_KEY = 'crypto-fiat-rates-cache-v3';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for more frequent updates
const AUTO_REFRESH_INTERVAL = 60 * 1000; // Auto-refresh every 60 seconds

interface ConversionSlot {
  id: number;
  assetCode: string;
  isEditing: boolean;
}

const CurrencyConversion: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [baseAmount, setBaseAmount] = useState<string>('100');
  const [slots, setSlots] = useState<ConversionSlot[]>([
    { id: 1, assetCode: 'USD', isEditing: true },
    { id: 2, assetCode: 'XAF', isEditing: false },
    { id: 3, assetCode: 'EUR', isEditing: false },
    { id: 4, assetCode: 'BTC', isEditing: false },
  ]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [priceChanges, setPriceChanges] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(1);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch rates from multiple reliable APIs
  const fetchRates = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);

    try {
      // Check cache first (skip if force refresh)
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { rates: cachedRates, priceChanges: cachedChanges, timestamp } = JSON.parse(cached);
            const cacheAge = Date.now() - timestamp;
            
            if (cacheAge < CACHE_DURATION && cachedRates && Object.keys(cachedRates).length > 10) {
              setRates(cachedRates);
              setPriceChanges(cachedChanges || {});
              setLastUpdated(new Date(timestamp));
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.log('Cache parse error, fetching fresh rates');
          }
        }
      }

      // All rates will be stored as "1 USD = X units"
      let fiatRates: Record<string, number> = { USD: 1 };
      
      // Primary API: ExchangeRate-API (free, reliable, 1500 requests/month)
      try {
        const fiatResponse = await fetch('https://open.er-api.com/v6/latest/USD');
        if (fiatResponse.ok) {
          const fiatData = await fiatResponse.json();
          if (fiatData?.rates) {
            FIAT_CURRENCIES.forEach(currency => {
              const code = currency.code.toUpperCase();
              if (code === 'USD') {
                fiatRates[currency.code] = 1;
              } else if (code === 'XAF' || code === 'XOF') {
                // XAF/XOF are pegged to EUR at 655.957
                const eurRate = fiatData.rates['EUR'] || 0.92;
                fiatRates[currency.code] = eurRate * 655.957;
              } else if (fiatData.rates[code]) {
                fiatRates[currency.code] = fiatData.rates[code];
              }
            });
          }
        }
      } catch (e) {
        console.log('Primary fiat API failed, trying fallback:', e);
        // Fallback: fawazahmed0 currency API
        try {
          const fallbackResponse = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData?.usd) {
              FIAT_CURRENCIES.forEach(currency => {
                const code = currency.code.toLowerCase();
                if (code === 'usd') {
                  fiatRates[currency.code] = 1;
                } else if (code === 'xaf' || code === 'xof') {
                  const eurRate = fallbackData.usd.eur || 0.92;
                  fiatRates[currency.code] = eurRate * 655.957;
                } else if (fallbackData.usd[code]) {
                  fiatRates[currency.code] = fallbackData.usd[code];
                }
              });
            }
          }
        } catch (fallbackError) {
          console.log('Fallback fiat API also failed:', fallbackError);
        }
      }

      // Fetch crypto rates from CoinGecko (free, 30 calls/min)
      let cryptoPricesInUsd: Record<string, number> = {};
      let changes: Record<string, number> = {};
      
      try {
        const cryptoIds = 'bitcoin,ethereum,tether,usd-coin,binancecoin,solana,ripple,cardano,dogecoin,tron,matic-network,litecoin,polkadot,avalanche-2,chainlink,shiba-inu,the-open-network,near';
        const cryptoResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (cryptoResponse.ok) {
          const cryptoData = await cryptoResponse.json();
          
          const idToCode: Record<string, string> = {
            'bitcoin': 'BTC', 'ethereum': 'ETH', 'tether': 'USDT', 'usd-coin': 'USDC',
            'binancecoin': 'BNB', 'solana': 'SOL', 'ripple': 'XRP', 'cardano': 'ADA',
            'dogecoin': 'DOGE', 'tron': 'TRX', 'matic-network': 'MATIC', 'litecoin': 'LTC',
            'polkadot': 'DOT', 'avalanche-2': 'AVAX', 'chainlink': 'LINK',
            'shiba-inu': 'SHIB', 'the-open-network': 'TON', 'near': 'NEAR'
          };

          Object.entries(cryptoData).forEach(([id, data]: [string, any]) => {
            const code = idToCode[id];
            if (code && data.usd) {
              cryptoPricesInUsd[code] = data.usd;
              if (data.usd_24h_change !== undefined) {
                changes[code] = data.usd_24h_change;
              }
            }
          });
        }
      } catch (e) {
        console.log('Crypto API failed, using cached or fallback:', e);
      }

      // Build final rates object - all rates are "1 USD = X units"
      const allRates: Record<string, number> = { ...fiatRates };
      
      // For crypto: 1 USD = 1/price crypto units
      // If BTC = $100,000, then 1 USD = 0.00001 BTC
      Object.entries(cryptoPricesInUsd).forEach(([code, usdPrice]) => {
        if (usdPrice && usdPrice > 0) {
          allRates[code] = 1 / usdPrice;
        }
      });

      // Only cache if we have valid rates
      if (Object.keys(allRates).length > 5) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          rates: allRates,
          priceChanges: changes,
          timestamp: Date.now(),
        }));

        setRates(allRates);
        setPriceChanges(changes);
        setLastUpdated(new Date());
      } else {
        console.log('Not enough rates fetched, keeping existing');
      }
    } catch (err) {
      console.error('Rate fetch error:', err);
      
      // Try to use cached data
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates: cachedRates, priceChanges: cachedChanges, timestamp } = JSON.parse(cached);
        setRates(cachedRates);
        setPriceChanges(cachedChanges || {});
        setLastUpdated(new Date(timestamp));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    
    // Auto-refresh rates every minute
    const intervalId = setInterval(() => {
      fetchRates(true);
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchRates]);

  // Get asset data
  const getAsset = useCallback((code: string): Asset | undefined => {
    return ALL_ASSETS.find(a => a.code === code);
  }, []);

  // Get asset name based on language
  const getAssetName = useCallback((code: string): string => {
    const asset = getAsset(code);
    if (!asset) return code;
    return language === 'fr' ? asset.nameFr : asset.name;
  }, [getAsset, language]);

  // Convert amount - All rates are stored as "1 USD = X units"
  const convertAmount = useCallback((amount: number, fromCode: string, toCode: string): number => {
    if (amount === 0 || !amount || isNaN(amount)) return 0;
    if (fromCode === toCode) return amount;
    
    // Get the rates - all rates are "1 USD = X units"
    const fromRate = rates[fromCode];
    const toRate = rates[toCode];
    
    // If rates are missing, return 0
    if (!fromRate || !toRate || fromRate === 0) {
      console.log('Missing or invalid rates:', { fromCode, fromRate, toCode, toRate });
      return 0;
    }
    
    // Step 1: Convert source amount to USD
    // If fromRate = 0.92 (EUR), it means 1 USD = 0.92 EUR
    // So to convert EUR to USD: amount / 0.92
    const amountInUsd = amount / fromRate;
    
    // Step 2: Convert USD to target currency
    // If toRate = 655 (XAF), it means 1 USD = 655 XAF
    // So to convert USD to XAF: amountInUsd * 655
    const result = amountInUsd * toRate;
    
    return result;
  }, [rates]);

  // Format number with proper decimals and spacing
  const formatNumber = useCallback((num: number, decimals: number = 4): string => {
    if (num === 0) return '0';
    
    const absNum = Math.abs(num);
    let formattedDecimals = decimals;
    
    if (absNum < 0.000001) formattedDecimals = 10;
    else if (absNum < 0.0001) formattedDecimals = 8;
    else if (absNum < 0.01) formattedDecimals = 6;
    else if (absNum < 1) formattedDecimals = 4;
    else if (absNum >= 1000000) formattedDecimals = 0;
    else if (absNum >= 1000) formattedDecimals = 2;
    
    const formatted = num.toFixed(Math.min(formattedDecimals, decimals));
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    
    if (parts[1]) {
      parts[1] = parts[1].replace(/0+$/, '');
      if (parts[1] === '') return parts[0];
    }
    
    return parts.join(',');
  }, []);

  // Update slot asset
  const updateSlotAsset = useCallback((slotId: number, newAssetCode: string) => {
    setSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, assetCode: newAssetCode } : slot
    ));
  }, []);

  // Get the base slot (the one being edited)
  const baseSlot = useMemo(() => {
    return slots.find(s => s.id === editingSlotId) || slots[0];
  }, [slots, editingSlotId]);

  // Calculate converted values
  const getConvertedValue = useCallback((slotId: number): number => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.id === editingSlotId) return parseFloat(baseAmount) || 0;
    
    const amount = parseFloat(baseAmount) || 0;
    return convertAmount(amount, baseSlot.assetCode, slot.assetCode);
  }, [slots, baseAmount, editingSlotId, baseSlot, convertAmount]);

  // Handle slot click to edit
  const handleSlotClick = useCallback((slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    
    // Calculate the new base amount based on current conversion
    const currentValue = getConvertedValue(slotId);
    setBaseAmount(currentValue.toString());
    setEditingSlotId(slotId);
  }, [slots, getConvertedValue]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">
            {language === 'fr' ? 'Convertisseur de devises' : 'Currency Converter'}
          </h1>
          
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-profit" />
            ) : (
              <WifiOff className="w-5 h-5 text-loss" />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchRates(true)}
              disabled={isLoading}
              className="text-foreground"
            >
              <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Conversion List */}
      <div className="px-2 py-4">
        <div className="divide-y divide-border/50">
          {slots.map((slot) => {
            const asset = getAsset(slot.assetCode);
            const isEditing = slot.id === editingSlotId;
            const value = isEditing ? parseFloat(baseAmount) || 0 : getConvertedValue(slot.id);
            const priceChange = priceChanges[slot.assetCode];
            
            return (
              <div
                key={slot.id}
                className={cn(
                  "flex items-center justify-between py-5 px-3 cursor-pointer transition-colors",
                  isEditing && "bg-primary/5"
                )}
                onClick={() => !isEditing && handleSlotClick(slot.id)}
              >
                {/* Left: Flag/Icon + Code */}
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {asset?.flag || '💱'}
                  </div>
                  
                  <Select
                    value={slot.assetCode}
                    onValueChange={(v) => updateSlotAsset(slot.id, v)}
                  >
                    <SelectTrigger className="w-auto border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0">
                      <SelectValue>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-semibold text-foreground">
                            {slot.assetCode}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {ALL_ASSETS.map((a) => (
                        <SelectItem key={a.code} value={a.code}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{a.flag}</span>
                            <div>
                              <span className="font-medium">{a.code}</span>
                              <span className="text-muted-foreground ml-2 text-sm">
                                {language === 'fr' ? a.nameFr : a.name}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* 24h change indicator for crypto */}
                  {priceChange !== undefined && (
                    <span className={cn(
                      "text-xs font-medium flex items-center gap-0.5",
                      priceChange >= 0 ? "text-profit" : "text-loss"
                    )}>
                      {priceChange >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {Math.abs(priceChange).toFixed(2)}%
                    </span>
                  )}
                </div>

                {/* Right: Value + Name */}
                <div className="flex flex-col items-end">
                  {isEditing ? (
                    <Input
                      type="text"
                      value={baseAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.,]/g, '');
                        setBaseAmount(val);
                      }}
                      className="text-right text-2xl font-semibold h-10 w-40 bg-transparent border-0 border-b-2 border-primary rounded-none shadow-none focus-visible:ring-0 px-0"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-foreground">
                      {formatNumber(value, asset?.decimals || 4)}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground mt-1">
                    {getAssetName(slot.assetCode)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last updated info */}
      {lastUpdated && (
        <div className="px-4 py-3 text-center">
          <span className="text-xs text-muted-foreground">
            {language === 'fr' ? 'Dernière mise à jour: ' : 'Last updated: '}
            {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default CurrencyConversion;
