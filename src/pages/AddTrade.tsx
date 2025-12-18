import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useTradeImages } from '@/hooks/useTradeImages';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ASSET_CATEGORIES, ALL_ASSETS } from '@/data/assets';
import { validateTradeForm, validateImageFiles, sanitizeText } from '@/lib/tradeValidation';
import { PENDING_TRADE_KEY } from './Calculator';

const DEFAULT_SETUPS = [
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
  const { addTrade } = useTrades();
  const { uploadImages } = useTradeImages();
  const locale = language === 'fr' ? fr : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [exitDate, setExitDate] = useState<Date | undefined>();
  const [exitTime, setExitTime] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [customAsset, setCustomAsset] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [customSetup, setCustomSetup] = useState('');
  const [exitMethod, setExitMethod] = useState<'sl' | 'tp' | 'manual'>('manual');
  
  const [formData, setFormData] = useState(() => {
    // Load pending trade data from localStorage on initial mount
    const savedData = localStorage.getItem(PENDING_TRADE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        return {
          asset: parsed.asset || '',
          setup: '',
          timeframe: '',
          entryPrice: parsed.entryPrice || '',
          exitPrice: '',
          stopLoss: parsed.stopLoss || '',
          takeProfit: parsed.takeProfit || '',
          lotSize: parsed.lotSize || '',
          pnl: '',
          risk: parsed.risk || '',
          emotion: '',
          notes: '',
        };
      } catch {
        return {
          asset: '',
          setup: '',
          timeframe: '',
          entryPrice: '',
          exitPrice: '',
          stopLoss: '',
          takeProfit: '',
          lotSize: '',
          pnl: '',
          risk: '',
          emotion: '',
          notes: '',
        };
      }
    }
    return {
      asset: '',
      setup: '',
      timeframe: '',
      entryPrice: '',
      exitPrice: '',
      stopLoss: '',
      takeProfit: '',
      lotSize: '',
      pnl: '',
      risk: '',
      emotion: '',
      notes: '',
    };
  });

  // Load direction from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(PENDING_TRADE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.direction) {
          setDirection(parsed.direction);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

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

    const newFiles = Array.from(files);
    const allFiles = [...imageFiles, ...newFiles];
    
    // Validate all files including existing ones
    const validation = validateImageFiles(allFiles);
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setImageFiles(allFiles);

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAsset = customAsset || formData.asset;
    const finalSetup = customSetup || formData.setup;
    
    // Comprehensive validation using Zod schema
    const validationData = {
      asset: finalAsset,
      direction: direction,
      entryPrice: formData.entryPrice,
      exitPrice: formData.exitPrice || undefined,
      stopLoss: formData.stopLoss || undefined,
      takeProfit: formData.takeProfit || undefined,
      lotSize: formData.lotSize,
      pnl: formData.pnl || undefined,
      risk: formData.risk || undefined,
      setup: formData.setup || undefined,
      customSetup: customSetup || undefined,
      timeframe: formData.timeframe || customTimeframe || undefined,
      emotion: formData.emotion || undefined,
      notes: formData.notes || undefined,
    };

    const validation = validateTradeForm(validationData);
    if (!validation.success) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Validate images if present
    if (imageFiles.length > 0) {
      const imageValidation = validateImageFiles(imageFiles);
      if (!imageValidation.valid) {
        imageValidation.errors.forEach(error => toast.error(error));
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload images first
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages(imageFiles);
      }

      const pnl = parseFloat(formData.pnl) || null;
      let result: 'win' | 'loss' | 'breakeven' | 'pending' | null = null;
      
      if (pnl !== null) {
        if (pnl > 0) result = 'win';
        else if (pnl < 0) result = 'loss';
        else result = 'breakeven';
      } else {
        result = 'pending';
      }

      // Calculate exit timestamp and duration
      let exitTimestamp: string | null = null;
      let durationSeconds: number | null = null;
      
      if (exitDate) {
        const exitDateTime = new Date(exitDate);
        if (exitTime) {
          const [hours, minutes] = exitTime.split(':').map(Number);
          exitDateTime.setHours(hours, minutes, 0, 0);
        }
        exitTimestamp = exitDateTime.toISOString();
        durationSeconds = Math.floor((exitDateTime.getTime() - date.getTime()) / 1000);
        if (durationSeconds < 0) durationSeconds = null;
      }

      // Calculate exit price based on exit method
      let finalExitPrice = formData.exitPrice ? parseFloat(formData.exitPrice) : null;
      if (exitMethod === 'sl' && formData.stopLoss) {
        finalExitPrice = parseFloat(formData.stopLoss);
      } else if (exitMethod === 'tp' && formData.takeProfit) {
        finalExitPrice = parseFloat(formData.takeProfit);
      }

      // Validation for exit price
      if (finalExitPrice !== null && finalExitPrice < 0) {
        toast.error(language === 'fr' ? 'Le prix de sortie ne peut pas être négatif' : 'Exit price cannot be negative');
        setIsSubmitting(false);
        return;
      }
      
      await addTrade.mutateAsync({
        asset: finalAsset,
        direction: direction === 'buy' ? 'long' : 'short',
        entry_price: parseFloat(formData.entryPrice),
        exit_price: finalExitPrice,
        stop_loss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
        take_profit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
        lot_size: parseFloat(formData.lotSize),
        setup: finalSetup || null,
        custom_setup: customSetup ? sanitizeText(customSetup) : null,
        result,
        profit_loss: pnl,
        notes: formData.notes ? sanitizeText(formData.notes) : null,
        emotions: formData.emotion || null,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        trade_date: date.toISOString(),
        exit_timestamp: exitTimestamp,
        exit_method: exitTimestamp ? exitMethod : null,
        duration_seconds: durationSeconds,
        timeframe: formData.timeframe || customTimeframe || null,
      });
      
      // Clear pending trade data from localStorage only after successful save
      localStorage.removeItem(PENDING_TRADE_KEY);
      
      toast.success(t('tradeRegistered'));
      
      // Reset form
      setFormData({
        asset: '',
        setup: '',
        timeframe: '',
        entryPrice: '',
        exitPrice: '',
        stopLoss: '',
        takeProfit: '',
        lotSize: '',
        pnl: '',
        risk: '',
        emotion: '',
        notes: '',
      });
      setDirection('buy');
      setSelectedTags([]);
      setImageFiles([]);
      setImagePreviews([]);
      setCustomAsset('');
      setCustomSetup('');
      setCustomTimeframe('');
      setDate(new Date());
      setExitDate(undefined);
      setExitTime('');
      setExitMethod('manual');
      
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error(t('errorSavingTrade'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {t('addTrade')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('registerNewTrade')}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">{t('score')}: {calculateQualityScore()}/100</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Direction */}
        <div className="glass-card p-6 space-y-4 animate-fade-in">
          <h3 className="font-display font-semibold text-foreground">{t('basicInformation')}</h3>
          
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
                    {date ? format(date, 'PPP', { locale }) : t('select')}
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
              <Label>{t('hour')}</Label>
              <Input type="time" defaultValue={format(new Date(), 'HH:mm')} />
            </div>
          </div>
        </div>

        {/* Asset Selection with Search */}
        <div className="glass-card p-6 space-y-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <h3 className="font-display font-semibold text-foreground">{t('assetSelection')}</h3>
          
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('searchAsset')}
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
                  <SelectValue placeholder={t('selectAsset')} />
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
              <Label>{t('customAsset')}</Label>
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
          <h3 className="font-display font-semibold text-foreground">{t('tradeDetails')}</h3>
          
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

          {/* Exit Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Date/Heure de Sortie' : 'Exit Date/Time'}</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !exitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exitDate ? format(exitDate, 'dd/MM/yy', { locale }) : (language === 'fr' ? 'Date sortie' : 'Exit date')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border">
                    <Calendar
                      mode="single"
                      selected={exitDate}
                      onSelect={setExitDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Input 
                  type="time" 
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Méthode de Sortie' : 'Exit Method'}</Label>
              <Select value={exitMethod} onValueChange={(v: 'sl' | 'tp' | 'manual') => setExitMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="manual">{language === 'fr' ? 'Personnalisé' : 'Manual'}</SelectItem>
                  <SelectItem value="sl">{language === 'fr' ? 'Lié au SL' : 'Linked to SL'}</SelectItem>
                  <SelectItem value="tp">{language === 'fr' ? 'Lié au TP' : 'Linked to TP'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Prix de Sortie' : 'Exit Price'}</Label>
              <Input
                type="number"
                step="any"
                placeholder={
                  exitMethod === 'sl' ? (formData.stopLoss || 'SL') :
                  exitMethod === 'tp' ? (formData.takeProfit || 'TP') : '1.0900'
                }
                value={
                  exitMethod === 'sl' ? formData.stopLoss :
                  exitMethod === 'tp' ? formData.takeProfit : formData.exitPrice
                }
                onChange={(e) => {
                  if (exitMethod === 'manual') {
                    handleInputChange('exitPrice', e.target.value);
                  }
                }}
                disabled={exitMethod !== 'manual'}
                className={cn(
                  exitMethod !== 'manual' && "bg-muted cursor-not-allowed"
                )}
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
              <div className="flex gap-2">
                <Select
                  value={formData.setup}
                  onValueChange={(v) => {
                    handleInputChange('setup', v);
                    setCustomSetup('');
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-60">
                    {DEFAULT_SETUPS.map(setup => (
                      <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Personnalisé"
                  className="w-28"
                  value={customSetup}
                  onChange={(e) => {
                    setCustomSetup(e.target.value);
                    if (e.target.value) handleInputChange('setup', '');
                  }}
                />
              </div>
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
            <Label>{t('images')} ({imagePreviews.length}/4)</Label>
            
            {/* Image Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((img, index) => (
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

            {imagePreviews.length < 4 && (
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
          <Button type="button" variant="outline" disabled={isSubmitting}>
            {t('cancel')}
          </Button>
          <Button type="submit" className="gap-2 bg-gradient-primary hover:opacity-90" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting ? 'Enregistrement...' : t('saveTrade')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTrade;
