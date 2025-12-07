import React, { useState, useEffect } from 'react';
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
import { Calculator as CalcIcon, ArrowRight, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const ASSET_CATEGORIES = {
  'Forex Majors': ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
  'Forex Crosses': ['EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'EUR/AUD', 'AUD/JPY', 'GBP/CHF'],
  'Métaux': ['XAU/USD', 'XAG/USD'],
  'Indices': ['US30', 'US100', 'US500', 'GER40', 'UK100', 'JPN225'],
  'Crypto': ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XRP/USD', 'BNB/USD'],
  'Énergies': ['USOIL', 'UKOIL', 'NATGAS'],
};

// Pip values for different assets (simplified)
const PIP_VALUES: { [key: string]: number } = {
  // Forex (standard lot = 100,000 units)
  'EUR/USD': 10, 'GBP/USD': 10, 'AUD/USD': 10, 'NZD/USD': 10, 'USD/CAD': 10,
  'USD/CHF': 10, 'USD/JPY': 1000, // JPY pairs have different pip calculation
  'EUR/GBP': 10, 'EUR/JPY': 1000, 'GBP/JPY': 1000, 'EUR/CHF': 10, 'EUR/AUD': 10,
  'AUD/JPY': 1000, 'GBP/CHF': 10,
  // Gold (1 lot = 100 oz)
  'XAU/USD': 100,
  // Silver (1 lot = 5000 oz)
  'XAG/USD': 50,
  // Indices (point value varies)
  'US30': 10, 'US100': 10, 'US500': 10, 'GER40': 10, 'UK100': 10, 'JPN225': 100,
  // Crypto (varies by broker)
  'BTC/USD': 1, 'ETH/USD': 1, 'SOL/USD': 1, 'XRP/USD': 1, 'BNB/USD': 1,
  // Energies
  'USOIL': 10, 'UKOIL': 10, 'NATGAS': 10,
};

// Decimal places for price display
const DECIMALS: { [key: string]: number } = {
  'EUR/USD': 5, 'GBP/USD': 5, 'AUD/USD': 5, 'NZD/USD': 5, 'USD/CAD': 5,
  'USD/CHF': 5, 'USD/JPY': 3, 'EUR/GBP': 5, 'EUR/JPY': 3, 'GBP/JPY': 3,
  'EUR/CHF': 5, 'EUR/AUD': 5, 'AUD/JPY': 3, 'GBP/CHF': 5,
  'XAU/USD': 2, 'XAG/USD': 3,
  'US30': 0, 'US100': 0, 'US500': 1, 'GER40': 0, 'UK100': 0, 'JPN225': 0,
  'BTC/USD': 0, 'ETH/USD': 1, 'SOL/USD': 2, 'XRP/USD': 4, 'BNB/USD': 1,
  'USOIL': 2, 'UKOIL': 2, 'NATGAS': 3,
};

const Calculator: React.FC = () => {
  const { t } = useLanguage();

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
    rrRatio: number;
    slValue: number;
    tpValue: number;
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
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const pipValue = PIP_VALUES[asset] || 10;
    const decimals = DECIMALS[asset] || 5;
    const pipSize = asset.includes('JPY') ? 0.01 : Math.pow(10, -decimals);

    // Calculate values
    const riskAmount = (capital * riskPercent) / 100;
    const slDistance = Math.abs(entryPrice - stopLoss);
    const slPips = slDistance / pipSize;
    
    // Lot size calculation
    const lotSize = riskAmount / (slPips * pipValue);
    
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
      newWarnings.push('Risque > 2% : Position agressive');
    }
    if (slPips < 10) {
      newWarnings.push('SL très serré : Trade risqué');
    }
    if (rrRatio < 1 && rrRatio > 0) {
      newWarnings.push('R:R < 1:1 : Ratio défavorable');
    }

    setWarnings(newWarnings);
    setResults({
      riskAmount: Math.round(riskAmount * 100) / 100,
      slPips: Math.round(slPips * 10) / 10,
      tpPips: Math.round(tpPips * 10) / 10,
      lotSize: Math.round(lotSize * 100) / 100,
      rrRatio: Math.round(rrRatio * 100) / 100,
      slValue: Math.round(slValue * 100) / 100,
      tpValue: Math.round(tpValue * 100) / 100,
    });

    toast.success('Calcul effectué!');
  };

  return (
    <div className="py-4 max-w-4xl mx-auto">
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
            <div className="space-y-2">
              <Label>{t('asset')}</Label>
              <Select value={formData.asset} onValueChange={(v) => handleInputChange('asset', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-80">
                  {Object.entries(ASSET_CATEGORIES).map(([category, assets]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        {category}
                      </div>
                      {assets.map(asset => (
                        <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
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
                <Label>{t('riskPercent')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  value={formData.riskPercent}
                  onChange={(e) => handleInputChange('riskPercent', e.target.value)}
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
                <Label>{t('stopLoss')}</Label>
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
                <Label>{t('takeProfit')} (optionnel)</Label>
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
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {results && (
            <div className="glass-card p-6 animate-fade-in">
              <h3 className="font-display font-semibold text-foreground mb-6">Résultats</h3>

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
                  <p className="font-display text-xl font-bold text-loss">{results.slPips}</p>
                  <p className="text-xs text-muted-foreground mt-1">${results.slValue}</p>
                </div>
                <div className="p-4 rounded-lg bg-profit/10 border border-profit/20">
                  <p className="text-xs text-muted-foreground">{t('tpPoints')}</p>
                  <p className="font-display text-xl font-bold text-profit">{results.tpPips || '-'}</p>
                  <p className="text-xs text-muted-foreground mt-1">${results.tpValue || 0}</p>
                </div>
              </div>

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
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-loss" />
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
