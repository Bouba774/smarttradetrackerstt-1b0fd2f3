import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useTrades } from '@/hooks/useTrades';
import { useTradeMedia } from '@/hooks/useTradeMedia';
import TradeMediaUploader, { type MediaItem } from '@/components/TradeMediaUploader';
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
  TrendingUp,
  TrendingDown,
  Save,
  Sparkles,
  Search,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ASSET_CATEGORIES } from '@/data/assets';
import { validateTradeForm, sanitizeText } from '@/lib/tradeValidation';
import { PENDING_TRADE_KEY } from './Calculator';

const DEFAULT_SETUPS = [
  'Breakout', 'Pullback', 'Reversal', 'Range', 'Trend Following',
  'Support/Resistance', 'Fibonacci', 'Moving Average', 'RSI Divergence',
  'MACD Cross', 'Supply & Demand', 'Order Block', 'Fair Value Gap',
  'Liquidity Sweep', 'Change of Character', 'Break of Structure',
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'M45', 'H1', 'H2', 'H3', 'H4', 'D1', 'W1', 'MN'];

const EMOTIONS = [
  { value: 'calm', labelFr: 'Calme', labelEn: 'Calm', emoji: '😌' },
  { value: 'confident', labelFr: 'Confiant', labelEn: 'Confident', emoji: '💪' },
  { value: 'stressed', labelFr: 'Stressé', labelEn: 'Stressed', emoji: '😰' },
  { value: 'impulsive', labelFr: 'Impulsif', labelEn: 'Impulsive', emoji: '⚡' },
  { value: 'fearful', labelFr: 'Craintif', labelEn: 'Fearful', emoji: '😨' },
  { value: 'greedy', labelFr: 'Avide', labelEn: 'Greedy', emoji: '🤑' },
  { value: 'patient', labelFr: 'Patient', labelEn: 'Patient', emoji: '🧘' },
  { value: 'focused', labelFr: 'Concentré', labelEn: 'Focused', emoji: '🎯' },
  { value: 'euphoric', labelFr: 'Euphorique', labelEn: 'Euphoric', emoji: '🤩' },
  { value: 'anxious', labelFr: 'Anxieux', labelEn: 'Anxious', emoji: '😟' },
  { value: 'frustrated', labelFr: 'Frustré', labelEn: 'Frustrated', emoji: '😤' },
  { value: 'neutral', labelFr: 'Neutre', labelEn: 'Neutral', emoji: '😐' },
  { value: 'doubtful', labelFr: 'Hésitant', labelEn: 'Doubtful', emoji: '🤔' },
  { value: 'disciplined', labelFr: 'Discipliné', labelEn: 'Disciplined', emoji: '🎖️' },
  { value: 'overconfident', labelFr: 'Trop confiant', labelEn: 'Overconfident', emoji: '😎' },
  { value: 'tired', labelFr: 'Fatigué', labelEn: 'Tired', emoji: '😴' },
];

const TAGS = [
  { value: 'a_plus_setup', labelFr: 'Setup A+', labelEn: 'A+ Setup' },
  { value: 'high_probability', labelFr: 'Haute probabilité', labelEn: 'High Probability' },
  { value: 'plan_followed', labelFr: 'Plan respecté', labelEn: 'Plan Followed' },
  { value: 'breakeven', labelFr: 'Break-even', labelEn: 'Break-even' },
  { value: 'fomo', labelFr: 'FOMO', labelEn: 'FOMO' },
  { value: 'revenge_trading', labelFr: 'Revenge Trading', labelEn: 'Revenge Trading' },
  { value: 'overtrading', labelFr: 'Overtrading', labelEn: 'Overtrading' },
  { value: 'early_entry', labelFr: 'Entrée anticipée', labelEn: 'Early Entry' },
  { value: 'late_entry', labelFr: 'Entrée tardive', labelEn: 'Late Entry' },
  { value: 'perfect_execution', labelFr: 'Exécution parfaite', labelEn: 'Perfect Execution' },
  { value: 'news_event', labelFr: 'Événement news', labelEn: 'News Event' },
  { value: 'session_open', labelFr: 'Ouverture session', labelEn: 'Session Open' },
  { value: 'session_close', labelFr: 'Clôture session', labelEn: 'Session Close' },
  { value: 'trend_trade', labelFr: 'Trade tendance', labelEn: 'Trend Trade' },
  { value: 'counter_trend', labelFr: 'Contre-tendance', labelEn: 'Counter-Trend' },
  { value: 'scalp', labelFr: 'Scalp', labelEn: 'Scalp' },
  { value: 'swing', labelFr: 'Swing', labelEn: 'Swing' },
  { value: 'sl_hit', labelFr: 'SL touché', labelEn: 'SL Hit' },
  { value: 'tp_hit', labelFr: 'TP touché', labelEn: 'TP Hit' },
  { value: 'partial_tp', labelFr: 'TP partiel', labelEn: 'Partial TP' },
  { value: 'moved_sl', labelFr: 'SL déplacé', labelEn: 'Moved SL' },
  { value: 'killzone', labelFr: 'Killzone', labelEn: 'Killzone' },
  { value: 'liquidity_grab', labelFr: 'Prise de liquidité', labelEn: 'Liquidity Grab' },
];

