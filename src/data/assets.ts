// Complete list of all tradable assets with categories

export const ASSET_CATEGORIES = {
  'Forex Majors': [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'
  ],
  'Forex Crosses': [
    'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD',
    'GBP/CHF', 'GBP/AUD', 'GBP/CAD', 'GBP/NZD', 'AUD/JPY', 'AUD/CAD', 'AUD/CHF',
    'AUD/NZD', 'CAD/JPY', 'CAD/CHF', 'CHF/JPY', 'NZD/JPY', 'NZD/CAD', 'NZD/CHF'
  ],
  'Forex Exotics': [
    'USD/TRY', 'USD/MXN', 'USD/ZAR', 'USD/SGD', 'USD/HKD', 'USD/NOK', 'USD/SEK',
    'USD/DKK', 'USD/PLN', 'USD/HUF', 'USD/CZK', 'EUR/TRY', 'EUR/NOK', 'EUR/SEK',
    'EUR/PLN', 'EUR/HUF', 'GBP/TRY', 'GBP/NOK', 'GBP/SEK', 'GBP/ZAR'
  ],
  'Crypto': [
    'BTC/USD', 'ETH/USD', 'BNB/USD', 'XRP/USD', 'SOL/USD', 'ADA/USD', 'DOGE/USD',
    'DOT/USD', 'AVAX/USD', 'MATIC/USD', 'LINK/USD', 'UNI/USD', 'LTC/USD', 'BCH/USD',
    'ATOM/USD', 'XLM/USD', 'ALGO/USD', 'VET/USD', 'NEAR/USD', 'FTM/USD', 'SAND/USD',
    'MANA/USD', 'AXS/USD', 'CRO/USD', 'APE/USD', 'SHIB/USD', 'TRX/USD', 'ETC/USD'
  ],
  'Indices US': [
    'US30', 'US100', 'US500', 'US2000', 'VIX'
  ],
  'Indices Europe': [
    'GER40', 'UK100', 'FRA40', 'SPA35', 'ITA40', 'EU50', 'SUI20', 'NED25'
  ],
  'Indices Asie': [
    'JPN225', 'HK50', 'AUS200', 'CHINA50', 'SGP20', 'INDIA50'
  ],
  'Métaux': [
    'XAU/USD', 'XAG/USD', 'XPT/USD', 'XPD/USD', 'COPPER'
  ],
  'Énergies': [
    'USOIL', 'UKOIL', 'NATGAS'
  ],
  'Actions US Tech': [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'NFLX',
    'PYPL', 'ADBE', 'CRM', 'CSCO', 'ORCL', 'IBM', 'QCOM', 'UBER', 'ABNB', 'COIN'
  ],
  'Actions US Finance': [
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'AXP', 'V', 'MA', 'BLK'
  ],
  'Actions US Autres': [
    'JNJ', 'PFE', 'UNH', 'XOM', 'CVX', 'WMT', 'HD', 'DIS', 'KO', 'PEP',
    'MCD', 'NKE', 'SBUX', 'BA', 'CAT', 'MMM', 'GE', 'F', 'GM', 'T'
  ]
};

// Flatten all assets for search
export const ALL_ASSETS = Object.values(ASSET_CATEGORIES).flat();

