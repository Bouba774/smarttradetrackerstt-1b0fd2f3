import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Globe, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MarketOverviewHeaderProps {
  tradingStyle: 'scalping' | 'daytrading' | 'swing';
}

interface MarketSession {
  name: string;
  status: 'open' | 'closed' | 'opening-soon';
  timeLeft?: string;
}

const MarketOverviewHeader: React.FC<MarketOverviewHeaderProps> = ({ tradingStyle }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine active market sessions
  const getSessions = (): MarketSession[] => {
    const hour = currentTime.getUTCHours();
    
    const sessions: MarketSession[] = [
      {
        name: 'Sydney',
        status: (hour >= 22 || hour < 7) ? 'open' : 'closed',
      },
      {
        name: 'Tokyo',
        status: (hour >= 0 && hour < 9) ? 'open' : 'closed',
      },
      {
        name: 'Londres',
        status: (hour >= 8 && hour < 17) ? 'open' : 'closed',
      },
      {
        name: 'New York',
        status: (hour >= 13 && hour < 22) ? 'open' : 'closed',
      },
    ];

    return sessions;
  };

  const sessions = getSessions();
  const activeSessions = sessions.filter(s => s.status === 'open');

  return (
    <div className="bg-gradient-to-r from-card via-card/95 to-card border-b border-border sticky top-0 z-40 backdrop-blur-xl">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Title & Status */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                Aperçu Global des Marchés
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-profit" />
                ) : (
                  <WifiOff className="h-4 w-4 text-loss" />
                )}
              </h1>
              <p className="text-xs text-muted-foreground">
                Centre de commandement • Mise à jour en temps réel
              </p>
            </div>
          </div>

          {/* Time & Sessions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Current Time */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono font-medium">
                {format(currentTime, 'HH:mm:ss')}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {format(currentTime, 'EEEE d MMMM', { locale: fr })}
              </span>
            </div>

            {/* Active Sessions */}
            <div className="flex items-center gap-1.5">
              {sessions.map((session) => (
                <Badge
                  key={session.name}
                  variant={session.status === 'open' ? 'default' : 'secondary'}
                  className={`text-xs ${
                    session.status === 'open' 
                      ? 'bg-profit/20 text-profit border-profit/30 animate-pulse' 
                      : 'bg-secondary/50 text-muted-foreground'
                  }`}
                >
                  {session.name}
                </Badge>
              ))}
            </div>

            {/* Trading Style Badge */}
            <Badge variant="outline" className="capitalize text-xs border-primary/30 text-primary">
              <TrendingUp className="h-3 w-3 mr-1" />
              {tradingStyle === 'daytrading' ? 'Day Trading' : tradingStyle}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverviewHeader;
