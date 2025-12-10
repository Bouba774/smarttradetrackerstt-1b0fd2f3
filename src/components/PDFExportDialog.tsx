import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useFeedback } from '@/hooks/useFeedback';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, CalendarIcon, Download, Filter } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, isWithinInterval } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Trade {
  id: string;
  trade_date: string;
  asset: string;
  direction: string;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  lot_size: number;
  profit_loss: number | null;
  result: string | null;
  setup: string | null;
  emotions: string | null;
  notes?: string | null;
}

interface ProfileData {
  nickname: string;
  level: number | null;
  total_points: number | null;
}

interface PDFExportDialogProps {
  trades: Trade[];
  profile: ProfileData | null;
  onExport: (trades: Trade[], profile: ProfileData | null, periodLabel: string) => Promise<void>;
  isExporting?: boolean;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'last7days' | 'last30days' | 'custom';

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  trades,
  profile,
  onExport,
  isExporting = false,
}) => {
  const { language, t } = useLanguage();
  const { triggerFeedback } = useFeedback();
  const locale = language === 'fr' ? fr : enUS;
  
  const [open, setOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  const filteredTrades = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate: Date;
    let endDate: Date = today;

    switch (periodFilter) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'last7days':
        startDate = subDays(today, 7);
        break;
      case 'last30days':
        startDate = subDays(today, 30);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          return trades;
        }
        break;
      default:
        return trades;
    }

    return trades.filter(trade => {
      const tradeDate = new Date(trade.trade_date);
      return isWithinInterval(tradeDate, { start: startDate, end: endDate });
    });
  }, [trades, periodFilter, customStartDate, customEndDate]);

  const getPeriodLabel = (): string => {
    const today = new Date();
    
    switch (periodFilter) {
      case 'today':
        return format(today, 'dd MMMM yyyy', { locale });
      case 'week':
        return `${format(startOfWeek(today, { weekStartsOn: 1 }), 'dd MMM', { locale })} - ${format(endOfWeek(today, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale })}`;
      case 'month':
        return format(today, 'MMMM yyyy', { locale });
      case 'last7days':
        return language === 'fr' ? 'Derniers 7 jours' : 'Last 7 days';
      case 'last30days':
        return language === 'fr' ? 'Derniers 30 jours' : 'Last 30 days';
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'dd MMM yyyy', { locale })} - ${format(customEndDate, 'dd MMM yyyy', { locale })}`;
        }
        return language === 'fr' ? 'Toutes les données' : 'All data';
      default:
        return language === 'fr' ? 'Toutes les données' : 'All data';
    }
  };

  const handleExport = async () => {
    triggerFeedback('click');
    await onExport(filteredTrades, profile, getPeriodLabel());
    setOpen(false);
  };

  const periodOptions = [
    { value: 'all', label: language === 'fr' ? 'Toutes les données' : 'All data' },
    { value: 'today', label: language === 'fr' ? "Aujourd'hui" : 'Today' },
    { value: 'week', label: language === 'fr' ? 'Cette semaine' : 'This week' },
    { value: 'month', label: language === 'fr' ? 'Ce mois' : 'This month' },
    { value: 'last7days', label: language === 'fr' ? 'Derniers 7 jours' : 'Last 7 days' },
    { value: 'last30days', label: language === 'fr' ? 'Derniers 30 jours' : 'Last 30 days' },
    { value: 'custom', label: language === 'fr' ? 'Période personnalisée' : 'Custom period' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12"
          disabled={isExporting}
        >
          <FileText className="w-5 h-5 text-loss" />
          {language === 'fr' ? 'Exporter en PDF' : 'Export to PDF'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {language === 'fr' ? 'Export PDF' : 'PDF Export'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Period Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {language === 'fr' ? 'Période' : 'Period'}
            </Label>
            <Select value={periodFilter} onValueChange={(val) => setPeriodFilter(val as PeriodFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {periodFilter === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{language === 'fr' ? 'Date de début' : 'Start date'}</Label>
                <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !customStartDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : language === 'fr' ? 'Choisir' : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={(date) => {
                        setCustomStartDate(date);
                        setStartCalendarOpen(false);
                      }}
                      initialFocus
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{language === 'fr' ? 'Date de fin' : 'End date'}</Label>
                <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !customEndDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : language === 'fr' ? 'Choisir' : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={(date) => {
                        setCustomEndDate(date);
                        setEndCalendarOpen(false);
                      }}
                      initialFocus
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-foreground">
              {language === 'fr' ? 'Aperçu de l\'export' : 'Export preview'}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{language === 'fr' ? 'Période:' : 'Period:'}</span>
              <span className="font-medium">{getPeriodLabel()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{language === 'fr' ? 'Trades:' : 'Trades:'}</span>
              <span className="font-medium">{filteredTrades.length}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || filteredTrades.length === 0}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? (language === 'fr' ? 'Export...' : 'Exporting...') : (language === 'fr' ? 'Exporter' : 'Export')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExportDialog;
