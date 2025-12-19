import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BellOff, AlertTriangle, TrendingUp, TrendingDown, Activity, Clock, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'news' | 'sentiment' | 'volatility' | 'price';
  title: string;
  description: string;
  asset?: string;
  importance: 'high' | 'medium' | 'low';
  timestamp: Date;
  read: boolean;
}

// Mock alerts
const generateMockAlerts = (): Alert[] => {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'news',
      title: 'Annonce Fed dans 30 minutes',
      description: 'Décision sur les taux FOMC imminente. Forte volatilité attendue sur USD.',
      asset: 'USD',
      importance: 'high',
      timestamp: new Date(now.getTime() - 5 * 60 * 1000),
      read: false,
    },
    {
      id: '2',
      type: 'sentiment',
      title: 'Changement de sentiment BTC',
      description: 'Le sentiment passe de Neutral à Bullish (+15% en 4h).',
      asset: 'BTC',
      importance: 'medium',
      timestamp: new Date(now.getTime() - 25 * 60 * 1000),
      read: false,
    },
    {
      id: '3',
      type: 'volatility',
      title: 'Volatilité extrême XAUUSD',
      description: 'L\'or atteint un pic de volatilité. ATR +45% vs moyenne.',
      asset: 'XAUUSD',
      importance: 'high',
      timestamp: new Date(now.getTime() - 45 * 60 * 1000),
      read: true,
    },
    {
      id: '4',
      type: 'price',
      title: 'EURUSD franchit 1.0900',
      description: 'Résistance majeure cassée. Potentiel de continuation haussière.',
      asset: 'EURUSD',
      importance: 'medium',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '5',
      type: 'news',
      title: 'IPC US publié',
      description: 'Inflation à 3.1% vs 3.2% attendu. Dollar en baisse.',
      asset: 'DXY',
      importance: 'high',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      read: true,
    },
  ];
};

const SmartAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(generateMockAlerts);
  const [settings, setSettings] = useState({
    newsAlerts: true,
    sentimentAlerts: true,
    volatilityAlerts: true,
    priceAlerts: true,
  });
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, read: true } : a
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'news': return <Bell className="h-4 w-4" />;
      case 'sentiment': return <TrendingUp className="h-4 w-4" />;
      case 'volatility': return <Activity className="h-4 w-4" />;
      case 'price': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'news': return 'bg-primary/20 text-primary border-primary/30';
      case 'sentiment': return 'bg-profit/20 text-profit border-profit/30';
      case 'volatility': return 'bg-loss/20 text-loss border-loss/30';
      case 'price': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (alert.type === 'news' && !settings.newsAlerts) return false;
    if (alert.type === 'sentiment' && !settings.sentimentAlerts) return false;
    if (alert.type === 'volatility' && !settings.volatilityAlerts) return false;
    if (alert.type === 'price' && !settings.priceAlerts) return false;
    return true;
  });

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Alertes Intelligentes
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-loss text-loss-foreground">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Tout lu
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs text-muted-foreground mb-3">Types d'alertes actives:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'newsAlerts', label: 'News' },
                { key: 'sentimentAlerts', label: 'Sentiment' },
                { key: 'volatilityAlerts', label: 'Volatilité' },
                { key: 'priceAlerts', label: 'Prix' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-xs">{label}</Label>
                  <Switch
                    id={key}
                    checked={settings[key as keyof typeof settings]}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="divide-y divide-border">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">Aucune alerte active</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 hover:bg-secondary/30 transition-colors cursor-pointer ${
                    !alert.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => markAsRead(alert.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(alert.type)}`}>
                      {getTypeIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${!alert.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {alert.title}
                        </h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs flex-shrink-0 ${
                            alert.importance === 'high' ? 'bg-loss/20 text-loss' :
                            alert.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-muted text-muted-foreground'
                          }`}
                        >
                          {alert.importance === 'high' ? '🔴' : alert.importance === 'medium' ? '🟡' : '🟢'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(alert.timestamp, { addSuffix: true, locale: fr })}</span>
                        {alert.asset && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs font-mono">
                              {alert.asset}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SmartAlerts;
