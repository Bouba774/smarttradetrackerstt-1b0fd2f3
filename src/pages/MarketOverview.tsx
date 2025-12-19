import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings2, 
  Bell, 
  Clock, 
  AlertTriangle, 
  Gauge,
  Calendar,
  Newspaper,
  TrendingUp,
  Brain,
  Grid3X3,
  ClipboardList,
  Activity
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import all market overview sections
import EconomicCalendar from '@/components/market-overview/EconomicCalendar';
import MarketNews from '@/components/market-overview/MarketNews';
import MarketSentiment from '@/components/market-overview/MarketSentiment';
import AIEconomicPrediction from '@/components/market-overview/AIEconomicPrediction';
import MarketHeatmap from '@/components/market-overview/MarketHeatmap';
import TradingDayPlan from '@/components/market-overview/TradingDayPlan';
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
  alerts: boolean;
  riskOnOff: boolean;
}

type TabKey = 'calendar' | 'news' | 'sentiment' | 'heatmap' | 'plan' | 'alerts' | 'ai' | 'risk';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  prefKey: keyof SectionPreferences;
}

const tabs: TabItem[] = [
  { key: 'calendar', label: 'Calendrier', icon: Calendar, prefKey: 'economicCalendar' },
  { key: 'news', label: 'News', icon: Newspaper, prefKey: 'news' },
  { key: 'sentiment', label: 'Sentiment', icon: TrendingUp, prefKey: 'sentiment' },
  { key: 'heatmap', label: 'Heatmap', icon: Grid3X3, prefKey: 'heatmap' },
  { key: 'plan', label: 'Plan', icon: ClipboardList, prefKey: 'dayPlan' },
  { key: 'alerts', label: 'Alertes', icon: Bell, prefKey: 'alerts' },
  { key: 'ai', label: 'IA', icon: Brain, prefKey: 'aiPrediction' },
  { key: 'risk', label: 'Risk', icon: Activity, prefKey: 'riskOnOff' },
];

const MarketOverview: React.FC = () => {
  const { t } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  
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

  // Filter visible tabs based on preferences
  const visibleTabs = tabs.filter(tab => sectionPrefs[tab.prefKey]);

  // Handle tab change with animation
  const handleTabChange = (newTab: TabKey) => {
    if (newTab !== activeTab) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveTab(newTab);
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 150);
    }
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'calendar':
        return sectionPrefs.economicCalendar ? <EconomicCalendar /> : null;
      case 'news':
        return sectionPrefs.news ? <MarketNews /> : null;
      case 'sentiment':
        return sectionPrefs.sentiment ? <MarketSentiment favoriteAssets={favoriteAssets} /> : null;
      case 'heatmap':
        return sectionPrefs.heatmap ? <MarketHeatmap /> : null;
      case 'plan':
        return sectionPrefs.dayPlan ? <TradingDayPlan tradingStyle={tradingStyle} favoriteAssets={favoriteAssets} /> : null;
      case 'alerts':
        return sectionPrefs.alerts ? <SmartAlerts /> : null;
      case 'ai':
        return sectionPrefs.aiPrediction ? <AIEconomicPrediction /> : null;
      case 'risk':
        return sectionPrefs.riskOnOff ? <RiskOnOffIndicator /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with global indicators */}
      <MarketOverviewHeader tradingStyle={tradingStyle} />

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between py-2 gap-2">
            {/* Navigation Tabs */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1 px-1">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 whitespace-nowrap",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md scale-105" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        isActive && "scale-110"
                      )} />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settings Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shrink-0">
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
        </div>
      </div>

      {/* Main Content Area with Animation */}
      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4">
        <div 
          className={cn(
            "transition-all duration-300 ease-out",
            isAnimating 
              ? "opacity-0 translate-y-2 scale-[0.98]" 
              : "opacity-100 translate-y-0 scale-100"
          )}
        >
          {renderActiveContent()}
        </div>
        
        {/* Disclaimer */}
        <div className="glass-card p-4 text-center mt-4">
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
