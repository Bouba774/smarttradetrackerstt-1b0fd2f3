import React from 'react';

const BullBearAnimation: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-8 md:gap-16">
      {/* Bull */}
      <div className="relative group">
        <div className="absolute inset-0 bg-profit/20 rounded-full blur-3xl animate-pulse" />
        <svg
          viewBox="0 0 100 100"
          className="w-24 h-24 md:w-32 md:h-32 relative z-10 floating-animation"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0, 255, 117, 0.5))' }}
        >
          <defs>
            <linearGradient id="bullGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FF75" />
              <stop offset="100%" stopColor="#00CC5D" />
            </linearGradient>
            <filter id="hologram">
              <feGaussianBlur stdDeviation="0.5" />
            </filter>
          </defs>
          
          {/* Bull body */}
          <ellipse cx="50" cy="60" rx="25" ry="18" fill="url(#bullGradient)" opacity="0.9" />
          
          {/* Bull head */}
          <circle cx="70" cy="45" r="12" fill="url(#bullGradient)" opacity="0.9" />
          
          {/* Horns */}
          <path
            d="M 65 35 Q 55 20 45 25"
            stroke="#00FF75"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M 75 35 Q 85 20 95 25"
            stroke="#00FF75"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Legs */}
          <rect x="32" y="72" width="6" height="20" rx="3" fill="url(#bullGradient)" />
          <rect x="45" y="72" width="6" height="20" rx="3" fill="url(#bullGradient)" />
          <rect x="55" y="72" width="6" height="20" rx="3" fill="url(#bullGradient)" />
          <rect x="68" y="72" width="6" height="20" rx="3" fill="url(#bullGradient)" />
          
          {/* Eye */}
          <circle cx="73" cy="43" r="2" fill="#0B0F15" />
          
          {/* Scan lines effect */}
          <g opacity="0.3">
            {[...Array(10)].map((_, i) => (
              <line
                key={i}
                x1="20"
                y1={25 + i * 6}
                x2="90"
                y2={25 + i * 6}
                stroke="#00FF75"
                strokeWidth="0.5"
                className="animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </g>
        </svg>
        <p className="text-center mt-2 font-display text-profit text-sm font-semibold tracking-wider">
          BULL
        </p>
      </div>

      {/* VS Separator */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-primary to-transparent" />
        <span className="font-display text-primary text-lg font-bold neon-text">VS</span>
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-primary to-transparent" />
      </div>

      {/* Bear */}
      <div className="relative group">
        <div className="absolute inset-0 bg-loss/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }} />
        <svg
          viewBox="0 0 100 100"
          className="w-24 h-24 md:w-32 md:h-32 relative z-10 floating-animation"
          style={{ 
            filter: 'drop-shadow(0 0 20px rgba(255, 74, 74, 0.5))',
            animationDelay: '0.5s',
          }}
        >
          <defs>
            <linearGradient id="bearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4A4A" />
              <stop offset="100%" stopColor="#CC3030" />
            </linearGradient>
          </defs>
          
          {/* Bear body */}
          <ellipse cx="50" cy="60" rx="28" ry="22" fill="url(#bearGradient)" opacity="0.9" />
          
          {/* Bear head */}
          <circle cx="50" cy="35" r="18" fill="url(#bearGradient)" opacity="0.9" />
          
          {/* Ears */}
          <circle cx="35" cy="22" r="7" fill="url(#bearGradient)" />
          <circle cx="65" cy="22" r="7" fill="url(#bearGradient)" />
          
          {/* Snout */}
          <ellipse cx="50" cy="42" rx="8" ry="6" fill="#CC3030" />
          <circle cx="50" cy="40" r="2" fill="#0B0F15" />
          
          {/* Eyes */}
          <circle cx="42" cy="32" r="2.5" fill="#0B0F15" />
          <circle cx="58" cy="32" r="2.5" fill="#0B0F15" />
          
          {/* Legs */}
          <ellipse cx="32" cy="80" rx="8" ry="12" fill="url(#bearGradient)" />
          <ellipse cx="68" cy="80" rx="8" ry="12" fill="url(#bearGradient)" />
          
          {/* Glitch effect lines */}
          <g opacity="0.4" className="animate-pulse">
            <rect x="25" y="30" width="50" height="2" fill="#FF4A4A" transform="translate(2, 0)" />
            <rect x="25" y="50" width="50" height="1" fill="#FF4A4A" transform="translate(-2, 0)" />
            <rect x="25" y="70" width="50" height="2" fill="#FF4A4A" transform="translate(1, 0)" />
          </g>
        </svg>
        <p className="text-center mt-2 font-display text-loss text-sm font-semibold tracking-wider">
          BEAR
        </p>
      </div>
    </div>
  );
};

export default BullBearAnimation;
