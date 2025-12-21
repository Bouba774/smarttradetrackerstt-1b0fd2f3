import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ClientEnvironment {
  timezone: string;
  language: string;
  platform: string;
  screenResolution: string;
  userAgent: string;
}

export interface VPNDetectionResult {
  success: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  vpnDetected: boolean;
  proxyDetected: boolean;
  torDetected: boolean;
  hostingDetected: boolean;
  connectionMasked: boolean;
  timezoneMismatch: boolean;
  languageMismatch: boolean;
  actionTaken: string;
  ipInfo: {
    countryCode: string;
    isp: string;
    asn: string;
    organization: string;
  };
}

export interface ConnectionSecurityState {
  isChecking: boolean;
  lastCheck: Date | null;
  result: VPNDetectionResult | null;
  error: string | null;
}

const getClientEnvironment = (): ClientEnvironment => {
  let timezone = 'unknown';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback
  }

  return {
    timezone,
    language: navigator.language || 'unknown',
    platform: navigator.platform || 'unknown',
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    userAgent: navigator.userAgent || 'unknown',
  };
};

export const useConnectionSecurity = () => {
  const { user } = useAuth();
  const [state, setState] = useState<ConnectionSecurityState>({
    isChecking: false,
    lastCheck: null,
    result: null,
    error: null,
  });

  // Mutation for checking VPN/connection security
  const checkMutation = useMutation({
    mutationFn: async ({ 
      sessionId, 
      isAdminAccess = false 
    }: { 
      sessionId?: string; 
      isAdminAccess?: boolean;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const clientEnvironment = getClientEnvironment();

      const { data, error } = await supabase.functions.invoke('vpn-detection', {
        body: {
          clientEnvironment,
          sessionId,
          isAdminAccess,
        },
      });

      if (error) throw error;
      return data as VPNDetectionResult;
    },
    onSuccess: (result) => {
      setState(prev => ({
        ...prev,
        isChecking: false,
        lastCheck: new Date(),
        result,
        error: null,
      }));

      // Show appropriate notifications based on risk level
      if (result.actionTaken === 'ADMIN_BLOCKED') {
        toast.error('Accès administrateur bloqué', {
          description: 'Une connexion masquée a été détectée. Veuillez désactiver votre VPN/Proxy.',
          duration: 10000,
        });
      } else if (result.actionTaken === 'MFA_REQUIRED') {
        toast.warning('Vérification supplémentaire requise', {
          description: 'Votre connexion nécessite une vérification MFA.',
          duration: 8000,
        });
      } else if (result.actionTaken === 'ADMIN_WARNING') {
        toast.warning('Connexion masquée détectée', {
          description: 'Attention : vous accédez à l\'espace admin via VPN/Proxy.',
          duration: 6000,
        });
      } else if (result.riskLevel === 'critical') {
        toast.warning('Risque de connexion élevé', {
          description: 'Certaines fonctionnalités peuvent être restreintes.',
          duration: 6000,
        });
      }
    },
    onError: (error) => {
      console.error('[Connection Security] Check failed:', error);
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    },
  });

  // Check connection security
  const checkConnection = useCallback(async (options?: { 
    sessionId?: string; 
    isAdminAccess?: boolean;
  }) => {
    if (!user) return null;
    
    setState(prev => ({ ...prev, isChecking: true }));
    
    return checkMutation.mutateAsync({
      sessionId: options?.sessionId,
      isAdminAccess: options?.isAdminAccess,
    });
  }, [user, checkMutation]);

  // Query for connection logs (admin only)
  const connectionLogsQuery = useQuery({
    queryKey: ['connection-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connection_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: false, // Only fetch when explicitly requested
  });

  // Check if current connection is safe for admin operations
  const isConnectionSafeForAdmin = useCallback((): boolean => {
    if (!state.result) return true; // No check performed yet
    
    const { actionTaken, riskLevel, connectionMasked } = state.result;
    
    // Block admin access for critical actions
    if (actionTaken === 'ADMIN_BLOCKED') return false;
    if (riskLevel === 'critical') return false;
    if (state.result.torDetected) return false;
    
    return true;
  }, [state.result]);

  // Check if MFA is required
  const isMFARequired = useCallback((): boolean => {
    if (!state.result) return false;
    return state.result.actionTaken === 'MFA_REQUIRED';
  }, [state.result]);

  // Get risk badge color
  const getRiskBadgeVariant = useCallback((): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!state.result) return 'outline';
    
    switch (state.result.riskLevel) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  }, [state.result]);

  return {
    // State
    ...state,
    
    // Actions
    checkConnection,
    
    // Helpers
    isConnectionSafeForAdmin,
    isMFARequired,
    getRiskBadgeVariant,
    
    // Admin queries
    connectionLogs: connectionLogsQuery.data,
    fetchConnectionLogs: connectionLogsQuery.refetch,
    isLoadingLogs: connectionLogsQuery.isLoading,
  };
};

export default useConnectionSecurity;
