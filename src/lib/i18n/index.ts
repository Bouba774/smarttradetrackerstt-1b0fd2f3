import { Language, TranslationDictionary, DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo } from './types';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';

// Translation cache
const translationCache: Partial<Record<Language, TranslationDictionary>> = {
  en,
  fr,
  es,
};

// Lazy load translations
export async function loadTranslations(lang: Language): Promise<TranslationDictionary> {
  if (translationCache[lang]) {
    return translationCache[lang]!;
  }
  
  // For now, fallback to English for unloaded languages
  // These can be lazy loaded when translation files are added
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
export { Language, DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo };
export type { TranslationDictionary };
