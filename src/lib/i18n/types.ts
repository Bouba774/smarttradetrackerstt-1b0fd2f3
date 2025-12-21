// Supported languages - 8 languages only
export type Language = 'en' | 'fr' | 'es' | 'pt' | 'ar' | 'de' | 'tr' | 'it';

// RTL languages
export const RTL_LANGUAGES: Language[] = ['ar'];

// Language metadata with native names
export interface LanguageInfo {
  code: Language;
  name: string;        // English name
  nativeName: string;  // Name in the language itself
  flag: string;        // Flag emoji
  rtl: boolean;
}

// Languages sorted alphabetically by nativeName
export const LANGUAGES: LanguageInfo[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪', rtl: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
];

export const DEFAULT_LANGUAGE: Language = 'en';

// Translation dictionary type
export type TranslationDictionary = Record<string, string>;

// Get browser language - only returns authorized languages
export function getBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  const supported = LANGUAGES.find(l => l.code === browserLang);
  return supported ? supported.code : DEFAULT_LANGUAGE;
}

// Check if language is RTL
export function isRTL(language: Language): boolean {
  return RTL_LANGUAGES.includes(language);
}

// Get language info
export function getLanguageInfo(code: Language): LanguageInfo {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES.find(l => l.code === 'en')!;
}

// Validate if a language code is authorized
export function isValidLanguage(code: string): code is Language {
  return LANGUAGES.some(l => l.code === code);
}
