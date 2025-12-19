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

    console.log('=== Fetching Forex Factory events for date:', requestedDate, '===');

    const events = await scrapeWithFirecrawl(requestedDate);
    
    console.log(`=== Returning ${events.length} events from Forex Factory ===`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        events,
        source: 'forexfactory',
        date: requestedDate,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-forex-factory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        events: [], 
        source: 'error',
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
