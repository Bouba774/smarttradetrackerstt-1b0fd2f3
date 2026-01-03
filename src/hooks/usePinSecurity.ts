import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface PinSettings {
  pinEnabled: boolean;
  pinLength: number;
  biometricEnabled: boolean;
  maxAttempts: number;
  wipeOnMaxAttempts: boolean;
  autoLockTimeout: number; // in seconds, 0 = immediate
}

interface PinStatus {
  hasPin: boolean;
  pinLength: number;
  biometricEnabled: boolean;
  maxAttempts: number;
  wipeOnMaxAttempts: boolean;
}

const defaultSettings: PinSettings = {
  pinEnabled: false,
  pinLength: 4,
  biometricEnabled: false,
  maxAttempts: 5,
  wipeOnMaxAttempts: false,
  autoLockTimeout: 0,
};

export const usePinSecurity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Fetch PIN status from database
  const { data: pinStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['pin-status', user?.id],
    queryFn: async (): Promise<PinStatus | null> => {
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_own_pin_status');

      if (error) {
        console.error('Error fetching PIN status:', error);
        return null;
      }

      if (data && data.length > 0) {
        const status = data[0];
        return {
          hasPin: status.has_pin,
          pinLength: status.pin_length || 4,
          biometricEnabled: status.biometric_enabled || false,
          maxAttempts: status.max_attempts || 5,
          wipeOnMaxAttempts: status.wipe_on_max_attempts || false,
        };
      }
      return null;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch auto-lock timeout from user_settings
  const { data: autoLockTimeout } = useQuery({
    queryKey: ['auto-lock-timeout', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;

      const { data, error } = await supabase
        .from('user_settings')
        .select('auto_lock_timeout')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching auto-lock timeout:', error);
      }

      return data?.auto_lock_timeout ?? 0;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Setup PIN mutation
  const setupPinMutation = useMutation({
    mutationFn: async ({ pin }: { pin: string }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('Setting up PIN for user:', user.id);

      // Call edge function to hash PIN
      const { data: hashData, error: hashError } = await supabase.functions.invoke('hash-pin', {
        body: { pin, action: 'create' },
      });

      console.log('Hash response:', hashData, hashError);

      if (hashError) {
        console.error('Hash error:', hashError);
        throw hashError;
      }
      if (!hashData?.hash || !hashData?.salt) {
        console.error('Invalid hash data:', hashData);
        throw new Error('Failed to hash PIN');
      }

      // Check if secure_credentials record exists
      const { data: existingCred, error: checkError } = await supabase
        .from('secure_credentials')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Existing credentials check:', existingCred, checkError);

      if (existingCred) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('secure_credentials')
          .update({
            pin_hash: hashData.hash,
            pin_salt: hashData.salt,
            pin_length: pin.length,
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('secure_credentials')
          .insert({
            user_id: user.id,
            pin_hash: hashData.hash,
            pin_salt: hashData.salt,
            pin_length: pin.length,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      // Update user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          pin_enabled: true,
          pin_length: pin.length,
        }, { onConflict: 'user_id' });

      if (settingsError) {
        console.error('Settings error:', settingsError);
        throw settingsError;
      }

      console.log('PIN setup completed successfully');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin-status'] });
      queryClient.invalidateQueries({ queryKey: ['auto-lock-timeout'] });
    },
  });

  // Verify PIN mutation
  const verifyPinMutation = useMutation({
    mutationFn: async ({ pin }: { pin: string }): Promise<boolean> => {
      if (!user) throw new Error('User not authenticated');

      // Get stored credentials
      const { data: credentials, error: credError } = await supabase
        .from('secure_credentials')
        .select('pin_hash, pin_salt, max_attempts, wipe_on_max_attempts')
        .eq('user_id', user.id)
        .single();

      if (credError || !credentials?.pin_hash || !credentials?.pin_salt) {
        throw new Error('PIN not configured');
      }

      // Call edge function to verify
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('hash-pin', {
        body: {
          pin,
          action: 'verify',
          existingHash: credentials.pin_hash,
          existingSalt: credentials.pin_salt,
        },
      });

      if (verifyError) throw verifyError;

      return verifyData?.valid === true;
    },
    onSuccess: (isValid) => {
      if (isValid) {
        setFailedAttempts(0);
      } else {
        setFailedAttempts((prev) => prev + 1);
      }
    },
    onError: () => {
      setFailedAttempts((prev) => prev + 1);
    },
  });

  // Disable PIN mutation
  const disablePinMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Clear PIN from secure_credentials
      const { error: credError } = await supabase
        .from('secure_credentials')
        .update({
          pin_hash: null,
          pin_salt: null,
          pin_length: null,
        })
        .eq('user_id', user.id);

      if (credError) throw credError;

      // Update user_settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          pin_enabled: false,
          biometric_enabled: false,
        })
        .eq('user_id', user.id);

      if (settingsError) throw settingsError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin-status'] });
    },
  });

  // Toggle biometric mutation
  const toggleBiometricMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('secure_credentials')
        .update({ biometric_enabled: enabled })
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin-status'] });
    },
  });

  // Update security settings mutation
  const updateSecuritySettingsMutation = useMutation({
    mutationFn: async (settings: Partial<{
      maxAttempts: number;
      wipeOnMaxAttempts: boolean;
      autoLockTimeout: number;
    }>) => {
      if (!user) throw new Error('User not authenticated');

      // Update secure_credentials if needed
      if (settings.maxAttempts !== undefined || settings.wipeOnMaxAttempts !== undefined) {
        const credUpdates: Record<string, unknown> = {};
        if (settings.maxAttempts !== undefined) credUpdates.max_attempts = settings.maxAttempts;
        if (settings.wipeOnMaxAttempts !== undefined) credUpdates.wipe_on_max_attempts = settings.wipeOnMaxAttempts;

        const { error } = await supabase
          .from('secure_credentials')
          .update(credUpdates)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Update user_settings for auto_lock_timeout
      if (settings.autoLockTimeout !== undefined) {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            auto_lock_timeout: settings.autoLockTimeout,
          }, { onConflict: 'user_id' });

        if (error) throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pin-status'] });
      queryClient.invalidateQueries({ queryKey: ['auto-lock-timeout'] });
    },
  });

  // Request PIN reset via email
  const requestPinReset = useCallback(async () => {
    if (!user?.email) {
      toast.error('Email not found');
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke('security-email', {
        body: {
          type: 'pin_reset',
          email: user.email,
          language: 'fr',
          resetUrl: `${window.location.origin}/reset-pin`,
        },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error requesting PIN reset:', error);
      return false;
    }
  }, [user]);

  // Check biometric availability - WebAuthn platform authenticator
  const checkBiometricAvailability = useCallback(async (): Promise<boolean> => {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) return false;

    try {
      // Check if platform authenticator (fingerprint/face) is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) return false;
      
      // Check if credentials are already registered for this user
      const storedCredentialId = localStorage.getItem(`biometric_credential_${user?.id}`);
      return !!storedCredentialId;
    } catch {
      return false;
    }
  }, [user?.id]);

  // Register biometric credential (must be called when enabling biometrics)
  const registerBiometricCredential = useCallback(async (): Promise<boolean> => {
    if (!user || !window.PublicKeyCredential) return false;

    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) return false;

      // Generate a challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'Smart Trade Tracker',
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email || 'user',
            displayName: user.email || 'User',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'discouraged',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (credential) {
        // Store the credential ID for later verification
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(`biometric_credential_${user.id}`, credentialId);
        return true;
      }
      return false;
    } catch (error) {
      console.log('Biometric registration failed:', error);
      return false;
    }
  }, [user]);

  // Verify biometric (used for unlocking)
  const verifyBiometric = useCallback(async (): Promise<boolean> => {
    if (!user || !window.PublicKeyCredential) return false;

    try {
      const storedCredentialId = localStorage.getItem(`biometric_credential_${user.id}`);
      if (!storedCredentialId) return false;

      // Decode the stored credential ID
      const rawId = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));

      // Generate a new challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Request authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
          allowCredentials: [{
            id: rawId,
            type: 'public-key',
            transports: ['internal'],
          }],
        },
      });

      return !!credential;
    } catch (error) {
      console.log('Biometric verification failed:', error);
      return false;
    }
  }, [user]);

  // Remove biometric credential
  const removeBiometricCredential = useCallback(() => {
    if (user?.id) {
      localStorage.removeItem(`biometric_credential_${user.id}`);
    }
  }, [user?.id]);

  // Wipe local data
  const wipeLocalData = useCallback(async () => {
    // Clear localStorage
    const keysToRemove = Object.keys(localStorage).filter(
      (key) => key.startsWith('trade') || key.startsWith('journal') || key.startsWith('settings')
    );
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Sign out user
    await supabase.auth.signOut();
  }, []);

  return {
    // State
    pinStatus,
    isLoadingStatus,
    failedAttempts,
    autoLockTimeout: autoLockTimeout ?? 0,
    
    // Computed
    isPinEnabled: pinStatus?.hasPin ?? false,
    isBiometricEnabled: pinStatus?.biometricEnabled ?? false,
    maxAttempts: pinStatus?.maxAttempts ?? 5,
    shouldWipeOnMaxAttempts: pinStatus?.wipeOnMaxAttempts ?? false,
    
    // Actions
    setupPin: setupPinMutation.mutateAsync,
    verifyPin: verifyPinMutation.mutateAsync,
    disablePin: disablePinMutation.mutateAsync,
    toggleBiometric: toggleBiometricMutation.mutateAsync,
    updateSecuritySettings: updateSecuritySettingsMutation.mutateAsync,
    requestPinReset,
    checkBiometricAvailability,
    registerBiometricCredential,
    verifyBiometric,
    removeBiometricCredential,
    wipeLocalData,
    refetchStatus,
    
    // Loading states
    isSettingUp: setupPinMutation.isPending,
    isVerifying: verifyPinMutation.isPending,
    isDisabling: disablePinMutation.isPending,
    resetFailedAttempts: () => setFailedAttempts(0),
  };
};
