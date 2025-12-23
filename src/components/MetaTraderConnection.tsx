import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Link2, 
  Unlink, 
  RefreshCw, 
  Loader2, 
  TrendingUp,
  Server,
  Wallet,
  CheckCircle2,
  XCircle,
  BarChart3,
  DollarSign,
  Activity,
  ChevronDown,
  ChevronUp,
  Upload,
  Zap,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import MTTradeImporter from '@/components/MTTradeImporter';
import MetaStatsMetrics from '@/components/MetaStatsMetrics';

interface MTAccount {
  id: string;
  account_name: string;
  platform: 'MT4' | 'MT5';
  server: string;
  login: string;
  metaapi_account_id: string | null;
  initial_balance: number;
  currency: string;
  is_connected: boolean;
  last_sync_at: string | null;
  created_at: string;
}

interface AccountStats {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  leverage: number;
  currency: string;
  broker: string;
}

const MetaTraderConnection: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setSyncing] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<MTAccount[]>([]);
  const [accountStats, setAccountStats] = useState<Record<string, AccountStats>>({});
  const [loadingStats, setLoadingStats] = useState<string | null>(null);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  
  // Form state - simplified for MetaStats (only needs MetaApi Account ID)
  const [metaApiAccountId, setMetaApiAccountId] = useState('');

  const t = {
    fr: {
      connectMT: 'Connexion MetaTrader',
      connectMTDesc: 'Connectez votre compte MT4/MT5 pour importer automatiquement vos trades',
      platform: 'Plateforme',
      accountName: 'Nom du compte',
      serverLabel: 'Serveur',
      loginLabel: 'Login',
      passwordLabel: 'Mot de passe',
      initialBalanceLabel: 'Solde initial',
      currencyLabel: 'Devise',
      connect: 'Connecter',
      cancel: 'Annuler',
      disconnect: 'Déconnecter',
      sync: 'Synchroniser',
      syncNow: 'Synchroniser maintenant',
      connected: 'Connecté',
      disconnected: 'Déconnecté',
      lastSync: 'Dernière synchro',
      noAccounts: 'Aucun compte connecté',
      addAccount: 'Ajouter un compte',
      connecting: 'Connexion en cours...',
      syncing: 'Synchronisation...',
      success: 'Compte connecté avec succès',
      syncSuccess: 'Trades importés avec succès',
      error: 'Une erreur est survenue',
      disconnectSuccess: 'Compte déconnecté',
      tradesImported: 'trades importés',
      balance: 'Balance',
      equity: 'Équité',
      margin: 'Marge utilisée',
      freeMargin: 'Marge libre',
      profit: 'P&L ouvert',
      leverage: 'Levier',
      viewStats: 'Voir les statistiques',
      hideStats: 'Masquer les statistiques',
      loadingStats: 'Chargement...',
      autoSync: 'Sync auto toutes les heures',
      tabManual: 'Import manuel',
      tabAuto: 'Connexion directe',
      manualDesc: 'Importez vos trades depuis un fichier exporté de MT4/MT5',
      autoDesc: 'Connectez votre compte MT4/MT5 pour synchroniser automatiquement vos trades',
      freeNote: '100% gratuit • Synchronisation automatique',
    },
    en: {
      connectMT: 'MetaTrader Connection',
      connectMTDesc: 'Connect your MT4/MT5 account to automatically import your trades',
      platform: 'Platform',
      accountName: 'Account Name',
      serverLabel: 'Server',
      loginLabel: 'Login',
      passwordLabel: 'Password',
      initialBalanceLabel: 'Initial Balance',
      currencyLabel: 'Currency',
      connect: 'Connect',
      cancel: 'Cancel',
      disconnect: 'Disconnect',
      sync: 'Sync',
      syncNow: 'Sync now',
      connected: 'Connected',
      disconnected: 'Disconnected',
      lastSync: 'Last sync',
      noAccounts: 'No accounts connected',
      addAccount: 'Add account',
      connecting: 'Connecting...',
      syncing: 'Syncing...',
      success: 'Account connected successfully',
      syncSuccess: 'Trades imported successfully',
      error: 'An error occurred',
      disconnectSuccess: 'Account disconnected',
      tradesImported: 'trades imported',
      balance: 'Balance',
      equity: 'Equity',
      margin: 'Used Margin',
      freeMargin: 'Free Margin',
      profit: 'Open P&L',
      leverage: 'Leverage',
      viewStats: 'View statistics',
      hideStats: 'Hide statistics',
      loadingStats: 'Loading...',
      autoSync: 'Auto-sync every hour',
      tabManual: 'Manual Import',
      tabAuto: 'Direct Connection',
      manualDesc: 'Import your trades from an exported MT4/MT5 file',
      autoDesc: 'Connect your MT4/MT5 account to automatically sync your trades',
      freeNote: '100% free • Automatic synchronization',
    },
  };

  const texts = t[language as keyof typeof t] || t.en;

  const fetchAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('metatrader-connect', {
        body: { action: 'list' },
      });

      if (error) throw error;
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  const handleConnect = async () => {
    if (!metaApiAccountId.trim()) {
      toast.error(texts.error);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('metatrader-connect', {
        body: {
          action: 'connect',
          metaApiAccountId: metaApiAccountId.trim(),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success(texts.success);
      setIsDialogOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Connect error:', error);
      toast.error(texts.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('metatrader-connect', {
        body: { action: 'disconnect', accountId },
      });

      if (error) throw error;

      toast.success(texts.disconnectSuccess);
      fetchAccounts();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error(texts.error);
    }
  };

  const handleSync = async (account: MTAccount) => {
    setSyncing(account.id);
    try {
      const { data, error } = await supabase.functions.invoke('metatrader-connect', {
        body: { 
          action: 'sync', 
          metaApiAccountId: account.metaapi_account_id || account.login,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.processing) {
        toast.info(data.message || 'Processing, please try again in a few seconds');
        return;
      }

      toast.success(`${texts.syncSuccess} (${data.tradesImported} ${texts.tradesImported})`);
      fetchAccounts();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(texts.error);
    } finally {
      setSyncing(null);
    }
  };

  const resetForm = () => {
    setMetaApiAccountId('');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const fetchAccountStats = async (accountId: string) => {
    if (accountStats[accountId]) {
      // Already loaded, just toggle
      setExpandedAccount(expandedAccount === accountId ? null : accountId);
      return;
    }

    setLoadingStats(accountId);
    setExpandedAccount(accountId);
    
    try {
      const { data, error } = await supabase.functions.invoke('metatrader-connect', {
        body: { action: 'stats', accountId },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAccountStats(prev => ({
        ...prev,
        [accountId]: data.stats,
      }));
    } catch (error) {
      console.error('Stats error:', error);
      toast.error(texts.error);
    } finally {
      setLoadingStats(null);
    }
  };

  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Tabs for Manual vs Auto Import */}
      <Tabs defaultValue="auto" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="auto" className="gap-2">
            <Zap className="w-4 h-4" />
            {texts.tabAuto}
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Upload className="w-4 h-4" />
            {texts.tabManual}
          </TabsTrigger>
        </TabsList>
        
        {/* Direct Connection Tab */}
        <TabsContent value="auto" className="mt-4 space-y-4">
          {/* Free badge */}
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            {texts.freeNote}
          </div>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">
                {texts.connectMT}
              </h3>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Link2 className="w-4 h-4" />
                  {texts.addAccount}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {texts.connectMT}
                  </DialogTitle>
                  <DialogDescription>
                    {texts.connectMTDesc}
                  </DialogDescription>
                </DialogHeader>

            <div className="space-y-4 py-4">
              {/* MetaApi Account ID */}
              <div className="space-y-2">
                <Label>MetaApi Account ID</Label>
                <Input
                  value={metaApiAccountId}
                  onChange={(e) => setMetaApiAccountId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                />
              </div>

              {/* Info about MetaApi */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  {language === 'fr' 
                    ? 'Pour obtenir votre MetaApi Account ID, créez un compte sur metaapi.cloud et connectez-y votre compte MT4/MT5. L\'ID sera affiché dans votre tableau de bord MetaApi.' 
                    : 'To get your MetaApi Account ID, create an account on metaapi.cloud and connect your MT4/MT5 account there. The ID will be displayed in your MetaApi dashboard.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {texts.cancel}
              </Button>
              <Button onClick={handleConnect} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {texts.connecting}
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    {texts.connect}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Connected Accounts */}
      {accounts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{texts.noAccounts}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Auto-sync info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <RefreshCw className="w-3 h-3" />
            <span>{texts.autoSync}</span>
          </div>

          {accounts.map((account) => (
            <Collapsible 
              key={account.id} 
              open={expandedAccount === account.id}
              onOpenChange={() => fetchAccountStats(account.id)}
            >
              <Card className="bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{account.account_name}</CardTitle>
                      <Badge variant={account.is_connected ? 'default' : 'secondary'} className="text-xs">
                        {account.platform}
                      </Badge>
                    </div>
                    <Badge 
                      variant={account.is_connected ? 'default' : 'destructive'} 
                      className="gap-1"
                    >
                      {account.is_connected ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {texts.connected}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          {texts.disconnected}
                        </>
                      )}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Server className="w-3 h-3" />
                      {account.server}
                    </span>
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      {account.initial_balance.toLocaleString()} {account.currency}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  {/* Stats Toggle */}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between gap-2 h-8">
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" />
                        {expandedAccount === account.id ? texts.hideStats : texts.viewStats}
                      </span>
                      {loadingStats === account.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : expandedAccount === account.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  {/* Stats Panel */}
                  <CollapsibleContent>
                    {/* MetaStats Metrics Component */}
                    {account.login && (
                      <MetaStatsMetrics 
                        metaApiAccountId={account.login}
                        accountName={account.account_name}
                      />
                    )}
                  </CollapsibleContent>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {texts.lastSync}: {formatDate(account.last_sync_at)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(account)}
                        disabled={isSyncing === account.id}
                        className="gap-1"
                      >
                        {isSyncing === account.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {texts.syncing}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            {texts.sync}
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        className="gap-1"
                      >
                        <Unlink className="w-3 h-3" />
                        {texts.disconnect}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
        </TabsContent>
        
        {/* Manual Import Tab */}
        <TabsContent value="manual" className="mt-4">
          <MTTradeImporter onImportComplete={fetchAccounts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MetaTraderConnection;
