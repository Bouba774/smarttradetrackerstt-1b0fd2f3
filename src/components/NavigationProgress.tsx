import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationProgress = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Only trigger animation if path actually changed
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      
      setIsVisible(true);
      setProgress(30);
      
      const timer1 = setTimeout(() => setProgress(60), 50);
      const timer2 = setTimeout(() => setProgress(100), 100);
      const timer3 = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent">
      <div 
        className="h-full bg-gradient-to-r from-primary via-primary to-profit transition-all duration-200 ease-out"
        style={{ 
          width: `${progress}%`,
          boxShadow: '0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary))'
        }}
      />
    </div>
  );
};

export default NavigationProgress;
