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
  } else if (/Huawei|HUAWEI|HW-/i.test(ua)) {
    result.deviceVendor = 'Huawei';
    const model = ua.match(/(?:Huawei|HUAWEI|HW-)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/Xiaomi|XIAOMI|Mi\s|Redmi|POCO/i.test(ua)) {
    result.deviceVendor = 'Xiaomi';
    const model = ua.match(/(?:Redmi|Mi|POCO)\s*[^;)\s]+/i) || ua.match(/(?:Xiaomi)[;\s]*([^;)\s]+)/i);
    result.deviceModel = (Array.isArray(model) ? model[0] : model?.[1])?.trim() || 'Device';
  } else if (/OPPO|Oppo|CPH/i.test(ua)) {
    result.deviceVendor = 'OPPO';
    const model = ua.match(/CPH[0-9]+/i) || ua.match(/(?:OPPO|Oppo)[;\s]*([^;)\s]+)/i);
    result.deviceModel = (Array.isArray(model) ? model[0] : model?.[1])?.trim() || 'Device';
  } else if (/Vivo|vivo|V[0-9]{4}/i.test(ua)) {
    result.deviceVendor = 'Vivo';
    const model = ua.match(/V[0-9]{4}[A-Z]*/i) || ua.match(/(?:Vivo|vivo)[;\s]*([^;)\s]+)/i);
    result.deviceModel = (Array.isArray(model) ? model[0] : model?.[1])?.trim() || 'Device';
  } else if (/OnePlus|ONEPLUS/i.test(ua)) {
    result.deviceVendor = 'OnePlus';
    const model = ua.match(/(?:OnePlus|ONEPLUS)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/Pixel/i.test(ua)) {
    result.deviceVendor = 'Google';
    const model = ua.match(/Pixel[^;)]*/i);
    result.deviceModel = model?.[0]?.trim() || 'Pixel';
  } else if (/Realme|realme|RMX/i.test(ua)) {
    result.deviceVendor = 'Realme';
    const model = ua.match(/RMX[0-9]+/i) || ua.match(/(?:Realme|realme)[;\s]*([^;)\s]+)/i);
    result.deviceModel = (Array.isArray(model) ? model[0] : model?.[1])?.trim() || 'Device';
  } else if (/Motorola|moto\s|XT[0-9]/i.test(ua)) {
    result.deviceVendor = 'Motorola';
    const model = ua.match(/moto\s*[^;)\s]*/i) || ua.match(/XT[0-9]+/i);
    result.deviceModel = model?.[0]?.trim() || 'Device';
  } else if (/Nokia/i.test(ua)) {
    result.deviceVendor = 'Nokia';
    const model = ua.match(/Nokia[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/LG[-\s]/i.test(ua)) {
    result.deviceVendor = 'LG';
    const model = ua.match(/LG[-;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/Sony|Xperia/i.test(ua)) {
    result.deviceVendor = 'Sony';
    const model = ua.match(/(?:Sony|Xperia)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Xperia';
  } else if (/ASUS|Asus/i.test(ua)) {
    result.deviceVendor = 'ASUS';
    const model = ua.match(/(?:ASUS|Asus)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/ZTE/i.test(ua)) {
    result.deviceVendor = 'ZTE';
    const model = ua.match(/ZTE[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/Tecno|TECNO/i.test(ua)) {
    result.deviceVendor = 'Tecno';
    const model = ua.match(/(?:Tecno|TECNO)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/Infinix|INFINIX/i.test(ua)) {
    result.deviceVendor = 'Infinix';
    const model = ua.match(/(?:Infinix|INFINIX)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/itel|ITEL/i.test(ua)) {
    result.deviceVendor = 'Itel';
    const model = ua.match(/(?:itel|ITEL)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/Honor|HONOR/i.test(ua)) {
    result.deviceVendor = 'Honor';
    const model = ua.match(/(?:Honor|HONOR)[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/Lenovo/i.test(ua)) {
    result.deviceVendor = 'Lenovo';
    const model = ua.match(/Lenovo[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
  } else if (/HTC/i.test(ua)) {
    result.deviceVendor = 'HTC';
    const model = ua.match(/HTC[;\s]*([^;)\s]+)/i);
    result.deviceModel = model?.[1]?.trim() || 'Device';
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
    // Try to extract model from Android user agent
    // Format: "Android X; MODEL Build/..." or "Android X; Build/..."
    const androidModel = ua.match(/;\s*([^;)]+?)\s*(?:Build|MIUI)/i);
    if (androidModel && androidModel[1]) {
      const modelName = androidModel[1].trim();
      // Filter out generic placeholders
      if (modelName !== 'K' && modelName !== 'wv' && modelName.length > 2 && !modelName.match(/^[A-Z]$/)) {
        // Try to identify vendor from model name
        if (/^SM-/.test(modelName)) {
          result.deviceVendor = 'Samsung';
          result.deviceModel = modelName;
        } else if (/^RMX/.test(modelName)) {
          result.deviceVendor = 'Realme';
          result.deviceModel = modelName;
        } else if (/^CPH/.test(modelName)) {
          result.deviceVendor = 'OPPO';
          result.deviceModel = modelName;
        } else if (/^V[0-9]{4}/.test(modelName)) {
          result.deviceVendor = 'Vivo';
          result.deviceModel = modelName;
        } else {
          result.deviceVendor = 'Android';
          result.deviceModel = modelName;
        }
      } else {
        result.deviceVendor = 'Android';
        result.deviceModel = 'Mobile';
      }
    } else {
      result.deviceVendor = 'Android';
      result.deviceModel = 'Mobile';
    }
  } else {
    // Final fallback based on OS
    result.deviceVendor = result.osName || 'Unknown';
    result.deviceModel = result.deviceType === 'mobile' ? 'Mobile' : result.deviceType === 'tablet' ? 'Tablet' : 'Device';
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
