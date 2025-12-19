const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EconomicEvent {
  id: string;
  time: string;
  country: string;
  currency: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  previous: string;
  forecast: string;
  actual: string;
}

const currencyToCountry: Record<string, string> = {
  'USD': 'US',
  'EUR': 'EU',
  'GBP': 'GB',
  'JPY': 'JP',
  'AUD': 'AU',
  'NZD': 'NZ',
  'CAD': 'CA',
  'CHF': 'CH',
  'CNY': 'CN',
};

// Parse HTML content from Forex Factory
function parseForexFactoryHtml(html: string, dateStr: string): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  
  // Look for calendar__row elements
  const rowRegex = /<tr[^>]*class="[^"]*calendar__row[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  let currentTime = '';
  let eventIndex = 0;
  
  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];
    
    // Skip if it's a day break or header row
    if (row.includes('calendar__cell--day-breaker') || row.includes('calendar__head')) {
      continue;
    }
    
    // Extract time - look for calendar__time
    const timeMatch = row.match(/calendar__time[^>]*>([^<]*)</);
    if (timeMatch && timeMatch[1].trim()) {
      currentTime = timeMatch[1].trim();
    }
    
    // Extract currency
    const currencyMatch = row.match(/calendar__currency[^>]*>([A-Z]{3})</);
    const currency = currencyMatch?.[1]?.trim();
    
    if (!currency || !currencyToCountry[currency]) continue;
    
    // Extract impact
    let impact: 'high' | 'medium' | 'low' = 'low';
    if (row.includes('icon--ff-impact-red') || row.includes('high')) {
      impact = 'high';
    } else if (row.includes('icon--ff-impact-ora') || row.includes('medium')) {
      impact = 'medium';
    } else if (row.includes('icon--ff-impact-yel')) {
      impact = 'low';
    }
    
    // Extract event name
    const eventMatch = row.match(/calendar__event-title[^>]*>([^<]+)</);
    const eventName = eventMatch?.[1]?.trim() || '';
    
    if (!eventName) continue;
    
    // Extract values
    const actualMatch = row.match(/calendar__actual[^>]*>([^<]*)</);
    const forecastMatch = row.match(/calendar__forecast[^>]*>([^<]*)</);
    const previousMatch = row.match(/calendar__previous[^>]*>([^<]*)</);
    
    eventIndex++;
    events.push({
      id: `ff-${dateStr}-${eventIndex}`,
      time: currentTime || 'All Day',
      country: currencyToCountry[currency] || currency,
      currency,
      event: eventName,
      impact,
      actual: actualMatch?.[1]?.trim() || '-',
      forecast: forecastMatch?.[1]?.trim() || '-',
      previous: previousMatch?.[1]?.trim() || '-',
    });
  }
  
  return events;
}

// Parse markdown content from Forex Factory
function parseForexFactoryMarkdown(markdown: string, dateStr: string): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const lines = markdown.split('\n');
  let currentTime = '';
  let eventIndex = 0;
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Look for time patterns like "8:30am" or "10:00pm"
    const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?)/i);
    if (timeMatch) {
      currentTime = timeMatch[1].trim();
    }
    
    // Look for currency codes
    const currencyMatch = line.match(/\b(USD|EUR|GBP|JPY|CHF|CAD|AUD|NZD|CNY)\b/);
    if (currencyMatch) {
      const currency = currencyMatch[1];
      
      // Extract text after currency as event name
      const afterCurrency = line.substring(line.indexOf(currency) + currency.length).trim();
      
      // Try to find event name - usually the main text
      let eventName = afterCurrency.replace(/^\s*\|?\s*/, '').trim();
      
      // Clean up common patterns
      eventName = eventName.replace(/^[\|\-\s]+/, '').trim();
      
      // Skip if event name is too short or just symbols
      if (eventName.length < 3 || /^[\d\.\%\-\s]+$/.test(eventName)) continue;
      
      // Determine impact from context
      let impact: 'high' | 'medium' | 'low' = 'low';
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('high') || line.includes('🔴') || lowerLine.includes('red')) {
        impact = 'high';
      } else if (lowerLine.includes('medium') || line.includes('🟠') || lowerLine.includes('orange')) {
        impact = 'medium';
      } else if (lowerLine.includes('low') || line.includes('🟡') || lowerLine.includes('yellow')) {
        impact = 'low';
      }
      
      // Extract numeric values
      const numbers = afterCurrency.match(/([\-\+]?\d+\.?\d*[%KMB]?)/g);
      
      eventIndex++;
      events.push({
        id: `ff-${dateStr}-${eventIndex}`,
        time: currentTime || 'All Day',
        country: currencyToCountry[currency] || currency,
        currency,
        event: eventName.substring(0, 100),
        impact,
        actual: numbers?.[0] || '-',
        forecast: numbers?.[1] || '-',
        previous: numbers?.[2] || '-',
      });
    }
  }
  
  return events;
}

