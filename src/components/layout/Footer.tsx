import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_VERSION, APP_NAME } from '@/lib/version';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto py-6 text-center space-y-1">
      <p className="text-muted-foreground text-sm font-medium tracking-wide">
        <span className="text-gradient-primary font-display">{t('slogan')}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {APP_NAME} <span className="text-primary font-semibold">V{APP_VERSION}</span>
      </p>
    </footer>
  );
};

export default Footer;
