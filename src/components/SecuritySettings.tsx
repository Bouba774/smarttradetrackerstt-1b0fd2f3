import React, { useState, useEffect } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeedback } from '@/hooks/useFeedback';
import { usePinSecurity } from '@/hooks/usePinSecurity';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Fingerprint,
  Trash2,
  KeyRound,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PINInput } from './PINInput';

const AUTO_LOCK_OPTIONS = [
  { value: '0', labelFr: 'Immédiat', labelEn: 'Immediate' },
  { value: '30', labelFr: '30 secondes', labelEn: '30 seconds' },
  { value: '60', labelFr: '1 minute', labelEn: '1 minute' },
  { value: '120', labelFr: '2 minutes', labelEn: '2 minutes' },
  { value: '300', labelFr: '5 minutes', labelEn: '5 minutes' },
  { value: '600', labelFr: '10 minutes', labelEn: '10 minutes' },
  { value: '-1', labelFr: 'Jamais', labelEn: 'Never' },
];

export const SecuritySettings: React.FC = () => {
  const { language } = useLanguage();
  const { triggerFeedback } = useFeedback();
  const {
    settings,
    toggleConfidentialMode,
  } = useSecurity();

  const {
    isPinEnabled,
    isBiometricEnabled,
    maxAttempts,
    shouldWipeOnMaxAttempts,
    autoLockTimeout,
    isLoadingStatus,
    setupPin,
    disablePin,
    toggleBiometric,
    updateSecuritySettings,
    checkBiometricAvailability,
    registerBiometricCredential,
    removeBiometricCredential,
    isSettingUp,
    isDisabling,
  } = usePinSecurity();

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isBiometricRegistered, setIsBiometricRegistered] = useState(false);

  // Check biometric availability (platform authenticator)
  useEffect(() => {
    const checkAvailability = async () => {
      if (!window.PublicKeyCredential) {
        setBiometricAvailable(false);
        return;
      }
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
        // Check if already registered
        const isRegistered = await checkBiometricAvailability();
        setIsBiometricRegistered(isRegistered);
      } catch {
        setBiometricAvailable(false);
      }
    };
    checkAvailability();
  }, [checkBiometricAvailability]);

  const handleConfidentialModeToggle = () => {
    toggleConfidentialMode();
    triggerFeedback('click');
    toast.success(
      settings.confidentialMode
        ? (language === 'fr' ? 'Mode confidentiel désactivé' : 'Confidential mode disabled')
        : (language === 'fr' ? 'Mode confidentiel activé' : 'Confidential mode enabled')
    );
  };

  const handlePinToggle = async (enabled: boolean) => {
    triggerFeedback('click');
    if (enabled) {
      setShowPinSetup(true);
    } else {
      setShowDisableConfirm(true);
    }
  };

  const handlePinSetupComplete = (pin: string) => {
    setNewPin(pin);
    setShowPinSetup(false);
    setShowPinConfirm(true);
  };

  const handlePinConfirmComplete = async (pin: string) => {
    if (pin !== newPin) {
      setPinError(true);
      setConfirmPin('');
      toast.error(
        language === 'fr'
          ? 'Les codes PIN ne correspondent pas'
          : 'PIN codes do not match'
      );
      setTimeout(() => setPinError(false), 500);
      return;
    }

    try {
      await setupPin({ pin });
      setShowPinConfirm(false);
      setNewPin('');
      setConfirmPin('');
      toast.success(
        language === 'fr'
          ? 'Code PIN configuré avec succès'
          : 'PIN code configured successfully'
      );
    } catch (error) {
      console.error('Error setting up PIN:', error);
      toast.error(
        language === 'fr'
          ? 'Erreur lors de la configuration du PIN'
          : 'Error configuring PIN'
      );
    }
  };

  const handleDisablePin = async () => {
    try {
      await disablePin();
      setShowDisableConfirm(false);
      toast.success(
        language === 'fr'
          ? 'Protection par PIN désactivée'
          : 'PIN protection disabled'
      );
    } catch (error) {
      console.error('Error disabling PIN:', error);
      toast.error(
        language === 'fr'
          ? 'Erreur lors de la désactivation du PIN'
          : 'Error disabling PIN'
      );
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    triggerFeedback('click');
    try {
      if (enabled) {
        // Register biometric credential first
        const registered = await registerBiometricCredential();
        if (!registered) {
          toast.error(
            language === 'fr'
              ? 'Impossible d\'enregistrer la biométrie. Vérifiez que votre appareil le supporte.'
              : 'Failed to register biometrics. Check if your device supports it.'
          );
          return;
        }
        setIsBiometricRegistered(true);
      } else {
        // Remove stored credential
        removeBiometricCredential();
        setIsBiometricRegistered(false);
      }
      
      await toggleBiometric(enabled);
      toast.success(
        enabled
          ? (language === 'fr' ? 'Biométrie activée' : 'Biometrics enabled')
          : (language === 'fr' ? 'Biométrie désactivée' : 'Biometrics disabled')
      );
    } catch (error) {
      console.error('Error toggling biometric:', error);
      toast.error(
        language === 'fr'
          ? 'Erreur lors de la modification des paramètres biométriques'
          : 'Error updating biometric settings'
      );
    }
  };

  const handleAutoLockChange = async (value: string) => {
    triggerFeedback('click');
    try {
      await updateSecuritySettings({ autoLockTimeout: parseInt(value) });
      toast.success(
        language === 'fr'
          ? 'Délai de verrouillage mis à jour'
          : 'Auto-lock timeout updated'
      );
    } catch (error) {
      console.error('Error updating auto-lock:', error);
    }
  };

  const handleWipeToggle = async (enabled: boolean) => {
    triggerFeedback('click');
    try {
      await updateSecuritySettings({ wipeOnMaxAttempts: enabled });
      toast.success(
        enabled
          ? (language === 'fr' ? 'Effacement automatique activé' : 'Auto-wipe enabled')
          : (language === 'fr' ? 'Effacement automatique désactivé' : 'Auto-wipe disabled')
      );
    } catch (error) {
      console.error('Error updating wipe settings:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Header */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Sécurité' : 'Security'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {language === 'fr'
            ? 'Protégez vos données de trading avec le verrouillage et le mode confidentiel'
            : 'Protect your trading data with app lock and confidential mode'}
        </p>
      </div>

      {/* App Lock Section */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Protection de l\'application' : 'App Protection'}
          </h3>
        </div>

        <div className="space-y-4">
          {/* PIN Lock Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground">
                {language === 'fr' ? 'Activer le verrouillage' : 'Enable app lock'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === 'fr'
                  ? 'Protégez l\'accès avec un code PIN à 4 chiffres'
                  : 'Protect access with a 4-digit PIN code'}
              </p>
            </div>
            <Switch
              checked={isPinEnabled}
              onCheckedChange={handlePinToggle}
              disabled={isLoadingStatus || isSettingUp || isDisabling}
            />
          </div>

          {/* Biometric Option - Only show if PIN is enabled and platform authenticator available */}
          {isPinEnabled && biometricAvailable && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <Label className="text-foreground flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  {language === 'fr' ? 'Utiliser la biométrie' : 'Use biometrics'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr'
                    ? isBiometricEnabled && isBiometricRegistered
                      ? 'Biométrie configurée et active'
                      : 'Déverrouillez avec votre empreinte ou visage'
                    : isBiometricEnabled && isBiometricRegistered
                      ? 'Biometrics configured and active'
                      : 'Unlock with fingerprint or face'}
                </p>
              </div>
              <Switch
                checked={isBiometricEnabled && isBiometricRegistered}
                onCheckedChange={handleBiometricToggle}
              />
            </div>
          )}

          {/* Auto-lock Timeout - Only show if PIN is enabled */}
          {isPinEnabled && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <Label className="text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {language === 'fr' ? 'Verrouillage automatique' : 'Auto-lock'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr'
                    ? 'Délai avant verrouillage'
                    : 'Time before locking'}
                </p>
              </div>
              <Select
                value={autoLockTimeout.toString()}
                onValueChange={handleAutoLockChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_LOCK_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {language === 'fr' ? option.labelFr : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Wipe on Max Attempts - Only show if PIN is enabled */}
          {isPinEnabled && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div>
                <Label className="text-foreground flex items-center gap-2 text-destructive">
                  <Trash2 className="w-4 h-4" />
                  {language === 'fr' ? 'Effacer après échecs' : 'Wipe after failures'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {language === 'fr'
                    ? `Effacer les données après ${maxAttempts} tentatives`
                    : `Wipe data after ${maxAttempts} failed attempts`}
                </p>
              </div>
              <Switch
                checked={shouldWipeOnMaxAttempts}
                onCheckedChange={handleWipeToggle}
              />
            </div>
          )}
        </div>
      </div>

      {/* Confidential Mode Section */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-4">
          {settings.confidentialMode ? (
            <EyeOff className="w-5 h-5 text-primary" />
          ) : (
            <Eye className="w-5 h-5 text-primary" />
          )}
          <h3 className="font-display font-semibold text-foreground">
            {language === 'fr' ? 'Mode confidentiel' : 'Confidential mode'}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-foreground">
              {language === 'fr' ? 'Masquer les montants' : 'Hide amounts'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === 'fr'
                ? 'Masque les valeurs monétaires et tailles de lot'
                : 'Hides monetary values and lot sizes'}
            </p>
          </div>
          <Switch
            checked={settings.confidentialMode}
            onCheckedChange={handleConfidentialModeToggle}
          />
        </div>
      </div>

      {/* Security Info */}
      <div className={cn(
        "glass-card p-6 animate-fade-in",
        "bg-amber-500/5 border-amber-500/20"
      )} style={{ animationDelay: '150ms' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground mb-1">
              {language === 'fr' ? 'Conseil de sécurité' : 'Security tip'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {language === 'fr'
                ? 'Activez le verrouillage par PIN pour protéger vos données sensibles. Le mode confidentiel masque les montants lorsque vous utilisez l\'application en public.'
                : 'Enable PIN lock to protect your sensitive data. Confidential mode hides amounts when using the app in public.'}
            </p>
          </div>
        </div>
      </div>

      {/* PIN Setup Dialog */}
      <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              {language === 'fr' ? 'Créer un code PIN' : 'Create PIN code'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr'
                ? 'Entrez un code PIN à 4 chiffres pour protéger l\'application'
                : 'Enter a 4-digit PIN code to protect the app'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <PINInput
              length={4}
              onComplete={handlePinSetupComplete}
              disabled={isSettingUp}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* PIN Confirm Dialog */}
      <Dialog open={showPinConfirm} onOpenChange={(open) => {
        setShowPinConfirm(open);
        if (!open) {
          setNewPin('');
          setConfirmPin('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              {language === 'fr' ? 'Confirmer le code PIN' : 'Confirm PIN code'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr'
                ? 'Entrez à nouveau votre code PIN pour confirmer'
                : 'Enter your PIN code again to confirm'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <PINInput
              length={4}
              onComplete={handlePinConfirmComplete}
              disabled={isSettingUp}
              error={pinError}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable PIN Confirm Dialog */}
      <Dialog open={showDisableConfirm} onOpenChange={setShowDisableConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Lock className="w-5 h-5" />
              {language === 'fr' ? 'Désactiver le verrouillage' : 'Disable app lock'}
            </DialogTitle>
            <DialogDescription>
              {language === 'fr'
                ? 'Êtes-vous sûr de vouloir désactiver la protection par code PIN ? Vos données ne seront plus protégées.'
                : 'Are you sure you want to disable PIN protection? Your data will no longer be protected.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDisableConfirm(false)}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisablePin}
              disabled={isDisabling}
            >
              {language === 'fr' ? 'Désactiver' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecuritySettings;
