import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Clock, AlertTriangle, TrendingUp, TrendingDown, Minus, Filter, RefreshCw, Loader2, ChevronLeft, ChevronRight, CalendarIcon, Database } from 'lucide-react';
import { format, addDays, subDays, differenceInMinutes, differenceInSeconds, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

interface CachedData {
  events: any[];
  timestamp: number;
  date: string;
}

const CACHE_KEY = 'economic-calendar-cache';
const CACHE_DURATION_TODAY = 30 * 60 * 1000; // 30 minutes for today
const CACHE_DURATION_PAST = 24 * 60 * 60 * 1000; // 24 hours for past dates
const CACHE_DURATION_FUTURE = 2 * 60 * 60 * 1000; // 2 hours for future dates

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

// Cache utilities
const getCache = (): Record<string, CachedData> => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const setCache = (date: string, events: any[]) => {
  try {
    const cache = getCache();
    cache[date] = {
      events,
      timestamp: Date.now(),
      date,
    };
    // Keep only last 14 days of cache
    const dates = Object.keys(cache).sort();
    if (dates.length > 14) {
      dates.slice(0, dates.length - 14).forEach(d => delete cache[d]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Error saving cache:', e);
  }
};

const getCachedData = (dateStr: string): CachedData | null => {
  const cache = getCache();
  const cached = cache[dateStr];
  
  if (!cached) return null;
  
  const now = Date.now();
  const today = format(new Date(), 'yyyy-MM-dd');
  const isPast = dateStr < today;
  const isToday = dateStr === today;
  
  let maxAge = CACHE_DURATION_FUTURE;
  if (isToday) maxAge = CACHE_DURATION_TODAY;
  else if (isPast) maxAge = CACHE_DURATION_PAST;
  
  if (now - cached.timestamp > maxAge) {
    return null; // Cache expired
  }
  
  return cached;
};

const EconomicCalendar: React.FC = () => {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highImpactOnly, setHighImpactOnly] = useState(false);
  const [tradingRiskMode, setTradingRiskMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  const parseEventsData = useCallback((data: any[], date: Date): EconomicEvent[] => {
    return data.map((event: any, index: number) => {
      let eventTime = new Date(date);
      if (event.time && event.time !== 'All Day') {
        const timeParts = event.time.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
        if (timeParts) {
          let hours = parseInt(timeParts[1]);
          const minutes = parseInt(timeParts[2]);
          const isPM = timeParts[3]?.toLowerCase() === 'pm';
          if (isPM && hours !== 12) hours += 12;
          if (!isPM && hours === 12) hours = 0;
          eventTime.setHours(hours, minutes, 0, 0);
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
  }, []);

  const fetchForexFactoryData = useCallback(async (date: Date, forceRefresh = false) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedData(formattedDate);
      if (cached && cached.events.length > 0) {
        console.log('Using cached data for:', formattedDate);
        const parsedEvents = parseEventsData(cached.events, date);
        setEvents(parsedEvents.sort((a, b) => a.time.getTime() - b.time.getTime()));
        setLastUpdate(new Date(cached.timestamp));
        setIsFromCache(true);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setIsFromCache(false);
    
    try {
      console.log('Fetching ForexFactory data for date:', formattedDate);
      
      const { data, error } = await supabase.functions.invoke('scrape-forex-factory', {
        body: { date: formattedDate }
      });
      
      if (error) {
        console.error('Error fetching ForexFactory data:', error);
        toast.error('Erreur lors du chargement des données');
        return;
      }

      if (data?.success && data?.events?.length > 0) {
        // Save to cache
        setCache(formattedDate, data.events);
        
        const parsedEvents = parseEventsData(data.events, date);
        setEvents(parsedEvents.sort((a, b) => a.time.getTime() - b.time.getTime()));
        setLastUpdate(new Date());
        toast.success('Calendrier économique mis à jour');
      } else {
        setEvents([]);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching ForexFactory:', error);
      toast.error('Impossible de charger les données ForexFactory');
    } finally {
      setIsLoading(false);
    }
  }, [parseEventsData]);

  useEffect(() => {
    fetchForexFactoryData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsCalendarOpen(false);
    }
  };

  const isToday = isSameDay(selectedDate, new Date());

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
              onClick={() => fetchForexFactoryData(selectedDate, true)}
              disabled={isLoading}
              className="h-8"
              title="Rafraîchir les données"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {isFromCache && (
              <Badge variant="outline" className="text-xs gap-1">
                <Database className="h-3 w-3" />
                Cache
              </Badge>
            )}
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

        {/* Date Selector */}
        <div className="flex items-center gap-2 mt-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-center text-left font-normal h-8 text-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarUI
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handleToday}>
              Aujourd'hui
            </Button>
          )}
        </div>

        {lastUpdate && (
          <p className="text-xs text-muted-foreground mt-2">
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
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                Aucune annonce économique ce jour
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Sélectionnez une autre date pour voir les événements
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredEvents.map((event) => {
                const isPast = event.time < currentTime && isToday;
                const countdown = isToday ? getCountdown(event.time) : null;
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
