import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';
import { 
  RefreshCw, 
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Coins,
  Banknote,
  LayoutGrid,
  Search,
  X
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
  { code: 'PEPE', name: 'Pepe', nameFr: 'Pepe', symbol: 'PEPE', decimals: 8, type: 'crypto', flag: '🐸' },
  { code: 'FLOKI', name: 'Floki', nameFr: 'Floki', symbol: 'FLOKI', decimals: 8, type: 'crypto', flag: '🐕‍🦺' },
  { code: 'ARB', name: 'Arbitrum', nameFr: 'Arbitrum', symbol: 'ARB', decimals: 8, type: 'crypto', flag: '🔵' },
  { code: 'OP', name: 'Optimism', nameFr: 'Optimism', symbol: 'OP', decimals: 8, type: 'crypto', flag: '🔴' },
  { code: 'APT', name: 'Aptos', nameFr: 'Aptos', symbol: 'APT', decimals: 8, type: 'crypto', flag: '🟢' },
  { code: 'SUI', name: 'Sui', nameFr: 'Sui', symbol: 'SUI', decimals: 9, type: 'crypto', flag: '💙' },
  { code: 'INJ', name: 'Injective', nameFr: 'Injective', symbol: 'INJ', decimals: 8, type: 'crypto', flag: '💉' },
  { code: 'FTM', name: 'Fantom', nameFr: 'Fantom', symbol: 'FTM', decimals: 8, type: 'crypto', flag: '👻' },
  { code: 'ATOM', name: 'Cosmos', nameFr: 'Cosmos', symbol: 'ATOM', decimals: 6, type: 'crypto', flag: '⚛️' },
  { code: 'UNI', name: 'Uniswap', nameFr: 'Uniswap', symbol: 'UNI', decimals: 8, type: 'crypto', flag: '🦄' },
  { code: 'AAVE', name: 'Aave', nameFr: 'Aave', symbol: 'AAVE', decimals: 8, type: 'crypto', flag: '👻' },
  { code: 'MKR', name: 'Maker', nameFr: 'Maker', symbol: 'MKR', decimals: 8, type: 'crypto', flag: '🏭' },
  { code: 'CRO', name: 'Cronos', nameFr: 'Cronos', symbol: 'CRO', decimals: 8, type: 'crypto', flag: '🦁' },
  { code: 'ALGO', name: 'Algorand', nameFr: 'Algorand', symbol: 'ALGO', decimals: 6, type: 'crypto', flag: '🔷' },
  { code: 'XLM', name: 'Stellar', nameFr: 'Stellar', symbol: 'XLM', decimals: 7, type: 'crypto', flag: '⭐' },
  { code: 'VET', name: 'VeChain', nameFr: 'VeChain', symbol: 'VET', decimals: 8, type: 'crypto', flag: '✔️' },
  { code: 'FIL', name: 'Filecoin', nameFr: 'Filecoin', symbol: 'FIL', decimals: 8, type: 'crypto', flag: '📁' },
  { code: 'ICP', name: 'Internet Computer', nameFr: 'Internet Computer', symbol: 'ICP', decimals: 8, type: 'crypto', flag: '🖥️' },
  { code: 'RENDER', name: 'Render', nameFr: 'Render', symbol: 'RENDER', decimals: 8, type: 'crypto', flag: '🎨' },
  { code: 'GRT', name: 'The Graph', nameFr: 'The Graph', symbol: 'GRT', decimals: 8, type: 'crypto', flag: '📊' },
  { code: 'IMX', name: 'Immutable X', nameFr: 'Immutable X', symbol: 'IMX', decimals: 8, type: 'crypto', flag: '🎮' },
  { code: 'WIF', name: 'Dogwifhat', nameFr: 'Dogwifhat', symbol: 'WIF', decimals: 8, type: 'crypto', flag: '🎩' },
  { code: 'BONK', name: 'Bonk', nameFr: 'Bonk', symbol: 'BONK', decimals: 8, type: 'crypto', flag: '🦴' },
];

const ALL_ASSETS: Asset[] = [...FIAT_CURRENCIES, ...CRYPTOCURRENCIES];

