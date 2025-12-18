import { Language, TranslationDictionary, DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo } from './types';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';
import * as stubs from './locales/stubs';

// Translation cache
const translationCache: Partial<Record<Language, TranslationDictionary>> = {
  en,
  fr,
  es,
  // Stub translations (fallback to English)
  zh: stubs.zh,
  hi: stubs.hi,
  ar: stubs.ar,
  bn: stubs.bn,
  pt: stubs.pt,
  ru: stubs.ru,
  ur: stubs.ur,
  de: stubs.de,
  ja: stubs.ja,
  ko: stubs.ko,
  tr: stubs.tr,
  it: stubs.it,
  vi: stubs.vi,
  th: stubs.th,
  fa: stubs.fa,
  sw: stubs.sw,
  nl: stubs.nl,
  id: stubs.id,
  ms: stubs.ms,
  pl: stubs.pl,
  uk: stubs.uk,
  ro: stubs.ro,
  ha: stubs.ha,
  yo: stubs.yo,
  ig: stubs.ig,
  ta: stubs.ta,
  te: stubs.te,
};

// Lazy load translations
export async function loadTranslations(lang: Language): Promise<TranslationDictionary> {
  if (translationCache[lang]) {
    return translationCache[lang]!;
  }
  
  // Fallback to English for unloaded languages
  translationCache[lang] = en;
  return en;
}

// Get translation with fallback
export function getTranslation(key: string, translations: TranslationDictionary): string {
  if (translations[key]) {
    return translations[key];
  }
  // Fallback to English
  if (en[key as keyof typeof en]) {
    return en[key as keyof typeof en];
  }
  console.warn(`Translation missing for key: ${key}`);
  return key;
}

// Re-export everything
export { DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo };
export type { Language, TranslationDictionary };
