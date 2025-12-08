import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Link } from 'react-router-dom';
import { ASSET_CATEGORIES, PIP_VALUES, DECIMALS, getPipSize, getAssetCategory } from '@/data/assets';

const Calculator: React.FC = () => {
  const { t } = useLanguage();
  const [assetSearch, setAssetSearch] = useState('');

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

  const calculateLot = () => {
    const capital = parseFloat(formData.capital);
    const riskPercent = parseFloat(formData.riskPercent);
    const entryPrice = parseFloat(formData.entryPrice);
    const stopLoss = parseFloat(formData.stopLoss);
    const takeProfit = parseFloat(formData.takeProfit);
    const asset = formData.asset;

    if (!capital || !riskPercent || !entryPrice || !stopLoss) {
      toast.error('Veuillez remplir tous les champs obligatoires');
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
      newWarnings.push('⚠️ Risque > 2% : Position agressive');
    }
    if (riskPercent > 5) {
      newWarnings.push('🚨 Risque > 5% : Très dangereux!');
    }
    if (slPips < 5 && category.includes('Forex')) {
      newWarnings.push('⚠️ SL très serré (< 5 pips) : Trade risqué');
    }
    if (slPips < 10 && category.includes('Forex')) {
      newWarnings.push('💡 SL serré : Attention au spread');
    }
    if (rrRatio < 1 && rrRatio > 0) {
      newWarnings.push('⚠️ R:R < 1:1 : Ratio défavorable');
    }
    if (lotSize > 10) {
      newWarnings.push('🚨 Lot size > 10 : Vérifiez votre calcul');
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

    toast.success('Calcul effectué!');
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
            Calculatrice de taille de position professionnelle
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <CalcIcon className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="glass-card p-6 space-y-6 animate-fade-in">
          <h3 className="font-display font-semibold text-foreground">Paramètres</h3>

          <div className="space-y-4">
            {/* Asset Search */}
            <div className="space-y-2">
              <Label>Rechercher un actif</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
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
                Catégorie: {getAssetCategory(formData.asset)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('capital')} ($)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={formData.capital}
                  onChange={(e) => handleInputChange('capital', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('riskPercent')} (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={formData.riskPercent}
                  onChange={(e) => handleInputChange('riskPercent', e.target.value)}
                  className={cn(
                    parseFloat(formData.riskPercent) > 2 && "border-loss/50"
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('entryPrice')}</Label>
              <Input
                type="number"
                step="any"
                placeholder="1.08500"
                value={formData.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('stopLoss')}
                  <span className="text-xs text-loss">(obligatoire)</span>
                </Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="1.08000"
                  value={formData.stopLoss}
                  onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                  className="border-loss/30 focus:border-loss"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('takeProfit')}
                  <span className="text-xs text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="1.09500"
                  value={formData.takeProfit}
                  onChange={(e) => handleInputChange('takeProfit', e.target.value)}
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

          {/* Formulas Info */}
          <div className="p-4 bg-secondary/30 rounded-lg text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Formules utilisées:</p>
            <p>• Risque ($) = Capital × (Risque% / 100)</p>
            <p>• SL (pips) = |Prix Entrée - SL| / Pip Size</p>
            <p>• Lot = Risque ($) / (SL pips × Pip Value)</p>
            <p>• R:R = TP pips / SL pips</p>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {results && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="font-display font-semibold text-foreground mb-6 flex items-center gap-2">
                Résultats
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
                  Taille de Lot Recommandée
                </p>
                <p className="font-display text-5xl font-bold text-primary neon-text">
                  {results.lotSize}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Standard Lots
                </p>
                <div className="flex justify-center gap-4 mt-4 text-sm">
                  <span className="text-muted-foreground">Mini: <span className="text-foreground font-medium">{results.lotSizeMini}</span></span>
                  <span className="text-muted-foreground">Micro: <span className="text-foreground font-medium">{results.lotSizeMicro}</span></span>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground">{t('riskAmount')}</p>
                  <p className="font-display text-xl font-bold text-foreground">
                    ${results.riskAmount}
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
                  <p className="text-xs text-muted-foreground mt-1">Perte max: ${results.slValue}</p>
                </div>
                <div className="p-4 rounded-lg bg-profit/10 border border-profit/20">
                  <p className="text-xs text-muted-foreground">{t('tpPoints')}</p>
                  <p className="font-display text-xl font-bold text-profit">{results.tpPips || '-'} pips</p>
                  <p className="text-xs text-muted-foreground mt-1">Gain potentiel: ${results.tpValue || 0}</p>
                </div>
              </div>

              {/* Visual SL/TP */}
              {results.tpPips > 0 && (
                <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-3 text-center">Visualisation</p>
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
              <Link to="/add-trade">
                <Button
                  variant="outline"
                  className="w-full mt-6 gap-2 border-primary/50 hover:bg-primary/10"
                >
                  <Send className="w-4 h-4" />
                  {t('sendToTrade')}
                </Button>
              </Link>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="glass-card p-4 border-loss/30 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-loss" />
                <h4 className="font-semibold text-loss">Avertissements</h4>
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
              <h4 className="font-semibold text-profit">Bonnes Pratiques</h4>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-profit" />
                Ne risquez jamais plus de 2% par trade
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
