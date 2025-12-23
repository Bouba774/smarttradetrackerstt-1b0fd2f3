import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Trade } from '@/hooks/useTrades';
import { useTradeMedia, type MediaType } from '@/hooks/useTradeMedia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Save,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/tradeValidation';
import { TIMEFRAMES, EMOTIONS } from '@/data/tradeFormOptions';
import { MediaSection } from '@/components/EditTradeDialog/MediaSection';

interface ExistingMedia {
  url: string;
  type: MediaType;
}

interface NewMedia {
  file: File;
  type: MediaType;
  preview: string;
}

interface EditTradeDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Trade>) => Promise<void>;
}

const EditTradeDialog: React.FC<EditTradeDialogProps> = ({
  trade,
  open,
  onOpenChange,
  onSave,
}) => {
  const { t, language } = useLanguage();
  const { uploadMedia, deleteMedia } = useTradeMedia();
  const locale = language === 'fr' ? fr : enUS;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [exitMethod, setExitMethod] = useState<'sl' | 'tp' | 'manual'>('manual');
  
  // Media state
  const [existingMedia, setExistingMedia] = useState<ExistingMedia[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [newMediaItems, setNewMediaItems] = useState<NewMedia[]>([]);
  
  const [formData, setFormData] = useState({
    asset: '',
    setup: '',
    timeframe: '',
    entryPrice: '',
    exitPrice: '',
    stopLoss: '',
    takeProfit: '',
    lotSize: '',
    pnl: '',
    emotion: '',
    notes: '',
  });

  // Initialize form when trade changes
  useEffect(() => {
    if (trade) {
      setDate(parseISO(trade.trade_date));
      setDirection(trade.direction as 'long' | 'short');
      setExitMethod((trade.exit_method as 'sl' | 'tp' | 'manual') || 'manual');
      
      // Build existing media list
      const media: ExistingMedia[] = [];
      if (trade.images) {
        trade.images.forEach(url => media.push({ url, type: 'image' }));
      }
      if (trade.videos) {
        trade.videos.forEach(url => media.push({ url, type: 'video' }));
      }
      if (trade.audios) {
        trade.audios.forEach(url => media.push({ url, type: 'audio' }));
      }
      setExistingMedia(media);
      setMediaToDelete([]);
      setNewMediaItems([]);
      
      setFormData({
        asset: trade.asset || '',
        setup: trade.setup || '',
        timeframe: trade.timeframe || '',
        entryPrice: trade.entry_price?.toString() || '',
        exitPrice: trade.exit_price?.toString() || '',
        stopLoss: trade.stop_loss?.toString() || '',
        takeProfit: trade.take_profit?.toString() || '',
        lotSize: trade.lot_size?.toString() || '',
        pnl: trade.profit_loss?.toString() || '',
        emotion: trade.emotions || '',
        notes: trade.notes || '',
      });
    }
  }, [trade]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNewMediaUpload = (items: NewMedia[]) => {
    setNewMediaItems(prev => [...prev, ...items]);
  };

  const removeExistingMedia = (url: string) => {
    setMediaToDelete(prev => [...prev, url]);
  };

  const restoreExistingMedia = (url: string) => {
    setMediaToDelete(prev => prev.filter(u => u !== url));
  };

  const removeNewMedia = (index: number) => {
    const item = newMediaItems[index];
    URL.revokeObjectURL(item.preview);
    setNewMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade) return;

    // Basic validation
    if (!formData.asset.trim()) {
      toast.error(language === 'fr' ? 'L\'actif est requis' : 'Asset is required');
      return;
    }
    if (!formData.entryPrice || parseFloat(formData.entryPrice) <= 0) {
      toast.error(language === 'fr' ? 'Le prix d\'entrée est requis' : 'Entry price is required');
      return;
    }
    if (!formData.lotSize || parseFloat(formData.lotSize) <= 0) {
      toast.error(language === 'fr' ? 'La taille de lot est requise' : 'Lot size is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const pnl = formData.pnl ? parseFloat(formData.pnl) : null;
      let result: 'win' | 'loss' | 'breakeven' | 'pending' | null = null;
      
      if (pnl !== null) {
        if (pnl > 0) result = 'win';
        else if (pnl < 0) result = 'loss';
        else result = 'breakeven';
      } else {
        result = 'pending';
      }

      // Calculate exit price based on exit method
      let finalExitPrice = formData.exitPrice ? parseFloat(formData.exitPrice) : null;
      if (exitMethod === 'sl' && formData.stopLoss) {
        finalExitPrice = parseFloat(formData.stopLoss);
      } else if (exitMethod === 'tp' && formData.takeProfit) {
        finalExitPrice = parseFloat(formData.takeProfit);
      }

      // Handle media deletions
      for (const url of mediaToDelete) {
        const mediaItem = existingMedia.find(m => m.url === url);
        if (mediaItem) {
          await deleteMedia(url, mediaItem.type);
        }
      }

      // Upload new media
      const newFiles = newMediaItems.map(item => item.file);
      let uploadedMedia = { images: [] as string[], videos: [] as string[], audios: [] as string[] };
      if (newFiles.length > 0) {
        uploadedMedia = await uploadMedia(newFiles);
      }

      // Combine remaining existing media with new uploads
      const remainingExisting = existingMedia.filter(m => !mediaToDelete.includes(m.url));
      const finalImages = [
        ...remainingExisting.filter(m => m.type === 'image').map(m => m.url),
        ...uploadedMedia.images
      ];
      const finalVideos = [
        ...remainingExisting.filter(m => m.type === 'video').map(m => m.url),
        ...uploadedMedia.videos
      ];
      const finalAudios = [
        ...remainingExisting.filter(m => m.type === 'audio').map(m => m.url),
        ...uploadedMedia.audios
      ];

      await onSave(trade.id, {
        asset: formData.asset,
        direction,
        entry_price: parseFloat(formData.entryPrice),
        exit_price: finalExitPrice,
        stop_loss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
        take_profit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
        lot_size: parseFloat(formData.lotSize),
        setup: formData.setup || null,
        result,
        profit_loss: pnl,
        notes: formData.notes ? sanitizeText(formData.notes) : null,
        emotions: formData.emotion || null,
        trade_date: date.toISOString(),
        exit_method: finalExitPrice ? exitMethod : null,
        timeframe: formData.timeframe || null,
        images: finalImages.length > 0 ? finalImages : null,
        videos: finalVideos.length > 0 ? finalVideos : null,
        audios: finalAudios.length > 0 ? finalAudios : null,
      });

      toast.success(language === 'fr' ? 'Trade mis à jour' : 'Trade updated');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating trade:', error);
      toast.error(language === 'fr' ? 'Erreur lors de la mise à jour' : 'Error updating trade');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {language === 'fr' ? 'Modifier le trade' : 'Edit Trade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date & Direction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('direction')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={direction === 'long' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 gap-2",
                    direction === 'long' && "bg-profit hover:bg-profit/90 text-profit-foreground"
                  )}
                  onClick={() => setDirection('long')}
                >
                  <TrendingUp className="w-4 h-4" />
                  Long
                </Button>
                <Button
                  type="button"
                  variant={direction === 'short' ? 'default' : 'outline'}
                  className={cn(
                    "flex-1 gap-2",
                    direction === 'short' && "bg-loss hover:bg-loss/90 text-loss-foreground"
                  )}
                  onClick={() => setDirection('short')}
                >
                  <TrendingDown className="w-4 h-4" />
                  Short
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('asset')}</Label>
              <Input
                value={formData.asset}
                onChange={(e) => handleInputChange('asset', e.target.value)}
                placeholder="EUR/USD"
              />
            </div>
          </div>

          {/* Trading Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t('entryPrice')}</Label>
              <Input
                type="number"
                step="any"
                value={formData.entryPrice}
                onChange={(e) => handleInputChange('entryPrice', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('stopLoss')}</Label>
              <Input
                type="number"
                step="any"
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
                value={formData.takeProfit}
                onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                className="border-profit/30 focus:border-profit"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('lotSize')}</Label>
              <Input
                type="number"
                step="any"
                value={formData.lotSize}
                onChange={(e) => handleInputChange('lotSize', e.target.value)}
              />
            </div>
          </div>

          {/* Exit Details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('exitPrice')}</Label>
              <Input
                type="number"
                step="any"
                value={formData.exitPrice}
                onChange={(e) => handleInputChange('exitPrice', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Méthode de sortie' : 'Exit Method'}</Label>
              <Select value={exitMethod} onValueChange={(v) => setExitMethod(v as 'sl' | 'tp' | 'manual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="manual">{language === 'fr' ? 'Manuel' : 'Manual'}</SelectItem>
                  <SelectItem value="sl">Stop Loss</SelectItem>
                  <SelectItem value="tp">Take Profit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>PnL</Label>
              <Input
                type="number"
                step="any"
                value={formData.pnl}
                onChange={(e) => handleInputChange('pnl', e.target.value)}
                className={cn(
                  parseFloat(formData.pnl) > 0 && "border-profit/50 text-profit",
                  parseFloat(formData.pnl) < 0 && "border-loss/50 text-loss"
                )}
              />
            </div>
          </div>

          {/* Setup & Timeframe */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('setup')}</Label>
              <Input
                placeholder={language === 'fr' ? 'Ex: Breakout, Pullback...' : 'Ex: Breakout, Pullback...'}
                value={formData.setup}
                onChange={(e) => handleInputChange('setup', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('timeframe')}</Label>
              <Select value={formData.timeframe} onValueChange={(v) => handleInputChange('timeframe', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTimeframe')} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Emotion */}
          <div className="space-y-2">
            <Label>{t('emotion')}</Label>
            <Select value={formData.emotion} onValueChange={(v) => handleInputChange('emotion', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectEmotion')} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {EMOTIONS.map(em => (
                  <SelectItem key={em.value} value={em.value}>
                    {em.emoji} {language === 'fr' ? em.labelFr : em.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={language === 'fr' ? 'Notes sur ce trade...' : 'Notes about this trade...'}
              rows={3}
            />
          </div>

          {/* Media Section */}
          <MediaSection
            language={language}
            existingMedia={existingMedia}
            mediaToDelete={mediaToDelete}
            newMediaItems={newMediaItems}
            onNewMediaUpload={handleNewMediaUpload}
            onRemoveExistingMedia={removeExistingMedia}
            onRestoreExistingMedia={restoreExistingMedia}
            onRemoveNewMedia={removeNewMedia}
          />

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTradeDialog;
