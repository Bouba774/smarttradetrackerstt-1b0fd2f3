import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  CalendarIcon,
  Upload,
  X,
  TrendingUp,
  TrendingDown,
  Save,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

const ASSETS = [
  // Forex Majors
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  // Forex Crosses
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'EUR/CHF', 'EUR/AUD', 'GBP/CHF', 'AUD/JPY',
  // Crypto
  'BTC/USD', 'ETH/USD', 'XRP/USD', 'SOL/USD', 'BNB/USD', 'ADA/USD', 'DOGE/USD',
  // Indices
  'US30', 'US100', 'US500', 'GER40', 'UK100', 'JPN225', 'FRA40',
  // Commodities
  'XAU/USD', 'XAG/USD', 'USOIL', 'UKOIL', 'NATGAS',
];

const SETUPS = [
  'Breakout', 'Pullback', 'Reversal', 'Range', 'Trend Following',
  'Support/Resistance', 'Fibonacci', 'Moving Average', 'RSI Divergence',
  'MACD Cross', 'Supply & Demand', 'Order Block', 'Fair Value Gap',
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];

const EMOTIONS = [
  { value: 'calm', label: 'Calme', emoji: '😌' },
  { value: 'confident', label: 'Confiant', emoji: '💪' },
  { value: 'stressed', label: 'Stressé', emoji: '😰' },
  { value: 'impulsive', label: 'Impulsif', emoji: '⚡' },
  { value: 'fearful', label: 'Craintif', emoji: '😨' },
  { value: 'greedy', label: 'Avide', emoji: '🤑' },
];

const TAGS = [
  'A+ Setup', 'High Probability', 'Plan Respecté', 'Break-even',
  'FOMO', 'Revenge Trading', 'Overtrading', 'Early Entry',
  'Late Entry', 'Perfect Execution', 'News Event', 'Session Open',
];

const AddTrade: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'fr' ? fr : enUS;

  const [date, setDate] = useState<Date>(new Date());
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    asset: '',
    setup: '',
    timeframe: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    lotSize: '',
    pnl: '',
    risk: '',
    emotion: '',
    notes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const calculateQualityScore = () => {
    let score = 0;
    if (formData.setup) score += 20;
    if (!selectedTags.includes('FOMO')) score += 20;
    if (formData.stopLoss) score += 20;
    if (parseFloat(formData.risk) <= 2) score += 10;
    if (selectedTags.includes('Plan Respecté')) score += 20;
    if (!selectedTags.includes('Revenge Trading')) score += 10;
    return score;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qualityScore = calculateQualityScore();
    toast.success(`Trade enregistré! Score de qualité: ${qualityScore}/100`);
  };

  return (
    <div className="py-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('addTrade')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Enregistrez votre nouveau trade avec tous les détails
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Score: {calculateQualityScore()}/100</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Direction */}
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <h3 className="font-display font-semibold text-foreground">Informations de Base</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>{t('dateTime')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale }) : 'Sélectionner'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Direction */}
            <div className="space-y-2">
              <Label>{t('direction')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={direction === 'buy' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 gap-2",
                    direction === 'buy' && "bg-profit hover:bg-profit/90 text-profit-foreground"
                  )}
                  onClick={() => setDirection('buy')}
                >
                  <TrendingUp className="w-4 h-4" />
                  {t('buy')}
                </Button>
                <Button
                  type="button"
                  variant={direction === 'sell' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 gap-2",
                    direction === 'sell' && "bg-loss hover:bg-loss/90 text-loss-foreground"
                  )}
                  onClick={() => setDirection('sell')}
                >
                  <TrendingDown className="w-4 h-4" />
                  {t('sell')}
                </Button>
              </div>
            </div>

            {/* Asset */}
            <div className="space-y-2">
              <Label>{t('asset')}</Label>
              <Select
                value={formData.asset}
                onValueChange={(v) => handleInputChange('asset', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un actif" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60">
                  {ASSETS.map(asset => (
                    <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Trading Details */}
        <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3 className="font-display font-semibold text-foreground">Détails du Trade</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('entryPrice')}</Label>
              <Input
                type="number"
                step="any"
                placeholder="1.0850"
                value={formData.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('stopLoss')}</Label>
              <Input
                type="number"
                step="any"
                placeholder="1.0800"
                value={formData.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('takeProfit')}</Label>
              <Input
                type="number"
                step="any"
                placeholder="1.0950"
                value={formData.takeProfit}
                onChange={(e) => handleInputChange('takeProfit', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lotSize')}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.10"
                value={formData.lotSize}
                onChange={(e) => handleInputChange('lotSize', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('risk')} (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={formData.risk}
                onChange={(e) => handleInputChange('risk', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('pnl')} ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={formData.pnl}
                onChange={(e) => handleInputChange('pnl', e.target.value)}
                className={cn(
                  parseFloat(formData.pnl) > 0 && "border-profit/50 focus:border-profit",
                  parseFloat(formData.pnl) < 0 && "border-loss/50 focus:border-loss"
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('setup')}</Label>
              <Select
                value={formData.setup}
                onValueChange={(v) => handleInputChange('setup', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {SETUPS.map(setup => (
                    <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('timeframe')}</Label>
              <Select
                value={formData.timeframe}
                onValueChange={(v) => handleInputChange('timeframe', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Psychology */}
        <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <h3 className="font-display font-semibold text-foreground">Analyse Psychologique</h3>
          
          <div className="space-y-2">
            <Label>{t('emotion')}</Label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(emotion => (
                <Button
                  key={emotion.value}
                  type="button"
                  variant={formData.emotion === emotion.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "gap-2",
                    formData.emotion === emotion.value && "bg-primary hover:bg-primary/90"
                  )}
                  onClick={() => handleInputChange('emotion', emotion.value)}
                >
                  <span>{emotion.emoji}</span>
                  {emotion.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('tags')}</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag) && "bg-primary hover:bg-primary/90"
                  )}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Notes & Images */}
        <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <h3 className="font-display font-semibold text-foreground">Notes & Captures</h3>
          
          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea
              placeholder="Décrivez votre analyse, votre stratégie, ce que vous avez appris..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('images')} (max 4)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Glissez vos captures ou cliquez pour sélectionner
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            {t('cancel')}
          </Button>
          <Button type="submit" className="gap-2 bg-gradient-primary hover:opacity-90">
            <Save className="w-4 h-4" />
            {t('saveTrade')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTrade;
