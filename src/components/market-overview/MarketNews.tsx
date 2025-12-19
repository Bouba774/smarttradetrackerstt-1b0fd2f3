import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Newspaper, TrendingUp, TrendingDown, AlertTriangle, Clock, ExternalLink, Loader2 } from 'lucide-react';
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
  url?: string;
}

// Mock news data
const generateMockNews = (): NewsItem[] => {
  const now = new Date();
  return [
    {
      id: '1',
      title: 'La Fed maintient ses taux, signale des baisses potentielles en 2025',
      summary: 'Jerome Powell indique que l\'inflation reste préoccupante mais les indicateurs montrent un ralentissement.',
      source: 'Reuters',
      publishedAt: new Date(now.getTime() - 15 * 60 * 1000),
      category: 'forex',
      sentiment: 'bullish',
      tags: ['Risk-On', 'USD', 'Fed'],
      importance: 'high',
    },
    {
      id: '2',
      title: 'Bitcoin franchit les $45,000 suite aux approbations ETF',
      summary: 'Les flux institutionnels continuent d\'affluer vers les ETF Bitcoin spot.',
      source: 'CoinDesk',
      publishedAt: new Date(now.getTime() - 45 * 60 * 1000),
      category: 'crypto',
      sentiment: 'bullish',
      tags: ['Risk-On', 'BTC', 'ETF'],
      importance: 'high',
    },
    {
      id: '3',
      title: 'L\'or atteint un nouveau record historique à $2,150',
      summary: 'Les tensions géopolitiques et les anticipations de baisse de taux soutiennent le métal jaune.',
      source: 'Bloomberg',
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      category: 'commodities',
      sentiment: 'bullish',
      tags: ['Risk-Off', 'XAUUSD', 'Safe Haven'],
      importance: 'medium',
    },
    {
      id: '4',
      title: 'Les indices US clôturent en baisse sur fond d\'incertitude',
      summary: 'Le S&P 500 perd 0.8% après des données économiques mitigées.',
      source: 'CNBC',
      publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      category: 'indices',
      sentiment: 'bearish',
      tags: ['Risk-Off', 'SP500', 'Volatilité'],
      importance: 'medium',
    },
    {
      id: '5',
      title: 'EUR/USD teste les 1.1000 après l\'IPC européen',
      summary: 'L\'inflation en zone euro reste persistante, la BCE pourrait maintenir sa politique restrictive.',
      source: 'FXStreet',
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      category: 'forex',
      sentiment: 'neutral',
      tags: ['EUR', 'BCE', 'Inflation'],
      importance: 'medium',
    },
    {
      id: '6',
      title: 'Ethereum 2.0 : mise à jour majeure prévue pour Q1 2025',
      summary: 'Les développeurs confirment l\'implémentation de nouvelles fonctionnalités de scalabilité.',
      source: 'The Block',
      publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      category: 'crypto',
      sentiment: 'bullish',
      tags: ['ETH', 'Tech', 'Upgrade'],
      importance: 'low',
    },
  ];
};

const MarketNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>(generateMockNews);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Tout' },
    { id: 'forex', label: 'Forex' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'indices', label: 'Indices' },
    { id: 'commodities', label: 'Matières' },
  ];

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
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Newspaper className="h-5 w-5 text-primary" />
          News & Annonces
        </CardTitle>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-1 mt-3">
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
          <div className="divide-y divide-border">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="p-3 sm:p-4 hover:bg-secondary/30 transition-colors cursor-pointer group"
              >
                <div className="space-y-2">
                  {/* Header with time and importance */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(item.publishedAt, { addSuffix: true, locale: fr })}
                      </span>
                      <span>•</span>
                      <span>{item.source}</span>
                    </div>
                    <span>{getImportanceIndicator(item.importance)}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-medium text-sm text-foreground leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* AI Summary */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.summary}
                  </p>

                  {/* Tags */}
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MarketNews;
