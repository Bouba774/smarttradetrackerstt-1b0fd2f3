import React, { useEffect, useRef } from 'react';

interface ReCaptchaWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  language?: string;
}

declare global {
  interface Window {
    grecaptcha: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: string;
        hl?: string;
      }) => number;
      reset: (widgetId: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const ReCaptchaWidget: React.FC<ReCaptchaWidgetProps> = ({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  language = 'en'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const loadScript = () => {
      if (document.querySelector('script[src*="recaptcha"]')) {
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit&hl=${language}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const renderWidget = () => {
      if (containerRef.current && window.grecaptcha && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            'expired-callback': onExpire,
            'error-callback': onError,
            theme,
          });
        } catch (e) {
          // Widget may already be rendered
          console.warn('reCAPTCHA already rendered');
        }
      }
    };

    window.onRecaptchaLoad = renderWidget;

    if (window.grecaptcha) {
      renderWidget();
    } else {
      loadScript();
    }

    return () => {
      // Cleanup is handled by the widget itself
      widgetIdRef.current = null;
    };
  }, [siteKey, onVerify, onExpire, onError, theme, language]);

  return (
    <div 
      ref={containerRef} 
      className="flex justify-center my-4"
    />
  );
};

export default ReCaptchaWidget;
