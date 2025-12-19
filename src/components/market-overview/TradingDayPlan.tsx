import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, AlertTriangle, Eye, EyeOff, Target } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TradingDayPlanProps {
  tradingStyle: 'scalping' | 'daytrading' | 'swing';
  favoriteAssets: string[];
}

interface PlanItem {
  time: string;
  type: 'session' | 'watch' | 'avoid' | 'event';
  title: string;
  description: string;
  assets?: string[];
  importance: 'high' | 'medium' | 'low';
}

const TradingDayPlan: React.FC<TradingDayPlanProps> = ({ tradingStyle, favoriteAssets }) => {
  const today = new Date();

  // Generate dynamic plan based on trading style
  const plan = useMemo((): PlanItem[] => {
    const basePlan: PlanItem[] = [
      {
        time: '00:00 - 07:00',
        type: 'session',
        title: 'Session Asie',
        description: 'Volatilité modérée sur les paires JPY et AUD. Bon pour le range trading.',
        assets: ['USDJPY', 'AUDUSD', 'NZDUSD'],
        importance: tradingStyle === 'swing' ? 'low' : 'medium',
      },
      {
        time: '08:00 - 09:00',
        type: 'watch',
        title: 'Ouverture Londres',
        description: 'Forte volatilité attendue. Breakouts fréquents sur les paires majeures.',
        assets: ['EURUSD', 'GBPUSD', 'XAUUSD'],
        importance: 'high',
      },
      {
        time: '10:00 - 11:00',
        type: 'event',
        title: 'Publications économiques EU',
        description: 'Données PMI et inflation zone Euro. Volatilité EUR élevée.',
        assets: ['EURUSD', 'EURGBP', 'DAX'],
        importance: 'high',
      },
      {
        time: '13:00 - 14:30',
        type: 'watch',
        title: 'Overlap Londres/NY',
        description: 'Période de plus forte liquidité. Optimal pour les trades directionnels.',
        assets: favoriteAssets.slice(0, 3),
        importance: 'high',
      },
      {
        time: '14:30 - 15:00',
        type: 'event',
        title: 'Données US',
        description: 'NFP, IPC ou annonces Fed possibles. Volatilité extrême.',
        assets: ['EURUSD', 'XAUUSD', 'SP500', 'DXY'],
        importance: 'high',
      },
      {
        time: '15:30 - 16:00',
        type: 'avoid',
        title: 'Post-données US',
        description: 'Période de digestion. Faux signaux fréquents. Attendre la stabilisation.',
        assets: [],
        importance: 'high',
      },
      {
        time: '16:00 - 20:00',
        type: 'watch',
        title: 'Session US active',
        description: 'Tendances établies, bon suivi de momentum. Indices US en focus.',
        assets: ['SP500', 'NASDAQ', 'BTC'],
        importance: 'medium',
      },
      {
        time: '21:00 - 23:00',
        type: 'session',
        title: 'Fin de session US',
        description: 'Réduction de volatilité. Consolidation habituelle.',
        assets: [],
        importance: 'low',
      },
    ];

    // Adjust based on trading style
    if (tradingStyle === 'swing') {
      return basePlan.filter(item => item.importance !== 'low');
    }

    return basePlan;
  }, [tradingStyle, favoriteAssets]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'session': return <Clock className="h-4 w-4" />;
      case 'watch': return <Eye className="h-4 w-4" />;
      case 'avoid': return <EyeOff className="h-4 w-4" />;
      case 'event': return <AlertTriangle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'watch': return 'text-profit border-profit/30 bg-profit/10';
      case 'avoid': return 'text-loss border-loss/30 bg-loss/10';
      case 'event': return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      default: return 'text-primary border-primary/30 bg-primary/10';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'watch': return 'À surveiller';
      case 'avoid': return 'À éviter';
      case 'event': return 'Événement';
      default: return 'Session';
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Plan du Jour
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {format(today, 'EEEE d MMMM', { locale: fr })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[350px]">
          <div className="p-4 space-y-3">
            {plan.map((item, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getTypeColor(item.type)}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <span className="font-mono text-xs">{item.time}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      item.importance === 'high' ? 'bg-loss/20 text-loss' :
                      item.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    {item.importance === 'high' ? '🔴' : item.importance === 'medium' ? '🟡' : '🟢'}
                  </Badge>
                </div>

                <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.description}</p>

                {item.assets && item.assets.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.assets.map((asset, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs font-mono">
                        {asset}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TradingDayPlan;
