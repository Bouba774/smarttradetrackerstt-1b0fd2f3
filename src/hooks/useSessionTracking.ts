import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DeviceInfo {
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  deviceVendor: string;
  deviceModel: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  userAgent: string;
  isMobile: boolean;
  fingerprint?: string;
}

// Generate a simple device fingerprint
function generateFingerprint(): string {
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

const parseUserAgent = (ua: string): Partial<DeviceInfo> => {
  const result: Partial<DeviceInfo> = {
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    fingerprint: generateFingerprint(),
  };

  // Detect browser
  if (ua.includes('Firefox/')) {
    result.browserName = 'Firefox';
    result.browserVersion = ua.match(/Firefox\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Edg/')) {
    result.browserName = 'Edge';
    result.browserVersion = ua.match(/Edg\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    result.browserName = 'Chrome';
    result.browserVersion = ua.match(/Chrome\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    result.browserName = 'Safari';
    result.browserVersion = ua.match(/Version\/(\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    result.browserName = 'Opera';
    result.browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.?\d*)/)?.[1] || '';
  } else {
    result.browserName = 'Unknown';
    result.browserVersion = '';
  }

  // Detect OS
  if (ua.includes('Windows NT 10')) {
    result.osName = 'Windows';
    result.osVersion = '10/11';
  } else if (ua.includes('Windows NT')) {
    result.osName = 'Windows';
    result.osVersion = ua.match(/Windows NT (\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('Mac OS X')) {
    result.osName = 'macOS';
    result.osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Android')) {
    result.osName = 'Android';
    result.osVersion = ua.match(/Android (\d+\.?\d*)/)?.[1] || '';
  } else if (ua.includes('iPhone OS') || ua.includes('iPad')) {
    result.osName = 'iOS';
    result.osVersion = ua.match(/OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Linux')) {
    result.osName = 'Linux';
    result.osVersion = '';
  } else {
    result.osName = 'Unknown';
    result.osVersion = '';
  }

  // Detect device type and vendor
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  
  result.isMobile = isMobile;
  result.deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // Enhanced device vendor and model detection
  if (ua.includes('iPhone')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = 'iPhone';
  } else if (ua.includes('iPad')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = 'iPad';
  } else if (ua.includes('Macintosh')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = 'Mac';
  } else if (/Samsung|SAMSUNG|SM-[A-Z]/i.test(ua)) {
    result.deviceVendor = 'Samsung';
    const model = ua.match(/SM-[A-Z0-9]+/i) || ua.match(/Galaxy\s*[^;)\s]*/i);
    result.deviceModel = model?.[0]?.trim() || 'Galaxy';
  } else if (result.deviceType === 'desktop') {
    if (result.osName === 'Windows') {
      result.deviceVendor = 'Windows';
      result.deviceModel = 'PC';
    } else if (result.osName === 'Linux') {
      result.deviceVendor = 'Linux';
      result.deviceModel = 'PC';
    } else if (result.osName === 'macOS') {
      result.deviceVendor = 'Apple';
      result.deviceModel = 'Mac';
    } else {
      result.deviceVendor = 'Desktop';
      result.deviceModel = 'PC';
    }
  } else if (ua.includes('Android')) {
    const androidModel = ua.match(/;\s*([^;)]+?)\s*(?:Build|MIUI)/i);
    if (androidModel && androidModel[1]) {
      const modelName = androidModel[1].trim();
      if (modelName !== 'K' && modelName !== 'wv' && modelName.length > 2) {
        result.deviceVendor = 'Android';
        result.deviceModel = modelName;
      } else {
        result.deviceVendor = 'Android';
        result.deviceModel = 'Mobile';
      }
    } else {
      result.deviceVendor = 'Android';
      result.deviceModel = 'Mobile';
    }
  } else {
    result.deviceVendor = result.osName || 'Unknown';
    result.deviceModel = result.deviceType === 'mobile' ? 'Mobile' : 'Device';
  }

  return result;
};

export const useSessionTracking = () => {
  const { user } = useAuth();
  const hasTracked = useRef(false);
  const currentSessionId = useRef<string | null>(null);
  const [anomaliesDetected, setAnomaliesDetected] = useState(false);

  useEffect(() => {
    const trackSession = async () => {
      if (!user || hasTracked.current) return;

      try {
        hasTracked.current = true;
        
        const deviceInfo = parseUserAgent(navigator.userAgent);

        // Use the new security-check edge function for enhanced tracking
        const { data, error } = await supabase.functions.invoke('security-check', {
          body: { 
            action: 'track-session',
            deviceInfo 
          }
        });

        if (error) {
          console.error('Error tracking session:', error);
          // Fallback to basic tracking
          const { data: fallbackData } = await supabase.functions.invoke('track-session', {
            body: { deviceInfo }
          });
          if (fallbackData?.sessionId) {
            currentSessionId.current = fallbackData.sessionId;
          }
          hasTracked.current = false;
          return;
        }

        if (data?.sessionId) {
          currentSessionId.current = data.sessionId;
          console.log('Session tracked with security check:', data.sessionId);
          
          // Check for anomalies
          if (data?.anomalies?.count > 0) {
            setAnomaliesDetected(true);
            
            // Show toast for security alerts
            const criticalAnomalies = data.anomalies.anomalies?.filter(
              (a: any) => a.severity === 'critical' || a.severity === 'high'
            );
            
            if (criticalAnomalies?.length > 0) {
              toast.warning('Activité inhabituelle détectée', {
                description: 'Vérifiez vos alertes de sécurité dans le Centre de confidentialité',
                duration: 8000,
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to track session:', err);
        hasTracked.current = false;
      }
    };

    trackSession();

    return () => {
      if (!user) {
        hasTracked.current = false;
        currentSessionId.current = null;
        setAnomaliesDetected(false);
      }
    };
  }, [user]);

  // Update session end time when page is closed
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentSessionId.current && user) {
        const updateData = {
          session_end: new Date().toISOString()
        };
        
        navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?id=eq.${currentSessionId.current}`,
          JSON.stringify(updateData)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  return { 
    sessionId: currentSessionId.current,
    anomaliesDetected 
  };
};
