import React from 'react';
import { TrendingUp, Brain, Target } from 'lucide-react';

const MiniWidgets: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mx-auto">
      {/* Monthly Gains Widget */}
      <div className="glass-card p-4 group hover:shadow-profit transition-all duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-profit/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-profit" />
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Gains du Mois
          </span>
        </div>
        
        <div className="flex items-end gap-2">
          <span className="font-display text-2xl font-bold profit-text">
            +24.5%
          </span>
          <span className="text-xs text-profit/70 mb-1">↑ 3.2%</span>
        </div>

        {/* Mini chart pulse */}
        <div className="mt-3 h-8 flex items-end gap-px">
          {[40, 55, 35, 70, 60, 80, 75, 90].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-profit/40 rounded-t animate-pulse"
              style={{ 
                height: `${height}%`,
                animationDelay: `${i * 100}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Daily Discipline Widget */}
      <div className="glass-card p-4 group hover:shadow-neon transition-all duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center relative">
            <Brain className="w-5 h-5 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 rounded-lg animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Discipline Aujourd'hui
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-primary neon-text">
            92%
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-profit/20 text-profit">
            Excellent
          </span>
        </div>

        {/* Heartbeat line */}
        <svg className="mt-3 w-full h-8" viewBox="0 0 100 30">
          <path
            d="M 0,15 L 20,15 L 25,5 L 30,25 L 35,10 L 40,20 L 45,15 L 100,15"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="chart-line"
            style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}
          />
        </svg>
      </div>

      {/* R:R Ratio Widget */}
      <div className="glass-card p-4 group hover:shadow-neon transition-all duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Ratio R:R Moyen
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold text-foreground">
            1:2.4
          </span>
        </div>

        {/* Circular progress */}
        <div className="mt-3 flex justify-center">
          <svg className="w-16 h-8" viewBox="0 0 60 30">
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#00FF75" />
              </linearGradient>
            </defs>
            <path
              d="M 5,25 A 25,25 0 0,1 55,25"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 5,25 A 25,25 0 0,1 55,25"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="78.5"
              strokeDashoffset="20"
              className="progress-bar"
              style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MiniWidgets;
