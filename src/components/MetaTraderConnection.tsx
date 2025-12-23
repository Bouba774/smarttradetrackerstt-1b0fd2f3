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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Cloud,
  Zap,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import MTTradeImporter from '@/components/MTTradeImporter';
import MTAutoSyncFree from '@/components/MTAutoSyncFree';

interface MTAccount {
  id: string;
  account_name: string;
  platform: 'MT4' | 'MT5';
  server: string;
  login: string;
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
  
  // Form state
  const [platform, setPlatform] = useState<'MT4' | 'MT5'>('MT4');
  const [accountName, setAccountName] = useState('');
  const [server, setServer] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [currency, setCurrency] = useState('USD');

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
      tabAuto: 'Sync auto (Gratuit)',
      tabMetaApi: 'MetaAPI (Avancé)',
      manualDesc: 'Importez vos trades depuis un fichier exporté de MT4/MT5',
      autoDesc: 'Connexion directe à MetaTrader via MetaAPI (nécessite une clé API)',
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
      tabAuto: 'Auto Sync (Free)',
      tabMetaApi: 'MetaAPI (Advanced)',
      manualDesc: 'Import your trades from an exported MT4/MT5 file',
      autoDesc: 'Direct connection to MetaTrader via MetaAPI (requires API key)',
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
    if (!accountName || !server || !login || !password) {
      toast.error(texts.error);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('metatrader-connect', {
        body: {
          action: 'connect',
          platform,
          accountName,
          server,
          login,
          password,
          initialBalance: parseFloat(initialBalance) || 0,
          currency,
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

  const handleSync = async (accountId: string) => {
    setSyncing(accountId);
    try {
      const { data, error } = await supabase.functions.invoke('metatrader-connect', {
        body: { action: 'sync', accountId },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
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
    setPlatform('MT4');
    setAccountName('');
    setServer('');
    setLogin('');
    setPassword('');
    setInitialBalance('');
    setCurrency('USD');
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auto" className="gap-2">
            <Zap className="w-4 h-4" />
            {texts.tabAuto}
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <Upload className="w-4 h-4" />
            {texts.tabManual}
          </TabsTrigger>
          <TabsTrigger value="metaapi" className="gap-2">
            <Cloud className="w-4 h-4" />
            {texts.tabMetaApi}
          </TabsTrigger>
        </TabsList>
        
        {/* Free Auto Sync Tab */}
        <TabsContent value="auto" className="mt-4">
          <MTAutoSyncFree />
        </TabsContent>
        
        {/* Manual Import Tab */}
        <TabsContent value="manual" className="mt-4">
          <MTTradeImporter onImportComplete={fetchAccounts} />
        </TabsContent>
        
        {/* MetaAPI Tab (Advanced) */}
        <TabsContent value="metaapi" className="mt-4 space-y-4">
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
              {/* Platform Select */}
              <div className="space-y-2">
                <Label>{texts.platform}</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as 'MT4' | 'MT5')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MT4">MetaTrader 4</SelectItem>
                    <SelectItem value="MT5">MetaTrader 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Account Name */}
              <div className="space-y-2">
                <Label>{texts.accountName}</Label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Mon compte trading"
                />
              </div>

              {/* Server */}
              <div className="space-y-2">
                <Label>{texts.serverLabel}</Label>
                <Input
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="ICMarkets-Demo01"
                />
              </div>

              {/* Login & Password */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{texts.loginLabel}</Label>
                  <Input
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{texts.passwordLabel}</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Security Warning about password */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ {language === 'fr' 
                    ? 'Votre mot de passe sera transmis au service MetaApi pour la connexion. Il est recommandé d\'utiliser un compte de trading dédié ou un mot de passe investisseur en lecture seule si possible.' 
                    : 'Your password will be transmitted to MetaApi service for connection. We recommend using a dedicated trading account or a read-only investor password if possible.'}
                </p>
              </div>

              {/* Initial Balance & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{texts.initialBalanceLabel}</Label>
                  <Input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{texts.currencyLabel}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="XOF">XOF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    {loadingStats === account.id ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">{texts.loadingStats}</span>
                      </div>
                    ) : accountStats[account.id] ? (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg">
                        {/* Balance */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{texts.balance}</p>
                            <p className="font-semibold text-sm">
                              {formatCurrency(accountStats[account.id].balance, accountStats[account.id].currency)}
                            </p>
                          </div>
                        </div>

                        {/* Equity */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{texts.equity}</p>
                            <p className="font-semibold text-sm">
                              {formatCurrency(accountStats[account.id].equity, accountStats[account.id].currency)}
                            </p>
                          </div>
                        </div>

                        {/* Margin */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{texts.margin}</p>
                            <p className="font-semibold text-sm">
                              {formatCurrency(accountStats[account.id].margin, accountStats[account.id].currency)}
                            </p>
                          </div>
                        </div>

                        {/* Free Margin */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{texts.freeMargin}</p>
                            <p className="font-semibold text-sm">
                              {formatCurrency(accountStats[account.id].freeMargin, accountStats[account.id].currency)}
                            </p>
                          </div>
                        </div>

                        {/* Open P&L */}
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            accountStats[account.id].profit >= 0 ? 'bg-profit/10' : 'bg-loss/10'
                          }`}>
                            <TrendingUp className={`w-4 h-4 ${
                              accountStats[account.id].profit >= 0 ? 'text-profit' : 'text-loss'
                            }`} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{texts.profit}</p>
                            <p className={`font-semibold text-sm ${
                              accountStats[account.id].profit >= 0 ? 'text-profit' : 'text-loss'
                            }`}>
                              {accountStats[account.id].profit >= 0 ? '+' : ''}
                              {formatCurrency(accountStats[account.id].profit, accountStats[account.id].currency)}
                            </p>
                          </div>
                        </div>

                        {/* Leverage */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{texts.leverage}</p>
                            <p className="font-semibold text-sm">
                              1:{accountStats[account.id].leverage}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
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
                        onClick={() => handleSync(account.id)}
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
      </Tabs>
    </div>
  );
};

export default MetaTraderConnection;
