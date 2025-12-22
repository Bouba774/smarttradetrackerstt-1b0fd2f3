/**
 * Timezone utilities for trading session management
 * All business logic uses New York Time (America/New_York) as reference
 */

/**
 * Get current NY Time using Intl API for accurate timezone handling
 */
export const getNYTime = (date: Date = new Date()): Date => {
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = nyFormatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';
  
  const nyDate = new Date(
    parseInt(getPart('year')),
    parseInt(getPart('month')) - 1,
    parseInt(getPart('day')),
    parseInt(getPart('hour')),
    parseInt(getPart('minute')),
    parseInt(getPart('second'))
  );
  
  return nyDate;
};

/**
 * Get NY hour from a local Date object
 */
export const getNYHour = (date: Date = new Date()): number => {
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    hour12: false,
  });
  
  const parts = nyFormatter.formatToParts(date);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  return hour;
};

/**
 * Get NY minute from a local Date object
 */
export const getNYMinute = (date: Date = new Date()): number => {
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    minute: '2-digit',
  });
  
  const parts = nyFormatter.formatToParts(date);
  return parseInt(parts.find(p => p.type === 'minute')?.value || '0');
};

/**
 * Convert local time to NY time string (HH:mm format)
 */
export const localToNYTimeString = (localDate: Date): string => {
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  return nyFormatter.format(localDate);
};

/**
 * Get formatted NY date string (YYYY-MM-DD)
 */
export const getNYDateString = (date: Date = new Date()): string => {
  const nyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  return nyFormatter.format(date);
};

/**
 * Check if current NY time is past 17:00 (5 PM) - daily reset time
 * The trading day resets at 17:00 NY Time (23:00 in Cameroon)
 */
export const isAfterDailyReset = (date: Date = new Date()): boolean => {
  const nyHour = getNYHour(date);
  return nyHour >= 17;
};

/**
 * Get the current trading day start in NY time
 * Trading day starts at 17:00 NY the previous day
 */
export const getTradingDayStart = (date: Date = new Date()): Date => {
  const nyTime = getNYTime(date);
  const nyHour = nyTime.getHours();
  
  // If before 17:00, trading day started at 17:00 yesterday
  // If after 17:00, trading day started at 17:00 today
  if (nyHour < 17) {
    nyTime.setDate(nyTime.getDate() - 1);
  }
  nyTime.setHours(17, 0, 0, 0);
  
  return nyTime;
};

/**
 * Get the current trading day end in NY time (next day at 17:00)
 */
export const getTradingDayEnd = (date: Date = new Date()): Date => {
  const start = getTradingDayStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return end;
};

/**
 * Session types for both classic and killzones modes
 */
export type SessionType = 
  | 'sydney' | 'tokyo' | 'london' | 'newYork' 
  | 'asia' | 'londonClose' | 'overlap' | 'none';

/**
 * ICT Killzone definitions in NY Time (Winter time - EST)
 * These are the official ICT killzone hours
 */
export const KILLZONE_HOURS = {
  asia: { start: 20, end: 0 },        // 20:00 - 00:00 NY (02:00 - 06:00 Cameroon)
  london: { start: 2, end: 5 },       // 02:00 - 05:00 NY (08:00 - 11:00 Cameroon)
  newYork: { start: 7, end: 10 },     // 07:00 - 10:00 NY (13:00 - 16:00 Cameroon)
  londonClose: { start: 10, end: 12 }, // 10:00 - 12:00 NY (16:00 - 18:00 Cameroon)
  overlap: { start: 8, end: 12 },     // 08:00 - 12:00 NY (14:00 - 18:00 Cameroon)
} as const;

/**
 * Check if NY hour is within a time range (handles overnight ranges)
 */
export const isHourInRange = (hour: number, start: number, end: number): boolean => {
  if (start < end) {
    // Normal range (e.g., 8-17)
    return hour >= start && hour < end;
  } else if (start > end) {
    // Overnight range (e.g., 20-0)
    return hour >= start || hour < end;
  } else {
    // start === end means 24h
    return true;
  }
};

/**
 * Get the current killzone/session based on NY hour
 */
export const getKillzoneForNYHour = (nyHour: number): SessionType => {
  // Check London/NY Overlap first (08:00 - 12:00 NY)
  if (isHourInRange(nyHour, KILLZONE_HOURS.overlap.start, KILLZONE_HOURS.overlap.end)) {
    return 'overlap';
  }
  
  // London Close (10:00 - 12:00 NY) - already covered by overlap
  if (isHourInRange(nyHour, KILLZONE_HOURS.londonClose.start, KILLZONE_HOURS.londonClose.end)) {
    return 'londonClose';
  }
  
  // New York Killzone (07:00 - 10:00 NY)
  if (isHourInRange(nyHour, KILLZONE_HOURS.newYork.start, KILLZONE_HOURS.newYork.end)) {
    return 'newYork';
  }
  
  // London Killzone (02:00 - 05:00 NY)
  if (isHourInRange(nyHour, KILLZONE_HOURS.london.start, KILLZONE_HOURS.london.end)) {
    return 'london';
  }
  
  // Asia Killzone (20:00 - 00:00 NY)
  if (isHourInRange(nyHour, KILLZONE_HOURS.asia.start, KILLZONE_HOURS.asia.end)) {
    return 'asia';
  }
  
  return 'none';
};

/**
 * Get killzone for a given local Date
 */
export const getKillzoneForDate = (date: Date): SessionType => {
  const nyHour = getNYHour(date);
  return getKillzoneForNYHour(nyHour);
};

/**
 * Get session label translations
 */
export const SESSION_LABELS: Record<SessionType, { fr: string; en: string }> = {
  sydney: { fr: 'Sydney', en: 'Sydney' },
  tokyo: { fr: 'Tokyo', en: 'Tokyo' },
  london: { fr: 'Londres', en: 'London' },
  newYork: { fr: 'New York', en: 'New York' },
  asia: { fr: 'Killzone Asie', en: 'Asia Killzone' },
  londonClose: { fr: 'London Close', en: 'London Close' },
  overlap: { fr: 'London/NY Overlap', en: 'London/NY Overlap' },
  none: { fr: 'Hors session', en: 'Off session' },
};

/**
 * Get user's local timezone name
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Format time for display with both local and NY time
 */
export const formatDualTime = (date: Date, language: string = 'fr'): string => {
  const localTime = date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const nyTime = localToNYTimeString(date);
  
  return `${localTime} (${nyTime} NY)`;
};
