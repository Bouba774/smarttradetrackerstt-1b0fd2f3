import { Language, TranslationDictionary, DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo } from './types';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { ar } from './locales/ar';
import { pt } from './locales/pt';
import { de } from './locales/de';
import { ja } from './locales/ja';

// Translation cache with complete translations
const translationCache: Partial<Record<Language, TranslationDictionary>> = {
  en,
  fr,
  es,
  zh,
  ar,
  pt,
  de,
  ja,
  // Fallback to English for remaining languages
  hi: en, bn: en, ru: en, ur: en, ko: en, tr: en, it: en, vi: en,
  th: en, fa: en, sw: en, nl: en, id: en, ms: en, pl: en, uk: en,
  ro: en, ha: en, yo: en, ig: en, ta: en, te: en,
};

// Lazy load translations
export async function loadTranslations(lang: Language): Promise<TranslationDictionary> {
  if (translationCache[lang]) {
    return translationCache[lang]!;
  }
  translationCache[lang] = en;
  return en;
}

// Get translation with fallback
export function getTranslation(key: string, translations: TranslationDictionary): string {
  if (translations[key]) {
    return translations[key];
  }
  if (en[key as keyof typeof en]) {
    return en[key as keyof typeof en];
  }
  return key;
}

// Re-export everything
export { DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo };
export type { Language, TranslationDictionary };
