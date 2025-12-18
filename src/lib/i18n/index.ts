import { Language, TranslationDictionary, DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo } from './types';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { zh } from './locales/zh';
import { ar } from './locales/ar';
import { pt } from './locales/pt';
import { de } from './locales/de';
import { ja } from './locales/ja';
import { it } from './locales/it';
import { ru } from './locales/ru';
import { ko } from './locales/ko';
import { tr } from './locales/tr';
import { hi } from './locales/hi';
import { vi } from './locales/vi';

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
  it,
  ru,
  ko,
  tr,
  hi,
  vi,
  // Fallback to English for remaining languages
  bn: en, ur: en, th: en, fa: en, sw: en, nl: en, id: en, ms: en, pl: en, uk: en,
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
