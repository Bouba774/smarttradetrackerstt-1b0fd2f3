import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
}

const parseUserAgent = (ua: string): Partial<DeviceInfo> => {
  const result: Partial<DeviceInfo> = {
    userAgent: ua,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
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
    const iphoneMatch = ua.match(/iPhone(\d+),(\d+)/);
    if (iphoneMatch) {
      result.deviceModel = `iPhone ${iphoneMatch[1]}`;
    } else {
      result.deviceModel = 'iPhone';
    }
  } else if (ua.includes('iPad')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = 'iPad';
  } else if (ua.includes('Macintosh')) {
    result.deviceVendor = 'Apple';
    result.deviceModel = ua.includes('Mac OS X') ? 'Mac' : 'Macintosh';
  } else if (/Samsung|SAMSUNG|SM-[A-Z]/i.test(ua)) {
    result.deviceVendor = 'Samsung';
    const model = ua.match(/SM-[A-Z0-9]+/i) || ua.match(/Galaxy[^;)\s]*/i);
    result.deviceModel = model?.[0]?.trim() || 'Galaxy';
  } else if (/Huawei|HUAWEI/i.test(ua)) {
    result.deviceVendor = 'Huawei';
    const model = ua.match(/(?:Huawei|HUAWEI)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Huawei';
  } else if (/Xiaomi|XIAOMI|Mi\s|Redmi|POCO/i.test(ua)) {
    result.deviceVendor = 'Xiaomi';
    const model = ua.match(/(?:Xiaomi|Mi|Redmi|POCO)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Xiaomi';
  } else if (/OPPO|Oppo/i.test(ua)) {
    result.deviceVendor = 'OPPO';
    const model = ua.match(/(?:OPPO|Oppo)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'OPPO';
  } else if (/Vivo|vivo/i.test(ua)) {
    result.deviceVendor = 'Vivo';
    const model = ua.match(/(?:Vivo|vivo)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Vivo';
  } else if (/OnePlus|ONEPLUS/i.test(ua)) {
    result.deviceVendor = 'OnePlus';
    const model = ua.match(/(?:OnePlus|ONEPLUS)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'OnePlus';
  } else if (/Pixel/i.test(ua)) {
    result.deviceVendor = 'Google';
    const model = ua.match(/Pixel[^;)]*/i);
    result.deviceModel = model?.[0]?.trim() || 'Pixel';
  } else if (/Realme|realme/i.test(ua)) {
    result.deviceVendor = 'Realme';
    const model = ua.match(/(?:Realme|realme)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Realme';
  } else if (/Motorola|moto\s/i.test(ua)) {
    result.deviceVendor = 'Motorola';
    const model = ua.match(/(?:Motorola|moto)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Motorola';
  } else if (/Nokia/i.test(ua)) {
    result.deviceVendor = 'Nokia';
    const model = ua.match(/Nokia[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Nokia';
  } else if (/LG[-\s]/i.test(ua)) {
    result.deviceVendor = 'LG';
    const model = ua.match(/LG[-;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'LG';
  } else if (/Sony|Xperia/i.test(ua)) {
    result.deviceVendor = 'Sony';
    const model = ua.match(/(?:Sony|Xperia)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Xperia';
  } else if (/ASUS|Asus/i.test(ua)) {
    result.deviceVendor = 'ASUS';
    const model = ua.match(/(?:ASUS|Asus)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'ASUS';
  } else if (/ZTE/i.test(ua)) {
    result.deviceVendor = 'ZTE';
    const model = ua.match(/ZTE[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'ZTE';
  } else if (/Tecno|TECNO/i.test(ua)) {
    result.deviceVendor = 'Tecno';
    const model = ua.match(/(?:Tecno|TECNO)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Tecno';
  } else if (/Infinix|INFINIX/i.test(ua)) {
    result.deviceVendor = 'Infinix';
    const model = ua.match(/(?:Infinix|INFINIX)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Infinix';
  } else if (/itel|ITEL/i.test(ua)) {
    result.deviceVendor = 'Itel';
    const model = ua.match(/(?:itel|ITEL)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Itel';
  } else if (result.deviceType === 'desktop') {
    if (result.osName === 'Windows') {
      result.deviceVendor = 'PC';
      result.deviceModel = 'Windows PC';
    } else if (result.osName === 'Linux') {
      result.deviceVendor = 'PC';
      result.deviceModel = 'Linux PC';
    } else {
      result.deviceVendor = 'PC';
      result.deviceModel = 'Desktop';
    }
  } else if (ua.includes('Android')) {
    // Generic Android device - try to extract model from user agent
    // Format: "Android X; MODEL Build/..." or "Android X; K"
    const androidModel = ua.match(/Android\s[\d.]+;\s*([^;)]+)/i);
    if (androidModel && androidModel[1]) {
      const modelName = androidModel[1].trim();
      // Check if it's a generic "K" placeholder used by Chrome
      if (modelName === 'K' || modelName.length <= 2) {
        result.deviceVendor = 'Android';
        result.deviceModel = 'Android Device';
      } else {
        result.deviceVendor = 'Android';
        result.deviceModel = modelName;
      }
    } else {
      result.deviceVendor = 'Android';
      result.deviceModel = 'Android Device';
    }
  } else {
    result.deviceVendor = 'Unknown';
    result.deviceModel = 'Unknown';
  }

  return result;
};

export const useSessionTracking = () => {
  const { user } = useAuth();
  const hasTracked = useRef(false);
  const currentSessionId = useRef<string | null>(null);

  useEffect(() => {
    const trackSession = async () => {
      if (!user || hasTracked.current) return;

      try {
        hasTracked.current = true;
        
        const deviceInfo = parseUserAgent(navigator.userAgent);

        console.log('Tracking session with device info:', deviceInfo);

        const { data, error } = await supabase.functions.invoke('track-session', {
          body: { deviceInfo }
        });

        if (error) {
          console.error('Error tracking session:', error);
          hasTracked.current = false; // Allow retry
          return;
        }

        if (data?.sessionId) {
          currentSessionId.current = data.sessionId;
          console.log('Session tracked:', data.sessionId);
        }
      } catch (err) {
        console.error('Failed to track session:', err);
        hasTracked.current = false;
      }
    };

    trackSession();

    // Reset tracking when user logs out
    return () => {
      if (!user) {
        hasTracked.current = false;
        currentSessionId.current = null;
      }
    };
  }, [user]);

  // Update session end time when page is closed
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentSessionId.current && user) {
        // Use sendBeacon for reliable data sending on page close
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

  return { sessionId: currentSessionId.current };
};
