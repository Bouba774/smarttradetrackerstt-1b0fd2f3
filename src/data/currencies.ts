export interface Currency {
  code: string;
  name: string;
  nameFr: string;
  decimals: number;
  symbol: string;
}

// Complete currency list - 51 currencies sorted alphabetically by code
export const CURRENCIES: Currency[] = [
  { code: 'AED', name: 'UAE Dirham', nameFr: 'Dirham des Émirats arabes unis', decimals: 2, symbol: 'د.إ' },
  { code: 'ARS', name: 'Argentine Peso', nameFr: 'Peso argentin', decimals: 2, symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', nameFr: 'Dollar australien', decimals: 2, symbol: 'A$' },
  { code: 'BDT', name: 'Bangladeshi Taka', nameFr: 'Taka bangladais', decimals: 2, symbol: '৳' },
  { code: 'BGN', name: 'Bulgarian Lev', nameFr: 'Lev bulgare', decimals: 2, symbol: 'лв' },
  { code: 'BRL', name: 'Brazilian Real', nameFr: 'Réal brésilien', decimals: 2, symbol: 'R$' },
  { code: 'CAD', name: 'Canadian Dollar', nameFr: 'Dollar canadien', decimals: 2, symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', nameFr: 'Franc suisse', decimals: 2, symbol: 'CHF' },
  { code: 'CLP', name: 'Chilean Peso', nameFr: 'Peso chilien', decimals: 0, symbol: '$' },
  { code: 'CNY', name: 'Chinese Yuan', nameFr: 'Yuan chinois (Renminbi)', decimals: 2, symbol: '¥' },
  { code: 'COP', name: 'Colombian Peso', nameFr: 'Peso colombien', decimals: 2, symbol: '$' },
  { code: 'CZK', name: 'Czech Koruna', nameFr: 'Couronne tchèque', decimals: 2, symbol: 'Kč' },
  { code: 'DKK', name: 'Danish Krone', nameFr: 'Couronne danoise', decimals: 2, symbol: 'kr' },
  { code: 'EGP', name: 'Egyptian Pound', nameFr: 'Livre égyptienne', decimals: 2, symbol: 'E£' },
  { code: 'EUR', name: 'Euro', nameFr: 'Euro', decimals: 2, symbol: '€' },
  { code: 'GBP', name: 'British Pound Sterling', nameFr: 'Livre sterling', decimals: 2, symbol: '£' },
  { code: 'GHS', name: 'Ghanaian Cedi', nameFr: 'Cedi ghanéen', decimals: 2, symbol: '₵' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameFr: 'Dollar de Hong Kong', decimals: 2, symbol: 'HK$' },
  { code: 'HUF', name: 'Hungarian Forint', nameFr: 'Forint hongrois', decimals: 2, symbol: 'Ft' },
  { code: 'IDR', name: 'Indonesian Rupiah', nameFr: 'Roupie indonésienne', decimals: 0, symbol: 'Rp' },
  { code: 'ILS', name: 'Israeli Shekel', nameFr: 'Shekel israélien', decimals: 2, symbol: '₪' },
  { code: 'INR', name: 'Indian Rupee', nameFr: 'Roupie indienne', decimals: 2, symbol: '₹' },
  { code: 'ISK', name: 'Icelandic Króna', nameFr: 'Couronne islandaise', decimals: 0, symbol: 'kr' },
  { code: 'JPY', name: 'Japanese Yen', nameFr: 'Yen japonais', decimals: 0, symbol: '¥' },
  { code: 'KES', name: 'Kenyan Shilling', nameFr: 'Shilling kényan', decimals: 2, symbol: 'KSh' },
  { code: 'KRW', name: 'South Korean Won', nameFr: 'Won sud-coréen', decimals: 0, symbol: '₩' },
  { code: 'MAD', name: 'Moroccan Dirham', nameFr: 'Dirham marocain', decimals: 2, symbol: 'د.م.' },
  { code: 'MXN', name: 'Mexican Peso', nameFr: 'Peso mexicain', decimals: 2, symbol: '$' },
  { code: 'MYR', name: 'Malaysian Ringgit', nameFr: 'Ringgit malaisien', decimals: 2, symbol: 'RM' },
  { code: 'NGN', name: 'Nigerian Naira', nameFr: 'Naira nigérian', decimals: 2, symbol: '₦' },
  { code: 'NOK', name: 'Norwegian Krone', nameFr: 'Couronne norvégienne', decimals: 2, symbol: 'kr' },
  { code: 'NZD', name: 'New Zealand Dollar', nameFr: 'Dollar néo-zélandais', decimals: 2, symbol: 'NZ$' },
  { code: 'PEN', name: 'Peruvian Sol', nameFr: 'Sol péruvien', decimals: 2, symbol: 'S/' },
  { code: 'PHP', name: 'Philippine Peso', nameFr: 'Peso philippin', decimals: 2, symbol: '₱' },
  { code: 'PLN', name: 'Polish Zloty', nameFr: 'Zloty polonais', decimals: 2, symbol: 'zł' },
  { code: 'QAR', name: 'Qatari Riyal', nameFr: 'Riyal qatari', decimals: 2, symbol: 'ر.ق' },
  { code: 'RON', name: 'Romanian Leu', nameFr: 'Leu roumain', decimals: 2, symbol: 'lei' },
  { code: 'RUB', name: 'Russian Ruble', nameFr: 'Rouble russe', decimals: 2, symbol: '₽' },
  { code: 'SAR', name: 'Saudi Riyal', nameFr: 'Riyal saoudien', decimals: 2, symbol: 'ر.س' },
  { code: 'SEK', name: 'Swedish Krona', nameFr: 'Couronne suédoise', decimals: 2, symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', nameFr: 'Dollar de Singapour', decimals: 2, symbol: 'S$' },
  { code: 'THB', name: 'Thai Baht', nameFr: 'Baht thaïlandais', decimals: 2, symbol: '฿' },
  { code: 'TND', name: 'Tunisian Dinar', nameFr: 'Dinar tunisien', decimals: 3, symbol: 'د.ت' },
  { code: 'TRY', name: 'Turkish Lira', nameFr: 'Livre turque', decimals: 2, symbol: '₺' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', nameFr: 'Hryvnia ukrainienne', decimals: 2, symbol: '₴' },
  { code: 'UGX', name: 'Ugandan Shilling', nameFr: 'Shilling ougandais', decimals: 0, symbol: 'USh' },
  { code: 'USD', name: 'US Dollar', nameFr: 'Dollar américain', decimals: 2, symbol: '$' },
  { code: 'VND', name: 'Vietnamese Dong', nameFr: 'Dong vietnamien', decimals: 0, symbol: '₫' },
  { code: 'XAF', name: 'Franc CFA (Central Africa)', nameFr: 'Franc CFA (Afrique centrale)', decimals: 0, symbol: 'FCFA' },
  { code: 'XOF', name: 'Franc CFA (West Africa)', nameFr: 'Franc CFA (Afrique de l\'Ouest)', decimals: 0, symbol: 'FCFA' },
  { code: 'ZAR', name: 'South African Rand', nameFr: 'Rand sud-africain', decimals: 2, symbol: 'R' },
];

export const getCurrencyLabel = (currency: Currency, language: string): string => {
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
