import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { format, addHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Fallback mock data
const generateFallbackEvents = (): EconomicEvent[] => {
  const now = new Date();
  const events: EconomicEvent[] = [
    {
      id: '1',
      time: addHours(now, 0.5),
      country: 'États-Unis',
      countryCode: 'US',
      currency: 'USD',
      event: 'Décision taux Fed (FOMC)',
      impact: 'high' as const,
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
      impact: 'high' as const,
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
      impact: 'medium' as const,
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
      impact: 'high' as const,
      previous: '4.0%',
      forecast: '3.8%',
      actual: null,
    },
  ];
  return events.sort((a, b) => a.time.getTime() - b.time.getTime());
};

const countryNames: Record<string, string> = {
  'US': 'États-Unis',
  'EU': 'Zone Euro',
  'GB': 'Royaume-Uni',
  'JP': 'Japon',
  'AU': 'Australie',
  'CA': 'Canada',
  'CH': 'Suisse',
  'CN': 'Chine',
  'NZ': 'Nouvelle-Zélande',
};

const EconomicCalendar: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>(generateFallbackEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [highImpactOnly, setHighImpactOnly] = useState(false);
  const [tradingRiskMode, setTradingRiskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchForexFactoryData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-forex-factory');
      
      if (error) {
        console.error('Error fetching ForexFactory data:', error);
        toast.error('Erreur lors du chargement des données');
        return;
      }

      if (data?.success && data?.events?.length > 0) {
        const now = new Date();
        const parsedEvents: EconomicEvent[] = data.events.map((event: any, index: number) => {
          // Parse time string to Date
          let eventTime = now;
          if (event.time && event.time !== 'All Day') {
            const timeParts = event.time.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
            if (timeParts) {
              let hours = parseInt(timeParts[1]);
              const minutes = parseInt(timeParts[2]);
              const isPM = timeParts[3].toLowerCase() === 'pm';
              if (isPM && hours !== 12) hours += 12;
              if (!isPM && hours === 12) hours = 0;
              eventTime = new Date(now);
              eventTime.setHours(hours, minutes, 0, 0);
              // If time is past, assume it's for tomorrow
              if (eventTime < now) {
                eventTime.setDate(eventTime.getDate() + 1);
              }
            }
          }

          return {
            id: event.id || `ff-${index}`,
            time: eventTime,
            country: countryNames[event.country] || event.country,
            countryCode: event.country,
            currency: event.currency,
            event: event.event,
            impact: event.impact,
            previous: event.previous !== '-' ? event.previous : null,
            forecast: event.forecast !== '-' ? event.forecast : null,
            actual: event.actual !== '-' ? event.actual : null,
          };
        });

        setEvents(parsedEvents.sort((a, b) => a.time.getTime() - b.time.getTime()));
        setLastUpdate(new Date());
        toast.success('Calendrier économique mis à jour');
      }
    } catch (error) {
      console.error('Error fetching ForexFactory:', error);
      toast.error('Impossible de charger les données ForexFactory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data on mount
    fetchForexFactoryData();
    
    // Refresh every 5 minutes
    const refreshInterval = setInterval(fetchForexFactoryData, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

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
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Calendrier Économique
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              ForexFactory
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchForexFactoryData}
              disabled={isLoading}
              className="h-8"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
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

        {lastUpdate && (
          <p className="text-xs text-muted-foreground mt-1">
            Dernière mise à jour: {format(lastUpdate, 'HH:mm', { locale: fr })}
          </p>
        )}

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
          {isLoading && events.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EconomicCalendar;
