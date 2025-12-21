import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Language, 
  DEFAULT_LANGUAGE, 
  getBrowserLanguage, 
  isRTL, 
  LANGUAGES, 
  getLanguageInfo,
  loadTranslations,
  getTranslation,
  TranslationDictionary,
  isValidLanguage
} from '@/lib/i18n';
import { en } from '@/lib/i18n/locales/en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    // Validate saved language is authorized
    if (saved && isValidLanguage(saved)) {
      return saved;
    }
    // Try browser language
    const browserLang = getBrowserLanguage();
    if (isValidLanguage(browserLang)) {
      return browserLang;
    }
    // Default to English
    return DEFAULT_LANGUAGE;
  });
  
  const [translations, setTranslations] = useState<TranslationDictionary>(en);

  // Load translations when language changes
  useEffect(() => {
    loadTranslations(language).then(setTranslations);
  }, [language]);

  // Persist language and update document attributes
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL(language) ? 'rtl' : 'ltr';
    
    // Add/remove RTL class for styling
    if (isRTL(language)) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    // Security: Only allow authorized languages
    if (!isValidLanguage(lang)) {
      console.warn(`Attempted to set unauthorized language: ${lang}`);
      return;
    }
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    return getTranslation(key, translations);
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t, 
      isRTL: isRTL(language),
      languages: LANGUAGES 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export type { Language };
