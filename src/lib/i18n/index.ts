import { Language, TranslationDictionary, DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo, isValidLanguage } from './types';
import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { ar } from './locales/ar';
import { pt } from './locales/pt';
import { de } from './locales/de';
import { tr } from './locales/tr';
import { it } from './locales/it';

// Translation cache with complete translations for 8 authorized languages
const translationCache: Record<Language, TranslationDictionary> = {
  en,
  fr,
  es,
  ar,
  pt,
  de,
  tr,
  it,
};

// Load translations - only authorized languages
export async function loadTranslations(lang: Language): Promise<TranslationDictionary> {
  // Validate language is authorized
  if (!isValidLanguage(lang)) {
    console.warn(`Unauthorized language: ${lang}, falling back to English`);
    return en;
  }
  
  if (translationCache[lang]) {
    return translationCache[lang];
  }
  
  // Fallback to English for any missing translations
  return en;
}

// Get translation with fallback to English
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
export { DEFAULT_LANGUAGE, getBrowserLanguage, isRTL, LANGUAGES, getLanguageInfo, isValidLanguage };
export type { Language, TranslationDictionary };
