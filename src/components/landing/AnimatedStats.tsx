import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown, Activity, Zap, Target, Award } from 'lucide-react';

const AnimatedStats: React.FC = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [values, setValues] = useState({
    winrate: 0,
    profitFactor: 0,
    trades: 0,
    profit: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2500;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const easeOut = 1 - Math.pow(1 - progress, 4);

      setValues({
        winrate: Math.floor(71 * easeOut),
        profitFactor: parseFloat((1.85 * easeOut).toFixed(2)),
        trades: Math.floor(247 * easeOut),
        profit: Math.floor(12450 * easeOut),
      });

      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible]);

  const stats = [
    {
      icon: Target,
      label: t('animatedStatsWinRate'),
      value: `${values.winrate}%`,
      color: 'text-profit',
      bgColor: 'bg-profit/10',
      trend: '+5.2%',
      trendUp: true,
    },
    {
      icon: Activity,
      label: t('animatedStatsProfitFactor'),
      value: values.profitFactor.toFixed(2),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      trend: '+0.23',
      trendUp: true,
    },
    {
      icon: Zap,
      label: t('animatedStatsTradesMonth'),
      value: values.trades.toString(),
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      trend: '+12',
      trendUp: true,
    },
    {
      icon: Award,
      label: t('animatedStatsTotalProfit'),
      value: `$${values.profit.toLocaleString()}`,
      color: 'text-profit',
      bgColor: 'bg-profit/10',
      trend: '+$2,340',
      trendUp: true,
    },
  ];

  return (
    <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="relative group"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.6s ease-out ${index * 0.1}s`,
            }}
          >
            {/* Glow effect on hover */}
            <div className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg ${stat.bgColor}`} />
            
            <div className="relative p-5 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              
              {/* Value - fixed height to prevent layout shift */}
              <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-1 tabular-nums min-h-[1.5em] min-w-[80px]`}>
                {stat.value}
              </div>
              
              {/* Label */}
              <div className="text-sm text-muted-foreground mb-3">
                {stat.label}
              </div>
              
              {/* Trend */}
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                stat.trendUp ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
              }`}>
                {stat.trendUp ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {stat.trend}
              </div>
              
              {/* Animated line */}
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-border/30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${stat.color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
                  style={{
                    width: isVisible ? '100%' : '0%',
                    transitionDelay: `${index * 0.15 + 0.5}s`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnimatedStats;
