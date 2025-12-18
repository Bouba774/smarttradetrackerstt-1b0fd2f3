// Supported languages
export type Language = 'en' | 'fr' | 'es' | 'pt' | 'ar' | 'zh' | 'hi' | 'ru' | 'de' | 'ja';

// RTL languages
export const RTL_LANGUAGES: Language[] = ['ar'];

// Language metadata with native names
export interface LanguageInfo {
  code: Language;
  name: string;        // English name
  nativeName: string;  // Name in the language itself
  flag?: string;       // Optional flag emoji
  rtl: boolean;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
];

export const DEFAULT_LANGUAGE: Language = 'en';

// Translation dictionary type
export type TranslationDictionary = Record<string, string>;

// Get browser language
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
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}
