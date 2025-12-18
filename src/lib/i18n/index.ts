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
import { th } from './locales/th';
import { fa } from './locales/fa';
import { sw } from './locales/sw';
import { nl } from './locales/nl';
import { id } from './locales/id';
import { ms } from './locales/ms';
import { pl } from './locales/pl';
import { uk } from './locales/uk';
import { ro } from './locales/ro';
import { bn } from './locales/bn';
import { ur } from './locales/ur';
import { ha } from './locales/ha';
import { yo } from './locales/yo';
import { ig } from './locales/ig';
import { ta } from './locales/ta';
import { te } from './locales/te';

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
  th,
  fa,
  sw,
  nl,
  id,
  ms,
  pl,
  uk,
  ro,
  bn,
  ur,
  ha,
  yo,
  ig,
  ta,
  te,
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
