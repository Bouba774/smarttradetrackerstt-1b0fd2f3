import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Download, ExternalLink, CheckCircle2, Zap, Shield, Clock, HelpCircle } from 'lucide-react';
import { generateMT4EA, generateMT5EA, downloadEAFile } from '@/lib/mtEAGenerator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MTAutoSyncFree: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mt-trade-webhook`;
  const userToken = user?.id || '';

  const t = {
    fr: {
      title: 'Sync Automatique Gratuite',
      description: 'Installez un Expert Advisor dans MetaTrader pour synchroniser automatiquement vos trades',
      step1Title: 'Téléchargez l\'Expert Advisor',
      step1Desc: 'Choisissez la version correspondant à votre plateforme',
      step2Title: 'Installez l\'EA dans MetaTrader',
      step2Desc: 'Copiez le fichier dans le dossier Experts de MT',
      step3Title: 'Activez l\'EA sur un graphique',
      step3Desc: 'Vos trades seront synchronisés automatiquement',
      downloadMT4: 'Télécharger pour MT4',
      downloadMT5: 'Télécharger pour MT5',
      yourToken: 'Votre Token Personnel',
      tokenDesc: 'Ce token identifie votre compte. Il est déjà configuré dans les fichiers EA téléchargés.',
      copyToken: 'Copier',
      copied: 'Copié !',
      howToInstall: 'Comment installer l\'EA ?',
      installStep1: '1. Ouvrez MetaTrader et allez dans Fichier > Ouvrir le dossier des données',
      installStep2: '2. Naviguez vers MQL4/Experts (MT4) ou MQL5/Experts (MT5)',
      installStep3: '3. Collez le fichier .mq4 ou .mq5 téléchargé',
      installStep4: '4. Redémarrez MetaTrader ou actualisez la liste des Experts',
      installStep5: '5. Glissez l\'EA sur n\'importe quel graphique',
      installStep6: '6. Activez "Autoriser WebRequest" dans Outils > Options > Expert Advisors',
      installStep7: '7. Ajoutez l\'URL du webhook à la liste des URLs autorisées',
      benefits: 'Avantages',
      benefit1: '100% Gratuit - Aucune limite',
      benefit2: 'Sync en temps réel',
      benefit3: 'Vos données restent privées',
      benefit4: 'Fonctionne avec tous les brokers',
      webhookUrl: 'URL du Webhook',
      webhookDesc: 'Ajoutez cette URL dans les options de MetaTrader',
      free: 'GRATUIT',
    },
    en: {
      title: 'Free Auto Sync',
      description: 'Install an Expert Advisor in MetaTrader to automatically sync your trades',
      step1Title: 'Download the Expert Advisor',
      step1Desc: 'Choose the version matching your platform',
      step2Title: 'Install the EA in MetaTrader',
      step2Desc: 'Copy the file to MT Experts folder',
      step3Title: 'Activate the EA on a chart',
      step3Desc: 'Your trades will be synced automatically',
      downloadMT4: 'Download for MT4',
      downloadMT5: 'Download for MT5',
      yourToken: 'Your Personal Token',
      tokenDesc: 'This token identifies your account. It\'s already configured in the downloaded EA files.',
      copyToken: 'Copy',
      copied: 'Copied!',
      howToInstall: 'How to install the EA?',
      installStep1: '1. Open MetaTrader and go to File > Open Data Folder',
      installStep2: '2. Navigate to MQL4/Experts (MT4) or MQL5/Experts (MT5)',
      installStep3: '3. Paste the downloaded .mq4 or .mq5 file',
      installStep4: '4. Restart MetaTrader or refresh the Experts list',
      installStep5: '5. Drag the EA onto any chart',
      installStep6: '6. Enable "Allow WebRequest" in Tools > Options > Expert Advisors',
      installStep7: '7. Add the webhook URL to the allowed URLs list',
      benefits: 'Benefits',
      benefit1: '100% Free - No limits',
      benefit2: 'Real-time sync',
      benefit3: 'Your data stays private',
      benefit4: 'Works with all brokers',
      webhookUrl: 'Webhook URL',
      webhookDesc: 'Add this URL in MetaTrader options',
      free: 'FREE',
    },
  };

  const texts = t[language as keyof typeof t] || t.en;

  const handleDownloadMT4 = () => {
    if (!userToken) {
      toast.error(language === 'fr' ? 'Vous devez être connecté' : 'You must be logged in');
      return;
    }
    const eaCode = generateMT4EA(webhookUrl, userToken);
    downloadEAFile(eaCode, 'TradeJournal_Sync.mq4');
    toast.success(language === 'fr' ? 'Fichier MT4 téléchargé' : 'MT4 file downloaded');
  };

  const handleDownloadMT5 = () => {
    if (!userToken) {
      toast.error(language === 'fr' ? 'Vous devez être connecté' : 'You must be logged in');
      return;
    }
    const eaCode = generateMT5EA(webhookUrl, userToken);
    downloadEAFile(eaCode, 'TradeJournal_Sync.mq5');
    toast.success(language === 'fr' ? 'Fichier MT5 téléchargé' : 'MT5 file downloaded');
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(userToken);
      setCopiedToken(true);
      toast.success(texts.copied);
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success(texts.copied);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {texts.title}
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                  {texts.free}
                </Badge>
              </CardTitle>
              <CardDescription>{texts.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Shield, text: texts.benefit1 },
            { icon: Clock, text: texts.benefit2 },
            { icon: Shield, text: texts.benefit3 },
            { icon: CheckCircle2, text: texts.benefit4 },
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
              <benefit.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-muted-foreground">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Step 1: Download */}
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              <h4 className="font-medium">{texts.step1Title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{texts.step1Desc}</p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleDownloadMT4} variant="outline" size="sm" className="gap-2 w-full">
                <Download className="w-4 h-4" />
                {texts.downloadMT4}
              </Button>
              <Button onClick={handleDownloadMT5} variant="outline" size="sm" className="gap-2 w-full">
                <Download className="w-4 h-4" />
                {texts.downloadMT5}
              </Button>
            </div>
          </div>

          {/* Step 2: Install */}
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <h4 className="font-medium">{texts.step2Title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{texts.step2Desc}</p>
            <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 w-full">
                  <HelpCircle className="w-4 h-4" />
                  {texts.howToInstall}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>{texts.installStep1}</p>
                <p>{texts.installStep2}</p>
                <p>{texts.installStep3}</p>
                <p>{texts.installStep4}</p>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Step 3: Activate */}
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <h4 className="font-medium">{texts.step3Title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">{texts.step3Desc}</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>{texts.installStep5}</p>
              <p>{texts.installStep6}</p>
              <p>{texts.installStep7}</p>
            </div>
          </div>
        </div>

        {/* Token & Webhook Info */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* User Token */}
          <div className="space-y-2">
            <Label>{texts.yourToken}</Label>
            <div className="flex gap-2">
              <Input
                value={userToken}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={handleCopyToken} variant="outline" size="icon" className="shrink-0">
                {copiedToken ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{texts.tokenDesc}</p>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label>{texts.webhookUrl}</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={handleCopyWebhook} variant="outline" size="icon" className="shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{texts.webhookDesc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MTAutoSyncFree;
