import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Calculator as CalcIcon, AlertTriangle, Send, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AssetCombobox from '@/components/AssetCombobox';

export const PENDING_TRADE_KEY = 'pending_trade_data';
import { PIP_VALUES, getPipSize, getAssetCategory } from '@/data/assets';

const Calculator: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    capital: '',
    riskPercent: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    asset: 'EUR/USD',
  });

  const [results, setResults] = useState<{
    riskAmount: number;
    slPips: number;
    tpPips: number;
    lotSize: number;
    lotSizeMini: number;
    lotSizeMicro: number;
    rrRatio: number;
    slValue: number;
    tpValue: number;
    direction: 'buy' | 'sell';
  } | null>(null);

  const [warnings, setWarnings] = useState<string[]>([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateLot = () => {
    const capital = parseFloat(formData.capital);
    const riskPercent = parseFloat(formData.riskPercent);
    const entryPrice = parseFloat(formData.entryPrice);
    const stopLoss = parseFloat(formData.stopLoss);
    const takeProfit = parseFloat(formData.takeProfit);
    const asset = formData.asset;

    if (!capital || !riskPercent || !entryPrice || !stopLoss) {
      toast.error(t('fillAllFields'));
      return;
    }

    const direction: 'buy' | 'sell' = entryPrice > stopLoss ? 'buy' : 'sell';
    const pipSize = getPipSize(asset);
    const category = getAssetCategory(asset);
    const slDistance = Math.abs(entryPrice - stopLoss);
    const slPips = slDistance / pipSize;
    const riskAmount = (capital * riskPercent) / 100;
    
    let pipValue = PIP_VALUES[asset] || 10;
    
    if (category.includes('Forex') && !asset.includes('JPY')) {
      pipValue = 10;
    } else if (asset.includes('JPY')) {
      pipValue = 1000 / 100;
    } else if (asset === 'XAU/USD') {
      pipValue = 1;
    } else if (asset === 'XAG/USD') {
      pipValue = 50;
    } else if (category.includes('Indices')) {
      pipValue = 1;
    } else if (category.includes('Crypto')) {
      pipValue = 1;
    }
    
    const lotSize = riskAmount / (slPips * pipValue);
    const lotSizeMini = lotSize * 10;
    const lotSizeMicro = lotSize * 100;
    
    let tpPips = 0;
    let rrRatio = 0;
    if (takeProfit) {
      const tpDistance = Math.abs(takeProfit - entryPrice);
      tpPips = tpDistance / pipSize;
      rrRatio = tpPips / slPips;
    }

    const slValue = riskAmount;
    const tpValue = riskAmount * rrRatio;

    const newWarnings: string[] = [];
    if (riskPercent > 2) newWarnings.push(`⚠️ ${t('warningRisk2')}`);
    if (riskPercent > 5) newWarnings.push(`🚨 ${t('warningRisk5')}`);
    if (slPips < 5 && category.includes('Forex')) newWarnings.push(`⚠️ ${t('warningSLTight')}`);
    if (slPips < 10 && category.includes('Forex')) newWarnings.push(`💡 ${t('warningSpread')}`);
    if (rrRatio < 1 && rrRatio > 0) newWarnings.push(`⚠️ ${t('warningRRBad')}`);
    if (lotSize > 10) newWarnings.push(`🚨 ${t('warningLotHigh')}`);

    setWarnings(newWarnings);
    setResults({
      riskAmount: Math.round(riskAmount * 100) / 100,
      slPips: Math.round(slPips * 10) / 10,
      tpPips: Math.round(tpPips * 10) / 10,
      lotSize: Math.round(lotSize * 100) / 100,
      lotSizeMini: Math.round(lotSizeMini * 100) / 100,
      lotSizeMicro: Math.round(lotSizeMicro * 100) / 100,
      rrRatio: Math.round(rrRatio * 100) / 100,
      slValue: Math.round(slValue * 100) / 100,
      tpValue: Math.round(tpValue * 100) / 100,
      direction,
    });

    toast.success(t('calculationDone'));
  };

  return (
    <div className="py-3 md:py-4 max-w-5xl mx-auto">
      {/* Header - Compact on mobile */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="font-display text-xl md:text-3xl font-bold text-foreground">
            {t('calculator')}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
            {t('calculatorDesc')}
          </p>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <CalcIcon className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Input Section - Optimized for mobile */}
        <div className="glass-card p-4 md:p-6 space-y-3 md:space-y-6 animate-fade-in">
          <h3 className="font-display font-semibold text-foreground text-sm md:text-base">{t('parameters')}</h3>

          {/* Asset Combobox - Compact single component */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t('asset')}</span>
            <AssetCombobox
              value={formData.asset}
              onValueChange={(v) => handleInputChange('asset', v)}
            />
            <p className="text-[10px] text-muted-foreground">
              {getAssetCategory(formData.asset)}
            </p>
          </div>

          {/* Capital & Risk - Side by side */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('capital')} ({getCurrencySymbol()})</span>
              <Input
                type="number"
                placeholder="10000"
                value={formData.capital}
                onChange={(e) => handleInputChange('capital', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('riskPercent')} (%)</span>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={formData.riskPercent}
                onChange={(e) => handleInputChange('riskPercent', e.target.value)}
                className={cn(
                  "h-9 text-sm",
                  parseFloat(formData.riskPercent) > 2 && "border-loss/50"
                )}
              />
            </div>
          </div>

          {/* Entry & SL - Side by side */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('entryPrice')}</span>
              <Input
                type="number"
                step="any"
                placeholder="1.08500"
                value={formData.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {t('stopLoss')}
                <span className="text-[10px] text-loss">*</span>
              </span>
              <Input
                type="number"
                step="any"
                placeholder="1.08000"
                value={formData.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                className="h-9 text-sm border-loss/30 focus:border-loss"
              />
            </div>
          </div>

          {/* Take Profit */}
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {t('takeProfit')}
              <span className="text-[10px] text-muted-foreground">({language === 'fr' ? 'optionnel' : 'optional'})</span>
            </span>
            <Input
              type="number"
              step="any"
              placeholder="1.09500"
              value={formData.takeProfit}
              onChange={(e) => handleInputChange('takeProfit', e.target.value)}
              className="h-9 text-sm border-profit/30 focus:border-profit"
            />
          </div>

          <Button
            onClick={calculateLot}
            className="w-full gap-2 bg-gradient-primary hover:opacity-90 font-display h-10"
          >
            <CalcIcon className="w-4 h-4" />
            {t('calculate')}
          </Button>

          {/* Formulas - Hidden on mobile, shown on md+ */}
          <div className="hidden md:block p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">{t('formulasUsed')}:</p>
            <p>• {t('risk')} ($) = {t('capital')} × ({t('risk')}% / 100)</p>
            <p>• SL (pips) = |{t('entryPrice')} - SL| / Pip Size</p>
            <p>• Lot = {t('risk')} ($) / (SL pips × Pip Value)</p>
            <p>• R:R = TP pips / SL pips</p>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4 md:space-y-6">
          {results && (
            <div className="glass-card p-4 md:p-6 animate-fade-in">
              <h3 className="font-display font-semibold text-foreground mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-base">
                {t('results')}
                {results.direction === 'buy' ? (
                  <span className="flex items-center gap-1 text-xs text-profit">
                    <TrendingUp className="w-3 h-3" /> BUY
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-loss">
                    <TrendingDown className="w-3 h-3" /> SELL
                  </span>
                )}
              </h3>

              {/* Main Result - Lot Size */}
              <div className="text-center p-4 md:p-6 rounded-xl bg-primary/10 border border-primary/30 mb-4 md:mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  {t('recommendedLotSize')}
                </p>
                <p className="font-display text-4xl md:text-5xl font-bold text-primary neon-text">
                  {results.lotSize}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('standardLots')}
                </p>
                <div className="flex justify-center gap-3 mt-2 text-xs">
                  <span className="text-muted-foreground">{t('mini')}: <span className="text-foreground font-medium">{results.lotSizeMini}</span></span>
                  <span className="text-muted-foreground">{t('micro')}: <span className="text-foreground font-medium">{results.lotSizeMicro}</span></span>
                </div>
              </div>

              {/* Detailed Results - Compact grid */}
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground">{t('riskAmount')}</p>
                  <p className="font-display text-lg md:text-xl font-bold text-foreground">
                    {formatAmount(results.riskAmount, false, false)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground">R:R Ratio</p>
                  <p className={cn(
                    "font-display text-lg md:text-xl font-bold",
                    results.rrRatio >= 2 ? "text-profit" : results.rrRatio >= 1 ? "text-primary" : "text-loss"
                  )}>
                    1:{results.rrRatio}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-loss/10 border border-loss/20">
                  <p className="text-[10px] text-muted-foreground">{t('slPoints')}</p>
                  <p className="font-display text-lg md:text-xl font-bold text-loss">{results.slPips} pips</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatAmount(results.slValue, false, false)}</p>
                </div>
                <div className="p-3 rounded-lg bg-profit/10 border border-profit/20">
                  <p className="text-[10px] text-muted-foreground">{t('tpPoints')}</p>
                  <p className="font-display text-lg md:text-xl font-bold text-profit">{results.tpPips || '-'} pips</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatAmount(results.tpValue || 0, false, false)}</p>
                </div>
              </div>

              {/* Visual SL/TP - Compact */}
              {results.tpPips > 0 && (
                <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-2 text-center">{t('visualization')}</p>
                  <div className="relative h-6 rounded-full bg-gradient-to-r from-loss via-secondary to-profit overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-foreground"
                      style={{ left: `${(results.slPips / (results.slPips + results.tpPips)) * 100}%` }}
                    />
                    <div className="absolute top-0 left-0 bottom-0 flex items-center px-2 text-[10px] text-loss-foreground font-medium">SL</div>
                    <div className="absolute top-0 right-0 bottom-0 flex items-center px-2 text-[10px] text-profit-foreground font-medium">TP</div>
                  </div>
                </div>
              )}

              {/* Send to Trade */}
              <Button
                variant="outline"
                className="w-full mt-4 gap-2 border-primary/50 hover:bg-primary/10 h-9 text-sm"
                onClick={() => {
                  const pendingTradeData = {
                    asset: formData.asset,
                    entryPrice: formData.entryPrice,
                    stopLoss: formData.stopLoss,
                    takeProfit: formData.takeProfit,
                    lotSize: results.lotSize.toString(),
                    direction: results.direction,
                    risk: formData.riskPercent,
                  };
                  localStorage.setItem(PENDING_TRADE_KEY, JSON.stringify(pendingTradeData));
                  toast.success(t('dataSentToTrade'));
                  navigate('/add-trade');
                }}
              >
                <Send className="w-3 h-3" />
                {t('sendToTrade')}
              </Button>
            </div>
          )}

          {/* Warnings - Compact */}
          {warnings.length > 0 && (
            <div className="glass-card p-3 md:p-4 border-loss/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-loss" />
                <h4 className="font-semibold text-loss text-sm">{t('warnings')}</h4>
              </div>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-xs text-muted-foreground">{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Best Practices - Compact */}
          <div className="glass-card p-3 md:p-4 border-profit/30 animate-fade-in hidden md:block" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-profit" />
              <h4 className="font-semibold text-profit text-sm">{t('bestPractices')}</h4>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-profit" />
                {t('tipNeverRisk2')}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-profit" />
                {language === 'fr' ? 'Visez un R:R minimum de 1:2' : 'Aim for a minimum R:R of 1:2'}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-profit" />
                {language === 'fr' ? 'Toujours placer un Stop Loss' : 'Always set a Stop Loss'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