const AddTrade: React.FC = () => {
  const { t, language } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { addTrade } = useTrades();
  const { uploadMedia } = useTradeMedia();
  const locale = language === 'fr' ? fr : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [exitDate, setExitDate] = useState<Date | undefined>();
  const [exitTime, setExitTime] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [customAsset, setCustomAsset] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [customSetup, setCustomSetup] = useState('');
  const [exitMethod, setExitMethod] = useState<'sl' | 'tp' | 'manual'>('manual');
  
  const [hasPendingData, setHasPendingData] = useState(false);

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
          riskCash: parsed.riskCash || '',
          capital: parsed.capital || '',
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
          riskCash: '',
          capital: '',
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
      riskCash: '',
      capital: '',
      emotion: '',
      notes: '',
    };
  });

  // Track which risk field was last modified
  const [lastModifiedRiskField, setLastModifiedRiskField] = useState<'percent' | 'cash' | null>(null);

  // Check if there's pending data on mount
  useEffect(() => {
    const savedData = localStorage.getItem(PENDING_TRADE_KEY);
    setHasPendingData(!!savedData);
  }, []);

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

  // Bidirectional risk calculation
  const handleRiskPercentChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, risk: value };
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
        newData.risk = ((cash / capital) * 100).toFixed(2);
      } else {
        newData.risk = '';
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
      if (lastModifiedRiskField === 'percent' && prev.risk) {
        const percent = parseFloat(prev.risk);
        if (!isNaN(capital) && !isNaN(percent) && capital > 0) {
          newData.riskCash = ((capital * percent) / 100).toFixed(2);
        }
      } else if (lastModifiedRiskField === 'cash' && prev.riskCash) {
        const cash = parseFloat(prev.riskCash);
        if (!isNaN(capital) && !isNaN(cash) && capital > 0) {
          newData.risk = ((cash / capital) * 100).toFixed(2);
        }
      }
      return newData;
    });
  };

  const clearPendingData = () => {
    localStorage.removeItem(PENDING_TRADE_KEY);
    setHasPendingData(false);
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
      riskCash: '',
      capital: '',
      emotion: '',
      notes: '',
    });
    setDirection('buy');
    setSelectedTags([]);
    setCustomAsset('');
    setCustomSetup('');
    setCustomTimeframe('');
    toast.success(language === 'fr' ? 'Formulaire réinitialisé' : 'Form cleared');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleMediaError = (error: string) => {
    toast.error(error);
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

    
    setIsSubmitting(true);
    
    try {
      // Upload all media files
      const mediaFiles = mediaItems.map(item => item.file);
      const uploadedMedia = mediaFiles.length > 0 
        ? await uploadMedia(mediaFiles) 
        : { images: [], videos: [], audios: [] };

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
        risk_amount: formData.riskCash ? parseFloat(formData.riskCash) : null,
        notes: formData.notes ? sanitizeText(formData.notes) : null,
        emotions: formData.emotion || null,
        images: uploadedMedia.images.length > 0 ? uploadedMedia.images : null,
        videos: uploadedMedia.videos.length > 0 ? uploadedMedia.videos : null,
        audios: uploadedMedia.audios.length > 0 ? uploadedMedia.audios : null,
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
        riskCash: '',
        capital: '',
        emotion: '',
        notes: '',
      });
      setDirection('buy');
      setSelectedTags([]);
      setMediaItems([]);
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
        {hasPendingData && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearPendingData}
            className="gap-2 text-muted-foreground hover:text-loss"
          >
            <Trash2 className="w-4 h-4" />
            {language === 'fr' ? 'Effacer' : 'Clear'}
          </Button>
        )}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Asset Select with integrated search */}
            <div className="space-y-2">
              <Label>{t('asset')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {formData.asset || customAsset || t('selectAsset')}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-popover border-border" align="start">
                  <div className="p-2 border-b border-border">
                    <Input
                      placeholder={t('searchAsset')}
                      value={assetSearch}
                      onChange={(e) => setAssetSearch(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {Object.entries(filteredAssets).map(([category, assets]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-primary/10 sticky top-0">
                          {category}
                        </div>
                        {assets.map(asset => (
                          <button
                            key={asset}
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                              formData.asset === asset && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                              handleInputChange('asset', asset);
                              setCustomAsset('');
                              setAssetSearch('');
                            }}
                          >
                            {asset}
                          </button>
                        ))}
                      </div>
                    ))}
                    {Object.keys(filteredAssets).length === 0 && (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        {language === 'fr' ? 'Aucun actif trouvé' : 'No asset found'}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
              <Label>{t('capital')} ({getCurrencySymbol()})</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="10000"
                value={formData.capital}
                onChange={(e) => handleCapitalChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('risk')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={formData.risk}
                    onChange={(e) => handleRiskPercentChange(e.target.value)}
                    className="pr-8"
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
            <div className="space-y-2">
              <Label>{t('pnl')} ({getCurrencySymbol()})</Label>
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
                  {language === 'fr' ? emotion.labelFr : emotion.labelEn}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('tags')}</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag.value) && "bg-primary hover:bg-primary/90"
                  )}
                  onClick={() => toggleTag(tag.value)}
                >
                  {language === 'fr' ? tag.labelFr : tag.labelEn}
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
            <Label>{language === 'fr' ? 'Médias (images, vidéos, audio)' : 'Media (images, videos, audio)'}</Label>
            <TradeMediaUploader
              mediaItems={mediaItems}
              onMediaChange={setMediaItems}
              onError={handleMediaError}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('score')}: {calculateQualityScore()}/100</span>
          </div>
          <div className="flex gap-4">
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
        </div>
      </form>
    </div>
  );
};

export default AddTrade;