// Scrape Forex Factory using Firecrawl
async function scrapeWithFirecrawl(dateStr: string): Promise<EconomicEvent[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.log('FIRECRAWL_API_KEY not configured, skipping Firecrawl');
    return [];
  }

  // Format date for Forex Factory URL (e.g., dec19.2024)
  const date = new Date(dateStr);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const ffDateFormat = `${month}${day}.${year}`;
  
  const url = `https://www.forexfactory.com/calendar?day=${ffDateFormat}`;
  console.log('Scraping Forex Factory URL with Firecrawl:', url);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 5000, // Wait 5s for JS to render
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firecrawl API error:', error);
      return [];
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    
    console.log('Firecrawl response - markdown length:', markdown.length, 'html length:', html.length);
    
    // Try HTML parsing first (more structured)
    let events = parseForexFactoryHtml(html, dateStr);
    
    // If HTML parsing didn't work, try markdown
    if (events.length === 0 && markdown) {
      events = parseForexFactoryMarkdown(markdown, dateStr);
    }
    
    console.log('Parsed', events.length, 'events from Firecrawl');
    return events;
  } catch (error) {
    console.error('Firecrawl scraping error:', error);
    return [];
  }
}

// Fetch from FCS API (free economic calendar API for current week)
async function fetchFromFCSAPI(dateStr: string): Promise<EconomicEvent[]> {
  try {
    const date = new Date(dateStr);
    const formattedDate = date.toISOString().split('T')[0];
    
    console.log('Fetching from FCS API for date:', formattedDate);
    
    const response = await fetch(`https://nfs.faireconomy.media/ff_calendar_thisweek.json`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.log('FCS API response not ok:', response.status);
      return [];
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.log('FCS API response is not an array');
      return [];
    }
    
    const events: EconomicEvent[] = [];
    let eventIndex = 0;
    
    for (const item of data) {
      try {
        const eventDate = item.date?.split('T')[0];
        
        if (eventDate === formattedDate) {
          const currency = item.country || '';
          
          if (!currencyToCountry[currency]) continue;
          
          let impact: 'high' | 'medium' | 'low' = 'low';
          const impactStr = String(item.impact || '').toLowerCase();
          if (impactStr === 'high' || impactStr === 'red' || item.impact === 3) {
            impact = 'high';
          } else if (impactStr === 'medium' || impactStr === 'orange' || item.impact === 2) {
            impact = 'medium';
          }
          
          // Extract time from date string
          let time = 'All Day';
          if (item.date && item.date.includes('T')) {
            const timePart = item.date.split('T')[1];
            if (timePart) {
              const [hours, minutes] = timePart.split(':');
              if (hours && minutes) {
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'pm' : 'am';
                const hour12 = hour % 12 || 12;
                time = `${hour12}:${minutes}${ampm}`;
              }
            }
          }
          
          eventIndex++;
          events.push({
            id: `fcs-${dateStr}-${eventIndex}`,
            time,
            country: currencyToCountry[currency] || currency,
            currency,
            event: item.title || item.event || 'Economic Event',
            impact,
            previous: String(item.previous || '-'),
            forecast: String(item.forecast || '-'),
            actual: String(item.actual || '-'),
          });
        }
      } catch (e) {
        console.error('Error parsing FCS event:', e);
      }
    }
    
    console.log(`FCS API returned ${events.length} events for ${formattedDate}`);
    return events;
  } catch (error) {
    console.error('Error fetching from FCS API:', error);
    return [];
  }
}

