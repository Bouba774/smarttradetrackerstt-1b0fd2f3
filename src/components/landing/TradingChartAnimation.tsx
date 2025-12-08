import React, { useEffect, useState } from 'react';

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  bullish: boolean;
}

const TradingChartAnimation: React.FC = () => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [linePoints, setLinePoints] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial candles
    const initialCandles: Candle[] = [];
    let basePrice = 50;

    for (let i = 0; i < 12; i++) {
      const change = (Math.random() - 0.5) * 15;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;
      
      initialCandles.push({
        open,
        close,
        high,
        low,
        bullish: close > open,
      });
      
      basePrice = close;
    }

    setCandles(initialCandles);

    // Generate line chart points
    const points = [];
    let value = 40;
    for (let i = 0; i < 20; i++) {
      value += (Math.random() - 0.4) * 8;
      value = Math.max(10, Math.min(90, value));
      points.push(value);
    }
    setLinePoints(points);

    // Animate candles
    const interval = setInterval(() => {
      setCandles(prev => {
        const newCandles = [...prev];
        const lastCandle = newCandles[newCandles.length - 1];
        const change = (Math.random() - 0.5) * 15;
        const open = lastCandle.close;
        const close = open + change;
        
        newCandles.shift();
        newCandles.push({
          open,
          close,
          high: Math.max(open, close) + Math.random() * 5,
          low: Math.min(open, close) - Math.random() * 5,
          bullish: close > open,
        });
        
        return newCandles;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const minPrice = Math.min(...candles.flatMap(c => [c.low, c.high])) - 5;
  const maxPrice = Math.max(...candles.flatMap(c => [c.low, c.high])) + 5;
  const priceRange = maxPrice - minPrice || 1;

  const getY = (price: number) => {
    return 100 - ((price - minPrice) / priceRange) * 100;
  };

  return (
    <div className="relative w-full h-full">
      {/* Candlesticks */}
      <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bullGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00FF75" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00FF75" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="bearGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF4A4A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF4A4A" stopOpacity="0.2" />
          </linearGradient>
          <filter id="candleGlow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[20, 40, 60, 80].map((y, i) => (
          <line
            key={i}
            x1="0"
            y1={y}
            x2="200"
            y2={y}
            stroke="rgba(0, 229, 255, 0.1)"
            strokeDasharray="2,4"
          />
        ))}

        {/* Candlesticks */}
        {candles.map((candle, i) => {
          const x = 10 + i * 15;
          const bodyTop = getY(Math.max(candle.open, candle.close));
          const bodyBottom = getY(Math.min(candle.open, candle.close));
          const wickTop = getY(candle.high);
          const wickBottom = getY(candle.low);
          const bodyHeight = Math.max(2, bodyBottom - bodyTop);

          return (
            <g key={i} filter="url(#candleGlow)" className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Wick */}
              <line
                x1={x}
                y1={wickTop}
                x2={x}
                y2={wickBottom}
                stroke={candle.bullish ? '#00FF75' : '#FF4A4A'}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - 4}
                y={bodyTop}
                width="8"
                height={bodyHeight}
                fill={candle.bullish ? 'url(#bullGlow)' : 'url(#bearGlow)'}
                rx="1"
              />
            </g>
          );
        })}

        {/* Moving average line */}
        <path
          d={`M ${linePoints.map((p, i) => `${i * 10},${p}`).join(' L ')}`}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          className="chart-line"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0, 229, 255, 0.5))' }}
        />
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* Volume bars */}
      <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end justify-around px-2 opacity-40">
        {candles.slice(0, 12).map((candle, i) => (
          <div
            key={i}
            className={`w-2 rounded-t transition-all duration-500 ${
              candle.bullish ? 'bg-profit' : 'bg-loss'
            }`}
            style={{
              height: `${20 + Math.random() * 80}%`,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TradingChartAnimation;
