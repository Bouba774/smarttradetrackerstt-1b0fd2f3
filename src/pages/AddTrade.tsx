import React, { useState, useMemo } from 'react';
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
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { ASSET_CATEGORIES, ALL_ASSETS } from '@/data/assets';

const SETUPS = [
  'Breakout', 'Pullback', 'Reversal', 'Range', 'Trend Following',
  'Support/Resistance', 'Fibonacci', 'Moving Average', 'RSI Divergence',
  'MACD Cross', 'Supply & Demand', 'Order Block', 'Fair Value Gap',
  'Liquidity Sweep', 'Change of Character', 'Break of Structure',
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'M45', 'H1', 'H2', 'H3', 'H4', 'D1', 'W1', 'MN'];

const EMOTIONS = [
  { value: 'calm', label: 'Calme', emoji: '😌' },
  { value: 'confident', label: 'Confiant', emoji: '💪' },
  { value: 'stressed', label: 'Stressé', emoji: '😰' },
  { value: 'impulsive', label: 'Impulsif', emoji: '⚡' },
  { value: 'fearful', label: 'Craintif', emoji: '😨' },
  { value: 'greedy', label: 'Avide', emoji: '🤑' },
  { value: 'patient', label: 'Patient', emoji: '🧘' },
  { value: 'focused', label: 'Concentré', emoji: '🎯' },
];

const TAGS = [
  'A+ Setup', 'High Probability', 'Plan Respecté', 'Break-even',
  'FOMO', 'Revenge Trading', 'Overtrading', 'Early Entry',
  'Late Entry', 'Perfect Execution', 'News Event', 'Session Open',
  'Session Close', 'Trend Trade', 'Counter-Trend', 'Scalp',
];

const AddTrade: React.FC = () => {
  const { t, language } = useLanguage();
  const locale = language === 'fr' ? fr : enUS;

  const [date, setDate] = useState<Date>(new Date());
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [customAsset, setCustomAsset] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [customTimeframe, setCustomTimeframe] = useState('');
  
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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 4) {
      toast.error('Maximum 4 images autorisées');
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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
    const finalAsset = customAsset || formData.asset;
    const finalTimeframe = customTimeframe || formData.timeframe;
    
    console.log({
      ...formData,
      asset: finalAsset,
      timeframe: finalTimeframe,
      date,
      direction,
      tags: selectedTags,
      images,
      qualityScore,
    });
    
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

            {/* Time */}
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input type="time" defaultValue={format(new Date(), 'HH:mm')} />
            </div>
          </div>
        </div>

        {/* Asset Selection with Search */}
        <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <h3 className="font-display font-semibold text-foreground">Sélection de l'Actif</h3>
          
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un actif..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Asset Select */}
            <div className="space-y-2">
              <Label>{t('asset')}</Label>
              <Select
                value={formData.asset}
                onValueChange={(v) => {
                  handleInputChange('asset', v);
                  setCustomAsset('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un actif" />
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
            </div>

            {/* Custom Asset Input */}
            <div className="space-y-2">
              <Label>Ou saisir un actif personnalisé</Label>
              <Input
                placeholder="Ex: CUSTOM/USD"
                value={customAsset}
                onChange={(e) => {
                  setCustomAsset(e.target.value);
                  if (e.target.value) handleInputChange('asset', '');
                }}
              />
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
                className="border-loss/30 focus:border-loss"
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
                className="border-profit/30 focus:border-profit"
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
                <SelectContent className="bg-popover border-border max-h-60">
                  {SETUPS.map(setup => (
                    <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('timeframe')}</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.timeframe}
                  onValueChange={(v) => {
                    handleInputChange('timeframe', v);
                    setCustomTimeframe('');
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="TF" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {TIMEFRAMES.map(tf => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Autre"
                  className="w-20"
                  value={customTimeframe}
                  onChange={(e) => {
                    setCustomTimeframe(e.target.value);
                    if (e.target.value) handleInputChange('timeframe', '');
                  }}
                />
              </div>
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
            <Label>{t('images')} ({images.length}/4)</Label>
            
            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={img} alt={`Capture ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-loss/80 text-loss-foreground hover:bg-loss transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {images.length < 4 && (
              <label className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Cliquez ou glissez vos captures d'écran (max 4)
                </p>
              </label>
            )}
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
