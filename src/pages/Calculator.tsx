import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Calculator as CalcIcon, ArrowRight, AlertTriangle, CheckCircle, Send, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const PENDING_TRADE_KEY = 'pending_trade_data';
import { ASSET_CATEGORIES, PIP_VALUES, DECIMALS, getPipSize, getAssetCategory } from '@/data/assets';

const Calculator: React.FC = () => {
  const { t } = useLanguage();
  const { formatAmount, getCurrencySymbol, currency } = useCurrency();
  const navigate = useNavigate();
  const [assetSearch, setAssetSearch] = useState('');

  const [formData, setFormData] = useState({
    capital: '',
    riskPercent: '',
    riskCash: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    asset: 'EUR/USD',
  });

  // Track which field was last modified for bidirectional calculation
  const [lastModifiedRiskField, setLastModifiedRiskField] = useState<'percent' | 'cash' | null>(null);

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

  // Filter assets based on search
  const filteredAssets = useMemo(() => {
    if (!assetSearch) return ASSET_CATEGORIES;
    const searchLower = assetSearch.toLowerCase();
    const result: { [key: string]: string[] } = {};
    
    for (const [category, assets] of Object.entries(ASSET_CATEGORIES)) {
      const filtered = assets.filter(asset => 
        asset.toLowerCase().includes(searchLower)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }
    return result;
  }, [assetSearch]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Bidirectional risk calculation
  const handleRiskPercentChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, riskPercent: value };
      const capital = parseFloat(prev.capital);
      const percent = parseFloat(value);
      
      if (!isNaN(capital) && !isNaN(percent) && capital > 0) {
        newData.riskCash = ((capital * percent) / 100).toFixed(2);
      } else {
        newData.riskCash = '';
      }
      return newData;
    });
    setLastModifiedRiskField('percent');
  };

  const handleRiskCashChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, riskCash: value };
      const capital = parseFloat(prev.capital);
      const cash = parseFloat(value);
      
      if (!isNaN(capital) && !isNaN(cash) && capital > 0) {
        newData.riskPercent = ((cash / capital) * 100).toFixed(2);
      } else {
        newData.riskPercent = '';
      }
      return newData;
    });
    setLastModifiedRiskField('cash');
  };

  const handleCapitalChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, capital: value };
      const capital = parseFloat(value);
      
      // Recalculate based on last modified field
      if (lastModifiedRiskField === 'percent' && prev.riskPercent) {
        const percent = parseFloat(prev.riskPercent);
        if (!isNaN(capital) && !isNaN(percent) && capital > 0) {
          newData.riskCash = ((capital * percent) / 100).toFixed(2);
        }
      } else if (lastModifiedRiskField === 'cash' && prev.riskCash) {
        const cash = parseFloat(prev.riskCash);
        if (!isNaN(capital) && !isNaN(cash) && capital > 0) {
          newData.riskPercent = ((cash / capital) * 100).toFixed(2);
        }
      }
      return newData;
    });
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

    // Determine direction based on entry vs SL
    const direction: 'buy' | 'sell' = entryPrice > stopLoss ? 'buy' : 'sell';
    
    // Get asset-specific values
    const pipSize = getPipSize(asset);
    const category = getAssetCategory(asset);
    
    // Calculate SL distance in pips/points
    const slDistance = Math.abs(entryPrice - stopLoss);
    const slPips = slDistance / pipSize;
    
    // Risk amount in currency
    const riskAmount = (capital * riskPercent) / 100;
    
    // Get pip value for this asset (or default)
    let pipValue = PIP_VALUES[asset] || 10;
    
    // Adjust pip value based on asset type
    if (category.includes('Forex') && !asset.includes('JPY')) {
      pipValue = 10; // Standard forex pip value per lot
    } else if (asset.includes('JPY')) {
      pipValue = 1000 / 100; // JPY pip value adjusted
    } else if (asset === 'XAU/USD') {
      pipValue = 1; // Gold: $1 per 0.01 movement per lot
    } else if (asset === 'XAG/USD') {
      pipValue = 50; // Silver
    } else if (category.includes('Indices')) {
      pipValue = 1; // Indices: typically $1 per point
    } else if (category.includes('Crypto')) {
      pipValue = 1; // Crypto: value depends on lot size
    }
    
    // Lot size calculation: LotSize = RiskMoney / (SL_pips * pip_value)
    const lotSize = riskAmount / (slPips * pipValue);
    const lotSizeMini = lotSize * 10;
    const lotSizeMicro = lotSize * 100;
    
    // TP calculations
    let tpPips = 0;
    let rrRatio = 0;
    if (takeProfit) {
      const tpDistance = Math.abs(takeProfit - entryPrice);
      tpPips = tpDistance / pipSize;
      rrRatio = tpPips / slPips;
    }

    const slValue = riskAmount;
    const tpValue = riskAmount * rrRatio;

    // Generate warnings
    const newWarnings: string[] = [];
    if (riskPercent > 2) {
      newWarnings.push(`⚠️ ${t('warningRisk2')}`);
    }
    if (riskPercent > 5) {
      newWarnings.push(`🚨 ${t('warningRisk5')}`);
    }
    if (slPips < 5 && category.includes('Forex')) {
      newWarnings.push(`⚠️ ${t('warningSLTight')}`);
    }
    if (slPips < 10 && category.includes('Forex')) {
      newWarnings.push(`💡 ${t('warningSpread')}`);
    }
    if (rrRatio < 1 && rrRatio > 0) {
      newWarnings.push(`⚠️ ${t('warningRRBad')}`);
    }
    if (lotSize > 10) {
      newWarnings.push(`🚨 ${t('warningLotHigh')}`);
    }

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
    <div className="py-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('calculator')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('calculatorDesc')}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <CalcIcon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="glass-card p-6 space-y-6 animate-fade-in">
          <h3 className="font-display font-semibold text-foreground">{t('parameters')}</h3>

          <div className="space-y-4">
            {/* Asset Search */}
            <div className="space-y-2">
              <Label>{t('searchAssetCalc')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('asset')}</Label>
              <Select value={formData.asset} onValueChange={(v) => handleInputChange('asset', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-80">
                  {Object.entries(filteredAssets).map(([category, assets]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/10">
                        {category}
                      </div>
                      {assets.map(asset => (
                        <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('category')}: {getAssetCategory(formData.asset)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('capital')} ({getCurrencySymbol()})</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={formData.capital}
                  onChange={(e) => handleCapitalChange(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{t('risk')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="1.0"
                      value={formData.riskPercent}
                      onChange={(e) => handleRiskPercentChange(e.target.value)}
                      className={cn(
                        "pr-8",
                        parseFloat(formData.riskPercent) > 2 && "border-loss/50"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="100.00"
                      value={formData.riskCash}
                      onChange={(e) => handleRiskCashChange(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{getCurrencySymbol()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('entryPrice')}</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="1.08500"
                value={formData.entryPrice}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                  handleInputChange('entryPrice', value);
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('stopLoss')}
                  <span className="text-xs text-loss">({t('required')})</span>
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="1.08000"
                  value={formData.stopLoss}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                    handleInputChange('stopLoss', value);
                  }}
                  className="border-loss/30 focus:border-loss"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('takeProfit')}
                  <span className="text-xs text-muted-foreground">({t('optional')})</span>
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="1.09500"
                  value={formData.takeProfit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                    handleInputChange('takeProfit', value);
                  }}
                  className="border-profit/30 focus:border-profit"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={calculateLot}
            className="w-full gap-2 bg-gradient-primary hover:opacity-90 font-display"
          >
            <CalcIcon className="w-4 h-4" />
            {t('calculate')}
          </Button>

        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {results && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2">
                {t('results')}
                {results.direction === 'buy' ? (
                  <span className="flex items-center gap-1 text-sm text-profit">
                    <TrendingUp className="w-4 h-4" /> BUY
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-loss">
                    <TrendingDown className="w-4 h-4" /> SELL
                  </span>
                )}
              </h3>

              {/* Main Result - Lot Size */}
              <div className="text-center p-6 rounded-xl bg-primary/10 border border-primary/30 mb-6">
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  {t('recommendedLotSize')}
                </p>
                <p className="font-display text-5xl font-bold text-primary neon-text">
                  {results.lotSize}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('standardLots')}
                </p>
                <div className="flex justify-center gap-4 mt-4 text-sm">
                  <span className="text-muted-foreground">{t('mini')}: <span className="text-foreground font-medium">{results.lotSizeMini}</span></span>
                  <span className="text-muted-foreground">{t('micro')}: <span className="text-foreground font-medium">{results.lotSizeMicro}</span></span>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">{t('riskAmount')}</p>
                  <p className="font-display text-xl font-bold text-foreground">
                    {formatAmount(results.riskAmount, false, false)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">R:R Ratio</p>
                  <p className={cn(
                    "font-display text-xl font-bold",
                    results.rrRatio >= 2 ? "text-profit" : results.rrRatio >= 1 ? "text-primary" : "text-loss"
                  )}>
                    1:{results.rrRatio}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-loss/10 border border-loss/20">
                  <p className="text-xs text-muted-foreground">{t('slPoints')}</p>
                  <p className="font-display text-xl font-bold text-loss">{results.slPips} pips</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('maxLoss')}: {formatAmount(results.slValue, false, false)}</p>
                </div>
                <div className="p-4 rounded-lg bg-profit/10 border border-profit/20">
                  <p className="text-xs text-muted-foreground">{t('tpPoints')}</p>
                  <p className="font-display text-xl font-bold text-profit">{results.tpPips || '-'} pips</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('potentialGain')}: {formatAmount(results.tpValue || 0, false, false)}</p>
                </div>
              </div>

              {/* Visual SL/TP */}
              {results.tpPips > 0 && (
                <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-3 text-center">{t('visualization')}</p>
                  <div className="relative h-8 rounded-full bg-gradient-to-r from-loss via-secondary to-profit overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-foreground"
                      style={{ 
                        left: `${(results.slPips / (results.slPips + results.tpPips)) * 100}%` 
                      }}
                    />
                    <div className="absolute top-0 left-0 bottom-0 flex items-center px-2 text-xs text-loss-foreground font-medium">
                      SL
                    </div>
                    <div className="absolute top-0 right-0 bottom-0 flex items-center px-2 text-xs text-profit-foreground font-medium">
                      TP
                    </div>
                  </div>
                </div>
              )}

              {/* Send to Trade */}
              <Button
                variant="outline"
                className="w-full mt-6 gap-2 border-primary/50 hover:bg-primary/10"
                onClick={() => {
                  const pendingTradeData = {
                    asset: formData.asset,
                    entryPrice: formData.entryPrice,
                    stopLoss: formData.stopLoss,
                    takeProfit: formData.takeProfit,
                    lotSize: results.lotSize.toString(),
                    direction: results.direction,
                    risk: formData.riskPercent,
                    riskCash: formData.riskCash,
                    capital: formData.capital,
                  };
                  localStorage.setItem(PENDING_TRADE_KEY, JSON.stringify(pendingTradeData));
                  toast.success(t('dataSentToTrade'));
                  navigate('/add-trade');
                }}
              >
                <Send className="w-4 h-4" />
                {t('sendToTrade')}
              </Button>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="glass-card p-4 border-loss/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-loss" />
                <h4 className="font-semibold text-loss">{t('warnings')}</h4>
              </div>
              <ul className="space-y-2">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          <div className="glass-card p-4 border-profit/30 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-profit" />
              <h4 className="font-semibold text-profit">{t('bestPractices')}</h4>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-profit" />
                {t('tipNeverRisk2')}
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-profit" />
                Visez un R:R minimum de 1:2
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-profit" />
                Toujours placer un Stop Loss
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-profit" />
                Tenez compte du spread dans votre SL
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
