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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, CalendarIcon, Download, Filter, EyeOff, Eye, Settings2, BarChart3, Table, User, TrendingUp, Clock, Target } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, isWithinInterval } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { calculateStats } from '@/lib/pdfExport/statistics';

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

export interface PDFExportOptions {
  confidentialMode: boolean;
  sections: PDFSections;
}

export interface PDFSections {
  header: boolean;
  profile: boolean;
  statistics: boolean;
  additionalStats: boolean;
  performanceChart: boolean;
  tradeHistory: boolean;
}

interface PDFExportDialogProps {
  trades: Trade[];
  profile: ProfileData | null;
  onExport: (trades: Trade[], profile: ProfileData | null, periodLabel: string, options: PDFExportOptions) => Promise<void>;
  isExporting?: boolean;
  compact?: boolean;
}

type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'last7days' | 'last30days' | 'custom';

// Translations for PDF Export Dialog
const pdfExportTranslations = {
  en: {
    exportPDF: 'Export to PDF',
    pdfExport: 'PDF Export',
    period: 'Period',
    allData: 'All data',
    today: 'Today',
    thisWeek: 'This week',
    thisMonth: 'This month',
    last7Days: 'Last 7 days',
    last30Days: 'Last 30 days',
    customPeriod: 'Custom period',
    startDate: 'Start date',
    endDate: 'End date',
    select: 'Select',
    sectionsToInclude: 'Sections to include',
    headerLogo: 'Header & Logo',
    profileInfo: 'Profile Info',
    mainStatistics: 'Main Statistics',
    additionalStats: 'Additional Stats',
    performanceChart: 'Performance Chart',
    tradeHistory: 'Trade History',
    confidentialMode: 'Confidential mode',
    hideAmounts: 'Hide amounts (****)',
    preview: 'Preview',
    hide: 'Hide',
    show: 'Show',
    performanceReport: 'Performance Report',
    confidential: 'CONFIDENTIAL',
    statistics: 'Statistics',
    best: 'Best',
    worst: 'Worst',
    avgLot: 'Avg Lot',
    wins: 'Wins',
    losses: 'Losses',
    distribution: 'Distribution',
    history: 'History',
    more: 'more',
    others: 'more',
    trades: 'Trades',
    sections: 'Sections',
    cancel: 'Cancel',
    export: 'Export',
    exporting: 'Exporting...',
  },
  fr: {
    exportPDF: 'Exporter en PDF',
    pdfExport: 'Export PDF',
    period: 'Période',
    allData: 'Toutes les données',
    today: "Aujourd'hui",
    thisWeek: 'Cette semaine',
    thisMonth: 'Ce mois',
    last7Days: 'Derniers 7 jours',
    last30Days: 'Derniers 30 jours',
    customPeriod: 'Période personnalisée',
    startDate: 'Date de début',
    endDate: 'Date de fin',
    select: 'Choisir',
    sectionsToInclude: 'Sections à inclure',
    headerLogo: 'En-tête & Logo',
    profileInfo: 'Infos Profil',
    mainStatistics: 'Statistiques principales',
    additionalStats: 'Stats additionnelles',
    performanceChart: 'Graphique performance',
    tradeHistory: 'Historique trades',
    confidentialMode: 'Mode confidentiel',
    hideAmounts: 'Masquer les montants (****)',
    preview: 'Aperçu',
    hide: 'Masquer',
    show: 'Afficher',
    performanceReport: 'Rapport de Performance',
    confidential: 'CONFIDENTIEL',
    statistics: 'Statistiques',
    best: 'Meilleur',
    worst: 'Pire',
    avgLot: 'Lot Moy',
    wins: 'Gains',
    losses: 'Pertes',
    distribution: 'Distribution',
    history: 'Historique',
    more: 'autres',
    others: 'autres',
    trades: 'Trades',
    sections: 'Sections',
    cancel: 'Annuler',
    export: 'Exporter',
    exporting: 'Export...',
  },
  es: {
    exportPDF: 'Exportar a PDF',
    pdfExport: 'Exportar PDF',
    period: 'Período',
    allData: 'Todos los datos',
    today: 'Hoy',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
    last7Days: 'Últimos 7 días',
    last30Days: 'Últimos 30 días',
    customPeriod: 'Período personalizado',
    startDate: 'Fecha de inicio',
    endDate: 'Fecha de fin',
    select: 'Seleccionar',
    sectionsToInclude: 'Secciones a incluir',
    headerLogo: 'Encabezado y Logo',
    profileInfo: 'Info del Perfil',
    mainStatistics: 'Estadísticas principales',
    additionalStats: 'Stats adicionales',
    performanceChart: 'Gráfico de rendimiento',
    tradeHistory: 'Historial de trades',
    confidentialMode: 'Modo confidencial',
    hideAmounts: 'Ocultar montos (****)',
    preview: 'Vista previa',
    hide: 'Ocultar',
    show: 'Mostrar',
    performanceReport: 'Informe de Rendimiento',
    confidential: 'CONFIDENCIAL',
    statistics: 'Estadísticas',
    best: 'Mejor',
    worst: 'Peor',
    avgLot: 'Lote Prom',
    wins: 'Ganancias',
    losses: 'Pérdidas',
    distribution: 'Distribución',
    history: 'Historial',
    more: 'más',
    others: 'más',
    trades: 'Trades',
    sections: 'Secciones',
    cancel: 'Cancelar',
    export: 'Exportar',
    exporting: 'Exportando...',
  },
  pt: {
    exportPDF: 'Exportar para PDF',
    pdfExport: 'Exportar PDF',
    period: 'Período',
    allData: 'Todos os dados',
    today: 'Hoje',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mês',
    last7Days: 'Últimos 7 dias',
    last30Days: 'Últimos 30 dias',
    customPeriod: 'Período personalizado',
    startDate: 'Data de início',
    endDate: 'Data de fim',
    select: 'Selecionar',
    sectionsToInclude: 'Seções a incluir',
    headerLogo: 'Cabeçalho e Logo',
    profileInfo: 'Info do Perfil',
    mainStatistics: 'Estatísticas principais',
    additionalStats: 'Stats adicionais',
    performanceChart: 'Gráfico de performance',
    tradeHistory: 'Histórico de trades',
    confidentialMode: 'Modo confidencial',
    hideAmounts: 'Ocultar valores (****)',
    preview: 'Prévia',
    hide: 'Ocultar',
    show: 'Mostrar',
    performanceReport: 'Relatório de Performance',
    confidential: 'CONFIDENCIAL',
    statistics: 'Estatísticas',
    best: 'Melhor',
    worst: 'Pior',
    avgLot: 'Lote Méd',
    wins: 'Ganhos',
    losses: 'Perdas',
    distribution: 'Distribuição',
    history: 'Histórico',
    more: 'mais',
    others: 'mais',
    trades: 'Trades',
    sections: 'Seções',
    cancel: 'Cancelar',
    export: 'Exportar',
    exporting: 'Exportando...',
  },
  ar: {
    exportPDF: 'تصدير إلى PDF',
    pdfExport: 'تصدير PDF',
    period: 'الفترة',
    allData: 'جميع البيانات',
    today: 'اليوم',
    thisWeek: 'هذا الأسبوع',
    thisMonth: 'هذا الشهر',
    last7Days: 'آخر 7 أيام',
    last30Days: 'آخر 30 يومًا',
    customPeriod: 'فترة مخصصة',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    select: 'اختيار',
    sectionsToInclude: 'الأقسام للتضمين',
    headerLogo: 'الرأس والشعار',
    profileInfo: 'معلومات الملف',
    mainStatistics: 'الإحصائيات الرئيسية',
    additionalStats: 'إحصائيات إضافية',
    performanceChart: 'رسم الأداء',
    tradeHistory: 'سجل الصفقات',
    confidentialMode: 'الوضع السري',
    hideAmounts: 'إخفاء المبالغ (****)',
    preview: 'معاينة',
    hide: 'إخفاء',
    show: 'عرض',
    performanceReport: 'تقرير الأداء',
    confidential: 'سري',
    statistics: 'الإحصائيات',
    best: 'أفضل',
    worst: 'أسوأ',
    avgLot: 'متوسط اللوت',
    wins: 'أرباح',
    losses: 'خسائر',
    distribution: 'التوزيع',
    history: 'السجل',
    more: 'المزيد',
    others: 'المزيد',
    trades: 'صفقات',
    sections: 'الأقسام',
    cancel: 'إلغاء',
    export: 'تصدير',
    exporting: 'جارٍ التصدير...',
  },
  de: {
    exportPDF: 'Als PDF exportieren',
    pdfExport: 'PDF Export',
    period: 'Zeitraum',
    allData: 'Alle Daten',
    today: 'Heute',
    thisWeek: 'Diese Woche',
    thisMonth: 'Dieser Monat',
    last7Days: 'Letzte 7 Tage',
    last30Days: 'Letzte 30 Tage',
    customPeriod: 'Benutzerdefinierter Zeitraum',
    startDate: 'Startdatum',
    endDate: 'Enddatum',
    select: 'Auswählen',
    sectionsToInclude: 'Abschnitte einbeziehen',
    headerLogo: 'Kopf & Logo',
    profileInfo: 'Profilinfo',
    mainStatistics: 'Hauptstatistiken',
    additionalStats: 'Zusätzliche Stats',
    performanceChart: 'Leistungsdiagramm',
    tradeHistory: 'Trade-Verlauf',
    confidentialMode: 'Vertraulicher Modus',
    hideAmounts: 'Beträge ausblenden (****)',
    preview: 'Vorschau',
    hide: 'Ausblenden',
    show: 'Anzeigen',
    performanceReport: 'Leistungsbericht',
    confidential: 'VERTRAULICH',
    statistics: 'Statistiken',
    best: 'Bester',
    worst: 'Schlechtester',
    avgLot: 'Durchschn. Lot',
    wins: 'Gewinne',
    losses: 'Verluste',
    distribution: 'Verteilung',
    history: 'Verlauf',
    more: 'mehr',
    others: 'mehr',
    trades: 'Trades',
    sections: 'Abschnitte',
    cancel: 'Abbrechen',
    export: 'Exportieren',
    exporting: 'Exportiere...',
  },
  tr: {
    exportPDF: "PDF'ye aktar",
    pdfExport: 'PDF Dışa Aktar',
    period: 'Dönem',
    allData: 'Tüm veriler',
    today: 'Bugün',
    thisWeek: 'Bu hafta',
    thisMonth: 'Bu ay',
    last7Days: 'Son 7 gün',
    last30Days: 'Son 30 gün',
    customPeriod: 'Özel dönem',
    startDate: 'Başlangıç tarihi',
    endDate: 'Bitiş tarihi',
    select: 'Seç',
    sectionsToInclude: 'Dahil edilecek bölümler',
    headerLogo: 'Başlık & Logo',
    profileInfo: 'Profil Bilgisi',
    mainStatistics: 'Ana İstatistikler',
    additionalStats: 'Ek İstatistikler',
    performanceChart: 'Performans Grafiği',
    tradeHistory: 'İşlem Geçmişi',
    confidentialMode: 'Gizli mod',
    hideAmounts: 'Tutarları gizle (****)',
    preview: 'Önizleme',
    hide: 'Gizle',
    show: 'Göster',
    performanceReport: 'Performans Raporu',
    confidential: 'GİZLİ',
    statistics: 'İstatistikler',
    best: 'En İyi',
    worst: 'En Kötü',
    avgLot: 'Ort. Lot',
    wins: 'Kazançlar',
    losses: 'Kayıplar',
    distribution: 'Dağılım',
    history: 'Geçmiş',
    more: 'daha fazla',
    others: 'daha fazla',
    trades: 'İşlemler',
    sections: 'Bölümler',
    cancel: 'İptal',
    export: 'Dışa Aktar',
    exporting: 'Dışa aktarılıyor...',
  },
  it: {
    exportPDF: 'Esporta in PDF',
    pdfExport: 'Esporta PDF',
    period: 'Periodo',
    allData: 'Tutti i dati',
    today: 'Oggi',
    thisWeek: 'Questa settimana',
    thisMonth: 'Questo mese',
    last7Days: 'Ultimi 7 giorni',
    last30Days: 'Ultimi 30 giorni',
    customPeriod: 'Periodo personalizzato',
    startDate: 'Data di inizio',
    endDate: 'Data di fine',
    select: 'Seleziona',
    sectionsToInclude: 'Sezioni da includere',
    headerLogo: 'Intestazione e Logo',
    profileInfo: 'Info Profilo',
    mainStatistics: 'Statistiche principali',
    additionalStats: 'Stats aggiuntive',
    performanceChart: 'Grafico performance',
    tradeHistory: 'Storico trade',
    confidentialMode: 'Modalità riservata',
    hideAmounts: 'Nascondi importi (****)',
    preview: 'Anteprima',
    hide: 'Nascondi',
    show: 'Mostra',
    performanceReport: 'Report di Performance',
    confidential: 'RISERVATO',
    statistics: 'Statistiche',
    best: 'Migliore',
    worst: 'Peggiore',
    avgLot: 'Lotto Medio',
    wins: 'Guadagni',
    losses: 'Perdite',
    distribution: 'Distribuzione',
    history: 'Storico',
    more: 'altri',
    others: 'altri',
    trades: 'Trade',
    sections: 'Sezioni',
    cancel: 'Annulla',
    export: 'Esporta',
    exporting: 'Esportando...',
  },
};

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  trades,
  profile,
  onExport,
  isExporting = false,
  compact = false,
}) => {
  const { language } = useLanguage();
  const { triggerFeedback } = useFeedback();
  const { getCurrencySymbol, convertFromBase, decimals } = useCurrency();
  const locale = language === 'fr' ? fr : enUS;
  const t = pdfExportTranslations[language as keyof typeof pdfExportTranslations] || pdfExportTranslations.en;
  
  const [open, setOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const [confidentialMode, setConfidentialMode] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  // Sections toggles
  const [sections, setSections] = useState<PDFSections>({
    header: true,
    profile: true,
    statistics: true,
    additionalStats: true,
    performanceChart: true,
    tradeHistory: true,
  });

  const toggleSection = (key: keyof PDFSections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  const stats = useMemo(() => calculateStats(filteredTrades), [filteredTrades]);

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
        return t.last7Days;
      case 'last30days':
        return t.last30Days;
      case 'custom':
        if (customStartDate && customEndDate) {
          return `${format(customStartDate, 'dd MMM yyyy', { locale })} - ${format(customEndDate, 'dd MMM yyyy', { locale })}`;
        }
        return t.allData;
      default:
        return t.allData;
    }
  };

  const handleExport = async () => {
    triggerFeedback('click');
    await onExport(filteredTrades, profile, getPeriodLabel(), { confidentialMode, sections });
    setOpen(false);
  };

  const periodOptions = [
    { value: 'all', label: t.allData },
    { value: 'today', label: t.today },
    { value: 'week', label: t.thisWeek },
    { value: 'month', label: t.thisMonth },
    { value: 'last7days', label: t.last7Days },
    { value: 'last30days', label: t.last30Days },
    { value: 'custom', label: t.customPeriod },
  ];

  const sectionItems = [
    { key: 'profile' as const, icon: User, label: t.profileInfo },
    { key: 'statistics' as const, icon: BarChart3, label: t.mainStatistics },
    { key: 'additionalStats' as const, icon: Target, label: t.additionalStats },
    { key: 'performanceChart' as const, icon: TrendingUp, label: t.performanceChart },
    { key: 'tradeHistory' as const, icon: Table, label: t.tradeHistory },
  ];

  const formatAmount = (value: number) => {
    if (confidentialMode) return '****';
    const converted = convertFromBase(value);
    return `${getCurrencySymbol()}${converted.toFixed(decimals)}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            compact ? "flex-1 justify-center gap-2 h-10" : "w-full justify-start gap-3 h-12"
          )}
          disabled={isExporting}
        >
          <FileText className={cn(compact ? "w-4 h-4" : "w-5 h-5", "text-loss")} />
          {compact ? 'PDF' : t.exportPDF}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t.pdfExport}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 h-[60vh]">
          {/* Left: Options */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* Period Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {t.period}
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
                    <Label>{t.startDate}</Label>
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
                          {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : t.select}
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
                    <Label>{t.endDate}</Label>
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
                          {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : t.select}
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

              <Separator />

              {/* Sections Toggle */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  {t.sectionsToInclude}
                </Label>
                <div className="space-y-2">
                  {sectionItems.map((item) => (
                    <div
                      key={item.key}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                        sections[item.key] ? "bg-primary/10" : "bg-muted/50 opacity-60"
                      )}
                      onClick={() => toggleSection(item.key)}
                    >
                      <Checkbox
                        checked={sections[item.key]}
                        onCheckedChange={() => toggleSection(item.key)}
                      />
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Confidential Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t.confidentialMode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.hideAmounts}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={confidentialMode}
                  onCheckedChange={setConfidentialMode}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Right: Visual Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {t.preview}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs"
              >
                {showPreview ? t.hide : t.show}
              </Button>
            </div>

            {showPreview && (
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg border overflow-hidden shadow-inner">
                <ScrollArea className="h-full">
                  <div className="p-3 space-y-2 text-[10px] scale-[0.85] origin-top-left w-[118%]">
                    {/* Mini PDF Preview */}
                    {sections.header && (
                      <div className="bg-slate-900 text-white p-2 rounded-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[8px] font-bold">
                            STT
                          </div>
                          <div>
                            <p className="font-bold text-[10px]">Smart Trade Tracker</p>
                            <p className="text-[8px] text-slate-400">
                              {t.performanceReport}
                            </p>
                          </div>
                        </div>
                        {confidentialMode && (
                          <span className="bg-yellow-500 text-black text-[6px] px-1 py-0.5 rounded font-bold">
                            {t.confidential}
                          </span>
                        )}
                      </div>
                    )}

                    {sections.profile && profile && (
                      <div className="text-right text-[8px] text-muted-foreground">
                        Level {profile.level || 1} • {profile.total_points || 0} pts
                      </div>
                    )}

                    <div className="bg-muted/30 rounded px-2 py-1 text-[8px]">
                      <span className="text-muted-foreground">{t.period}:</span>{' '}
                      <span className="font-medium">{getPeriodLabel()}</span>
                    </div>

                    {sections.statistics && (
                      <div className="space-y-1">
                        <p className="font-bold text-[9px]">{t.statistics}</p>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { label: 'Trades', value: stats.totalTrades },
                            { label: 'Winrate', value: `${stats.winrate}%`, win: stats.winrate >= 50 },
                            { label: 'PF', value: stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2), win: stats.profitFactor >= 1 },
                            { label: 'PnL', value: formatAmount(stats.totalPnL), win: stats.totalPnL >= 0 },
                            { label: t.best, value: formatAmount(stats.bestTrade), win: true },
                            { label: t.worst, value: formatAmount(stats.worstTrade), win: false },
                          ].map((stat, i) => (
                            <div key={i} className="bg-muted/50 rounded p-1">
                              <p className="text-[7px] text-muted-foreground">{stat.label}</p>
                              <p className={cn(
                                "text-[9px] font-bold",
                                typeof stat.win === 'boolean' ? (stat.win ? "text-profit" : "text-loss") : ""
                              )}>
                                {stat.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sections.additionalStats && (
                      <div className="flex gap-2 text-[7px] text-muted-foreground">
                        <span>{t.avgLot}: {confidentialMode ? '****' : stats.avgLotSize.toFixed(2)}</span>
                        <span>•</span>
                        <span>{t.wins}: {stats.winningTrades}</span>
                        <span>•</span>
                        <span>{t.losses}: {stats.losingTrades}</span>
                      </div>
                    )}

                    {sections.performanceChart && (
                      <div className="bg-muted/30 rounded p-2">
                        <p className="text-[8px] text-muted-foreground mb-1">{t.distribution}</p>
                        <div className="flex h-4 rounded overflow-hidden">
                          <div 
                            className="bg-profit" 
                            style={{ width: `${stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 0}%` }} 
                          />
                          <div 
                            className="bg-muted" 
                            style={{ width: `${stats.totalTrades > 0 ? (stats.breakeven / stats.totalTrades) * 100 : 0}%` }} 
                          />
                          <div 
                            className="bg-loss" 
                            style={{ width: `${stats.totalTrades > 0 ? (stats.losingTrades / stats.totalTrades) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>
                    )}

                    {sections.tradeHistory && (
                      <div className="space-y-1">
                        <p className="font-bold text-[9px]">{t.history}</p>
                        <div className="border rounded overflow-hidden">
                          <div className="bg-slate-900 text-white grid grid-cols-5 gap-1 p-1 text-[7px]">
                            <span>Date</span>
                            <span>Asset</span>
                            <span>Dir</span>
                            <span>Lot</span>
                            <span>PnL</span>
                          </div>
                          {filteredTrades.slice(0, 3).map((trade, i) => (
                            <div key={i} className="grid grid-cols-5 gap-1 p-1 text-[7px] border-t">
                              <span>{format(new Date(trade.trade_date), 'dd/MM')}</span>
                              <span className="truncate">{trade.asset}</span>
                              <span>{trade.direction[0].toUpperCase()}</span>
                              <span>{confidentialMode ? '****' : trade.lot_size}</span>
                              <span className={trade.result === 'win' ? 'text-profit' : trade.result === 'loss' ? 'text-loss' : ''}>
                                {formatAmount(trade.profit_loss || 0)}
                              </span>
                            </div>
                          ))}
                          {filteredTrades.length > 3 && (
                            <div className="text-center text-[7px] text-muted-foreground py-1 border-t">
                              +{filteredTrades.length - 3} {t.others}...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Export Summary */}
            <div className="mt-3 p-2 bg-muted/50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.trades}:</span>
                <span className="font-medium">{filteredTrades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.sections}:</span>
                <span className="font-medium">{Object.values(sections).filter(Boolean).length}/6</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            {t.cancel}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || filteredTrades.length === 0}
            className="flex-1 gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? t.exporting : t.export}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFExportDialog;
