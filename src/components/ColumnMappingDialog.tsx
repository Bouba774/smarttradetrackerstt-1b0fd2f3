import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Settings2, ArrowRight, Check, X, AlertCircle } from 'lucide-react';

export interface ColumnMapping {
  ticket: number;
  openTime: number;
  closeTime: number;
  type: number;
  symbol: number;
  volume: number;
  openPrice: number;
  closePrice: number;
  stopLoss: number;
  takeProfit: number;
  profit: number;
  commission: number;
  swap: number;
  comment: number;
}

interface ColumnMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  headers: string[];
  sampleData: string[][];
  currentMapping: ColumnMapping;
  onConfirm: (mapping: ColumnMapping) => void;
}

const translations = {
  en: {
    title: 'Column Mapping',
    subtitle: 'Match file columns to trade fields',
    field: 'Field',
    column: 'Source Column',
    preview: 'Preview',
    required: 'Required',
    optional: 'Optional',
    none: 'Not mapped',
    confirm: 'Apply Mapping',
    cancel: 'Cancel',
    autoDetected: 'Auto-detected',
    ticket: 'Ticket/Order',
    openTime: 'Open Time',
    closeTime: 'Close Time',
    type: 'Type (Buy/Sell)',
    symbol: 'Symbol/Asset',
    volume: 'Volume/Lots',
    openPrice: 'Open Price',
    closePrice: 'Close Price',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    profit: 'Profit/Loss',
    commission: 'Commission',
    swap: 'Swap',
    comment: 'Comment',
    sampleValues: 'Sample values',
    missingRequired: 'Missing required fields',
  },
  fr: {
    title: 'Mapping des colonnes',
    subtitle: 'Associez les colonnes du fichier aux champs de trade',
    field: 'Champ',
    column: 'Colonne source',
    preview: 'Aperçu',
    required: 'Requis',
    optional: 'Optionnel',
    none: 'Non mappé',
    confirm: 'Appliquer le mapping',
    cancel: 'Annuler',
    autoDetected: 'Auto-détecté',
    ticket: 'Ticket/Ordre',
    openTime: "Heure d'ouverture",
    closeTime: 'Heure de clôture',
    type: 'Type (Achat/Vente)',
    symbol: 'Symbole/Actif',
    volume: 'Volume/Lots',
    openPrice: "Prix d'entrée",
    closePrice: 'Prix de sortie',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    profit: 'Profit/Perte',
    commission: 'Commission',
    swap: 'Swap',
    comment: 'Commentaire',
    sampleValues: 'Valeurs exemple',
    missingRequired: 'Champs requis manquants',
  },
  es: {
    title: 'Mapeo de columnas',
    subtitle: 'Asocie las columnas del archivo a los campos de operación',
    field: 'Campo',
    column: 'Columna origen',
    preview: 'Vista previa',
    required: 'Requerido',
    optional: 'Opcional',
    none: 'No mapeado',
    confirm: 'Aplicar mapeo',
    cancel: 'Cancelar',
    autoDetected: 'Auto-detectado',
    ticket: 'Ticket/Orden',
    openTime: 'Hora de apertura',
    closeTime: 'Hora de cierre',
    type: 'Tipo (Compra/Venta)',
    symbol: 'Símbolo/Activo',
    volume: 'Volumen/Lotes',
    openPrice: 'Precio de entrada',
    closePrice: 'Precio de salida',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    profit: 'Beneficio/Pérdida',
    commission: 'Comisión',
    swap: 'Swap',
    comment: 'Comentario',
    sampleValues: 'Valores de ejemplo',
    missingRequired: 'Faltan campos requeridos',
  },
  pt: {
    title: 'Mapeamento de colunas',
    subtitle: 'Associe as colunas do arquivo aos campos de operação',
    field: 'Campo',
    column: 'Coluna origem',
    preview: 'Prévia',
    required: 'Obrigatório',
    optional: 'Opcional',
    none: 'Não mapeado',
    confirm: 'Aplicar mapeamento',
    cancel: 'Cancelar',
    autoDetected: 'Auto-detectado',
    ticket: 'Ticket/Ordem',
    openTime: 'Hora de abertura',
    closeTime: 'Hora de fechamento',
    type: 'Tipo (Compra/Venda)',
    symbol: 'Símbolo/Ativo',
    volume: 'Volume/Lotes',
    openPrice: 'Preço de entrada',
    closePrice: 'Preço de saída',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    profit: 'Lucro/Prejuízo',
    commission: 'Comissão',
    swap: 'Swap',
    comment: 'Comentário',
    sampleValues: 'Valores de exemplo',
    missingRequired: 'Faltam campos obrigatórios',
  },
  ar: {
    title: 'تعيين الأعمدة',
    subtitle: 'ربط أعمدة الملف بحقول الصفقة',
    field: 'الحقل',
    column: 'العمود المصدر',
    preview: 'معاينة',
    required: 'مطلوب',
    optional: 'اختياري',
    none: 'غير معين',
    confirm: 'تطبيق التعيين',
    cancel: 'إلغاء',
    autoDetected: 'تم الاكتشاف تلقائياً',
    ticket: 'رقم الأمر',
    openTime: 'وقت الفتح',
    closeTime: 'وقت الإغلاق',
    type: 'النوع (شراء/بيع)',
    symbol: 'الرمز/الأصل',
    volume: 'الحجم/اللوت',
    openPrice: 'سعر الدخول',
    closePrice: 'سعر الخروج',
    stopLoss: 'وقف الخسارة',
    takeProfit: 'جني الأرباح',
    profit: 'الربح/الخسارة',
    commission: 'العمولة',
    swap: 'السواب',
    comment: 'تعليق',
    sampleValues: 'قيم تجريبية',
    missingRequired: 'حقول مطلوبة مفقودة',
  },
  de: {
    title: 'Spaltenzuordnung',
    subtitle: 'Ordnen Sie die Dateispalten den Trade-Feldern zu',
    field: 'Feld',
    column: 'Quellspalte',
    preview: 'Vorschau',
    required: 'Erforderlich',
    optional: 'Optional',
    none: 'Nicht zugeordnet',
    confirm: 'Zuordnung anwenden',
    cancel: 'Abbrechen',
    autoDetected: 'Automatisch erkannt',
    ticket: 'Ticket/Auftrag',
    openTime: 'Eröffnungszeit',
    closeTime: 'Schließzeit',
    type: 'Typ (Kauf/Verkauf)',
    symbol: 'Symbol/Asset',
    volume: 'Volumen/Lots',
    openPrice: 'Einstiegspreis',
    closePrice: 'Ausstiegspreis',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    profit: 'Gewinn/Verlust',
    commission: 'Kommission',
    swap: 'Swap',
    comment: 'Kommentar',
    sampleValues: 'Beispielwerte',
    missingRequired: 'Fehlende Pflichtfelder',
  },
  tr: {
    title: 'Sütun Eşleştirme',
    subtitle: 'Dosya sütunlarını işlem alanlarıyla eşleştirin',
    field: 'Alan',
    column: 'Kaynak Sütun',
    preview: 'Önizleme',
    required: 'Zorunlu',
    optional: 'İsteğe bağlı',
    none: 'Eşlenmemiş',
    confirm: 'Eşleştirmeyi Uygula',
    cancel: 'İptal',
    autoDetected: 'Otomatik algılandı',
    ticket: 'Bilet/Emir',
    openTime: 'Açılış Zamanı',
    closeTime: 'Kapanış Zamanı',
    type: 'Tür (Alış/Satış)',
    symbol: 'Sembol/Varlık',
    volume: 'Hacim/Lot',
    openPrice: 'Giriş Fiyatı',
    closePrice: 'Çıkış Fiyatı',
    stopLoss: 'Zarar Durdur',
    takeProfit: 'Kar Al',
    profit: 'Kar/Zarar',
    commission: 'Komisyon',
    swap: 'Swap',
    comment: 'Yorum',
    sampleValues: 'Örnek değerler',
    missingRequired: 'Eksik zorunlu alanlar',
  },
  it: {
    title: 'Mappatura Colonne',
    subtitle: 'Associa le colonne del file ai campi del trade',
    field: 'Campo',
    column: 'Colonna Origine',
    preview: 'Anteprima',
    required: 'Obbligatorio',
    optional: 'Opzionale',
    none: 'Non mappato',
    confirm: 'Applica Mappatura',
    cancel: 'Annulla',
    autoDetected: 'Rilevato automaticamente',
    ticket: 'Ticket/Ordine',
    openTime: 'Ora Apertura',
    closeTime: 'Ora Chiusura',
    type: 'Tipo (Acquisto/Vendita)',
    symbol: 'Simbolo/Asset',
    volume: 'Volume/Lotti',
    openPrice: 'Prezzo Entrata',
    closePrice: 'Prezzo Uscita',
    stopLoss: 'Stop Loss',
    takeProfit: 'Take Profit',
    profit: 'Profitto/Perdita',
    commission: 'Commissione',
    swap: 'Swap',
    comment: 'Commento',
    sampleValues: 'Valori esempio',
    missingRequired: 'Campi obbligatori mancanti',
  },
};

