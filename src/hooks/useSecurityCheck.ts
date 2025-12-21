import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DeviceInfo {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  userAgent?: string;
  isMobile?: boolean;
  fingerprint?: string;
}

interface SessionAnomaly {
  id: string;
  user_id: string;
  session_id: string | null;
  anomaly_type: 'new_device' | 'new_ip' | 'new_country' | 'suspicious_activity' | 'concurrent_sessions' | 'impossible_travel';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  resolved: boolean;
  created_at: string;
}

interface TrustedDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  browser_name: string | null;
  os_name: string | null;
  country: string | null;
  ip_address: string | null;
  last_used_at: string;
  is_trusted: boolean;
  created_at: string;
}

// Generate a simple device fingerprint
function generateDeviceFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString(),
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Generate a nonce for anti-replay protection
function generateNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export const useSecurityCheck = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get device info
  const getDeviceInfo = (): DeviceInfo => {
    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = '';
    let osName = 'Unknown';
    let osVersion = '';

    // Detect browser
    if (ua.includes('Firefox/')) {
      browserName = 'Firefox';
      browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
      browserName = 'Chrome';
      browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      browserName = 'Safari';
      browserVersion = ua.split('Version/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Edg/')) {
      browserName = 'Edge';
      browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || '';
    }

    // Detect OS
    if (ua.includes('Windows')) {
      osName = 'Windows';
      if (ua.includes('Windows NT 10.0')) osVersion = '10';
      else if (ua.includes('Windows NT 11.0')) osVersion = '11';
    } else if (ua.includes('Mac OS X')) {
      osName = 'macOS';
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      osVersion = match ? match[1].replace('_', '.') : '';
    } else if (ua.includes('Linux')) {
      osName = 'Linux';
    } else if (ua.includes('Android')) {
      osName = 'Android';
      const match = ua.match(/Android (\d+\.?\d*)/);
      osVersion = match ? match[1] : '';
    } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
      osName = 'iOS';
      const match = ua.match(/OS (\d+_\d+)/);
      osVersion = match ? match[1].replace('_', '.') : '';
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    return {
      browserName,
      browserVersion,
      osName,
      osVersion,
      deviceType: isMobile ? 'mobile' : 'desktop',
      screenWidth: screen.width,
      screenHeight: screen.height,
      language: navigator.language,
      userAgent: ua,
      isMobile,
      fingerprint: generateDeviceFingerprint(),
    };
  };

  // Track session with anomaly detection
  const trackSessionMutation = useMutation({
    mutationFn: async () => {
      const deviceInfo = getDeviceInfo();
      
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: {
          action: 'track-session',
          deviceInfo,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.anomalies?.count > 0) {
        queryClient.invalidateQueries({ queryKey: ['security-anomalies'] });
      }
    },
  });

  // Get anomalies
  const anomaliesQuery = useQuery({
    queryKey: ['security-anomalies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'get-anomalies' },
      });

      if (error) throw error;
      return data.anomalies as SessionAnomaly[];
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Resolve anomaly
  const resolveAnomalyMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'resolve-anomaly', anomalyId },
        headers: { 'x-request-nonce': generateNonce() },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-anomalies'] });
    },
  });

  // Get trusted devices
  const trustedDevicesQuery = useQuery({
    queryKey: ['trusted-devices', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'get-trusted-devices' },
      });

      if (error) throw error;
      return data.devices as TrustedDevice[];
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Trust device
  const trustDeviceMutation = useMutation({
    mutationFn: async ({ fingerprint, deviceName }: { fingerprint: string; deviceName?: string }) => {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'trust-device', fingerprint, deviceName },
        headers: { 'x-request-nonce': generateNonce() },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-devices'] });
    },
  });

  // Untrust device
  const untrustDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const { data, error } = await supabase.functions.invoke('security-check', {
        body: { action: 'untrust-device', deviceId },
        headers: { 'x-request-nonce': generateNonce() },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-devices'] });
    },
  });

  return {
    // Session tracking
    trackSession: trackSessionMutation.mutateAsync,
    isTrackingSession: trackSessionMutation.isPending,
    sessionData: trackSessionMutation.data,

    // Anomalies
    anomalies: anomaliesQuery.data || [],
    isLoadingAnomalies: anomaliesQuery.isLoading,
    unresolvedAnomaliesCount: (anomaliesQuery.data || []).filter(a => !a.resolved).length,
    resolveAnomaly: resolveAnomalyMutation.mutateAsync,
    isResolvingAnomaly: resolveAnomalyMutation.isPending,

    // Trusted devices
    trustedDevices: trustedDevicesQuery.data || [],
    isLoadingDevices: trustedDevicesQuery.isLoading,
    trustDevice: trustDeviceMutation.mutateAsync,
    untrustDevice: untrustDeviceMutation.mutateAsync,
    isTrustingDevice: trustDeviceMutation.isPending,
    isUntrustingDevice: untrustDeviceMutation.isPending,

    // Utils
    getDeviceInfo,
    generateNonce,
    currentFingerprint: generateDeviceFingerprint(),
  };
};
