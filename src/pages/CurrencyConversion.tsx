import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRightLeft, RefreshCw, Clock, TrendingUp, TrendingDown, 
  AlertCircle, Search, Star, History, Coins, DollarSign, Wifi, WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Asset {
  code: string;
  name: string;
  nameFr: string;
  symbol: string;
  decimals: number;
  type: 'fiat' | 'crypto';
  category?: string;
  icon?: string;
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

interface PriceChange {
  [key: string]: number;
}

// Fiat currencies
const FIAT_CURRENCIES: Asset[] = [
  { code: 'USD', name: 'US Dollar', nameFr: 'Dollar américain', symbol: '$', decimals: 2, type: 'fiat' },
  { code: 'EUR', name: 'Euro', nameFr: 'Euro', symbol: '€', decimals: 2, type: 'fiat' },
  { code: 'GBP', name: 'British Pound', nameFr: 'Livre sterling', symbol: '£', decimals: 2, type: 'fiat' },
  { code: 'JPY', name: 'Japanese Yen', nameFr: 'Yen japonais', symbol: '¥', decimals: 0, type: 'fiat' },
  { code: 'CHF', name: 'Swiss Franc', nameFr: 'Franc suisse', symbol: 'CHF', decimals: 2, type: 'fiat' },
  { code: 'CAD', name: 'Canadian Dollar', nameFr: 'Dollar canadien', symbol: 'CA$', decimals: 2, type: 'fiat' },
  { code: 'AUD', name: 'Australian Dollar', nameFr: 'Dollar australien', symbol: 'A$', decimals: 2, type: 'fiat' },
  { code: 'NZD', name: 'New Zealand Dollar', nameFr: 'Dollar néo-zélandais', symbol: 'NZ$', decimals: 2, type: 'fiat' },
  { code: 'CNY', name: 'Chinese Yuan', nameFr: 'Yuan chinois', symbol: '¥', decimals: 2, type: 'fiat' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameFr: 'Dollar de Hong Kong', symbol: 'HK$', decimals: 2, type: 'fiat' },
  { code: 'SGD', name: 'Singapore Dollar', nameFr: 'Dollar de Singapour', symbol: 'S$', decimals: 2, type: 'fiat' },
  { code: 'XAF', name: 'CFA Franc BEAC', nameFr: 'Franc CFA BEAC', symbol: 'FCFA', decimals: 0, type: 'fiat' },
  { code: 'XOF', name: 'CFA Franc BCEAO', nameFr: 'Franc CFA BCEAO', symbol: 'FCFA', decimals: 0, type: 'fiat' },
  { code: 'ZAR', name: 'South African Rand', nameFr: 'Rand sud-africain', symbol: 'R', decimals: 2, type: 'fiat' },
  { code: 'NGN', name: 'Nigerian Naira', nameFr: 'Naira nigérian', symbol: '₦', decimals: 2, type: 'fiat' },
  { code: 'GHS', name: 'Ghanaian Cedi', nameFr: 'Cedi ghanéen', symbol: '₵', decimals: 2, type: 'fiat' },
  { code: 'KES', name: 'Kenyan Shilling', nameFr: 'Shilling kényan', symbol: 'KSh', decimals: 2, type: 'fiat' },
  { code: 'EGP', name: 'Egyptian Pound', nameFr: 'Livre égyptienne', symbol: 'E£', decimals: 2, type: 'fiat' },
  { code: 'MAD', name: 'Moroccan Dirham', nameFr: 'Dirham marocain', symbol: 'MAD', decimals: 2, type: 'fiat' },
  { code: 'AED', name: 'UAE Dirham', nameFr: 'Dirham des Émirats', symbol: 'AED', decimals: 2, type: 'fiat' },
  { code: 'SAR', name: 'Saudi Riyal', nameFr: 'Riyal saoudien', symbol: 'SAR', decimals: 2, type: 'fiat' },
  { code: 'INR', name: 'Indian Rupee', nameFr: 'Roupie indienne', symbol: '₹', decimals: 2, type: 'fiat' },
  { code: 'KRW', name: 'South Korean Won', nameFr: 'Won sud-coréen', symbol: '₩', decimals: 0, type: 'fiat' },
  { code: 'THB', name: 'Thai Baht', nameFr: 'Baht thaïlandais', symbol: '฿', decimals: 2, type: 'fiat' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameFr: 'Ringgit malaisien', symbol: 'RM', decimals: 2, type: 'fiat' },
  { code: 'IDR', name: 'Indonesian Rupiah', nameFr: 'Roupie indonésienne', symbol: 'Rp', decimals: 0, type: 'fiat' },
  { code: 'PHP', name: 'Philippine Peso', nameFr: 'Peso philippin', symbol: '₱', decimals: 2, type: 'fiat' },
  { code: 'VND', name: 'Vietnamese Dong', nameFr: 'Dong vietnamien', symbol: '₫', decimals: 0, type: 'fiat' },
  { code: 'SEK', name: 'Swedish Krona', nameFr: 'Couronne suédoise', symbol: 'kr', decimals: 2, type: 'fiat' },
  { code: 'NOK', name: 'Norwegian Krone', nameFr: 'Couronne norvégienne', symbol: 'kr', decimals: 2, type: 'fiat' },
  { code: 'DKK', name: 'Danish Krone', nameFr: 'Couronne danoise', symbol: 'kr', decimals: 2, type: 'fiat' },
  { code: 'PLN', name: 'Polish Zloty', nameFr: 'Zloty polonais', symbol: 'zł', decimals: 2, type: 'fiat' },
  { code: 'CZK', name: 'Czech Koruna', nameFr: 'Couronne tchèque', symbol: 'Kč', decimals: 2, type: 'fiat' },
  { code: 'HUF', name: 'Hungarian Forint', nameFr: 'Forint hongrois', symbol: 'Ft', decimals: 0, type: 'fiat' },
  { code: 'RON', name: 'Romanian Leu', nameFr: 'Leu roumain', symbol: 'lei', decimals: 2, type: 'fiat' },
  { code: 'RUB', name: 'Russian Ruble', nameFr: 'Rouble russe', symbol: '₽', decimals: 2, type: 'fiat' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', nameFr: 'Hryvnia ukrainienne', symbol: '₴', decimals: 2, type: 'fiat' },
  { code: 'TRY', name: 'Turkish Lira', nameFr: 'Livre turque', symbol: '₺', decimals: 2, type: 'fiat' },
  { code: 'MXN', name: 'Mexican Peso', nameFr: 'Peso mexicain', symbol: 'MX$', decimals: 2, type: 'fiat' },
  { code: 'BRL', name: 'Brazilian Real', nameFr: 'Réal brésilien', symbol: 'R$', decimals: 2, type: 'fiat' },
  { code: 'ARS', name: 'Argentine Peso', nameFr: 'Peso argentin', symbol: 'AR$', decimals: 2, type: 'fiat' },
  { code: 'CLP', name: 'Chilean Peso', nameFr: 'Peso chilien', symbol: 'CL$', decimals: 0, type: 'fiat' },
  { code: 'COP', name: 'Colombian Peso', nameFr: 'Peso colombien', symbol: 'CO$', decimals: 0, type: 'fiat' },
  { code: 'PEN', name: 'Peruvian Sol', nameFr: 'Sol péruvien', symbol: 'S/', decimals: 2, type: 'fiat' },
];

// Cryptocurrencies
const CRYPTOCURRENCIES: Asset[] = [
  // Major cryptos
  { code: 'BTC', name: 'Bitcoin', nameFr: 'Bitcoin', symbol: '₿', decimals: 8, type: 'crypto', category: 'major' },
  { code: 'ETH', name: 'Ethereum', nameFr: 'Ethereum', symbol: 'Ξ', decimals: 8, type: 'crypto', category: 'major' },
  { code: 'USDT', name: 'Tether', nameFr: 'Tether', symbol: '₮', decimals: 6, type: 'crypto', category: 'stablecoin' },
  { code: 'USDC', name: 'USD Coin', nameFr: 'USD Coin', symbol: '$', decimals: 6, type: 'crypto', category: 'stablecoin' },
  { code: 'BNB', name: 'Binance Coin', nameFr: 'Binance Coin', symbol: 'BNB', decimals: 8, type: 'crypto', category: 'major' },
  { code: 'SOL', name: 'Solana', nameFr: 'Solana', symbol: 'SOL', decimals: 9, type: 'crypto', category: 'major' },
  { code: 'XRP', name: 'Ripple', nameFr: 'Ripple', symbol: 'XRP', decimals: 6, type: 'crypto', category: 'major' },
  { code: 'ADA', name: 'Cardano', nameFr: 'Cardano', symbol: 'ADA', decimals: 6, type: 'crypto', category: 'major' },
  { code: 'DOGE', name: 'Dogecoin', nameFr: 'Dogecoin', symbol: 'Ð', decimals: 8, type: 'crypto', category: 'major' },
  { code: 'TRX', name: 'Tron', nameFr: 'Tron', symbol: 'TRX', decimals: 6, type: 'crypto', category: 'major' },
  // Popular cryptos
  { code: 'MATIC', name: 'Polygon', nameFr: 'Polygon', symbol: 'MATIC', decimals: 8, type: 'crypto', category: 'popular' },
  { code: 'LTC', name: 'Litecoin', nameFr: 'Litecoin', symbol: 'Ł', decimals: 8, type: 'crypto', category: 'popular' },
  { code: 'DOT', name: 'Polkadot', nameFr: 'Polkadot', symbol: 'DOT', decimals: 10, type: 'crypto', category: 'popular' },
  { code: 'AVAX', name: 'Avalanche', nameFr: 'Avalanche', symbol: 'AVAX', decimals: 9, type: 'crypto', category: 'popular' },
  { code: 'LINK', name: 'Chainlink', nameFr: 'Chainlink', symbol: 'LINK', decimals: 8, type: 'crypto', category: 'popular' },
  { code: 'BCH', name: 'Bitcoin Cash', nameFr: 'Bitcoin Cash', symbol: 'BCH', decimals: 8, type: 'crypto', category: 'popular' },
  { code: 'XLM', name: 'Stellar', nameFr: 'Stellar', symbol: 'XLM', decimals: 7, type: 'crypto', category: 'popular' },
  // DeFi
  { code: 'UNI', name: 'Uniswap', nameFr: 'Uniswap', symbol: 'UNI', decimals: 8, type: 'crypto', category: 'defi' },
  { code: 'AAVE', name: 'Aave', nameFr: 'Aave', symbol: 'AAVE', decimals: 8, type: 'crypto', category: 'defi' },
  { code: 'MKR', name: 'Maker', nameFr: 'Maker', symbol: 'MKR', decimals: 8, type: 'crypto', category: 'defi' },
  { code: 'SNX', name: 'Synthetix', nameFr: 'Synthetix', symbol: 'SNX', decimals: 8, type: 'crypto', category: 'defi' },
  { code: 'CRV', name: 'Curve DAO', nameFr: 'Curve DAO', symbol: 'CRV', decimals: 8, type: 'crypto', category: 'defi' },
  // Payment & adoption
  { code: 'SHIB', name: 'Shiba Inu', nameFr: 'Shiba Inu', symbol: 'SHIB', decimals: 8, type: 'crypto', category: 'meme' },
  { code: 'PEPE', name: 'Pepe', nameFr: 'Pepe', symbol: 'PEPE', decimals: 8, type: 'crypto', category: 'meme' },
  { code: 'TON', name: 'Toncoin', nameFr: 'Toncoin', symbol: 'TON', decimals: 9, type: 'crypto', category: 'payment' },
  { code: 'NEAR', name: 'Near Protocol', nameFr: 'Near Protocol', symbol: 'NEAR', decimals: 8, type: 'crypto', category: 'web3' },
  { code: 'ICP', name: 'Internet Computer', nameFr: 'Internet Computer', symbol: 'ICP', decimals: 8, type: 'crypto', category: 'web3' },
  // Web3 / AI / Gaming
  { code: 'GRT', name: 'The Graph', nameFr: 'The Graph', symbol: 'GRT', decimals: 8, type: 'crypto', category: 'web3' },
  { code: 'RNDR', name: 'Render', nameFr: 'Render', symbol: 'RNDR', decimals: 8, type: 'crypto', category: 'ai' },
  { code: 'FET', name: 'Fetch.ai', nameFr: 'Fetch.ai', symbol: 'FET', decimals: 8, type: 'crypto', category: 'ai' },
  { code: 'IMX', name: 'Immutable', nameFr: 'Immutable', symbol: 'IMX', decimals: 8, type: 'crypto', category: 'gaming' },
  { code: 'SAND', name: 'Sandbox', nameFr: 'Sandbox', symbol: 'SAND', decimals: 8, type: 'crypto', category: 'gaming' },
  { code: 'MANA', name: 'Decentraland', nameFr: 'Decentraland', symbol: 'MANA', decimals: 8, type: 'crypto', category: 'gaming' },
  // Stablecoins
  { code: 'DAI', name: 'DAI', nameFr: 'DAI', symbol: 'DAI', decimals: 8, type: 'crypto', category: 'stablecoin' },
  { code: 'TUSD', name: 'TrueUSD', nameFr: 'TrueUSD', symbol: 'TUSD', decimals: 8, type: 'crypto', category: 'stablecoin' },
  { code: 'USDP', name: 'Pax Dollar', nameFr: 'Pax Dollar', symbol: 'USDP', decimals: 8, type: 'crypto', category: 'stablecoin' },
];

const ALL_ASSETS: Asset[] = [...FIAT_CURRENCIES, ...CRYPTOCURRENCIES];

const CACHE_KEY = 'crypto-fiat-rates-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for crypto rates
const HISTORY_KEY = 'crypto-conversion-history';
const FAVORITES_KEY = 'crypto-conversion-favorites';

const CurrencyConversion: React.FC = () => {
  const { language } = useLanguage();
  
  const [amount, setAmount] = useState<string>('1');
  const [fromAsset, setFromAsset] = useState<string>('BTC');
  const [toAsset, setToAsset] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [priceChanges, setPriceChanges] = useState<PriceChange>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['BTC', 'ETH', 'USD', 'EUR', 'USDT']);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'all' | 'fiat' | 'crypto'>('all');

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

  // Load history and favorites from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setHistory(parsed.map((h: ConversionHistory) => ({ ...h, timestamp: new Date(h.timestamp) })));
    }
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Fetch rates
  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rates: cachedRates, priceChanges: cachedChanges, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        
        if (cacheAge < CACHE_DURATION) {
          setRates(cachedRates);
          setPriceChanges(cachedChanges || {});
          setLastUpdated(new Date(timestamp));
          setIsLoading(false);
          return;
        }
      }

      // Fetch fiat rates
      let fiatRates: Record<string, number> = { USD: 1 };
      try {
        const fiatResponse = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
        if (fiatResponse.ok) {
          const fiatData = await fiatResponse.json();
          if (fiatData?.usd) {
            FIAT_CURRENCIES.forEach(currency => {
              const code = currency.code.toLowerCase();
              if (code === 'usd') {
                fiatRates[currency.code] = 1;
              } else if (code === 'xaf' || code === 'xof') {
                const eurRate = fiatData.usd.eur || 0.92;
                fiatRates[currency.code] = eurRate * 655.957;
              } else if (fiatData.usd[code]) {
                fiatRates[currency.code] = fiatData.usd[code];
              }
            });
          }
        }
      } catch {
        console.log('Fiat API failed, using fallback');
      }

      // Fetch crypto rates from CoinGecko
      let cryptoRates: Record<string, number> = {};
      let changes: PriceChange = {};
      
      const cryptoIds = CRYPTOCURRENCIES.map(c => c.code.toLowerCase()).join(',');
      
      try {
        const cryptoResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,binancecoin,solana,ripple,cardano,dogecoin,tron,matic-network,litecoin,polkadot,avalanche-2,chainlink,bitcoin-cash,stellar,uniswap,aave,maker,havven,curve-dao-token,shiba-inu,pepe,the-open-network,near,internet-computer,the-graph,render-token,fetch-ai,immutable-x,the-sandbox,decentraland,dai,true-usd,paxos-standard&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (cryptoResponse.ok) {
          const cryptoData = await cryptoResponse.json();
          
          // Map CoinGecko IDs to our codes
          const idToCode: Record<string, string> = {
            'bitcoin': 'BTC', 'ethereum': 'ETH', 'tether': 'USDT', 'usd-coin': 'USDC',
            'binancecoin': 'BNB', 'solana': 'SOL', 'ripple': 'XRP', 'cardano': 'ADA',
            'dogecoin': 'DOGE', 'tron': 'TRX', 'matic-network': 'MATIC', 'litecoin': 'LTC',
            'polkadot': 'DOT', 'avalanche-2': 'AVAX', 'chainlink': 'LINK', 'bitcoin-cash': 'BCH',
            'stellar': 'XLM', 'uniswap': 'UNI', 'aave': 'AAVE', 'maker': 'MKR',
            'havven': 'SNX', 'curve-dao-token': 'CRV', 'shiba-inu': 'SHIB', 'pepe': 'PEPE',
            'the-open-network': 'TON', 'near': 'NEAR', 'internet-computer': 'ICP',
            'the-graph': 'GRT', 'render-token': 'RNDR', 'fetch-ai': 'FET', 'immutable-x': 'IMX',
            'the-sandbox': 'SAND', 'decentraland': 'MANA', 'dai': 'DAI', 'true-usd': 'TUSD',
            'paxos-standard': 'USDP'
          };

          Object.entries(cryptoData).forEach(([id, data]: [string, any]) => {
            const code = idToCode[id];
            if (code && data.usd) {
              cryptoRates[code] = data.usd;
              if (data.usd_24h_change !== undefined) {
                changes[code] = data.usd_24h_change;
              }
            }
          });
        }
      } catch {
        console.log('Crypto API failed');
      }

      // Combine rates (all expressed in USD)
      const allRates: Record<string, number> = { ...fiatRates };
      
      // For cryptos, the rate is how many USD per 1 crypto
      // We store as "how much of this asset per 1 USD" for consistency
      Object.entries(cryptoRates).forEach(([code, usdPrice]) => {
        allRates[code] = 1 / usdPrice; // e.g., BTC at $50000 = 0.00002 BTC per USD
      });

      // Cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: allRates,
        priceChanges: changes,
        timestamp: Date.now(),
      }));

      setRates(allRates);
      setPriceChanges(changes);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Rate fetch error:', err);
      setError(language === 'fr' 
        ? 'Impossible de récupérer les taux. Utilisation des données en cache.'
        : 'Unable to fetch rates. Using cached data.');
      
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
  }, [language]);

  useEffect(() => {
    fetchRates();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRates, CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchRates]);

  // Auto-convert on change
  useEffect(() => {
    if (amount && rates[fromAsset] && rates[toAsset]) {
      const numAmount = parseFloat(amount.replace(/,/g, ''));
      if (!isNaN(numAmount)) {
        setIsConverting(true);
        const timeout = setTimeout(() => {
          // Convert to USD first, then to target
          const amountInUSD = numAmount / rates[fromAsset];
          const converted = amountInUSD * rates[toAsset];
          setResult(converted);
          setIsConverting(false);
        }, 100);
        return () => clearTimeout(timeout);
      }
    }
    setResult(null);
  }, [amount, fromAsset, toAsset, rates]);

  const handleSwap = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
  };

  const saveToHistory = () => {
    if (result === null) return;
    
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    const rate = rates[toAsset] / rates[fromAsset];
    
    const newEntry: ConversionHistory = {
      id: Date.now().toString(),
      from: fromAsset,
      to: toAsset,
      amount: numAmount,
      result: result,
      rate: rate,
      timestamp: new Date(),
    };

    const newHistory = [newEntry, ...history.slice(0, 19)];
    setHistory(newHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
  };

  const toggleFavorite = (code: string) => {
    const newFavorites = favorites.includes(code)
      ? favorites.filter(f => f !== code)
      : [...favorites, code];
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  };

  const getAsset = (code: string) => ALL_ASSETS.find(a => a.code === code);
  const getAssetName = (code: string) => {
    const asset = getAsset(code);
    return language === 'fr' ? asset?.nameFr : asset?.name;
  };

  const filterAssets = (search: string, type: 'all' | 'fiat' | 'crypto') => {
    const term = search.toLowerCase();
    let assets = ALL_ASSETS;
    if (type === 'fiat') assets = FIAT_CURRENCIES;
    if (type === 'crypto') assets = CRYPTOCURRENCIES;
    
    return assets.filter(a => 
      a.code.toLowerCase().includes(term) ||
      a.name.toLowerCase().includes(term) ||
      a.nameFr.toLowerCase().includes(term)
    );
  };

  const filteredFromAssets = useMemo(() => filterAssets(searchFrom, activeTab), [searchFrom, activeTab]);
  const filteredToAssets = useMemo(() => filterAssets(searchTo, activeTab), [searchTo, activeTab]);

  const formatNumber = (num: number, decimals: number) => {
    if (Math.abs(num) < 0.000001) {
      return num.toExponential(4);
    }
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: Math.min(decimals, 8),
      maximumFractionDigits: Math.min(decimals, 8),
    }).format(num);
  };

  const getUsdPrice = (code: string) => {
    if (!rates[code]) return null;
    const asset = getAsset(code);
    if (asset?.type === 'crypto') {
      return 1 / rates[code];
    }
    return 1 / rates[code];
  };

  const fromAssetData = getAsset(fromAsset);
  const toAssetData = getAsset(toAsset);
  const currentRate = rates[fromAsset] && rates[toAsset] 
    ? rates[toAsset] / rates[fromAsset] 
    : null;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { en: string; fr: string }> = {
      'major': { en: 'Major', fr: 'Majeur' },
      'popular': { en: 'Popular', fr: 'Populaire' },
      'defi': { en: 'DeFi', fr: 'DeFi' },
      'stablecoin': { en: 'Stablecoin', fr: 'Stablecoin' },
      'meme': { en: 'Meme', fr: 'Meme' },
      'payment': { en: 'Payment', fr: 'Paiement' },
      'web3': { en: 'Web3', fr: 'Web3' },
      'ai': { en: 'AI', fr: 'IA' },
      'gaming': { en: 'Gaming', fr: 'Gaming' },
    };
    return labels[category]?.[language === 'fr' ? 'fr' : 'en'] || category;
  };

  const renderAssetOption = (asset: Asset, isFavorite: boolean, prefix: string) => (
    <SelectItem key={`${prefix}-${asset.code}`} value={asset.code}>
      <div className="flex items-center gap-2 w-full">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          asset.type === 'crypto' ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
        )}>
          {asset.symbol.slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
            <span className="font-medium">{asset.code}</span>
            {asset.category && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                {getCategoryLabel(asset.category)}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate block">
            {language === 'fr' ? asset.nameFr : asset.name}
          </span>
        </div>
        {priceChanges[asset.code] !== undefined && (
          <div className={cn(
            "text-xs font-medium",
            priceChanges[asset.code] >= 0 ? "text-profit" : "text-loss"
          )}>
            {priceChanges[asset.code] >= 0 ? '+' : ''}{priceChanges[asset.code].toFixed(2)}%
          </div>
        )}
      </div>
    </SelectItem>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-neon">
            <Coins className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {language === 'fr' ? 'Conversion devises / cryptos' : 'Currency / Crypto Conversion'}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm md:text-base">
          {language === 'fr' 
            ? 'Convertissez en temps réel entre devises fiat et cryptomonnaies'
            : 'Convert in real-time between fiat currencies and cryptocurrencies'}
        </p>
        
        {/* Online/Offline indicator */}
        <div className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs",
          isOnline ? "bg-profit/20 text-profit" : "bg-loss/20 text-loss"
        )}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline 
            ? (language === 'fr' ? 'En ligne' : 'Online')
            : (language === 'fr' ? 'Hors ligne' : 'Offline')}
        </div>
      </div>

      {/* Main Conversion Card */}
      <Card className="glass-card border-primary/20 overflow-hidden">
        <CardHeader className="border-b border-primary/20 pb-4">
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              {language === 'fr' ? 'Convertisseur' : 'Converter'}
            </span>
            <div className="flex items-center gap-2">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-auto">
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-2 h-6">
                    {language === 'fr' ? 'Tout' : 'All'}
                  </TabsTrigger>
                  <TabsTrigger value="fiat" className="text-xs px-2 h-6">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Fiat
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="text-xs px-2 h-6">
                    <Coins className="w-3 h-3 mr-1" />
                    Crypto
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRates}
                disabled={isLoading}
                className="text-primary hover:bg-primary/10"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>
            </div>
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
            {/* From Asset */}
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
              <Select value={fromAsset} onValueChange={setFromAsset}>
                <SelectTrigger className="h-14 bg-secondary/50">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        fromAssetData?.type === 'crypto' ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
                      )}>
                        {fromAssetData?.symbol.slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{fromAsset}</span>
                          {priceChanges[fromAsset] !== undefined && (
                            <span className={cn(
                              "text-xs",
                              priceChanges[fromAsset] >= 0 ? "text-profit" : "text-loss"
                            )}>
                              {priceChanges[fromAsset] >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                              {Math.abs(priceChanges[fromAsset]).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {getAssetName(fromAsset)}
                        </span>
                      </div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <div className="p-2 sticky top-0 bg-popover z-10">
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
                  
                  {/* Favorites */}
                  {favorites.length > 0 && !searchFrom && (
                    <div className="px-2 py-1 border-b border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {language === 'fr' ? 'Favoris' : 'Favorites'}
                      </p>
                      {favorites.map(code => {
                        const asset = getAsset(code);
                        if (!asset) return null;
                        return renderAssetOption(asset, true, 'fav-from');
                      })}
                    </div>
                  )}
                  
                  {/* All assets */}
                  {filteredFromAssets.map((asset) => 
                    renderAssetOption(asset, favorites.includes(asset.code), 'from')
                  )}
                </SelectContent>
              </Select>
              
              {/* Toggle favorite button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(fromAsset)}
                className={cn(
                  "w-full text-xs",
                  favorites.includes(fromAsset) ? "text-yellow-500" : "text-muted-foreground"
                )}
              >
                <Star className={cn("w-4 h-4 mr-1", favorites.includes(fromAsset) && "fill-yellow-500")} />
                {favorites.includes(fromAsset)
                  ? (language === 'fr' ? 'Retirer des favoris' : 'Remove from favorites')
                  : (language === 'fr' ? 'Ajouter aux favoris' : 'Add to favorites')}
              </Button>
            </div>

            {/* Swap Button */}
            <div className="flex items-center justify-center md:mt-14">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwap}
                className="rounded-full w-12 h-12 border-primary/30 hover:bg-primary/20 hover:border-primary hover:rotate-180 transition-all duration-300"
              >
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </Button>
            </div>

            {/* To Asset */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                {language === 'fr' ? 'Vers' : 'To'}
              </label>
              <div className={cn(
                "text-2xl font-semibold h-14 flex items-center px-3 rounded-md bg-primary/10 border border-primary/30",
                isConverting && "animate-pulse"
              )}>
                {result !== null && toAssetData
                  ? formatNumber(result, toAssetData.decimals)
                  : '—'}
              </div>
              <Select value={toAsset} onValueChange={setToAsset}>
                <SelectTrigger className="h-14 bg-secondary/50">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        toAssetData?.type === 'crypto' ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
                      )}>
                        {toAssetData?.symbol.slice(0, 2)}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{toAsset}</span>
                          {priceChanges[toAsset] !== undefined && (
                            <span className={cn(
                              "text-xs",
                              priceChanges[toAsset] >= 0 ? "text-profit" : "text-loss"
                            )}>
                              {priceChanges[toAsset] >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                              {Math.abs(priceChanges[toAsset]).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {getAssetName(toAsset)}
                        </span>
                      </div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  <div className="p-2 sticky top-0 bg-popover z-10">
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
                  
                  {/* Favorites */}
                  {favorites.length > 0 && !searchTo && (
                    <div className="px-2 py-1 border-b border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {language === 'fr' ? 'Favoris' : 'Favorites'}
                      </p>
                      {favorites.map(code => {
                        const asset = getAsset(code);
                        if (!asset) return null;
                        return renderAssetOption(asset, true, 'fav-to');
                      })}
                    </div>
                  )}
                  
                  {/* All assets */}
                  {filteredToAssets.map((asset) => 
                    renderAssetOption(asset, favorites.includes(asset.code), 'to')
                  )}
                </SelectContent>
              </Select>
              
              {/* Toggle favorite button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(toAsset)}
                className={cn(
                  "w-full text-xs",
                  favorites.includes(toAsset) ? "text-yellow-500" : "text-muted-foreground"
                )}
              >
                <Star className={cn("w-4 h-4 mr-1", favorites.includes(toAsset) && "fill-yellow-500")} />
                {favorites.includes(toAsset)
                  ? (language === 'fr' ? 'Retirer des favoris' : 'Remove from favorites')
                  : (language === 'fr' ? 'Ajouter aux favoris' : 'Add to favorites')}
              </Button>
            </div>
          </div>

          {/* Rate Info */}
          {currentRate && (
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Taux de change' : 'Exchange Rate'}
                </span>
                <span className="font-mono text-sm font-medium">
                  1 {fromAsset} = {formatNumber(currentRate, 8)} {toAsset}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {language === 'fr' ? 'Taux inverse' : 'Inverse Rate'}
                </span>
                <span className="font-mono text-sm">
                  1 {toAsset} = {formatNumber(1 / currentRate, 8)} {fromAsset}
                </span>
              </div>
              
              {/* 24h changes */}
              {(priceChanges[fromAsset] !== undefined || priceChanges[toAsset] !== undefined) && (
                <div className="pt-2 border-t border-border/50 flex flex-wrap gap-4">
                  {priceChanges[fromAsset] !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{fromAsset} 24h:</span>
                      <span className={cn(
                        "text-xs font-medium flex items-center gap-1",
                        priceChanges[fromAsset] >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {priceChanges[fromAsset] >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {priceChanges[fromAsset] >= 0 ? '+' : ''}{priceChanges[fromAsset].toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {priceChanges[toAsset] !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{toAsset} 24h:</span>
                      <span className={cn(
                        "text-xs font-medium flex items-center gap-1",
                        priceChanges[toAsset] >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {priceChanges[toAsset] >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {priceChanges[toAsset] >= 0 ? '+' : ''}{priceChanges[toAsset].toFixed(2)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
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
          ? 'Les taux sont indicatifs et peuvent varier. Sources: CoinGecko, ExchangeRate API.'
          : 'Rates are indicative and may vary. Sources: CoinGecko, ExchangeRate API.'}
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
            {history.slice(0, 10).map((item) => {
              const fromData = getAsset(item.from);
              const toData = getAsset(item.to);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setAmount(item.amount.toString());
                    setFromAsset(item.from);
                    setToAsset(item.to);
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        fromData?.type === 'crypto' ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
                      )}>
                        {fromData?.symbol.slice(0, 2)}
                      </div>
                      <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                        toData?.type === 'crypto' ? "bg-primary/20 text-primary" : "bg-secondary text-foreground"
                      )}>
                        {toData?.symbol.slice(0, 2)}
                      </div>
                    </div>
                    <div className="text-sm truncate">
                      <span className="font-semibold">
                        {formatNumber(item.amount, fromData?.decimals || 2)} {item.from}
                      </span>
                      <span className="text-muted-foreground mx-1">→</span>
                      <span className="font-semibold text-primary">
                        {formatNumber(item.result, toData?.decimals || 2)} {item.to}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
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
