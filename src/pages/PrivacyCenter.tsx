import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGDPR } from '@/hooks/useGDPR';
import { useSecurityCheck } from '@/hooks/useSecurityCheck';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Shield,
  Download,
  Trash2,
  FileText,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Database,
  Lock,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const PrivacyCenter: React.FC = () => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const {
    consents,
    isLoadingConsents,
    updateConsent,
    isUpdatingConsent,
    requests,
    isLoadingRequests,
    registry,
    isLoadingRegistry,
    exportData,
    isExporting,
    requestDeletion,
    isRequestingDeletion,
  } = useGDPR();
  const {
    anomalies,
    isLoadingAnomalies,
    unresolvedAnomaliesCount,
    resolveAnomaly,
    trustedDevices,
    isLoadingDevices,
    untrustDevice,
  } = useSecurityCheck();

  const [deletionReason, setDeletionReason] = useState('');
  const dateLocale = language === 'fr' ? fr : enUS;

  const consentTypes = [
    {
      id: 'terms',
      label: language === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Service',
      description: language === 'fr' 
        ? 'Acceptation des conditions générales (obligatoire)' 
        : 'Acceptance of terms and conditions (required)',
      required: true,
    },
    {
      id: 'privacy',
      label: language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy',
      description: language === 'fr'
        ? 'Acceptation de la politique de traitement des données (obligatoire)'
        : 'Acceptance of data processing policy (required)',
      required: true,
    },
    {
      id: 'analytics',
      label: language === 'fr' ? 'Analyse d\'utilisation' : 'Usage Analytics',
      description: language === 'fr'
        ? 'Permettre l\'analyse anonyme pour améliorer le service'
        : 'Allow anonymous analysis to improve the service',
      required: false,
    },
    {
      id: 'marketing',
      label: 'Marketing',
      description: language === 'fr'
        ? 'Recevoir des communications marketing et promotionnelles'
        : 'Receive marketing and promotional communications',
      required: false,
    },
  ];

  const getConsentValue = (type: string): boolean => {
    return consents.find(c => c.consent_type === type)?.granted ?? false;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  const getAnomalyLabel = (type: string) => {
    const labels: Record<string, { fr: string; en: string }> = {
      new_device: { fr: 'Nouvel appareil', en: 'New device' },
      new_country: { fr: 'Nouveau pays', en: 'New country' },
      impossible_travel: { fr: 'Voyage impossible', en: 'Impossible travel' },
      concurrent_sessions: { fr: 'Sessions multiples', en: 'Multiple sessions' },
      suspicious_activity: { fr: 'Activité suspecte', en: 'Suspicious activity' },
    };
    return labels[type]?.[language] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          {language === 'fr' ? 'Veuillez vous connecter' : 'Please log in'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-4 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {language === 'fr' ? 'Centre de confidentialité' : 'Privacy Center'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {language === 'fr' 
              ? 'Gérez vos données et préférences de confidentialité' 
              : 'Manage your data and privacy preferences'}
          </p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shadow-neon">
          <Shield className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>

      {/* Alert for unresolved anomalies */}
      {unresolvedAnomaliesCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="font-medium text-foreground">
                {language === 'fr' 
                  ? `${unresolvedAnomaliesCount} alerte(s) de sécurité` 
                  : `${unresolvedAnomaliesCount} security alert(s)`}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'fr'
                  ? 'Vérifiez les alertes dans l\'onglet Sécurité'
                  : 'Check alerts in the Security tab'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'fr' ? 'Données' : 'Data'}</span>
          </TabsTrigger>
          <TabsTrigger value="consents" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'fr' ? 'Consentements' : 'Consents'}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 relative">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'fr' ? 'Sécurité' : 'Security'}</span>
            {unresolvedAnomaliesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {unresolvedAnomaliesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'fr' ? 'Appareils' : 'Devices'}</span>
          </TabsTrigger>
        </TabsList>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4 mt-6">
          {/* Export Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                {language === 'fr' ? 'Exporter mes données' : 'Export my data'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Téléchargez une copie complète de toutes vos données au format JSON.'
                  : 'Download a complete copy of all your data in JSON format.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => exportData()} disabled={isExporting}>
                {isExporting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    {language === 'fr' ? 'Export en cours...' : 'Exporting...'}
                  </span>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {language === 'fr' ? 'Télécharger mes données' : 'Download my data'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                {language === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Demandez la suppression définitive de votre compte et de toutes vos données. Cette action est irréversible.'
                  : 'Request permanent deletion of your account and all your data. This action is irreversible.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={language === 'fr' ? 'Raison (optionnel)...' : 'Reason (optional)...'}
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'fr' ? 'Demander la suppression' : 'Request deletion'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === 'fr' ? 'Êtes-vous sûr ?' : 'Are you sure?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'fr'
                        ? 'Cette action est irréversible. Toutes vos données seront supprimées dans un délai de 30 jours.'
                        : 'This action is irreversible. All your data will be deleted within 30 days.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {language === 'fr' ? 'Annuler' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => requestDeletion(deletionReason || undefined)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {language === 'fr' ? 'Confirmer la suppression' : 'Confirm deletion'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Request History */}
          {requests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{language === 'fr' ? 'Historique des demandes' : 'Request History'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(request.status)}
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {request.request_type === 'export' 
                              ? (language === 'fr' ? 'Export de données' : 'Data export')
                              : (language === 'fr' ? 'Suppression de compte' : 'Account deletion')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.created_at), 'PPp', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        request.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        request.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                        request.status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Processing Registry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                {language === 'fr' ? 'Registre des traitements' : 'Processing Registry'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Conformément au RGPD, voici comment nous traitons vos données.'
                  : 'In compliance with GDPR, here is how we process your data.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRegistry ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-secondary/50 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {registry.map((entry) => (
                    <div key={entry.id} className="p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-foreground">{entry.processing_name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{entry.purpose}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                          {entry.legal_basis.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.data_categories.map((cat) => (
                          <span key={cat} className="text-xs px-2 py-0.5 bg-muted rounded">
                            {cat}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {language === 'fr' ? 'Conservation : ' : 'Retention: '}{entry.retention_period}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consents Tab */}
        <TabsContent value="consents" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'fr' ? 'Vos consentements' : 'Your Consents'}</CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Gérez vos préférences de consentement. Les consentements obligatoires ne peuvent pas être retirés.'
                  : 'Manage your consent preferences. Required consents cannot be withdrawn.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {consentTypes.map((consent) => (
                <div key={consent.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label className="text-foreground font-medium">
                      {consent.label}
                      {consent.required && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({language === 'fr' ? 'obligatoire' : 'required'})
                        </span>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {consent.description}
                    </p>
                  </div>
                  <Switch
                    checked={getConsentValue(consent.id)}
                    onCheckedChange={(checked) => updateConsent({ consentType: consent.id, granted: checked })}
                    disabled={consent.required || isUpdatingConsent}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                {language === 'fr' ? 'Alertes de sécurité' : 'Security Alerts'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Activités inhabituelles détectées sur votre compte.'
                  : 'Unusual activities detected on your account.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAnomalies ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-secondary/50 rounded-lg" />
                  ))}
                </div>
              ) : anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>{language === 'fr' ? 'Aucune alerte de sécurité' : 'No security alerts'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((anomaly) => (
                    <div 
                      key={anomaly.id} 
                      className={`flex items-center justify-between p-4 rounded-lg ${getSeverityColor(anomaly.severity)}`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                          <p className="font-medium">{getAnomalyLabel(anomaly.anomaly_type)}</p>
                          <p className="text-xs opacity-80">
                            {format(new Date(anomaly.created_at), 'PPp', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => resolveAnomaly(anomaly.id)}
                      >
                        {language === 'fr' ? 'C\'était moi' : 'It was me'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                {language === 'fr' ? 'Appareils de confiance' : 'Trusted Devices'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Gérez les appareils autorisés à accéder à votre compte.'
                  : 'Manage devices authorized to access your account.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDevices ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 bg-secondary/50 rounded-lg" />
                  ))}
                </div>
              ) : trustedDevices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{language === 'fr' ? 'Aucun appareil enregistré' : 'No registered devices'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trustedDevices.map((device) => (
                    <div 
                      key={device.id} 
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">
                            {device.device_name || `${device.browser_name} on ${device.os_name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {device.country && `${device.country} • `}
                            {language === 'fr' ? 'Dernière utilisation : ' : 'Last used: '}
                            {format(new Date(device.last_used_at), 'PPp', { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {language === 'fr' ? 'Retirer cet appareil ?' : 'Remove this device?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'fr'
                                ? 'Cet appareil devra être re-vérifié lors de la prochaine connexion.'
                                : 'This device will need to be re-verified on the next login.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{language === 'fr' ? 'Annuler' : 'Cancel'}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => untrustDevice(device.id)}>
                              {language === 'fr' ? 'Retirer' : 'Remove'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivacyCenter;
