import React, { useEffect, useRef, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const renderAttempted = useRef(false);

  useEffect(() => {
    // Reset state when siteKey changes
    setIsLoading(true);
    setHasError(false);
    renderAttempted.current = false;

    if (!siteKey || siteKey.trim() === '') {
      console.warn('Turnstile: No site key provided');
      setIsLoading(false);
      setHasError(true);
      return;
    }

    const loadScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if turnstile already exists
        if (window.turnstile) {
          resolve();
          return;
        }

        // Check if script already exists
        const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]') as HTMLScriptElement;
        if (existingScript) {
          const checkTurnstile = setInterval(() => {
            if (window.turnstile) {
              clearInterval(checkTurnstile);
              resolve();
            }
          }, 100);
          
          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkTurnstile);
            if (!window.turnstile) {
              reject(new Error('Turnstile failed to initialize'));
            }
          }, 5000);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        
        script.onload = () => {
          // Wait for turnstile to be available
          const checkTurnstile = setInterval(() => {
            if (window.turnstile) {
              clearInterval(checkTurnstile);
              resolve();
            }
          }, 50);
          
          setTimeout(() => {
            clearInterval(checkTurnstile);
            if (!window.turnstile) {
              reject(new Error('Turnstile object not found after script load'));
            }
          }, 3000);
        };
        
        script.onerror = () => reject(new Error('Failed to load Turnstile script'));
        
        document.head.appendChild(script);
      });
    };

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || renderAttempted.current) {
        return;
      }

      // Clear container first - remove all child nodes safely
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }

      renderAttempted.current = true;
      
      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setIsLoading(false);
            onVerify(token);
          },
          'expired-callback': () => {
            onExpire?.();
          },
          'error-callback': () => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
          },
          theme,
          language,
        });
        setIsLoading(false);
      } catch (e) {
        console.error('Turnstile render error:', e);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // Load script and render
    loadScript()
      .then(() => {
        renderWidget();
      })
      .catch((err) => {
        console.error('Turnstile script error:', err);
        setHasError(true);
        setIsLoading(false);
      });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be removed
        }
      }
      widgetIdRef.current = null;
      renderAttempted.current = false;
    };
  }, [siteKey, theme, language]);

  if (hasError) {
    return (
      <div className="flex justify-center my-4 text-muted-foreground text-sm">
        <span>Captcha non disponible</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-4">
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span>Chargement du captcha...</span>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="flex justify-center"
      />
    </div>
  );
};

export default TurnstileWidget;
