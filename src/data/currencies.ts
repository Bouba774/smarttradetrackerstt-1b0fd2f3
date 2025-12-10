export interface Currency {
  code: string;
  name: string;
  nameFr?: string;
}

// Deduplicated and normalized currency list sorted alphabetically by name
export const CURRENCIES: Currency[] = [
  { code: 'DZD', name: 'Algerian Dinar', nameFr: 'Dinar Algérien' },
  { code: 'MGA', name: 'Ariary Malgache', nameFr: 'Ariary Malgache' },
  { code: 'AUD', name: 'Australian Dollar', nameFr: 'Dollar Australien' },
  { code: 'BSD', name: 'Bahamian Dollar', nameFr: 'Dollar Bahaméen' },
  { code: 'BBD', name: 'Barbadian Dollar', nameFr: 'Dollar Barbadien' },
  { code: 'BZD', name: 'Belize Dollar', nameFr: 'Dollar Bélizien' },
  { code: 'BMD', name: 'Bermudian Dollar', nameFr: 'Dollar Bermudien' },
  { code: 'BWP', name: 'Botswanan Pula', nameFr: 'Pula Botswanais' },
  { code: 'BIF', name: 'Burundian Franc', nameFr: 'Franc Burundais' },
  { code: 'CAD', name: 'Canadian Dollar', nameFr: 'Dollar Canadien' },
  { code: 'KYD', name: 'Cayman Islands Dollar', nameFr: 'Dollar des Îles Caïmans' },
  { code: 'KMF', name: 'Comorian Franc', nameFr: 'Franc Comorien' },
  { code: 'CDF', name: 'Congolese Franc', nameFr: 'Franc Congolais' },
  { code: 'DJF', name: 'Djiboutian Franc', nameFr: 'Franc Djiboutien' },
  { code: 'XCD', name: 'East Caribbean Dollar', nameFr: 'Dollar des Caraïbes Orientales' },
  { code: 'EUR', name: 'Euro', nameFr: 'Euro' },
  { code: 'FJD', name: 'Fijian Dollar', nameFr: 'Dollar Fidjien' },
  { code: 'XAF', name: 'Franc CFA BEAC', nameFr: 'Franc CFA BEAC' },
  { code: 'XOF', name: 'Franc CFA BCEAO', nameFr: 'Franc CFA BCEAO' },
  { code: 'XPF', name: 'Franc CFP', nameFr: 'Franc CFP' },
  { code: 'GMD', name: 'Gambian Dalasi', nameFr: 'Dalasi Gambien' },
  { code: 'GHS', name: 'Ghanaian Cedi', nameFr: 'Cédi Ghanéen' },
  { code: 'GYD', name: 'Guyanese Dollar', nameFr: 'Dollar Guyanien' },
  { code: 'HTG', name: 'Haitian Gourde', nameFr: 'Gourde Haïtienne' },
  { code: 'HKD', name: 'Hong Kong Dollar', nameFr: 'Dollar de Hong Kong' },
  { code: 'JMD', name: 'Jamaican Dollar', nameFr: 'Dollar Jamaïcain' },
  { code: 'KES', name: 'Kenyan Shilling', nameFr: 'Shilling Kényan' },
  { code: 'KID', name: 'Kiribati Dollar', nameFr: 'Dollar de Kiribati' },
  { code: 'LBP', name: 'Lebanese Pound', nameFr: 'Livre Libanaise' },
  { code: 'LRD', name: 'Liberian Dollar', nameFr: 'Dollar Libérien' },
  { code: 'MWK', name: 'Malawian Kwacha', nameFr: 'Kwacha Malawien' },
  { code: 'MAD', name: 'Moroccan Dirham', nameFr: 'Dirham Marocain' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', nameFr: 'Ouguiya Mauritanien' },
  { code: 'NAD', name: 'Namibian Dollar', nameFr: 'Dollar Namibien' },
  { code: 'NZD', name: 'New Zealand Dollar', nameFr: 'Dollar Néo-Zélandais' },
  { code: 'NGN', name: 'Nigerian Naira', nameFr: 'Naira Nigérian' },
  { code: 'PGK', name: 'Papua New Guinea Kina', nameFr: 'Kina de Papouasie-Nouvelle-Guinée' },
  { code: 'GBP', name: 'Pound Sterling', nameFr: 'Livre Sterling' },
  { code: 'RWF', name: 'Rwandan Franc', nameFr: 'Franc Rwandais' },
  { code: 'WST', name: 'Samoan Tala', nameFr: 'Tala Samoan' },
  { code: 'SCR', name: 'Seychellois Rupee', nameFr: 'Roupie Seychelloise' },
  { code: 'SLE', name: 'Sierra Leonean Leone', nameFr: 'Leone Sierra-Léonais' },
  { code: 'SGD', name: 'Singapore Dollar', nameFr: 'Dollar de Singapour' },
  { code: 'SBD', name: 'Solomon Islands Dollar', nameFr: 'Dollar des Îles Salomon' },
  { code: 'ZAR', name: 'South African Rand', nameFr: 'Rand Sud-Africain' },
  { code: 'CHF', name: 'Swiss Franc', nameFr: 'Franc Suisse' },
  { code: 'TZS', name: 'Tanzanian Shilling', nameFr: 'Shilling Tanzanien' },
  { code: 'TOP', name: 'Tongan Paʻanga', nameFr: 'Paʻanga Tongien' },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', nameFr: 'Dollar de Trinité-et-Tobago' },
  { code: 'TND', name: 'Tunisian Dinar', nameFr: 'Dinar Tunisien' },
  { code: 'TVD', name: 'Tuvaluan Dollar', nameFr: 'Dollar Tuvaluan' },
  { code: 'UGX', name: 'Ugandan Shilling', nameFr: 'Shilling Ougandais' },
  { code: 'USD', name: 'US Dollar', nameFr: 'Dollar Américain' },
  { code: 'VUV', name: 'Vanuatu Vatu', nameFr: 'Vatu du Vanuatu' },
  { code: 'ZMW', name: 'Zambian Kwacha', nameFr: 'Kwacha Zambien' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', nameFr: 'Dollar Zimbabwéen' },
].sort((a, b) => a.name.localeCompare(b.name));

export const getCurrencyLabel = (currency: Currency, language: 'fr' | 'en'): string => {
  const name = language === 'fr' && currency.nameFr ? currency.nameFr : currency.name;
  return `${name} (${currency.code})`;
};

export const findCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};
