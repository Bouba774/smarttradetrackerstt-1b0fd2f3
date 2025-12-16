import React, { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: string;
        language?: string;
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  language = 'auto'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadScript = () => {
      if (document.querySelector('script[src*="turnstile"]')) {
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    const renderWidget = () => {
      if (containerRef.current && window.turnstile && widgetIdRef.current === null) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            'expired-callback': onExpire,
            'error-callback': onError,
            theme,
            language,
          });
        } catch (e) {
          console.warn('Turnstile already rendered');
        }
      }
    };

    window.onTurnstileLoad = renderWidget;

    if (window.turnstile) {
      renderWidget();
    } else {
      loadScript();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Widget may already be removed
        }
      }
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

export default TurnstileWidget;
