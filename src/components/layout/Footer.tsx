import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto py-6 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-wide">
        <span className="text-gradient-primary font-display">{t('slogan')}</span>
      </p>
    </footer>
  );
};

export default Footer;
