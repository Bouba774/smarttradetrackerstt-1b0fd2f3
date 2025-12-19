import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Newspaper, TrendingUp, TrendingDown, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  category: 'forex' | 'crypto' | 'indices' | 'commodities';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tags: string[];
  importance: 'high' | 'medium' | 'low';
}

const fallbackNews: NewsItem[] = [
  {
    id: '1',
    title: 'La Fed maintient ses taux, signale des baisses potentielles',
    summary: 'Jerome Powell indique que l\'inflation reste préoccupante.',
    source: 'ForexFactory',
    publishedAt: new Date(Date.now() - 15 * 60 * 1000),
    category: 'forex',
    sentiment: 'bullish',
    tags: ['Risk-On', 'USD', 'Fed'],
    importance: 'high',
  },
  {
    id: '2',
    title: 'EUR/USD teste les 1.1000 après l\'IPC européen',
    summary: 'L\'inflation en zone euro reste persistante.',
    source: 'ForexFactory',
    publishedAt: new Date(Date.now() - 60 * 60 * 1000),
    category: 'forex',
    sentiment: 'neutral',
    tags: ['EUR', 'BCE'],
    importance: 'medium',
  },
];

const MarketNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(fallbackNews);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const categories = [
    { id: 'all', label: 'Tout' },
    { id: 'forex', label: 'Forex' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'indices', label: 'Indices' },
    { id: 'commodities', label: 'Matières' },
  ];

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-forex-news');
      
      if (error) {
        console.error('Error fetching news:', error);
        return;
      }

      if (data?.success && data?.news?.length > 0) {
        const parsedNews: NewsItem[] = data.news.map((item: any) => ({
          ...item,
          publishedAt: new Date(item.publishedAt),
        }));
        setNews(parsedNews);
        setLastUpdate(new Date());
        toast.success('News mises à jour');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredNews = news.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-profit/20 text-profit border-profit/30';
      case 'bearish': return 'bg-loss/20 text-loss border-loss/30';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-3 w-3" />;
      case 'bearish': return <TrendingDown className="h-3 w-3" />;
      default: return null;
    }
  };

  const getImportanceIndicator = (importance: string) => {
    switch (importance) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      default: return '🟢';
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Newspaper className="h-5 w-5 text-primary" />
              News & Annonces
            </CardTitle>
            <Badge variant="outline" className="text-xs">ForexFactory</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNews}
            disabled={isLoading}
            className="h-8"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>

        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Maj: {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: fr })}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1 mt-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading && news.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNews.map((item) => (
                <div
                  key={item.id}
                  className="p-3 sm:p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(item.publishedAt, { addSuffix: true, locale: fr })}</span>
                        <span>•</span>
                        <span>{item.source}</span>
                      </div>
                      <span>{getImportanceIndicator(item.importance)}</span>
                    </div>

                    <h3 className="font-medium text-sm text-foreground leading-snug">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={`text-xs ${getSentimentColor(item.sentiment)}`}>
                        {getSentimentIcon(item.sentiment)}
                        <span className="ml-1 capitalize">{item.sentiment}</span>
                      </Badge>
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className={`text-xs ${
                            tag === 'Risk-On' ? 'bg-profit/10 text-profit' :
                            tag === 'Risk-Off' ? 'bg-loss/10 text-loss' : ''
                          }`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MarketNews;
