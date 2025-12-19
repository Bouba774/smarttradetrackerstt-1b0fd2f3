import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { format, addHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EconomicEvent {
  id: string;
  time: Date;
  country: string;
  countryCode: string;
  currency: string;
  event: string;
  impact: 'low' | 'medium' | 'high';
  previous: string | null;
  forecast: string | null;
  actual: string | null;
}

// Mock data - in production, this would come from an API
const generateMockEvents = (): EconomicEvent[] => {
  const now = new Date();
  const events: EconomicEvent[] = [
    {
      id: '1',
      time: addHours(now, 0.5),
      country: 'États-Unis',
      countryCode: 'US',
      currency: 'USD',
      event: 'Décision taux Fed (FOMC)',
      impact: 'high',
      previous: '5.50%',
      forecast: '5.50%',
      actual: null,
    },
    {
      id: '2',
      time: addHours(now, 1),
      country: 'États-Unis',
      countryCode: 'US',
      currency: 'USD',
      event: 'Conférence de presse Powell',
      impact: 'high',
      previous: null,
      forecast: null,
      actual: null,
    },
    {
      id: '3',
      time: addHours(now, 2.5),
      country: 'Zone Euro',
      countryCode: 'EU',
      currency: 'EUR',
      event: 'PIB (QoQ)',
      impact: 'medium',
      previous: '0.3%',
      forecast: '0.2%',
      actual: null,
    },
    {
      id: '4',
      time: addHours(now, 3),
      country: 'Royaume-Uni',
      countryCode: 'GB',
      currency: 'GBP',
      event: 'IPC (YoY)',
      impact: 'high',
      previous: '4.0%',
      forecast: '3.8%',
      actual: null,
    },
    {
      id: '5',
      time: addHours(now, 4),
      country: 'Japon',
      countryCode: 'JP',
      currency: 'JPY',
      event: 'Balance commerciale',
      impact: 'low',
      previous: '-1.2T',
      forecast: '-0.9T',
      actual: null,
    },
    {
      id: '6',
      time: addHours(now, -1),
      country: 'Chine',
      countryCode: 'CN',
      currency: 'CNY',
      event: 'PMI Manufacturier',
      impact: 'medium',
      previous: '49.2',
      forecast: '49.5',
      actual: '49.8',
    },
    {
      id: '7',
      time: addHours(now, -2),
      country: 'Australie',
      countryCode: 'AU',
      currency: 'AUD',
      event: 'Emploi (MoM)',
      impact: 'high',
      previous: '+32K',
      forecast: '+25K',
      actual: '+18K',
    },
    {
      id: '8',
      time: addHours(now, 5),
      country: 'Canada',
      countryCode: 'CA',
      currency: 'CAD',
      event: 'Ventes au détail (MoM)',
      impact: 'medium',
      previous: '0.4%',
      forecast: '0.3%',
      actual: null,
    },
  ];
  
  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
};

const EconomicCalendar: React.FC = () => {
  const [events] = useState<EconomicEvent[]>(generateMockEvents);
  const [highImpactOnly, setHighImpactOnly] = useState(false);
  const [tradingRiskMode, setTradingRiskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (highImpactOnly && event.impact !== 'high') return false;
      return true;
    });
  }, [events, highImpactOnly]);

  const getCountdown = (eventTime: Date) => {
    const diffMinutes = differenceInMinutes(eventTime, currentTime);
    const diffSeconds = differenceInSeconds(eventTime, currentTime) % 60;
    
    if (diffMinutes < 0) return null;
    if (diffMinutes === 0) return `${diffSeconds}s`;
    if (diffMinutes < 60) return `${diffMinutes}m ${diffSeconds}s`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-loss/20 text-loss border-loss/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'low': return 'bg-profit/20 text-profit border-profit/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getResultIcon = (actual: string | null, forecast: string | null) => {
    if (!actual || !forecast) return null;
    
    const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ''));
    const forecastNum = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
    
    if (isNaN(actualNum) || isNaN(forecastNum)) return <Minus className="h-4 w-4 text-muted-foreground" />;
    
    if (actualNum > forecastNum) return <TrendingUp className="h-4 w-4 text-profit" />;
    if (actualNum < forecastNum) return <TrendingDown className="h-4 w-4 text-loss" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const upcomingHighImpact = events.filter(
    e => e.impact === 'high' && differenceInMinutes(e.time, currentTime) > 0 && differenceInMinutes(e.time, currentTime) < 60
  );

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Calendrier Économique
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="highImpact"
                checked={highImpactOnly}
                onCheckedChange={setHighImpactOnly}
              />
              <Label htmlFor="highImpact" className="text-xs cursor-pointer">
                <Filter className="h-3 w-3 inline mr-1" />
                Fort impact
              </Label>
            </div>
          </div>
        </div>

        {/* Trading Risk Mode Warning */}
        {tradingRiskMode && upcomingHighImpact.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-loss/10 border border-loss/30 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-loss flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-loss">⚠️ Annonce majeure imminente</p>
              <p className="text-xs text-muted-foreground mt-1">
                {upcomingHighImpact[0].event} dans {getCountdown(upcomingHighImpact[0].time)}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {filteredEvents.map((event) => {
              const isPast = event.time < currentTime;
              const countdown = getCountdown(event.time);
              const isImminent = countdown && differenceInMinutes(event.time, currentTime) < 15;
              
              return (
                <div
                  key={event.id}
                  className={`p-3 sm:p-4 hover:bg-secondary/30 transition-colors ${
                    isPast ? 'opacity-60' : ''
                  } ${isImminent && event.impact === 'high' ? 'bg-loss/5 border-l-2 border-l-loss' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Time and Country */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          {format(event.time, 'HH:mm', { locale: fr })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {event.countryCode}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">
                          {event.currency}
                        </Badge>
                        <Badge className={`text-xs ${getImpactColor(event.impact)}`}>
                          {event.impact === 'high' ? '🔴 Fort' : event.impact === 'medium' ? '🟡 Moyen' : '🟢 Faible'}
                        </Badge>
                      </div>

                      {/* Event Name */}
                      <p className="font-medium text-sm text-foreground truncate">
                        {event.event}
                      </p>

                      {/* Values */}
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Préc: </span>
                          <span className="font-mono">{event.previous || '-'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Prévu: </span>
                          <span className="font-mono">{event.forecast || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Réel: </span>
                          <span className={`font-mono font-medium ${
                            event.actual 
                              ? parseFloat(event.actual) > parseFloat(event.forecast || '0') 
                                ? 'text-profit' 
                                : 'text-loss'
                              : ''
                          }`}>
                            {event.actual || '-'}
                          </span>
                          {getResultIcon(event.actual, event.forecast)}
                        </div>
                      </div>
                    </div>

                    {/* Countdown */}
                    {countdown && !isPast && (
                      <div className={`text-right flex-shrink-0 ${
                        isImminent && event.impact === 'high' ? 'animate-pulse' : ''
                      }`}>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs font-mono ${
                            isImminent && event.impact === 'high' ? 'text-loss font-bold' : 'text-muted-foreground'
                          }`}>
                            {countdown}
                          </span>
                        </div>
                      </div>
                    )}

                    {isPast && event.actual && (
                      <Badge variant="secondary" className="text-xs">
                        Publié
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EconomicCalendar;
