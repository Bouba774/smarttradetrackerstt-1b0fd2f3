import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: 'forex' | 'crypto' | 'indices' | 'commodities';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tags: string[];
  importance: 'high' | 'medium' | 'low';
  url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping ForexFactory news...');

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.forexfactory.com/news',
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Failed to scrape' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = data.data?.markdown || data.markdown || '';
    const news = parseForexFactoryNews(markdown);

    console.log(`Parsed ${news.length} news items`);

    return new Response(
      JSON.stringify({ success: true, news }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping news:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseForexFactoryNews(markdown: string): NewsItem[] {
  const news: NewsItem[] = [];
  const lines = markdown.split('\n');
  const now = new Date();

  // Time patterns to match
  const timePatterns = [
    /(\d{1,2})\s*(min|mins|minute|minutes)\s*ago/i,
    /(\d{1,2})\s*(hour|hours|hr|hrs)\s*ago/i,
    /(\d{1,2})\s*(day|days)\s*ago/i,
    /(\d{1,2}):(\d{2})\s*(am|pm)/i,
    /(today|yesterday)/i,
    /(\w+)\s+(\d{1,2}),?\s*(\d{4})?/i, // "Dec 19, 2024" or "Dec 19"
  ];

  // Keywords for categorization
  const forexKeywords = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'forex', 'currency', 'dollar', 'euro', 'yen', 'pound', 'fx'];
  const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 'xrp', 'solana'];
  const indicesKeywords = ['s&p', 'nasdaq', 'dow', 'dax', 'ftse', 'nikkei', 'stock', 'index', 'indices', 'wall street', 'equity'];
  const commoditiesKeywords = ['gold', 'silver', 'oil', 'crude', 'wti', 'brent', 'xauusd', 'commodity', 'natural gas'];

  // Sentiment keywords
  const bullishKeywords = ['rise', 'rises', 'rising', 'gain', 'gains', 'surge', 'surges', 'rally', 'rallies', 'jump', 'jumps', 'soar', 'climb', 'bullish', 'higher', 'up', 'strong', 'strength', 'growth', 'positive', 'boost', 'recover', 'advance', 'break above'];
  const bearishKeywords = ['fall', 'falls', 'falling', 'drop', 'drops', 'plunge', 'plunges', 'decline', 'declines', 'sink', 'sinks', 'tumble', 'bearish', 'lower', 'down', 'weak', 'weakness', 'loss', 'losses', 'negative', 'slump', 'break below', 'crash'];

  let currentTime: Date | null = null;
  let newsCount = 0;
  
  for (let i = 0; i < lines.length && newsCount < 20; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try to extract time from the line or nearby lines
    const extractedTime = extractTimeFromText(line, now, timePatterns);
    if (extractedTime) {
      currentTime = extractedTime;
    }
    
    // Skip short lines, headers, navigation, and non-content
    if (line.length < 35 || line.startsWith('#') || line.startsWith('|') || line.includes('---') || line.startsWith('[') || line.startsWith('!')) continue;
    
    // Look for news-like content
    if (/^[A-Z]/.test(line) && line.length > 40 && !line.includes('Cookie') && !line.includes('Privacy')) {
      const lowerLine = line.toLowerCase();
      
      // Skip navigation/UI elements
      if (lowerLine.includes('sign in') || lowerLine.includes('register') || lowerLine.includes('menu') || lowerLine.includes('copyright')) continue;
      
      // Determine category
      let category: 'forex' | 'crypto' | 'indices' | 'commodities' = 'forex';
      if (cryptoKeywords.some(k => lowerLine.includes(k.toLowerCase()))) category = 'crypto';
      else if (indicesKeywords.some(k => lowerLine.includes(k.toLowerCase()))) category = 'indices';
      else if (commoditiesKeywords.some(k => lowerLine.includes(k.toLowerCase()))) category = 'commodities';

      // Determine sentiment with weighted scoring
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      const bullishCount = bullishKeywords.filter(k => lowerLine.includes(k)).length;
      const bearishCount = bearishKeywords.filter(k => lowerLine.includes(k)).length;
      if (bullishCount > bearishCount && bullishCount > 0) sentiment = 'bullish';
      else if (bearishCount > bullishCount && bearishCount > 0) sentiment = 'bearish';

      // Determine importance
      let importance: 'high' | 'medium' | 'low' = 'medium';
      const highImpactKeywords = ['breaking', 'urgent', 'fed', 'ecb', 'boj', 'boe', 'rba', 'rate decision', 'interest rate', 'inflation', 'cpi', 'gdp', 'nfp', 'fomc', 'employment', 'payroll'];
      if (highImpactKeywords.some(k => lowerLine.includes(k))) importance = 'high';
      else if (lowerLine.includes('speech') || lowerLine.includes('minutes')) importance = 'medium';

      // Extract tags
      const tags: string[] = [];
      if (sentiment === 'bullish') tags.push('Risk-On');
      else if (sentiment === 'bearish') tags.push('Risk-Off');
      
      // Add currency/asset tags (check uppercase versions)
      const currencyTags = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNY'];
      currencyTags.forEach(curr => {
        if (line.includes(curr) || lowerLine.includes(curr.toLowerCase())) {
          if (!tags.includes(curr)) tags.push(curr);
        }
      });

      // Clean title
      const title = line
        .substring(0, 150)
        .replace(/[*#\[\]]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Use extracted time or calculate based on position
      const publishedAt = currentTime || new Date(now.getTime() - newsCount * 20 * 60 * 1000);
      
      // Avoid duplicates
      const isDuplicate = news.some(n => 
        n.title.toLowerCase().substring(0, 50) === title.toLowerCase().substring(0, 50)
      );
      
      if (!isDuplicate && title.length > 20) {
        news.push({
          id: `news-${Date.now()}-${newsCount}`,
          title,
          summary: title,
          source: 'ForexFactory',
          publishedAt: publishedAt.toISOString(),
          category,
          sentiment,
          tags: tags.slice(0, 4),
          importance,
        });
        
        newsCount++;
        currentTime = null; // Reset for next news item
      }
    }
  }

  // Sort by publication time (newest first)
  return news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

function extractTimeFromText(text: string, now: Date, patterns: RegExp[]): Date | null {
  const lowerText = text.toLowerCase();
  
  // Check for "X minutes ago"
  const minMatch = lowerText.match(/(\d{1,2})\s*(min|mins|minute|minutes)\s*ago/i);
  if (minMatch) {
    const mins = parseInt(minMatch[1]);
    return new Date(now.getTime() - mins * 60 * 1000);
  }
  
  // Check for "X hours ago"
  const hourMatch = lowerText.match(/(\d{1,2})\s*(hour|hours|hr|hrs)\s*ago/i);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]);
    return new Date(now.getTime() - hours * 60 * 60 * 1000);
  }
  
  // Check for "X days ago"
  const dayMatch = lowerText.match(/(\d{1,2})\s*(day|days)\s*ago/i);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  
  // Check for "today" or "yesterday"
  if (lowerText.includes('today')) {
    return new Date(now);
  }
  if (lowerText.includes('yesterday')) {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  // Check for time format "8:30am" or "2:00pm"
  const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const isPM = timeMatch[3].toLowerCase() === 'pm';
    
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);
    
    // If time is in the future, assume it's from yesterday
    if (result > now) {
      result.setDate(result.getDate() - 1);
    }
    
    return result;
  }
  
  // Check for date format "Dec 19" or "December 19, 2024"
  const months: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
    aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
    nov: 10, november: 10, dec: 11, december: 11
  };
  
  const dateMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i);
  if (dateMatch) {
    const month = months[dateMatch[1].toLowerCase()];
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
    
    if (month !== undefined && day >= 1 && day <= 31) {
      return new Date(year, month, day, 12, 0, 0);
    }
  }
  
  return null;
}
