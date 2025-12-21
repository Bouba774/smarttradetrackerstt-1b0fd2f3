/**
 * Translation key verification utility
 * This module helps identify missing translation keys across all supported languages
 */

import { en } from './locales/en';
import { fr } from './locales/fr';
import { es } from './locales/es';
import { pt } from './locales/pt';
import { ar } from './locales/ar';
import { de } from './locales/de';
import { tr } from './locales/tr';
import { it } from './locales/it';

export type Language = 'en' | 'fr' | 'es' | 'pt' | 'ar' | 'de' | 'tr' | 'it';

const locales: Record<Language, Record<string, string>> = {
  en,
  fr,
  es,
  pt,
  ar,
  de,
  tr,
  it,
};

export interface TranslationTestResult {
  language: Language;
  missingKeys: string[];
  extraKeys: string[];
  totalKeys: number;
  missingCount: number;
}

/**
 * Get all translation keys from the English locale (reference)
 */
export const getReferenceKeys = (): string[] => {
  return Object.keys(en);
};

/**
 * Check a specific language for missing or extra keys
 */
export const checkLanguage = (language: Language): TranslationTestResult => {
  const referenceKeys = new Set(getReferenceKeys());
  const languageKeys = new Set(Object.keys(locales[language]));
  
  const missingKeys: string[] = [];
  const extraKeys: string[] = [];
  
  // Find missing keys
  referenceKeys.forEach(key => {
    if (!languageKeys.has(key)) {
      missingKeys.push(key);
    }
  });
  
  // Find extra keys (not in reference)
  languageKeys.forEach(key => {
    if (!referenceKeys.has(key)) {
      extraKeys.push(key);
    }
  });
  
  return {
    language,
    missingKeys,
    extraKeys,
    totalKeys: referenceKeys.size,
    missingCount: missingKeys.length,
  };
};

/**
 * Check all languages for translation completeness
 */
export const checkAllLanguages = (): TranslationTestResult[] => {
  const languages: Language[] = ['en', 'fr', 'es', 'pt', 'ar', 'de', 'tr', 'it'];
  return languages.map(checkLanguage);
};

/**
 * Get a summary of translation status
 */
export const getTranslationSummary = (): {
  totalReferenceKeys: number;
  languages: { language: Language; completeness: number; missingCount: number }[];
} => {
  const results = checkAllLanguages();
  const totalKeys = getReferenceKeys().length;
  
  return {
    totalReferenceKeys: totalKeys,
    languages: results.map(r => ({
      language: r.language,
      completeness: Math.round(((totalKeys - r.missingCount) / totalKeys) * 100),
      missingCount: r.missingCount,
    })),
  };
};

/**
 * Console log the translation test results (for development)
 */
export const logTranslationTest = (): void => {
  console.group('🌍 Translation Test Results');
  
  const summary = getTranslationSummary();
  console.log(`Total reference keys (English): ${summary.totalReferenceKeys}`);
  console.log('');
  
  const results = checkAllLanguages();
  
  results.forEach(result => {
    const completeness = Math.round(((result.totalKeys - result.missingCount) / result.totalKeys) * 100);
    const emoji = completeness === 100 ? '✅' : completeness >= 90 ? '🟡' : '🔴';
    
    console.group(`${emoji} ${result.language.toUpperCase()} - ${completeness}% complete`);
    
    if (result.missingKeys.length > 0) {
      console.log(`Missing keys (${result.missingKeys.length}):`);
      result.missingKeys.forEach(key => console.log(`  - ${key}`));
    }
    
    if (result.extraKeys.length > 0) {
      console.log(`Extra keys (${result.extraKeys.length}):`);
      result.extraKeys.forEach(key => console.log(`  + ${key}`));
    }
    
    if (result.missingKeys.length === 0 && result.extraKeys.length === 0) {
      console.log('All keys present!');
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
};

/**
 * Generate missing keys template for a language
 * This outputs the English values that need to be translated
 */
export const generateMissingKeysTemplate = (language: Language): Record<string, string> => {
  const result = checkLanguage(language);
  const template: Record<string, string> = {};
  
  result.missingKeys.forEach(key => {
    template[key] = en[key as keyof typeof en];
  });
  
  return template;
};
