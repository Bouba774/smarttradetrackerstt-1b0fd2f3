import React, { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  parseTradeFile,
  convertToAppTrades,
  type ParseResult,
  type ParsedMTTrade,
} from '@/lib/mtTradeParser';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

interface MTTradeImporterProps {
  onImportComplete?: () => void;
}

const MTTradeImporter: React.FC<MTTradeImporterProps> = ({ onImportComplete }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locale = language === 'fr' ? fr : enUS;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const t = {
    fr: {
      title: 'Importer depuis votre broker',
      description: 'Importez votre historique de trades',
      dropzone: 'Glissez un fichier ici',
      orClick: 'ou cliquez pour sélectionner',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'Analyse en cours...',
      importing: 'Importation des trades...',
      success: 'Import terminé avec succès',
      error: 'Erreur lors de l\'import',
      tradesFound: 'trades trouvés',
      tradesImported: 'trades importés',
      errors: 'erreurs',
      showErrors: 'Voir les erreurs',
      hideErrors: 'Masquer les erreurs',
      importNow: 'Importer maintenant',
      cancel: 'Annuler',
      howToExport: 'Comment exporter depuis votre broker ?',
      mt4Step: 'MT4: Historique du compte → Clic droit → Enregistrer comme rapport détaillé (HTML)',
      mt5Step: 'MT5: Historique → Clic droit → Rapport → HTML ou CSV',
      noTrades: 'Aucun trade trouvé dans ce fichier',
      formatDetected: 'Format détecté',
      preview: 'Aperçu',
      hidePreview: 'Masquer',
      previewTitle: 'Trades à importer',
      date: 'Date',
      symbol: 'Symbole',
      type: 'Type',
      volume: 'Volume',
      profit: 'Profit',
      buy: 'Achat',
      sell: 'Vente',
      more: 'de plus',
    },
    en: {
      title: 'Import from your broker',
      description: 'Import your trade history',
      dropzone: 'Drop a file here',
      orClick: 'or click to select',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'Processing...',
      importing: 'Importing trades...',
      success: 'Import completed successfully',
      error: 'Import error',
      tradesFound: 'trades found',
      tradesImported: 'trades imported',
      errors: 'errors',
      showErrors: 'Show errors',
      hideErrors: 'Hide errors',
      importNow: 'Import now',
      cancel: 'Cancel',
      howToExport: 'How to export from your broker?',
      mt4Step: 'MT4: Account History → Right-click → Save as Detailed Report (HTML)',
      mt5Step: 'MT5: History → Right-click → Report → HTML or CSV',
      noTrades: 'No trades found in this file',
      formatDetected: 'Format detected',
      preview: 'Preview',
      hidePreview: 'Hide',
      previewTitle: 'Trades to import',
      date: 'Date',
      symbol: 'Symbol',
      type: 'Type',
      volume: 'Volume',
      profit: 'Profit',
      buy: 'Buy',
      sell: 'Sell',
      more: 'more',
    },
    es: {
      title: 'Importar desde su broker',
      description: 'Importe su historial de trades',
      dropzone: 'Arrastre un archivo aquí',
      orClick: 'o haga clic para seleccionar',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'Procesando...',
      importing: 'Importando trades...',
      success: 'Importación completada con éxito',
      error: 'Error de importación',
      tradesFound: 'trades encontrados',
      tradesImported: 'trades importados',
      errors: 'errores',
      showErrors: 'Ver errores',
      hideErrors: 'Ocultar errores',
      importNow: 'Importar ahora',
      cancel: 'Cancelar',
      howToExport: '¿Cómo exportar desde su broker?',
      mt4Step: 'MT4: Historial de cuenta → Clic derecho → Guardar como informe detallado (HTML)',
      mt5Step: 'MT5: Historial → Clic derecho → Informe → HTML o CSV',
      noTrades: 'No se encontraron trades en este archivo',
      formatDetected: 'Formato detectado',
      preview: 'Vista previa',
      hidePreview: 'Ocultar',
      previewTitle: 'Trades a importar',
      date: 'Fecha',
      symbol: 'Símbolo',
      type: 'Tipo',
      volume: 'Volumen',
      profit: 'Beneficio',
      buy: 'Compra',
      sell: 'Venta',
      more: 'más',
    },
    pt: {
      title: 'Importar do seu broker',
      description: 'Importe seu histórico de trades',
      dropzone: 'Arraste um arquivo aqui',
      orClick: 'ou clique para selecionar',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'Processando...',
      importing: 'Importando trades...',
      success: 'Importação concluída com sucesso',
      error: 'Erro de importação',
      tradesFound: 'trades encontrados',
      tradesImported: 'trades importados',
      errors: 'erros',
      showErrors: 'Ver erros',
      hideErrors: 'Ocultar erros',
      importNow: 'Importar agora',
      cancel: 'Cancelar',
      howToExport: 'Como exportar do seu broker?',
      mt4Step: 'MT4: Histórico da conta → Clique direito → Salvar como relatório detalhado (HTML)',
      mt5Step: 'MT5: Histórico → Clique direito → Relatório → HTML ou CSV',
      noTrades: 'Nenhum trade encontrado neste arquivo',
      formatDetected: 'Formato detectado',
      preview: 'Prévia',
      hidePreview: 'Ocultar',
      previewTitle: 'Trades a importar',
      date: 'Data',
      symbol: 'Símbolo',
      type: 'Tipo',
      volume: 'Volume',
      profit: 'Lucro',
      buy: 'Compra',
      sell: 'Venda',
      more: 'mais',
    },
    ar: {
      title: 'استيراد من الوسيط',
      description: 'استورد سجل صفقاتك',
      dropzone: 'اسحب ملفًا هنا',
      orClick: 'أو انقر للاختيار',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'جارٍ المعالجة...',
      importing: 'جارٍ استيراد الصفقات...',
      success: 'تم الاستيراد بنجاح',
      error: 'خطأ في الاستيراد',
      tradesFound: 'صفقات موجودة',
      tradesImported: 'صفقات مستوردة',
      errors: 'أخطاء',
      showErrors: 'عرض الأخطاء',
      hideErrors: 'إخفاء الأخطاء',
      importNow: 'استيراد الآن',
      cancel: 'إلغاء',
      howToExport: 'كيفية التصدير من الوسيط؟',
      mt4Step: 'MT4: سجل الحساب ← انقر بزر الماوس الأيمن ← حفظ كتقرير مفصل (HTML)',
      mt5Step: 'MT5: السجل ← انقر بزر الماوس الأيمن ← تقرير ← HTML أو CSV',
      noTrades: 'لم يتم العثور على صفقات في هذا الملف',
      formatDetected: 'تم اكتشاف التنسيق',
      preview: 'معاينة',
      hidePreview: 'إخفاء',
      previewTitle: 'الصفقات للاستيراد',
      date: 'التاريخ',
      symbol: 'الرمز',
      type: 'النوع',
      volume: 'الحجم',
      profit: 'الربح',
      buy: 'شراء',
      sell: 'بيع',
      more: 'المزيد',
    },
    de: {
      title: 'Von Ihrem Broker importieren',
      description: 'Importieren Sie Ihren Trade-Verlauf',
      dropzone: 'Datei hierher ziehen',
      orClick: 'oder klicken Sie zur Auswahl',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'Verarbeitung...',
      importing: 'Trades werden importiert...',
      success: 'Import erfolgreich abgeschlossen',
      error: 'Importfehler',
      tradesFound: 'Trades gefunden',
      tradesImported: 'Trades importiert',
      errors: 'Fehler',
      showErrors: 'Fehler anzeigen',
      hideErrors: 'Fehler ausblenden',
      importNow: 'Jetzt importieren',
      cancel: 'Abbrechen',
      howToExport: 'Wie exportiert man von seinem Broker?',
      mt4Step: 'MT4: Kontoverlauf → Rechtsklick → Als detaillierten Bericht speichern (HTML)',
      mt5Step: 'MT5: Verlauf → Rechtsklick → Bericht → HTML oder CSV',
      noTrades: 'Keine Trades in dieser Datei gefunden',
      formatDetected: 'Format erkannt',
      preview: 'Vorschau',
      hidePreview: 'Ausblenden',
      previewTitle: 'Zu importierende Trades',
      date: 'Datum',
      symbol: 'Symbol',
      type: 'Typ',
      volume: 'Volumen',
      profit: 'Gewinn',
      buy: 'Kauf',
      sell: 'Verkauf',
      more: 'mehr',
    },
    tr: {
      title: 'Brokerınızdan içe aktarın',
      description: 'İşlem geçmişinizi içe aktarın',
      dropzone: 'Buraya bir dosya sürükleyin',
      orClick: 'veya seçmek için tıklayın',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'İşleniyor...',
      importing: 'İşlemler içe aktarılıyor...',
      success: 'İçe aktarma başarıyla tamamlandı',
      error: 'İçe aktarma hatası',
      tradesFound: 'işlem bulundu',
      tradesImported: 'işlem içe aktarıldı',
      errors: 'hatalar',
      showErrors: 'Hataları göster',
      hideErrors: 'Hataları gizle',
      importNow: 'Şimdi içe aktar',
      cancel: 'İptal',
      howToExport: 'Brokerınızdan nasıl dışa aktarılır?',
      mt4Step: 'MT4: Hesap Geçmişi → Sağ tıklama → Detaylı Rapor Olarak Kaydet (HTML)',
      mt5Step: 'MT5: Geçmiş → Sağ tıklama → Rapor → HTML veya CSV',
      noTrades: 'Bu dosyada işlem bulunamadı',
      formatDetected: 'Format tespit edildi',
      preview: 'Önizleme',
      hidePreview: 'Gizle',
      previewTitle: 'İçe aktarılacak işlemler',
      date: 'Tarih',
      symbol: 'Sembol',
      type: 'Tür',
      volume: 'Hacim',
      profit: 'Kar',
      buy: 'Alış',
      sell: 'Satış',
      more: 'daha fazla',
    },
    it: {
      title: 'Importa dal tuo broker',
      description: 'Importa la cronologia dei trade',
      dropzone: 'Trascina un file qui',
      orClick: 'o clicca per selezionare',
      supportedFormats: 'CSV, HTML, XML, JSON',
      processing: 'Elaborazione...',
      importing: 'Importazione trade...',
      success: 'Importazione completata con successo',
      error: 'Errore di importazione',
      tradesFound: 'trade trovati',
      tradesImported: 'trade importati',
      errors: 'errori',
      showErrors: 'Mostra errori',
      hideErrors: 'Nascondi errori',
      importNow: 'Importa ora',
      cancel: 'Annulla',
      howToExport: 'Come esportare dal tuo broker?',
      mt4Step: 'MT4: Cronologia account → Clic destro → Salva come report dettagliato (HTML)',
      mt5Step: 'MT5: Cronologia → Clic destro → Report → HTML o CSV',
      noTrades: 'Nessun trade trovato in questo file',
      formatDetected: 'Formato rilevato',
      preview: 'Anteprima',
      hidePreview: 'Nascondi',
      previewTitle: 'Trade da importare',
      date: 'Data',
      symbol: 'Simbolo',
      type: 'Tipo',
      volume: 'Volume',
      profit: 'Profitto',
      buy: 'Acquisto',
      sell: 'Vendita',
      more: 'altri',
    },
  };

  const texts = t[language as keyof typeof t] || t.en;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!user) {
      toast.error(texts.error);
      return;
    }

    const validExtensions = ['.csv', '.html', '.htm', '.txt', '.xml', '.xls', '.json'];
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidExtension && !file.type.includes('text') && !file.type.includes('json') && !file.type.includes('xml')) {
      toast.error(texts.error);
      return;
    }

    setIsProcessing(true);
    setParseResult(null);
    setShowPreview(false);

    try {
      const content = await file.text();
      const result = parseTradeFile(content, file.name);
      
      setParseResult(result);
      
      if (result.trades.length === 0) {
        toast.warning(texts.noTrades);
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error(texts.error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!user || !parseResult || parseResult.trades.length === 0) return;

    setIsProcessing(true);
    setImportProgress(0);

    try {
      const trades = convertToAppTrades(parseResult.trades, user.id);
      
      const batchSize = 50;
      let imported = 0;
      
      for (let i = 0; i < trades.length; i += batchSize) {
        const batch = trades.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('trades')
          .insert(batch);

        if (error) {
          console.error('Import batch error:', error);
        } else {
          imported += batch.length;
        }
        
        setImportProgress(Math.round((imported / trades.length) * 100));
      }

      toast.success(`${texts.success} (${imported} ${texts.tradesImported})`);
      setParseResult(null);
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error(texts.error);
    } finally {
      setIsProcessing(false);
      setImportProgress(0);
    }
  };

  const resetImport = () => {
    setParseResult(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTradeDate = (date: Date) => {
    return format(date, 'dd/MM/yy HH:mm', { locale });
  };

  const getFormatIcon = (formatName: string) => {
    if (formatName.includes('CSV')) return <FileSpreadsheet className="w-3 h-3" />;
    if (formatName.includes('HTML')) return <FileText className="w-3 h-3" />;
    if (formatName.includes('XML') || formatName.includes('Excel')) return <FileSpreadsheet className="w-3 h-3" />;
    if (formatName.includes('JSON')) return <FileCode className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">{texts.title}</CardTitle>
        </div>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        {!parseResult && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
              transition-all duration-200
              ${isDragging 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
              }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.html,.htm,.txt,.xml,.xls,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{texts.processing}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-2 mb-3">
                  <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                  <FileCode className="w-6 h-6 text-muted-foreground" />
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{texts.dropzone}</p>
                <p className="text-xs text-muted-foreground mt-1">{texts.orClick}</p>
                <div className="flex justify-center gap-1 mt-3">
                  {['CSV', 'HTML', 'XML', 'JSON'].map((fmt) => (
                    <Badge key={fmt} variant="outline" className="text-xs px-1.5 py-0">
                      {fmt}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Parse Result */}
        {parseResult && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              {parseResult.success ? (
                <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-destructive shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-lg">
                    {parseResult.trades.length}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {texts.tradesFound}
                  </span>
                  <Badge variant="outline" className="gap-1 text-xs">
                    {getFormatIcon(parseResult.format)}
                    {parseResult.format}
                  </Badge>
                </div>
                
                {parseResult.errors.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-amber-500 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{parseResult.errors.length} {texts.errors}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Toggle */}
            {parseResult.trades.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="gap-1"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? texts.hidePreview : texts.preview}
                </Button>
                
                {parseResult.errors.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowErrors(!showErrors)}
                    className="gap-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {showErrors ? texts.hideErrors : texts.showErrors}
                  </Button>
                )}
              </div>
            )}

            {/* Preview Table */}
            {showPreview && parseResult.trades.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="p-2 bg-muted/50 border-b">
                  <p className="text-sm font-medium">{texts.previewTitle}</p>
                </div>
                <ScrollArea className="h-48">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">{texts.date}</TableHead>
                        <TableHead className="text-xs">{texts.symbol}</TableHead>
                        <TableHead className="text-xs">{texts.type}</TableHead>
                        <TableHead className="text-xs text-right">{texts.volume}</TableHead>
                        <TableHead className="text-xs text-right">{texts.profit}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.trades.slice(0, 20).map((trade, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs py-1.5">
                            {formatTradeDate(trade.openTime)}
                          </TableCell>
                          <TableCell className="font-mono text-xs py-1.5">
                            {trade.symbol}
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Badge 
                              variant={trade.type === 'buy' ? 'default' : 'destructive'}
                              className="text-xs py-0 px-1"
                            >
                              {trade.type === 'buy' ? texts.buy : texts.sell}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs py-1.5">
                            {trade.volume.toFixed(2)}
                          </TableCell>
                          <TableCell className={`text-right text-xs py-1.5 font-medium ${
                            trade.profit >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parseResult.trades.length > 20 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{parseResult.trades.length - 20} {texts.more}
                    </p>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Progress Bar during import */}
            {isProcessing && importProgress > 0 && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-xs text-center text-muted-foreground">
                  {texts.importing} ({importProgress}%)
                </p>
              </div>
            )}

            {/* Errors Collapsible */}
            {showErrors && parseResult.errors.length > 0 && (
              <div className="border border-amber-500/30 rounded-lg overflow-hidden">
                <div className="p-2 bg-amber-500/10 border-b border-amber-500/30">
                  <p className="text-sm font-medium text-amber-600">{texts.errors}</p>
                </div>
                <ScrollArea className="h-24">
                  <div className="p-2 space-y-1">
                    {parseResult.errors.map((error, i) => (
                      <p key={i} className="text-xs text-muted-foreground font-mono">{error}</p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetImport}
                disabled={isProcessing}
                className="flex-1"
              >
                {texts.cancel}
              </Button>
              <Button
                onClick={handleImport}
                disabled={isProcessing || parseResult.trades.length === 0}
                className="flex-1 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {texts.importing}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {texts.importNow}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Help Section */}
        <Collapsible open={showHelp} onOpenChange={setShowHelp}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground">
              <HelpCircle className="w-4 h-4" />
              {texts.howToExport}
              {showHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">MT4</Badge>
                <span className="text-muted-foreground">{texts.mt4Step}</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="shrink-0">MT5</Badge>
                <span className="text-muted-foreground">{texts.mt5Step}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default MTTradeImporter;
