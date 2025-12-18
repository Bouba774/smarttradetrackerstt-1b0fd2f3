import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTradeFocus } from '@/hooks/useTradeFocus';
import { useTrades } from '@/hooks/useTrades';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Focus,
  Settings,
  Target,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { parseISO, isToday } from 'date-fns';

const TradeFocusMode: React.FC = () => {
  const { language } = useLanguage();
  const { trades } = useTrades();
  const {
    isEnabled,
    tradingPlan,
    dailyGoal,
    maxTrades,
    maxLoss,
    toggle,
    setTradingPlan,
    setDailyGoal,
    setMaxTrades,
    setMaxLoss,
  } = useTradeFocus();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempPlan, setTempPlan] = useState(tradingPlan);
  const [tempGoal, setTempGoal] = useState(dailyGoal);
  const [tempMaxTrades, setTempMaxTrades] = useState(maxTrades);
  const [tempMaxLoss, setTempMaxLoss] = useState(maxLoss);

  // Calculate today's stats
  const todayTrades = trades.filter(t => isToday(parseISO(t.trade_date)));
  const todayPnL = todayTrades.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
  const todayTradeCount = todayTrades.length;

  const isOverMaxTrades = todayTradeCount >= maxTrades;
  const isOverMaxLoss = todayPnL <= -maxLoss;

  const saveSettings = () => {
    setTradingPlan(tempPlan);
    setDailyGoal(tempGoal);
    setMaxTrades(tempMaxTrades);
    setMaxLoss(tempMaxLoss);
    setSettingsOpen(false);
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Focus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold text-foreground">
              {language === 'fr' ? 'Mode Trade Focus' : 'Trade Focus Mode'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {language === 'fr' ? 'Concentrez-vous sur votre plan' : 'Focus on your plan'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {language === 'fr' ? 'Paramètres Focus' : 'Focus Settings'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'fr' ? 'Plan de trading' : 'Trading Plan'}</Label>
                  <Textarea
                    value={tempPlan}
                    onChange={(e) => setTempPlan(e.target.value)}
                    placeholder={language === 'fr' 
                      ? 'Décrivez votre plan de trading...' 
                      : 'Describe your trading plan...'}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'fr' ? 'Objectif du jour' : 'Daily Goal'}</Label>
                  <Input
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    placeholder={language === 'fr' 
                      ? 'Ex: 2 trades gagnants, +50$' 
                      : 'Ex: 2 winning trades, +$50'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'fr' ? 'Max trades/jour' : 'Max trades/day'}</Label>
                    <Input
                      type="number"
                      value={tempMaxTrades}
                      onChange={(e) => setTempMaxTrades(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'fr' ? 'Perte max ($)' : 'Max loss ($)'}</Label>
                    <Input
                      type="number"
                      value={tempMaxLoss}
                      onChange={(e) => setTempMaxLoss(Number(e.target.value))}
                    />
                  </div>
                </div>
                <Button onClick={saveSettings} className="w-full">
                  {language === 'fr' ? 'Sauvegarder' : 'Save'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="icon" onClick={toggle}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        {/* Warnings */}
        {(isOverMaxTrades || isOverMaxLoss) && (
          <div className={cn(
            "w-full max-w-lg mb-8 p-4 rounded-lg border animate-pulse",
            "bg-loss/20 border-loss/50"
          )}>
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-loss" />
              <div>
                <p className="font-medium text-loss">
                  {isOverMaxLoss 
                    ? (language === 'fr' ? '⛔ Perte maximale atteinte!' : '⛔ Maximum loss reached!')
                    : (language === 'fr' ? '⚠️ Nombre max de trades atteint!' : '⚠️ Max trades reached!')}
                </p>
                <p className="text-sm text-loss/80">
                  {language === 'fr' 
                    ? 'Arrêtez de trader pour aujourd\'hui.' 
                    : 'Stop trading for today.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Stats */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg mb-8">
          <div className={cn(
            "p-4 rounded-lg border",
            todayTradeCount >= maxTrades ? "bg-loss/10 border-loss/30" : "bg-muted/30 border-border"
          )}>
            <p className="text-sm text-muted-foreground mb-1">
              {language === 'fr' ? 'Trades aujourd\'hui' : 'Trades today'}
            </p>
            <p className={cn(
              "font-display text-3xl font-bold",
              todayTradeCount >= maxTrades ? "text-loss" : "text-foreground"
            )}>
              {todayTradeCount}/{maxTrades}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-lg border",
            todayPnL <= -maxLoss ? "bg-loss/10 border-loss/30" : "bg-muted/30 border-border"
          )}>
            <p className="text-sm text-muted-foreground mb-1">P&L</p>
            <p className={cn(
              "font-display text-3xl font-bold",
              todayPnL >= 0 ? "text-profit" : "text-loss"
            )}>
              {todayPnL >= 0 ? '+' : ''}{todayPnL.toFixed(2)}$
            </p>
          </div>
        </div>

        {/* Trading Plan */}
        <div className="w-full max-w-lg space-y-6">
          {/* Goal */}
          {dailyGoal && (
            <div className="p-6 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Objectif du jour' : 'Daily Goal'}
                </h3>
              </div>
              <p className="text-lg text-foreground">{dailyGoal}</p>
            </div>
          )}

          {/* Plan */}
          {tradingPlan && (
            <div className="p-6 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-profit" />
                <h3 className="font-display font-semibold text-foreground">
                  {language === 'fr' ? 'Mon Plan' : 'My Plan'}
                </h3>
              </div>
              <p className="text-foreground whitespace-pre-wrap">{tradingPlan}</p>
            </div>
          )}

          {/* No plan set */}
          {!tradingPlan && !dailyGoal && (
            <div className="text-center py-12">
              <Focus className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                {language === 'fr' 
                  ? 'Définissez votre plan de trading dans les paramètres'
                  : 'Set your trading plan in settings'}
              </p>
              <Button onClick={() => setSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'Configurer' : 'Configure'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TradeFocusMode;
