import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const previousPathRef = useRef(location.pathname);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Only trigger transition if path actually changed
    if (previousPathRef.current !== location.pathname) {
      previousPathRef.current = location.pathname;
      
      // Quick fade out then immediate fade in
      setIsVisible(false);
      
      // Use requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        if (isMountedRef.current) {
          // Small delay then fade back in
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsVisible(true);
            }
          }, 50);
        }
      });
    }
  }, [location.pathname]);

  return (
    <div
      className="page-transition-container"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
        width: '100%',
        minHeight: '100%',
      }}
    >
      {children}
    </div>
  );
};

export default PageTransition;