const CACHE_KEY = 'crypto-fiat-rates-cache-v4';
const CACHE_DURATION = 30 * 1000; // 30 seconds cache
const AUTO_REFRESH_INTERVAL = 30 * 1000; // Auto-refresh every 30 seconds

interface ConversionSlot {
  id: number;
  assetCode: string;
  isEditing: boolean;
}

// Memoized asset item component for performance
const AssetItem = React.memo(({ asset, language }: { asset: Asset; language: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-xl">{asset.flag}</span>
    <div>
      <span className="font-medium">{asset.code}</span>
      <span className="text-muted-foreground ml-2 text-sm">
        {language === 'fr' ? asset.nameFr : asset.name}
      </span>
    </div>
  </div>
));

AssetItem.displayName = 'AssetItem';

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
  const [assetFilter, setAssetFilter] = useState<'all' | 'fiat' | 'crypto'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fetchControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Filtered and searched assets - memoized for performance
  const filteredAssets = useMemo(() => {
    let assets: Asset[];
    switch (assetFilter) {
      case 'fiat':
        assets = FIAT_CURRENCIES;
        break;
      case 'crypto':
        assets = CRYPTOCURRENCIES;
        break;
      default:
        assets = ALL_ASSETS;
    }
    
    if (!searchQuery.trim()) return assets;
    
    const query = searchQuery.toLowerCase().trim();
    return assets.filter(a => 
      a.code.toLowerCase().includes(query) ||
      a.name.toLowerCase().includes(query) ||
      a.nameFr.toLowerCase().includes(query)
    );
  }, [assetFilter, searchQuery]);

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

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, []);

  // Optimized fetch rates function
  const fetchRates = useCallback(async (forceRefresh = false, silent = false) => {
    // Cancel any pending request
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    fetchControllerRef.current = new AbortController();
    const signal = fetchControllerRef.current.signal;

    if (!silent) {
      setIsLoading(true);
    }
    setIsRefreshing(true);

    try {
      // Check cache first (skip if force refresh)
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { rates: cachedRates, priceChanges: cachedChanges, timestamp } = JSON.parse(cached);
            const cacheAge = Date.now() - timestamp;
            
            if (cacheAge < CACHE_DURATION && cachedRates && Object.keys(cachedRates).length > 10) {
              if (isMountedRef.current) {
                setRates(cachedRates);
                setPriceChanges(cachedChanges || {});
                setLastUpdated(new Date(timestamp));
                setIsLoading(false);
                setIsRefreshing(false);
              }
              return;
            }
          } catch {
            // Cache parse error, continue to fetch
          }
        }
      }

      // Fetch fiat and crypto rates in parallel for speed
      const [fiatResult, cryptoResult] = await Promise.allSettled([
        // Fiat API
        fetch('https://open.er-api.com/v6/latest/USD', { signal })
          .then(r => r.ok ? r.json() : null)
          .catch(() => null),
        // Crypto API
        fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin,binancecoin,solana,ripple,cardano,dogecoin,tron,matic-network,litecoin,polkadot,avalanche-2,chainlink,shiba-inu,the-open-network,near,pepe,floki,arbitrum,optimism,aptos,sui,injective-protocol,fantom,cosmos,uniswap,aave,maker,crypto-com-chain,algorand,stellar,vechain,filecoin,internet-computer,render-token,the-graph,immutable-x,dogwifcoin,bonk&vs_currencies=usd&include_24hr_change=true',
          { signal }
        ).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (signal.aborted || !isMountedRef.current) return;

      // Process fiat rates
      let fiatRates: Record<string, number> = { USD: 1 };
      const fiatData = fiatResult.status === 'fulfilled' ? fiatResult.value : null;
      
      if (fiatData?.rates) {
        FIAT_CURRENCIES.forEach(currency => {
          const code = currency.code.toUpperCase();
          if (code === 'USD') {
            fiatRates['USD'] = 1;
          } else if (code === 'XAF' || code === 'XOF') {
            const eurRate = fiatData.rates['EUR'];
            if (eurRate && eurRate > 0) {
              fiatRates[currency.code] = eurRate * 655.957;
            } else {
              fiatRates[currency.code] = 603;
            }
          } else if (fiatData.rates[code]) {
            fiatRates[currency.code] = fiatData.rates[code];
          }
        });
      } else {
        // Fallback fiat rates
        fiatRates = {
          USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CHF: 0.88,
          CAD: 1.36, AUD: 1.54, NZD: 1.68, CNY: 7.24, HKD: 7.82,
          SGD: 1.34, XAF: 600, XOF: 600, ZAR: 18.5, NGN: 1550,
          GHS: 15.5, KES: 153, EGP: 49, MAD: 10, AED: 3.67,
          SAR: 3.75, INR: 83.5, KRW: 1340, THB: 35.5, MYR: 4.7,
          IDR: 15800, PHP: 56.5, VND: 24500, SEK: 10.5, NOK: 10.8,
          DKK: 6.9, PLN: 4.0, CZK: 23.5, HUF: 365, RON: 4.6,
          RUB: 92, UAH: 38, TRY: 32, MXN: 17.2, BRL: 5.0,
          ARS: 900, CLP: 950, COP: 4000, PEN: 3.75
        };
      }

      // Process crypto rates
      let cryptoPricesInUsd: Record<string, number> = {};
      let changes: Record<string, number> = {};
      const cryptoData = cryptoResult.status === 'fulfilled' ? cryptoResult.value : null;
      
      if (cryptoData) {
        const idToCode: Record<string, string> = {
          'bitcoin': 'BTC', 'ethereum': 'ETH', 'tether': 'USDT', 'usd-coin': 'USDC',
          'binancecoin': 'BNB', 'solana': 'SOL', 'ripple': 'XRP', 'cardano': 'ADA',
          'dogecoin': 'DOGE', 'tron': 'TRX', 'matic-network': 'MATIC', 'litecoin': 'LTC',
          'polkadot': 'DOT', 'avalanche-2': 'AVAX', 'chainlink': 'LINK',
          'shiba-inu': 'SHIB', 'the-open-network': 'TON', 'near': 'NEAR',
          'pepe': 'PEPE', 'floki': 'FLOKI', 'arbitrum': 'ARB', 'optimism': 'OP',
          'aptos': 'APT', 'sui': 'SUI', 'injective-protocol': 'INJ', 'fantom': 'FTM',
          'cosmos': 'ATOM', 'uniswap': 'UNI', 'aave': 'AAVE', 'maker': 'MKR',
          'crypto-com-chain': 'CRO', 'algorand': 'ALGO', 'stellar': 'XLM', 'vechain': 'VET',
          'filecoin': 'FIL', 'internet-computer': 'ICP', 'render-token': 'RENDER',
          'the-graph': 'GRT', 'immutable-x': 'IMX', 'dogwifcoin': 'WIF', 'bonk': 'BONK'
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
      } else {
        // Fallback crypto prices
        cryptoPricesInUsd = {
          BTC: 95000, ETH: 3400, USDT: 1, USDC: 1,
          BNB: 690, SOL: 200, XRP: 2.3, ADA: 1.0,
          DOGE: 0.35, TRX: 0.25, MATIC: 0.5, LTC: 100,
          DOT: 7.5, AVAX: 40, LINK: 23, SHIB: 0.000023,
          TON: 5.5, NEAR: 5.2, PEPE: 0.00001, FLOKI: 0.00015,
          ARB: 1.2, OP: 2.5, APT: 9, SUI: 4, INJ: 25,
          FTM: 0.8, ATOM: 10, UNI: 12, AAVE: 350, MKR: 2000,
          CRO: 0.12, ALGO: 0.2, XLM: 0.4, VET: 0.04,
          FIL: 6, ICP: 12, RENDER: 8, GRT: 0.2,
          IMX: 2, WIF: 2.5, BONK: 0.00003
        };
      }

      // Build final rates object
      const allRates: Record<string, number> = { ...fiatRates };
      Object.entries(cryptoPricesInUsd).forEach(([code, usdPrice]) => {
        if (usdPrice && usdPrice > 0) {
          allRates[code] = 1 / usdPrice;
        }
      });

      // Update state and cache
      if (Object.keys(allRates).length > 5 && isMountedRef.current) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          rates: allRates,
          priceChanges: changes,
          timestamp: Date.now(),
        }));

        setRates(allRates);
        setPriceChanges(changes);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      
      // Try to use cached data
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && isMountedRef.current) {
        const { rates: cachedRates, priceChanges: cachedChanges, timestamp } = JSON.parse(cached);
        setRates(cachedRates);
        setPriceChanges(cachedChanges || {});
        setLastUpdated(new Date(timestamp));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRates();
    
    // Auto-refresh rates every 30 seconds (silent refresh)
    const intervalId = setInterval(() => {
      fetchRates(true, true);
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [fetchRates]);

  // Get asset data - memoized
  const getAsset = useCallback((code: string): Asset | undefined => {
    return ALL_ASSETS.find(a => a.code === code);
  }, []);

  // Get asset name based on language
  const getAssetName = useCallback((code: string): string => {
    const asset = getAsset(code);
    if (!asset) return code;
    return language === 'fr' ? asset.nameFr : asset.name;
  }, [getAsset, language]);

  // Convert amount - optimized
  const convertAmount = useCallback((amount: number, fromCode: string, toCode: string): number => {
    if (!amount || isNaN(amount) || fromCode === toCode) return amount || 0;
    
    const fromRate = rates[fromCode];
    const toRate = rates[toCode];
    
    if (fromRate === undefined || toRate === undefined || fromRate === 0) {
      return 0;
    }
    
    return (amount / fromRate) * toRate;
  }, [rates]);

  // Format number with proper decimals
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
    setSearchQuery('');
  }, []);

  // Get the base slot
  const baseSlot = useMemo(() => {
    return slots.find(s => s.id === editingSlotId) || slots[0];
  }, [slots, editingSlotId]);

  // Calculate converted values - memoized
  const getConvertedValue = useCallback((slotId: number): number => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.id === editingSlotId) return parseFloat(baseAmount) || 0;
    
    const amount = parseFloat(baseAmount) || 0;
    return convertAmount(amount, baseSlot.assetCode, slot.assetCode);
  }, [slots, baseAmount, editingSlotId, baseSlot, convertAmount]);

  // Handle slot click
  const handleSlotClick = useCallback((slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;
    
    const currentValue = getConvertedValue(slotId);
    setBaseAmount(currentValue.toString());
    setEditingSlotId(slotId);
  }, [slots, getConvertedValue]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

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
              disabled={isRefreshing}
              className="text-foreground"
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
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
                  "flex items-center justify-between py-5 px-3 cursor-pointer",
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
                    <SelectContent className="max-h-[400px] bg-background border border-border">
                      {/* Search bar */}
                      <div className="p-2 border-b border-border sticky top-0 bg-background z-20">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
                            className="h-8 pl-8 pr-8 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {searchQuery && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearSearch();
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Filter tabs */}
                      <div className="flex gap-1 p-2 border-b border-border sticky top-[52px] bg-background z-10">
                        <Button
                          size="sm"
                          variant={assetFilter === 'all' ? 'default' : 'ghost'}
                          className="h-7 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssetFilter('all');
                          }}
                        >
                          <LayoutGrid className="w-3 h-3 mr-1" />
                          {language === 'fr' ? 'Tout' : 'All'}
                        </Button>
                        <Button
                          size="sm"
                          variant={assetFilter === 'fiat' ? 'default' : 'ghost'}
                          className="h-7 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssetFilter('fiat');
                          }}
                        >
                          <Banknote className="w-3 h-3 mr-1" />
                          Fiat
                        </Button>
                        <Button
                          size="sm"
                          variant={assetFilter === 'crypto' ? 'default' : 'ghost'}
                          className="h-7 text-xs flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssetFilter('crypto');
                          }}
                        >
                          <Coins className="w-3 h-3 mr-1" />
                          Crypto
                        </Button>
                      </div>
                      
                      {/* Asset list */}
                      {filteredAssets.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          {language === 'fr' ? 'Aucun résultat' : 'No results'}
                        </div>
                      ) : (
                        filteredAssets.map((a) => (
                          <SelectItem key={a.code} value={a.code}>
                            <AssetItem asset={a} language={language} />
                          </SelectItem>
                        ))
                      )}
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
                      inputMode="decimal"
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
            {isRefreshing && (
              <span className="ml-2 text-primary">
                {language === 'fr' ? '(actualisation...)' : '(refreshing...)'}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default CurrencyConversion;
