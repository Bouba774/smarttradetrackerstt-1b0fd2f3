import { useEffect, useState } from 'react';
import { useNavigation, useLocation } from 'react-router-dom';

const NavigationProgress = () => {
  const navigation = useNavigation();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (navigation.state === 'loading') {
      setIsVisible(true);
      setProgress(0);
      
      // Animate progress
      const timer1 = setTimeout(() => setProgress(30), 50);
      const timer2 = setTimeout(() => setProgress(60), 150);
      const timer3 = setTimeout(() => setProgress(80), 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      if (isVisible) {
        setProgress(100);
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
          setProgress(0);
        }, 200);
        return () => clearTimeout(hideTimer);
      }
    }
  }, [navigation.state, isVisible]);

  // Also trigger on location change for lazy-loaded components
  useEffect(() => {
    setIsVisible(true);
    setProgress(30);
    
    const timer1 = setTimeout(() => setProgress(60), 50);
    const timer2 = setTimeout(() => setProgress(100), 100);
    const timer3 = setTimeout(() => setIsVisible(false), 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
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
