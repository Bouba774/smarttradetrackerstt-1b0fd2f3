import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'blur';
  delay?: number;
  duration?: number;
  threshold?: number;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.1,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold]);

  const getAnimationStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      transitionDuration: `${duration}ms`,
      transitionDelay: `${delay}ms`,
      transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: isVisible ? 'auto' : 'opacity, transform',
    };

    if (!isVisible) {
      switch (animation) {
        case 'fade-up':
          return { ...baseStyles, opacity: 0, transform: 'translateY(30px)' };
        case 'fade-down':
          return { ...baseStyles, opacity: 0, transform: 'translateY(-30px)' };
        case 'fade-left':
          return { ...baseStyles, opacity: 0, transform: 'translateX(30px)' };
        case 'fade-right':
          return { ...baseStyles, opacity: 0, transform: 'translateX(-30px)' };
        case 'scale':
          return { ...baseStyles, opacity: 0, transform: 'scale(0.95)' };
        case 'blur':
          return { ...baseStyles, opacity: 0, filter: 'blur(8px)' };
        default:
          return { ...baseStyles, opacity: 0 };
      }
    }

    return {
      ...baseStyles,
      opacity: 1,
      transform: 'none',
      filter: 'none',
    };
  };

  return (
    <div
      ref={ref}
      className={cn('transition-all', className)}
      style={getAnimationStyles()}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
