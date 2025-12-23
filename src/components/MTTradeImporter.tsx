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
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Download,
} from 'lucide-react';
import {
  parseTradeFile,
  convertToAppTrades,
  type ParseResult,
} from '@/lib/mtTradeParser';

interface MTTradeImporterProps {
  onImportComplete?: () => void;
}

const MTTradeImporter: React.FC<MTTradeImporterProps> = ({ onImportComplete }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const t = {
    fr: {
      title: 'Importer depuis MetaTrader',
      description: 'Importez votre historique de trades en exportant un fichier depuis MT4/MT5',
      dropzone: 'Glissez un fichier CSV ou HTML ici',
      orClick: 'ou cliquez pour sélectionner',
      supportedFormats: 'Formats supportés: CSV, HTML (Statement)',
      processing: 'Traitement en cours...',
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
      howToExport: 'Comment exporter depuis MetaTrader ?',
      step1: '1. Ouvrez MetaTrader et allez dans "Historique du compte"',
      step2: '2. Cliquez droit et sélectionnez "Toute l\'historique"',
      step3: '3. Cliquez droit à nouveau et choisissez "Enregistrer comme rapport détaillé"',
      step4: '4. Sauvegardez le fichier HTML et importez-le ici',
      noTrades: 'Aucun trade trouvé dans ce fichier',
      duplicateSkipped: 'Trades déjà existants ignorés',
      free100: '100% gratuit - Aucune API externe requise',
    },
    en: {
      title: 'Import from MetaTrader',
      description: 'Import your trade history by exporting a file from MT4/MT5',
      dropzone: 'Drop a CSV or HTML file here',
      orClick: 'or click to select',
      supportedFormats: 'Supported formats: CSV, HTML (Statement)',
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
      howToExport: 'How to export from MetaTrader?',
      step1: '1. Open MetaTrader and go to "Account History"',
      step2: '2. Right-click and select "All History"',
      step3: '3. Right-click again and choose "Save as Detailed Report"',
      step4: '4. Save the HTML file and import it here',
      noTrades: 'No trades found in this file',
      duplicateSkipped: 'Duplicate trades skipped',
      free100: '100% free - No external API required',
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

    // Validate file type
    const validTypes = ['text/csv', 'text/html', 'application/vnd.ms-excel', 'text/plain'];
    const validExtensions = ['.csv', '.html', '.htm', '.txt'];
    
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      toast.error(texts.error);
      return;
    }

    setIsProcessing(true);
    setParseResult(null);

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
      
      // Import in batches to avoid timeout
      const batchSize = 50;
      let imported = 0;
      
      for (let i = 0; i < trades.length; i += batchSize) {
        const batch = trades.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('trades')
          .insert(batch);

        if (error) {
          console.error('Import batch error:', error);
          // Continue with next batch even if one fails
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-card/50 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">{texts.title}</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            {texts.free100}
          </Badge>
        </div>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        {!parseResult && (
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
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
              accept=".csv,.html,.htm,.txt"
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
                <div className="flex justify-center gap-3 mb-3">
                  <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                  <FileCode className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">{texts.dropzone}</p>
                <p className="text-xs text-muted-foreground mt-1">{texts.orClick}</p>
                <p className="text-xs text-muted-foreground mt-2">{texts.supportedFormats}</p>
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
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <XCircle className="w-8 h-8 text-destructive" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg">
                    {parseResult.trades.length}
                  </span>
                  <span className="text-muted-foreground">
                    {texts.tradesFound}
                  </span>
                </div>
                
                {parseResult.errors.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-amber-500">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{parseResult.errors.length} {texts.errors}</span>
                  </div>
                )}
              </div>
            </div>

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
            {parseResult.errors.length > 0 && (
              <Collapsible open={showErrors} onOpenChange={setShowErrors}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full gap-2">
                    {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showErrors ? texts.hideErrors : texts.showErrors}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 rounded bg-muted/50 max-h-32 overflow-y-auto text-xs font-mono">
                    {parseResult.errors.slice(0, 10).map((error, i) => (
                      <div key={i} className="text-amber-500">{error}</div>
                    ))}
                    {parseResult.errors.length > 10 && (
                      <div className="text-muted-foreground mt-1">
                        ... +{parseResult.errors.length - 10} more
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
              <p>{texts.step1}</p>
              <p>{texts.step2}</p>
              <p>{texts.step3}</p>
              <p>{texts.step4}</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default MTTradeImporter;
