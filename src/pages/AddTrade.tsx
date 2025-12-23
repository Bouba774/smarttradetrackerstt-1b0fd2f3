import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/hooks/useTrades';
import { useTradeMedia } from '@/hooks/useTradeMedia';
import TradeMediaUploader, { type MediaItem } from '@/components/TradeMediaUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { validateTradeForm, sanitizeText } from '@/lib/tradeValidation';
import { PENDING_TRADE_KEY } from './Calculator';
import AssetCombobox from '@/components/AssetCombobox';

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
  const { addTrade } = useTrades();
  const { uploadMedia } = useTradeMedia();
  const locale = language === 'fr' ? fr : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [exitDate, setExitDate] = useState<Date | undefined>();
  const [exitTime, setExitTime] = useState('');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customAsset, setCustomAsset] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [customSetup, setCustomSetup] = useState('');
  const [exitMethod, setExitMethod] = useState<'sl' | 'tp' | 'manual'>('manual');
  const [hasPendingData, setHasPendingData] = useState(false);

  const [formData, setFormData] = useState(() => {
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
        return getDefaultFormData();
      }
    }
    return getDefaultFormData();
  });

  function getDefaultFormData() {
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

  useEffect(() => {
    const savedData = localStorage.getItem(PENDING_TRADE_KEY);
    setHasPendingData(!!savedData);
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem(PENDING_TRADE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.direction) setDirection(parsed.direction);
      } catch { /* Ignore */ }
    }
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const clearPendingData = () => {
    localStorage.removeItem(PENDING_TRADE_KEY);
    setHasPendingData(false);
    setFormData(getDefaultFormData());
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

      let finalExitPrice = formData.exitPrice ? parseFloat(formData.exitPrice) : null;
      if (exitMethod === 'sl' && formData.stopLoss) {
        finalExitPrice = parseFloat(formData.stopLoss);
      } else if (exitMethod === 'tp' && formData.takeProfit) {
        finalExitPrice = parseFloat(formData.takeProfit);
      }

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
        images: uploadedMedia.images.length > 0 ? uploadedMedia.images : null,
        videos: uploadedMedia.videos.length > 0 ? uploadedMedia.videos : null,
        audios: uploadedMedia.audios.length > 0 ? uploadedMedia.audios : null,
        trade_date: date.toISOString(),
        exit_timestamp: exitTimestamp,
        exit_method: exitTimestamp ? exitMethod : null,
        duration_seconds: durationSeconds,
        timeframe: formData.timeframe || customTimeframe || null,
      });
      
      localStorage.removeItem(PENDING_TRADE_KEY);
      toast.success(t('tradeRegistered'));
      
      setFormData(getDefaultFormData());
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
    <div className="py-3 md:py-4 max-w-4xl mx-auto">
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="font-display text-xl md:text-3xl font-bold text-foreground">
            {t('addTrade')}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
            {t('registerNewTrade')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPendingData && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearPendingData}
              className="gap-1 text-muted-foreground hover:text-loss h-8 text-xs"
            >
              <Trash2 className="w-3 h-3" />
              {language === 'fr' ? 'Effacer' : 'Clear'}
            </Button>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">{calculateQualityScore()}/100</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-6">
        {/* Date, Direction, Time & Asset - Compact combined section */}
        <div className="glass-card p-3 md:p-6 space-y-3 md:space-y-4 animate-fade-in">
          <h3 className="font-display font-semibold text-foreground text-sm md:text-base">{t('basicInformation')}</h3>
          
          {/* Row 1: Date & Time + Direction */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('dateTime')}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9 text-sm",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {date ? format(date, 'dd/MM/yy', { locale }) : t('select')}
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

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('direction')}</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={direction === 'buy' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 gap-1 h-9 text-sm",
                    direction === 'buy' && "bg-profit hover:bg-profit/90 text-profit-foreground"
                  )}
                  onClick={() => setDirection('buy')}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t('buy')}
                </Button>
                <Button
                  type="button"
                  variant={direction === 'sell' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 gap-1 h-9 text-sm",
                    direction === 'sell' && "bg-loss hover:bg-loss/90 text-loss-foreground"
                  )}
                  onClick={() => setDirection('sell')}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  {t('sell')}
                </Button>
              </div>
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <span className="text-xs text-muted-foreground">{t('asset')}</span>
              <AssetCombobox
                value={formData.asset}
                onValueChange={(v) => {
                  handleInputChange('asset', v);
                  setCustomAsset('');
                }}
                customValue={customAsset}
                onCustomChange={setCustomAsset}
                showCustomInput
              />
            </div>
          </div>
        </div>

        {/* Trading Details - Compact */}
        <div className="glass-card p-3 md:p-6 space-y-3 md:space-y-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <h3 className="font-display font-semibold text-foreground text-sm md:text-base">{t('tradeDetails')}</h3>
          
          {/* Entry, SL, TP, Lot - 4 columns on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('entryPrice')}</span>
              <Input
                type="number"
                step="any"
                placeholder="1.0850"
                value={formData.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('stopLoss')}</span>
              <Input
                type="number"
                step="any"
                placeholder="1.0800"
                value={formData.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                className="h-9 text-sm border-loss/30 focus:border-loss"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('takeProfit')}</span>
              <Input
                type="number"
                step="any"
                placeholder="1.0950"
                value={formData.takeProfit}
                onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                className="h-9 text-sm border-profit/30 focus:border-profit"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('lotSize')}</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.10"
                value={formData.lotSize}
                onChange={(e) => handleInputChange('lotSize', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Exit Section - Compact */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 p-2 md:p-3 bg-secondary/30 rounded-lg border border-border">
            <div className="space-y-1">
              <span className="text-[10px] md:text-xs text-muted-foreground">{language === 'fr' ? 'Sortie' : 'Exit'}</span>
              <div className="flex gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal h-8 text-xs px-2",
                        !exitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {exitDate ? format(exitDate, 'dd/MM', { locale }) : '--/--'}
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
                  className="w-16 md:w-20 h-8 text-xs px-1"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] md:text-xs text-muted-foreground">{language === 'fr' ? 'Méthode' : 'Method'}</span>
              <Select value={exitMethod} onValueChange={(v: 'sl' | 'tp' | 'manual') => setExitMethod(v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="manual">{language === 'fr' ? 'Manuel' : 'Manual'}</SelectItem>
                  <SelectItem value="sl">SL</SelectItem>
                  <SelectItem value="tp">TP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] md:text-xs text-muted-foreground">{language === 'fr' ? 'Prix sortie' : 'Exit price'}</span>
              <Input
                type="number"
                step="any"
                placeholder={
                  exitMethod === 'sl' ? (formData.stopLoss || 'SL') :
                  exitMethod === 'tp' ? (formData.takeProfit || 'TP') : '...'
                }
                value={
                  exitMethod === 'sl' ? formData.stopLoss :
                  exitMethod === 'tp' ? formData.takeProfit : formData.exitPrice
                }
                onChange={(e) => {
                  if (exitMethod === 'manual') handleInputChange('exitPrice', e.target.value);
                }}
                disabled={exitMethod !== 'manual'}
                className={cn("h-8 text-xs", exitMethod !== 'manual' && "bg-muted cursor-not-allowed")}
              />
            </div>
          </div>

          {/* Risk, PnL, Setup, Timeframe - Compact grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('risk')} (%)</span>
              <Input
                type="number"
                step="0.1"
                placeholder="1.0"
                value={formData.risk}
                onChange={(e) => handleInputChange('risk', e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('pnl')} ($)</span>
              <Input
                type="number"
                step="0.01"
                placeholder="±150"
                value={formData.pnl}
                onChange={(e) => handleInputChange('pnl', e.target.value)}
                className={cn(
                  "h-9 text-sm",
                  parseFloat(formData.pnl) > 0 && "border-profit/50",
                  parseFloat(formData.pnl) < 0 && "border-loss/50"
                )}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('setup')}</span>
              <div className="flex gap-1">
                <Select
                  value={formData.setup}
                  onValueChange={(v) => {
                    handleInputChange('setup', v);
                    setCustomSetup('');
                  }}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-60">
                    {DEFAULT_SETUPS.map(setup => (
                      <SelectItem key={setup} value={setup}>{setup}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="+"
                  className="w-10 h-9 text-sm px-2 text-center"
                  value={customSetup}
                  onChange={(e) => {
                    setCustomSetup(e.target.value);
                    if (e.target.value) handleInputChange('setup', '');
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{t('timeframe')}</span>
              <div className="flex gap-1">
                <Select
                  value={formData.timeframe}
                  onValueChange={(v) => {
                    handleInputChange('timeframe', v);
                    setCustomTimeframe('');
                  }}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue placeholder="TF" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {TIMEFRAMES.map(tf => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="+"
                  className="w-10 h-9 text-sm px-2 text-center"
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

        {/* Psychology - Compact */}
        <div className="glass-card p-3 md:p-6 space-y-3 md:space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <h3 className="font-display font-semibold text-foreground text-sm md:text-base">
            {language === 'fr' ? 'Psychologie' : 'Psychology'}
          </h3>
          
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">{t('emotion')}</span>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map(emotion => (
                <Button
                  key={emotion.value}
                  type="button"
                  variant={formData.emotion === emotion.value ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "gap-1 h-7 text-xs px-2",
                    formData.emotion === emotion.value && "bg-primary hover:bg-primary/90"
                  )}
                  onClick={() => handleInputChange('emotion', emotion.value)}
                >
                  <span className="text-sm">{emotion.emoji}</span>
                  <span className="hidden sm:inline">{language === 'fr' ? emotion.labelFr : emotion.labelEn}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">{t('tags')}</span>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(tag => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                  className={cn(
                    "cursor-pointer transition-all text-xs py-0.5",
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

        {/* Notes & Media - Compact */}
        <div className="glass-card p-3 md:p-6 space-y-3 md:space-y-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <h3 className="font-display font-semibold text-foreground text-sm md:text-base">
            {language === 'fr' ? 'Notes & Médias' : 'Notes & Media'}
          </h3>
          
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{t('notes')}</span>
            <Textarea
              placeholder={language === 'fr' ? 'Analyse, stratégie, leçons...' : 'Analysis, strategy, lessons...'}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="min-h-[60px] md:min-h-[80px] text-sm"
            />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">{language === 'fr' ? 'Médias' : 'Media'}</span>
            <TradeMediaUploader
              mediaItems={mediaItems}
              onMediaChange={setMediaItems}
              onError={handleMediaError}
            />
          </div>
        </div>

        {/* Submit - Compact */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={isSubmitting} className="h-9 text-sm">
            {t('cancel')}
          </Button>
          <Button type="submit" className="gap-2 bg-gradient-primary hover:opacity-90 h-9 text-sm" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {isSubmitting ? '...' : t('saveTrade')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTrade;
