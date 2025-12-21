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

  // Enhanced browser detection - check specific browsers first
  if (/Phoenix/.test(ua)) {
    result.browserName = 'Phoenix';
    result.browserVersion = ua.match(/Phoenix\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/DuckDuckGo/.test(ua)) {
    result.browserName = 'DuckDuckGo';
    result.browserVersion = ua.match(/DuckDuckGo\/(\d+)/)?.[1] || '';
  } else if ((navigator as any).brave?.isBrave) {
    result.browserName = 'Brave';
    result.browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (/Vivaldi/.test(ua)) {
    result.browserName = 'Vivaldi';
    result.browserVersion = ua.match(/Vivaldi\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/YaBrowser/.test(ua)) {
    result.browserName = 'Yandex';
    result.browserVersion = ua.match(/YaBrowser\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/UCBrowser|UCWEB/.test(ua)) {
    result.browserName = 'UC Browser';
    result.browserVersion = ua.match(/UCBrowser\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/Puffin/.test(ua)) {
    result.browserName = 'Puffin';
    result.browserVersion = ua.match(/Puffin\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/Whale/.test(ua)) {
    result.browserName = 'Whale';
    result.browserVersion = ua.match(/Whale\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/QQBrowser/.test(ua)) {
    result.browserName = 'QQ Browser';
    result.browserVersion = ua.match(/QQBrowser\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/Kiwi/.test(ua)) {
    result.browserName = 'Kiwi';
    result.browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (/MiuiBrowser/.test(ua)) {
    result.browserName = 'Mi Browser';
    result.browserVersion = ua.match(/MiuiBrowser\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/HuaweiBrowser/.test(ua)) {
    result.browserName = 'Huawei Browser';
    result.browserVersion = ua.match(/HuaweiBrowser\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/Edg\//.test(ua)) {
    result.browserName = 'Edge';
    result.browserVersion = ua.match(/Edg\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/OPR\/|Opera/.test(ua)) {
    result.browserName = /Opera GX/.test(ua) ? 'Opera GX' : 'Opera';
    result.browserVersion = ua.match(/OPR\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/SamsungBrowser/.test(ua)) {
    result.browserName = 'Samsung Internet';
    result.browserVersion = ua.match(/SamsungBrowser\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/Firefox\//.test(ua)) {
    result.browserName = /Focus/.test(ua) ? 'Firefox Focus' : 'Firefox';
    result.browserVersion = ua.match(/Firefox\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
    result.browserName = 'Chrome';
    result.browserVersion = ua.match(/Chrome\/(\d+\.?\d*)/)?.[1] || '';
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    result.browserName = 'Safari';
    result.browserVersion = ua.match(/Version\/(\d+\.?\d*)/)?.[1] || '';
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

  // Detect device type
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua);
  
  result.isMobile = isMobile;
  result.deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  // Enhanced device vendor and model detection for more brands
  if (ua.includes('iPhone')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = 'iPhone';
  } else if (ua.includes('iPad')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = 'iPad';
  } else if (ua.includes('Macintosh')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = 'Mac';
  } else if (/Android/.test(ua)) {
    // Extract Android device info
    const buildMatch = ua.match(/;\s*([^;)]+)\s*Build/i);
    
    if (buildMatch) {
      const deviceString = buildMatch[1].trim();
      
      // Known vendors
      const vendorMap: { [key: string]: string } = {
        'SM-': 'Samsung', 'Galaxy': 'Samsung', 'SAMSUNG': 'Samsung',
        'Infinix': 'Infinix', 'TECNO': 'Tecno', 'itel': 'Itel', 'ITEL': 'Itel',
        'Redmi': 'Xiaomi', 'Mi ': 'Xiaomi', 'POCO': 'Xiaomi', 'M2': 'Xiaomi',
        'Pixel': 'Google', 'HUAWEI': 'Huawei', 'VOG-': 'Huawei', 'ELE-': 'Huawei',
        'OPPO': 'Oppo', 'CPH': 'Oppo', 'RMX': 'Realme', 'realme': 'Realme',
        'vivo': 'Vivo', 'V2': 'Vivo', 'OnePlus': 'OnePlus', 'LE2': 'OnePlus',
        'Nokia': 'Nokia', 'TA-': 'Nokia', 'Motorola': 'Motorola', 'moto': 'Motorola',
        'LG-': 'LG', 'LM-': 'LG', 'Sony': 'Sony', 'Xperia': 'Sony',
        'ASUS': 'Asus', 'ZS': 'Asus', 'Lenovo': 'Lenovo', 'ZTE': 'ZTE', 'HTC': 'HTC',
      };
      
      // Friendly names for common models
      const friendlyNames: { [key: string]: string } = {
        'X6528': 'Infinix HOT 40i', 'X6831': 'Infinix HOT 40 Pro',
        'X6711': 'Infinix Smart 8', 'X6515': 'Infinix HOT 30i', 'X669': 'Infinix HOT 20',
        'SM-A546': 'Galaxy A54', 'SM-A536': 'Galaxy A53', 'SM-A346': 'Galaxy A34',
        'SM-A236': 'Galaxy A23', 'SM-A146': 'Galaxy A14', 'SM-A047': 'Galaxy A04s',
        'SM-S918': 'Galaxy S23 Ultra', 'SM-S916': 'Galaxy S23+', 'SM-S911': 'Galaxy S23',
      };
      
      let vendor = 'Android';
      for (const [prefix, vendorName] of Object.entries(vendorMap)) {
        if (deviceString.includes(prefix)) {
          vendor = vendorName;
          break;
        }
      }
      
      let model = deviceString;
      for (const [modelNum, friendly] of Object.entries(friendlyNames)) {
        if (deviceString.includes(modelNum)) {
          model = friendly;
          break;
        }
      }
      
      result.deviceVendor = vendor;
      result.deviceModel = model;
    } else {
      result.deviceVendor = 'Android';
      result.deviceModel = isMobile ? 'Phone' : 'Tablet';
    }
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