// Pip values for different assets (per standard lot)
export const PIP_VALUES: { [key: string]: number } = {
  // Forex Major & Cross (standard lot = 100,000 units)
  'EUR/USD': 10, 'GBP/USD': 10, 'AUD/USD': 10, 'NZD/USD': 10, 'USD/CAD': 10,
  'USD/CHF': 10, 'EUR/GBP': 10, 'EUR/CHF': 10, 'EUR/AUD': 10, 'EUR/CAD': 10,
  'EUR/NZD': 10, 'GBP/CHF': 10, 'GBP/AUD': 10, 'GBP/CAD': 10, 'GBP/NZD': 10,
  'AUD/CAD': 10, 'AUD/CHF': 10, 'AUD/NZD': 10, 'CAD/CHF': 10, 'NZD/CAD': 10, 
  'NZD/CHF': 10,
  // JPY pairs (pip = 0.01)
  'USD/JPY': 1000, 'EUR/JPY': 1000, 'GBP/JPY': 1000, 'AUD/JPY': 1000,
  'CAD/JPY': 1000, 'CHF/JPY': 1000, 'NZD/JPY': 1000,
  // Gold (1 lot = 100 oz, pip = 0.01)
  'XAU/USD': 1,
  // Silver (1 lot = 5000 oz)
  'XAG/USD': 50,
  // Platinum
  'XPT/USD': 10,
  // Indices (point value varies by broker)
  'US30': 1, 'US100': 1, 'US500': 10, 'GER40': 1, 'UK100': 1, 'JPN225': 100,
  'FRA40': 1, 'AUS200': 1, 'HK50': 1, 'EU50': 1,
  // Crypto (1 lot = 1 coin typically)
  'BTC/USD': 1, 'ETH/USD': 1, 'SOL/USD': 1, 'XRP/USD': 100, 'BNB/USD': 1,
  'ADA/USD': 1000, 'DOGE/USD': 10000, 'DOT/USD': 100, 'AVAX/USD': 10,
  'MATIC/USD': 1000, 'LINK/USD': 100, 'LTC/USD': 1, 'BCH/USD': 1,
  // Energies
  'USOIL': 10, 'UKOIL': 10, 'NATGAS': 10,
  // Stocks (1 lot = 1 share typically)
  'AAPL': 1, 'MSFT': 1, 'GOOGL': 1, 'AMZN': 1, 'META': 1, 'NVDA': 1, 'TSLA': 1,
};

// Decimal places for price display
export const DECIMALS: { [key: string]: number } = {
  // 5 decimal forex
  'EUR/USD': 5, 'GBP/USD': 5, 'AUD/USD': 5, 'NZD/USD': 5, 'USD/CAD': 5,
  'USD/CHF': 5, 'EUR/GBP': 5, 'EUR/CHF': 5, 'EUR/AUD': 5, 'EUR/CAD': 5,
  'GBP/CHF': 5, 'GBP/AUD': 5, 'AUD/CAD': 5, 'AUD/CHF': 5, 'NZD/CHF': 5,
  // 3 decimal JPY pairs
  'USD/JPY': 3, 'EUR/JPY': 3, 'GBP/JPY': 3, 'AUD/JPY': 3, 'CAD/JPY': 3,
  'CHF/JPY': 3, 'NZD/JPY': 3,
  // Metals
  'XAU/USD': 2, 'XAG/USD': 3, 'XPT/USD': 2,
  // Indices
  'US30': 0, 'US100': 0, 'US500': 1, 'GER40': 0, 'UK100': 0, 'JPN225': 0,
  // Crypto
  'BTC/USD': 1, 'ETH/USD': 2, 'SOL/USD': 2, 'XRP/USD': 4, 'BNB/USD': 2,
  'ADA/USD': 4, 'DOGE/USD': 5, 'DOT/USD': 3, 'LTC/USD': 2,
  // Energies
  'USOIL': 2, 'UKOIL': 2, 'NATGAS': 3,
  // Stocks
  'AAPL': 2, 'MSFT': 2, 'GOOGL': 2, 'AMZN': 2, 'TSLA': 2, 'NVDA': 2,
};

// Contract sizes for different asset types
export const CONTRACT_SIZES: { [key: string]: { size: number; unit: string } } = {
  // Forex
  'EUR/USD': { size: 100000, unit: 'units' },
  'GBP/USD': { size: 100000, unit: 'units' },
  // Gold
  'XAU/USD': { size: 100, unit: 'ounces' },
  // Silver
  'XAG/USD': { size: 5000, unit: 'ounces' },
  // Indices (varies)
  'US30': { size: 1, unit: 'contract' },
  'US100': { size: 1, unit: 'contract' },
  // Crypto
  'BTC/USD': { size: 1, unit: 'BTC' },
  'ETH/USD': { size: 1, unit: 'ETH' },
  // Oil
  'USOIL': { size: 1000, unit: 'barrels' },
};

// Get asset category
export const getAssetCategory = (asset: string): string => {
  for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
    if (assets.includes(asset)) return category;
  }
  return 'Other';
};

// Get pip size for an asset
export const getPipSize = (asset: string): number => {
  if (asset.includes('JPY')) return 0.01;
  if (asset === 'XAU/USD') return 0.01;
  if (asset === 'XAG/USD') return 0.001;
  if (asset.startsWith('US') || asset.startsWith('GER') || asset.startsWith('UK')) return 1;
  return 0.0001;
};
