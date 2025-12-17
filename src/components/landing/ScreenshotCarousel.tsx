import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Screenshot {
  src: string;
  altFr: string;
  altEn: string;
  titleFr: string;
  titleEn: string;
}

interface ScreenshotCarouselProps {
  screenshots: Screenshot[];
  language: 'fr' | 'en';
}

const ScreenshotCarousel: React.FC<ScreenshotCarouselProps> = ({ screenshots, language }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const progress = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
    setScrollProgress(progress * 100);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    onScroll();
    emblaApi.on('select', onSelect);
    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('scroll', onScroll);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect, onScroll]);

  // Auto-scroll with pause on interaction
  useEffect(() => {
    if (!emblaApi) return;
    let interval: NodeJS.Timeout;
    
    const startAutoPlay = () => {
      interval = setInterval(() => {
        emblaApi.scrollNext();
      }, 4000);
    };

    const stopAutoPlay = () => {
      clearInterval(interval);
    };

    emblaApi.on('pointerDown', stopAutoPlay);
    emblaApi.on('pointerUp', () => {
      stopAutoPlay();
      setTimeout(startAutoPlay, 2000);
    });
    
    startAutoPlay();
    
    return () => {
      stopAutoPlay();
      emblaApi.off('pointerDown', stopAutoPlay);
    };
  }, [emblaApi]);

  return (
    <div className="relative w-full group">
      {/* Glowing background effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-profit/20 to-primary/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
      
      {/* Progress bar */}
      <div className="absolute -top-2 left-0 right-0 h-0.5 bg-border/30 rounded-full overflow-hidden z-20">
        <div 
          className="h-full bg-gradient-to-r from-primary via-profit to-primary transition-all duration-100 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Carousel container */}
      <div className="overflow-hidden rounded-2xl relative" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {screenshots.map((screenshot, index) => {
            const isActive = index === selectedIndex;
            return (
              <div 
                key={index} 
                className="flex-[0_0_85%] min-w-0 pl-3 first:pl-0 transition-all duration-500"
                style={{
                  transform: isActive ? 'scale(1)' : 'scale(0.92)',
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                <div className={`relative rounded-xl overflow-hidden border shadow-xl transition-all duration-500 ${
                  isActive ? 'border-primary/50 shadow-primary/20' : 'border-border/50'
                }`}>
                  {/* Animated border glow for active */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-profit/20 to-primary/20 rounded-xl" />
                    </div>
                  )}
                  
                  <img
                    src={screenshot.src}
                    alt={language === 'fr' ? screenshot.altFr : screenshot.altEn}
                    className="w-full h-72 sm:h-80 object-cover object-top relative z-10"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                  />
                  
                  {/* Title overlay with glassmorphism */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4 z-20">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-profit animate-pulse' : 'bg-muted-foreground/50'
                      }`} />
                      <p className="text-sm font-medium text-foreground">
                        {language === 'fr' ? screenshot.titleFr : screenshot.titleEn}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons with hover effects */}
      <button
        onClick={scrollPrev}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 z-10 shadow-lg hover:shadow-primary/30 hover:scale-110"
        aria-label={language === 'fr' ? 'Précédent' : 'Previous'}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 z-10 shadow-lg hover:shadow-primary/30 hover:scale-110"
        aria-label={language === 'fr' ? 'Suivant' : 'Next'}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots indicator with animations */}
      <div className="flex justify-center gap-2 mt-6">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              index === selectedIndex 
                ? 'bg-gradient-to-r from-primary to-profit w-8 shadow-lg shadow-primary/30' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2 hover:w-3'
            }`}
            aria-label={`${language === 'fr' ? 'Aller à l\'image' : 'Go to image'} ${index + 1}`}
          />
        ))}
      </div>

      {/* Counter indicator */}
      <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50">
        <span className="text-xs font-mono text-primary">{selectedIndex + 1}</span>
        <span className="text-xs text-muted-foreground"> / {screenshots.length}</span>
      </div>
    </div>
  );
};

export default ScreenshotCarousel;
