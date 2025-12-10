export interface Currency {
  code: string;
  name: string;
  nameFr: string;
  decimals: number;
  symbol: string;
}

// Restricted currency list - exactly 6 currencies in specified order
export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', nameFr: 'Dollar Américain', decimals: 2, symbol: '$' },
  { code: 'EUR', name: 'Euro', nameFr: 'Euro', decimals: 2, symbol: '€' },
  { code: 'GBP', name: 'British Pound Sterling', nameFr: 'Livre Sterling', decimals: 2, symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', nameFr: 'Yen Japonais', decimals: 0, symbol: '¥' },
  { code: 'XAF', name: 'Franc CFA BEAC', nameFr: 'Franc CFA BEAC', decimals: 0, symbol: 'FCFA' },
  { code: 'XOF', name: 'Franc CFA BCEAO', nameFr: 'Franc CFA BCEAO', decimals: 0, symbol: 'FCFA' },
];

export const getCurrencyLabel = (currency: Currency, language: 'fr' | 'en'): string => {
  const name = language === 'fr' ? currency.nameFr : currency.name;
  return `${name} (${currency.code})`;
};

export const findCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};

export const getCurrencyDecimals = (code: string): number => {
  const currency = findCurrencyByCode(code);
  return currency?.decimals ?? 2;
};

export const getCurrencySymbol = (code: string): string => {
  const currency = findCurrencyByCode(code);
  return currency?.symbol ?? code;
};

// Base currency for all stored values (trades are stored in USD)
export const BASE_CURRENCY = 'USD';