interface FieldConfig {
  key: keyof ColumnMapping;
  required: boolean;
}

const FIELD_CONFIGS: FieldConfig[] = [
  { key: 'symbol', required: true },
  { key: 'type', required: true },
  { key: 'volume', required: true },
  { key: 'openTime', required: true },
  { key: 'profit', required: true },
  { key: 'ticket', required: false },
  { key: 'openPrice', required: false },
  { key: 'closePrice', required: false },
  { key: 'closeTime', required: false },
  { key: 'stopLoss', required: false },
  { key: 'takeProfit', required: false },
  { key: 'commission', required: false },
  { key: 'swap', required: false },
  { key: 'comment', required: false },
];

export const ColumnMappingDialog: React.FC<ColumnMappingDialogProps> = ({
  open,
  onOpenChange,
  headers,
  sampleData,
  currentMapping,
  onConfirm,
}) => {
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const [mapping, setMapping] = useState<ColumnMapping>(currentMapping);

  useEffect(() => {
    setMapping(currentMapping);
  }, [currentMapping]);

  const getFieldLabel = (key: keyof ColumnMapping): string => {
    return t[key as keyof typeof t] || key;
  };

  const handleMappingChange = (field: keyof ColumnMapping, columnIndex: number) => {
    setMapping(prev => ({ ...prev, [field]: columnIndex }));
  };

  const getSampleValue = (columnIndex: number): string => {
    if (columnIndex < 0 || sampleData.length === 0) return '-';
    const values = sampleData.slice(0, 3).map(row => row[columnIndex] || '').filter(Boolean);
    return values.join(', ') || '-';
  };

  const requiredFields: (keyof ColumnMapping)[] = ['symbol', 'type', 'volume', 'openTime', 'profit'];
  const missingRequired = requiredFields.filter(field => mapping[field] < 0);

  const handleConfirm = () => {
    onConfirm(mapping);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            {t.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3">
            {FIELD_CONFIGS.map(({ key, required }) => (
              <div
                key={key}
                className={`p-3 rounded-lg border ${
                  required && mapping[key] < 0 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Field Name */}
                  <div className="w-32 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{getFieldLabel(key)}</span>
                      {required ? (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0">
                          {t.required}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-muted-foreground">
                          {t.optional}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />

                  {/* Column Selector */}
                  <div className="flex-1">
                    <Select
                      value={mapping[key].toString()}
                      onValueChange={(val) => handleMappingChange(key, parseInt(val))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={t.none} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-56">
                        <SelectItem value="-1">
                          <span className="text-muted-foreground">{t.none}</span>
                        </SelectItem>
                        {headers.map((header, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {idx + 1}
                              </Badge>
                              <span className="truncate max-w-40">{header || `Column ${idx + 1}`}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="w-6 shrink-0">
                    {mapping[key] >= 0 ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : required ? (
                      <X className="w-4 h-4 text-destructive" />
                    ) : null}
                  </div>
                </div>

                {/* Sample Values */}
                {mapping[key] >= 0 && (
                  <div className="mt-2 pl-[140px]">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">{t.sampleValues}:</span>{' '}
                      <span className="font-mono">{getSampleValue(mapping[key])}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Missing Required Warning */}
        {missingRequired.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm">
              {t.missingRequired}: {missingRequired.map(f => getFieldLabel(f)).join(', ')}
            </span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={missingRequired.length > 0}
          >
            {t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnMappingDialog;
