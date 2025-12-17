import React, { useEffect, useRef } from 'react';

const AdBanner: React.FC = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current || !adContainerRef.current) return;

    // Set atOptions on window
    (window as any).atOptions = {
      key: '30c3c69641f149547c5d49035fb07542',
      format: 'iframe',
      height: 50,
      width: 320,
      params: {}
    };

    // Create and append the script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highperformanceformat.com/30c3c69641f149547c5d49035fb07542/invoke.js';
    script.async = true;
    
    adContainerRef.current.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      // Cleanup on unmount - remove all child nodes safely
      if (adContainerRef.current) {
        while (adContainerRef.current.firstChild) {
          adContainerRef.current.removeChild(adContainerRef.current.firstChild);
        }
      }
      scriptLoaded.current = false;
    };
  }, []);

  return (
    <div 
      ref={adContainerRef}
      className="flex justify-center items-center w-full py-2 bg-background/50 backdrop-blur-sm border-t border-border/50"
      style={{ minHeight: '54px' }}
    />
  );
};

export default AdBanner;