// Static fallback data
function getStaticEventsForDate(dateStr: string): EconomicEvent[] {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  const dayOfMonth = date.getDate();
  
  const weeklyEvents: Record<number, EconomicEvent[]> = {
    0: [],
    1: [
      { id: `${dateStr}-mon-1`, time: '09:00am', country: 'EU', currency: 'EUR', event: 'German Ifo Business Climate', impact: 'high', previous: '87.3', forecast: '87.5', actual: '-' },
      { id: `${dateStr}-mon-2`, time: '10:00am', country: 'EU', currency: 'EUR', event: 'ECB President Speech', impact: 'high', previous: '-', forecast: '-', actual: '-' },
    ],
    2: [
      { id: `${dateStr}-tue-1`, time: '07:00am', country: 'GB', currency: 'GBP', event: 'Claimant Count Change', impact: 'high', previous: '26.7K', forecast: '28.0K', actual: '-' },
      { id: `${dateStr}-tue-2`, time: '10:00am', country: 'EU', currency: 'EUR', event: 'ZEW Economic Sentiment', impact: 'high', previous: '7.4', forecast: '6.8', actual: '-' },
      { id: `${dateStr}-tue-3`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Building Permits', impact: 'medium', previous: '1.42M', forecast: '1.45M', actual: '-' },
    ],
    3: [
      { id: `${dateStr}-wed-1`, time: '07:00am', country: 'GB', currency: 'GBP', event: 'CPI y/y', impact: 'high', previous: '2.3%', forecast: '2.5%', actual: '-' },
      { id: `${dateStr}-wed-2`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Core Durable Goods Orders m/m', impact: 'medium', previous: '0.2%', forecast: '0.3%', actual: '-' },
      { id: `${dateStr}-wed-3`, time: '03:30pm', country: 'US', currency: 'USD', event: 'Crude Oil Inventories', impact: 'medium', previous: '-1.4M', forecast: '0.8M', actual: '-' },
    ],
    4: [
      { id: `${dateStr}-thu-1`, time: '08:30am', country: 'CH', currency: 'CHF', event: 'SNB Interest Rate Decision', impact: 'high', previous: '0.50%', forecast: '0.25%', actual: '-' },
      { id: `${dateStr}-thu-2`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Initial Jobless Claims', impact: 'high', previous: '242K', forecast: '230K', actual: '-' },
      { id: `${dateStr}-thu-3`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Final GDP q/q', impact: 'high', previous: '2.8%', forecast: '2.8%', actual: '-' },
    ],
    5: [
      { id: `${dateStr}-fri-1`, time: '07:00am', country: 'GB', currency: 'GBP', event: 'Retail Sales m/m', impact: 'high', previous: '-0.7%', forecast: '0.5%', actual: '-' },
      { id: `${dateStr}-fri-2`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Core PCE Price Index m/m', impact: 'high', previous: '0.3%', forecast: '0.2%', actual: '-' },
    ],
    6: [],
  };
  
  const baseEvents = weeklyEvents[dayOfWeek] || [];
  const additionalEvents: EconomicEvent[] = [];
  
  // NFP on first Friday
  if (dayOfWeek === 5 && dayOfMonth <= 7) {
    additionalEvents.push(
      { id: `${dateStr}-nfp-1`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Non-Farm Employment Change', impact: 'high', previous: '227K', forecast: '160K', actual: '-' },
      { id: `${dateStr}-nfp-2`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Unemployment Rate', impact: 'high', previous: '4.2%', forecast: '4.2%', actual: '-' },
    );
  }
  
  // CPI mid-month
  if (dayOfMonth >= 12 && dayOfMonth <= 15 && dayOfWeek >= 1 && dayOfWeek <= 5) {
    additionalEvents.push(
      { id: `${dateStr}-cpi-1`, time: '01:30pm', country: 'US', currency: 'USD', event: 'Core CPI m/m', impact: 'high', previous: '0.3%', forecast: '0.3%', actual: '-' },
      { id: `${dateStr}-cpi-2`, time: '01:30pm', country: 'US', currency: 'USD', event: 'CPI y/y', impact: 'high', previous: '2.7%', forecast: '2.8%', actual: '-' },
    );
  }
  
  return [...baseEvents, ...additionalEvents];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestedDate = '';
    try {
      const body = await req.json();
      requestedDate = body.date || '';
    } catch {
      requestedDate = new Date().toISOString().split('T')[0];
    }

    if (!requestedDate) {
      requestedDate = new Date().toISOString().split('T')[0];
    }

    console.log('=== Fetching economic events for date:', requestedDate, '===');

    let events: EconomicEvent[] = [];
    let source = 'unknown';

    // Strategy 1: Try Firecrawl first (works for any date)
    events = await scrapeWithFirecrawl(requestedDate);
    if (events.length > 0) {
      source = 'firecrawl';
      console.log('Using Firecrawl data:', events.length, 'events');
    }

    // Strategy 2: Try FCS API (works for current week)
    if (events.length === 0) {
      events = await fetchFromFCSAPI(requestedDate);
      if (events.length > 0) {
        source = 'fcs-api';
        console.log('Using FCS API data:', events.length, 'events');
      }
    }

    // Strategy 3: Fallback to static data
    if (events.length === 0) {
      events = getStaticEventsForDate(requestedDate);
      source = 'static';
      console.log('Using static fallback data:', events.length, 'events');
    }

    console.log(`=== Returning ${events.length} events from ${source} ===`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events,
        source,
        date: requestedDate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-forex-factory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const fallbackEvents = getStaticEventsForDate(new Date().toISOString().split('T')[0]);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        events: fallbackEvents, 
        source: 'static',
        warning: errorMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
