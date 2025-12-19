const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    return new Response(null, { headers: corsHeaders });
  }

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
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseForexFactoryNews(markdown: string): NewsItem[] {
  const news: NewsItem[] = [];
  const lines = markdown.split('\n').filter(l => l.trim());

  // Keywords for categorization
  const forexKeywords = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'forex', 'currency', 'dollar', 'euro', 'yen', 'pound'];
  const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi'];
  const indicesKeywords = ['S&P', 'nasdaq', 'dow', 'dax', 'ftse', 'nikkei', 'stock', 'index', 'indices'];
  const commoditiesKeywords = ['gold', 'silver', 'oil', 'crude', 'wti', 'brent', 'xauusd', 'commodity'];

  // Sentiment keywords
  const bullishKeywords = ['rise', 'gain', 'surge', 'rally', 'jump', 'soar', 'climb', 'bullish', 'higher', 'up', 'strong', 'growth', 'positive'];
  const bearishKeywords = ['fall', 'drop', 'plunge', 'decline', 'sink', 'tumble', 'bearish', 'lower', 'down', 'weak', 'loss', 'negative'];

  let newsCount = 0;
  
  for (let i = 0; i < lines.length && newsCount < 15; i++) {
    const line = lines[i].trim();
    
    // Skip short lines, headers, and navigation
    if (line.length < 30 || line.startsWith('#') || line.startsWith('|') || line.includes('---')) continue;
    
    // Look for news-like content (starts with capital, has substance)
    if (/^[A-Z]/.test(line) && line.length > 40) {
      const lowerLine = line.toLowerCase();
      
      // Determine category
      let category: 'forex' | 'crypto' | 'indices' | 'commodities' = 'forex';
      if (cryptoKeywords.some(k => lowerLine.includes(k))) category = 'crypto';
      else if (indicesKeywords.some(k => lowerLine.includes(k))) category = 'indices';
      else if (commoditiesKeywords.some(k => lowerLine.includes(k))) category = 'commodities';

      // Determine sentiment
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      const bullishCount = bullishKeywords.filter(k => lowerLine.includes(k)).length;
      const bearishCount = bearishKeywords.filter(k => lowerLine.includes(k)).length;
      if (bullishCount > bearishCount) sentiment = 'bullish';
      else if (bearishCount > bullishCount) sentiment = 'bearish';

      // Determine importance
      let importance: 'high' | 'medium' | 'low' = 'medium';
      const highImpactKeywords = ['breaking', 'urgent', 'fed', 'ecb', 'boj', 'rate', 'inflation', 'gdp', 'nfp', 'fomc'];
      if (highImpactKeywords.some(k => lowerLine.includes(k))) importance = 'high';

      // Extract tags
      const tags: string[] = [];
      if (sentiment === 'bullish') tags.push('Risk-On');
      else if (sentiment === 'bearish') tags.push('Risk-Off');
      
      // Add currency/asset tags
      forexKeywords.slice(0, 8).forEach(curr => {
        if (lowerLine.includes(curr.toLowerCase())) tags.push(curr);
      });

      const title = line.substring(0, 120).replace(/[*#]/g, '').trim();
      
      news.push({
        id: `news-${newsCount + 1}`,
        title,
        summary: title,
        source: 'ForexFactory',
        publishedAt: new Date(Date.now() - newsCount * 30 * 60 * 1000).toISOString(),
        category,
        sentiment,
        tags: tags.slice(0, 4),
        importance,
      });
      
      newsCount++;
    }
  }

  return news;
}
