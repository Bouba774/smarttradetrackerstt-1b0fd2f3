import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2, Bell, Clock, AlertTriangle, Gauge } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

// Import all market overview sections
import EconomicCalendar from '@/components/market-overview/EconomicCalendar';
import MarketNews from '@/components/market-overview/MarketNews';
import MarketSentiment from '@/components/market-overview/MarketSentiment';
import AIEconomicPrediction from '@/components/market-overview/AIEconomicPrediction';
import MarketHeatmap from '@/components/market-overview/MarketHeatmap';
import TradingDayPlan from '@/components/market-overview/TradingDayPlan';
import DirectionalBias from '@/components/market-overview/DirectionalBias';
import SmartAlerts from '@/components/market-overview/SmartAlerts';
import RiskOnOffIndicator from '@/components/market-overview/RiskOnOffIndicator';
import MarketOverviewHeader from '@/components/market-overview/MarketOverviewHeader';

// User preferences for sections
interface SectionPreferences {
  economicCalendar: boolean;
  news: boolean;
  sentiment: boolean;
  aiPrediction: boolean;
  heatmap: boolean;
  dayPlan: boolean;
  directionalBias: boolean;
  alerts: boolean;
  riskOnOff: boolean;
}

const MarketOverview: React.FC = () => {
  const { t } = useLanguage();
  
  const [sectionPrefs, setSectionPrefs] = useState<SectionPreferences>(() => {
    const saved = localStorage.getItem('marketOverviewPrefs');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      economicCalendar: true,
      news: true,
      sentiment: true,
      aiPrediction: true,
      heatmap: true,
      dayPlan: true,
      directionalBias: true,
      alerts: true,
      riskOnOff: true,
    };
  });

  const [tradingStyle, setTradingStyle] = useState<'scalping' | 'daytrading' | 'swing'>(() => {
    return (localStorage.getItem('tradingStyle') as any) || 'daytrading';
  });

  const [favoriteAssets, setFavoriteAssets] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteAssets');
    return saved ? JSON.parse(saved) : ['EURUSD', 'XAUUSD', 'BTC', 'SP500', 'DXY'];
  });

  // Save preferences
  useEffect(() => {
    localStorage.setItem('marketOverviewPrefs', JSON.stringify(sectionPrefs));
  }, [sectionPrefs]);

  useEffect(() => {
    localStorage.setItem('tradingStyle', tradingStyle);
  }, [tradingStyle]);

  useEffect(() => {
    localStorage.setItem('favoriteAssets', JSON.stringify(favoriteAssets));
  }, [favoriteAssets]);

  const toggleSection = (key: keyof SectionPreferences) => {
    setSectionPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with global indicators */}
      <MarketOverviewHeader tradingStyle={tradingStyle} />

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Top Row: Risk-On/Off + Quick Stats */}
        {sectionPrefs.riskOnOff && (
          <RiskOnOffIndicator />
        )}

        {/* Settings Button */}
        <div className="flex justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings') || 'Paramètres'}</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Personnalisation</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                <div className="space-y-6">
                  {/* Trading Style */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm text-foreground">Style de trading</h3>
                    <div className="space-y-2">
                      {['scalping', 'daytrading', 'swing'].map((style) => (
                        <label
                          key={style}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            tradingStyle === style 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="tradingStyle"
                            value={style}
                            checked={tradingStyle === style}
                            onChange={() => setTradingStyle(style as any)}
                            className="sr-only"
                          />
                          <span className="capitalize">{style === 'daytrading' ? 'Day Trading' : style}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Section Toggles */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm text-foreground">Sections visibles</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'economicCalendar', label: 'Calendrier économique', icon: Clock },
                        { key: 'news', label: 'News & Annonces', icon: Bell },
                        { key: 'sentiment', label: 'Sentiment de marché', icon: Gauge },
                        { key: 'aiPrediction', label: "Prédictions IA (Premium)", icon: AlertTriangle },
                        { key: 'heatmap', label: 'Heatmap globale', icon: Settings2 },
                        { key: 'dayPlan', label: 'Plan du jour', icon: Clock },
                        { key: 'directionalBias', label: 'Biais directionnel', icon: Gauge },
                        { key: 'alerts', label: 'Alertes intelligentes', icon: Bell },
                        { key: 'riskOnOff', label: 'Risk-On/Risk-Off', icon: AlertTriangle },
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor={key} className="text-sm">{label}</Label>
                          </div>
                          <Switch
                            id={key}
                            checked={sectionPrefs[key as keyof SectionPreferences]}
                            onCheckedChange={() => toggleSection(key as keyof SectionPreferences)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-4 sm:space-y-6">
            {sectionPrefs.economicCalendar && (
              <EconomicCalendar />
            )}
            
            {sectionPrefs.sentiment && (
              <MarketSentiment favoriteAssets={favoriteAssets} />
            )}
            
            {sectionPrefs.directionalBias && (
              <DirectionalBias favoriteAssets={favoriteAssets} />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            {sectionPrefs.news && (
              <MarketNews />
            )}
            
            {sectionPrefs.dayPlan && (
              <TradingDayPlan tradingStyle={tradingStyle} favoriteAssets={favoriteAssets} />
            )}
            
            {sectionPrefs.alerts && (
              <SmartAlerts />
            )}
          </div>
        </div>

        {/* Full Width Sections */}
        {sectionPrefs.heatmap && (
          <MarketHeatmap />
        )}
        
        {sectionPrefs.aiPrediction && (
          <AIEconomicPrediction />
        )}

        {/* Disclaimer */}
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong>Avertissement:</strong> Les informations fournies sont à titre informatif uniquement et ne constituent pas des conseils financiers. 
            Le trading comporte des risques importants de perte en capital. Les performances passées ne préjugent pas des performances futures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
