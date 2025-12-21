import { useMemo, useCallback } from 'react';

export interface DeviceInfo {
  deviceName: string;
  deviceModel: string;
  deviceVendor: string;
  deviceType: string;
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  fingerprint: string;
  timestamp: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  isMobile: boolean;
}

const KNOWN_DEVICES_KEY = 'smart-trade-tracker-known-devices';

// Extended browser detection with more browsers
const getBrowserInfo = (): { name: string; version: string } => {
  const userAgent = navigator.userAgent;
  
  // Order matters - check more specific browsers first
  
  // Phoenix Browser
  if (/Phoenix/.test(userAgent)) {
    const match = userAgent.match(/Phoenix\/(\d+\.?\d*)/);
    return { name: 'Phoenix', version: match?.[1] || '' };
  }
  
  // DuckDuckGo Browser
  if (/DuckDuckGo/.test(userAgent)) {
    const match = userAgent.match(/DuckDuckGo\/(\d+)/);
    return { name: 'DuckDuckGo', version: match?.[1] || '' };
  }
  
  // Brave Browser (check before Chrome)
  if ((navigator as any).brave?.isBrave) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'Brave', version: match?.[1] || '' };
  }
  
  // Vivaldi
  if (/Vivaldi/.test(userAgent)) {
    const match = userAgent.match(/Vivaldi\/(\d+\.?\d*)/);
    return { name: 'Vivaldi', version: match?.[1] || '' };
  }
  
  // Yandex Browser
  if (/YaBrowser/.test(userAgent)) {
    const match = userAgent.match(/YaBrowser\/(\d+\.?\d*)/);
    return { name: 'Yandex', version: match?.[1] || '' };
  }
  
  // UC Browser
  if (/UCBrowser|UCWEB/.test(userAgent)) {
    const match = userAgent.match(/UCBrowser\/(\d+\.?\d*)/);
    return { name: 'UC Browser', version: match?.[1] || '' };
  }
  
  // Puffin
  if (/Puffin/.test(userAgent)) {
    const match = userAgent.match(/Puffin\/(\d+\.?\d*)/);
    return { name: 'Puffin', version: match?.[1] || '' };
  }
  
  // Whale Browser
  if (/Whale/.test(userAgent)) {
    const match = userAgent.match(/Whale\/(\d+\.?\d*)/);
    return { name: 'Whale', version: match?.[1] || '' };
  }
  
  // QQ Browser
  if (/QQBrowser/.test(userAgent)) {
    const match = userAgent.match(/QQBrowser\/(\d+\.?\d*)/);
    return { name: 'QQ Browser', version: match?.[1] || '' };
  }
  
  // Kiwi Browser
  if (/Kiwi/.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'Kiwi', version: match?.[1] || '' };
  }
  
  // Mi Browser
  if (/MiuiBrowser/.test(userAgent)) {
    const match = userAgent.match(/MiuiBrowser\/(\d+\.?\d*)/);
    return { name: 'Mi Browser', version: match?.[1] || '' };
  }
  
  // Huawei Browser
  if (/HuaweiBrowser/.test(userAgent)) {
    const match = userAgent.match(/HuaweiBrowser\/(\d+\.?\d*)/);
    return { name: 'Huawei Browser', version: match?.[1] || '' };
  }
  
  // Edge
  if (/Edg\//.test(userAgent)) {
    const match = userAgent.match(/Edg\/(\d+\.?\d*)/);
    return { name: 'Edge', version: match?.[1] || '' };
  }
  
  // Opera / Opera GX
  if (/OPR\/|Opera/.test(userAgent)) {
    const match = userAgent.match(/OPR\/(\d+\.?\d*)/);
    const isGX = /Opera GX/.test(userAgent);
    return { name: isGX ? 'Opera GX' : 'Opera', version: match?.[1] || '' };
  }
  
  // Samsung Internet
  if (/SamsungBrowser/.test(userAgent)) {
    const match = userAgent.match(/SamsungBrowser\/(\d+\.?\d*)/);
    return { name: 'Samsung Internet', version: match?.[1] || '' };
  }
  
  // Firefox / Firefox Focus
  if (/Firefox\//.test(userAgent)) {
    const match = userAgent.match(/Firefox\/(\d+\.?\d*)/);
    const isFocus = /Focus/.test(userAgent);
    return { name: isFocus ? 'Firefox Focus' : 'Firefox', version: match?.[1] || '' };
  }
  
  // Chrome
  if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+\.?\d*)/);
    return { name: 'Chrome', version: match?.[1] || '' };
  }
  
  // Safari
  if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) {
    const match = userAgent.match(/Version\/(\d+\.?\d*)/);
    return { name: 'Safari', version: match?.[1] || '' };
  }
  
  // WebView
  if (/wv\)/.test(userAgent)) {
    return { name: 'WebView', version: '' };
  }
  
  return { name: 'Unknown', version: '' };
};

// Extended OS detection with version
const getOSInfo = (): { name: string; version: string } => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // iOS
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    const match = userAgent.match(/OS (\d+)_(\d+)(?:_(\d+))?/);
    if (match) {
      return { name: 'iOS', version: `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}` };
    }
    return { name: 'iOS', version: '' };
  }
  
  // Android
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android (\d+\.?\d*\.?\d*)/);
    return { name: 'Android', version: match?.[1] || '' };
  }
  
  // Windows
  if (/Win/.test(platform)) {
    if (/Windows NT 10\.0/.test(userAgent)) {
      // Windows 10 or 11 - can't reliably distinguish
      return { name: 'Windows', version: '10/11' };
    }
    if (/Windows NT 6\.3/.test(userAgent)) return { name: 'Windows', version: '8.1' };
    if (/Windows NT 6\.2/.test(userAgent)) return { name: 'Windows', version: '8' };
    if (/Windows NT 6\.1/.test(userAgent)) return { name: 'Windows', version: '7' };
    if (/Windows NT 6\.0/.test(userAgent)) return { name: 'Windows', version: 'Vista' };
    if (/Windows NT 5\.1/.test(userAgent)) return { name: 'Windows', version: 'XP' };
    return { name: 'Windows', version: '' };
  }
  
  // macOS
  if (/Mac/.test(platform) && !/iPhone|iPad|iPod/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X (\d+)[._](\d+)(?:[._](\d+))?/);
    if (match) {
      return { name: 'macOS', version: `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}` };
    }
    return { name: 'macOS', version: '' };
  }
  
  // Linux
  if (/Linux/.test(platform) && !/Android/.test(userAgent)) {
    if (/Ubuntu/.test(userAgent)) return { name: 'Ubuntu', version: '' };
    if (/Fedora/.test(userAgent)) return { name: 'Fedora', version: '' };
    if (/Debian/.test(userAgent)) return { name: 'Debian', version: '' };
    return { name: 'Linux', version: '' };
  }
  
  // Chrome OS
  if (/CrOS/.test(userAgent)) {
    const match = userAgent.match(/CrOS \w+ (\d+\.?\d*)/);
    return { name: 'Chrome OS', version: match?.[1] || '' };
  }
  
  return { name: 'Unknown', version: '' };
};

// Mobile device vendor and model detection
const getDeviceDetails = (): { vendor: string; model: string; name: string; type: string } => {
  const userAgent = navigator.userAgent;
  
  // iPhone models
  if (/iPhone/.test(userAgent)) {
    return { vendor: 'Apple', model: 'iPhone', name: 'iPhone', type: 'mobile' };
  }
  
  // iPad models
  if (/iPad/.test(userAgent)) {
    return { vendor: 'Apple', model: 'iPad', name: 'iPad', type: 'tablet' };
  }
  
  // Android devices - extract vendor and model
  if (/Android/.test(userAgent)) {
    const isMobile = /Mobile/.test(userAgent);
    const type = isMobile ? 'mobile' : 'tablet';
    
    // Extract device info from user agent
    // Pattern: ; <Vendor> <Model> Build/ or ; <Model> Build/
    const buildMatch = userAgent.match(/;\s*([^;)]+)\s*Build/i);
    
    if (buildMatch) {
      const deviceString = buildMatch[1].trim();
      
      // Known vendor prefixes
      const vendors: { [key: string]: string } = {
        'SM-': 'Samsung',
        'Galaxy': 'Samsung',
        'SAMSUNG': 'Samsung',
        'Infinix': 'Infinix',
        'TECNO': 'Tecno',
        'itel': 'Itel',
        'ITEL': 'Itel',
        'Redmi': 'Xiaomi',
        'Mi ': 'Xiaomi',
        'POCO': 'Xiaomi',
        'M2': 'Xiaomi',
        'Pixel': 'Google',
        'HUAWEI': 'Huawei',
        'VOG-': 'Huawei',
        'ELE-': 'Huawei',
        'MAR-': 'Huawei',
        'STK-': 'Huawei',
        'OPPO': 'Oppo',
        'CPH': 'Oppo',
        'RMX': 'Realme',
        'realme': 'Realme',
        'vivo': 'Vivo',
        'V2': 'Vivo',
        'OnePlus': 'OnePlus',
        'LE2': 'OnePlus',
        'IN2': 'OnePlus',
        'Nokia': 'Nokia',
        'TA-': 'Nokia',
        'Motorola': 'Motorola',
        'moto': 'Motorola',
        'LG-': 'LG',
        'LM-': 'LG',
        'Sony': 'Sony',
        'Xperia': 'Sony',
        'ASUS': 'Asus',
        'ZS': 'Asus',
        'Lenovo': 'Lenovo',
        'ZTE': 'ZTE',
        'HTC': 'HTC',
      };
      
      let vendor = '';
      let model = deviceString;
      
      for (const [prefix, vendorName] of Object.entries(vendors)) {
        if (deviceString.includes(prefix)) {
          vendor = vendorName;
          break;
        }
      }
      
      // Generate friendly device name
      let name = deviceString;
      
      // Map common model numbers to friendly names
      const friendlyNames: { [key: string]: string } = {
        'X6528': 'Infinix HOT 40i',
        'X6831': 'Infinix HOT 40 Pro',
        'X6711': 'Infinix Smart 8',
        'X6515': 'Infinix HOT 30i',
        'X669': 'Infinix HOT 20',
        'SM-A546': 'Galaxy A54',
        'SM-A536': 'Galaxy A53',
        'SM-A346': 'Galaxy A34',
        'SM-A236': 'Galaxy A23',
        'SM-A146': 'Galaxy A14',
        'SM-A047': 'Galaxy A04s',
        'SM-S918': 'Galaxy S23 Ultra',
        'SM-S916': 'Galaxy S23+',
        'SM-S911': 'Galaxy S23',
        'SM-G998': 'Galaxy S21 Ultra',
        'Redmi Note 12': 'Redmi Note 12',
        'Redmi Note 11': 'Redmi Note 11',
        'Redmi 12': 'Redmi 12',
        'POCO X5': 'POCO X5',
        'Pixel 8': 'Pixel 8',
        'Pixel 7': 'Pixel 7',
        'Pixel 6': 'Pixel 6',
      };
      
      for (const [modelNum, friendly] of Object.entries(friendlyNames)) {
        if (deviceString.includes(modelNum)) {
          name = friendly;
          break;
        }
      }
      
      // If vendor found, try to clean up the model
      if (vendor && model.startsWith(vendor)) {
        model = model.replace(vendor, '').trim();
      }
      
      return { vendor, model, name: name || `${vendor} ${model}`.trim(), type };
    }
    
    return { vendor: '', model: '', name: isMobile ? 'Android Phone' : 'Android Tablet', type };
  }
  
  // Desktop devices
  const osInfo = getOSInfo();
  if (osInfo.name.includes('Windows')) {
    return { vendor: '', model: '', name: 'PC Windows', type: 'desktop' };
  }
  if (osInfo.name.includes('macOS')) {
    return { vendor: 'Apple', model: 'Mac', name: 'Mac', type: 'desktop' };
  }
  if (osInfo.name.includes('Linux')) {
    return { vendor: '', model: '', name: 'PC Linux', type: 'desktop' };
  }
  if (osInfo.name.includes('Chrome OS')) {
    return { vendor: '', model: '', name: 'Chromebook', type: 'desktop' };
  }
  
  return { vendor: '', model: '', name: 'Unknown Device', type: 'unknown' };
};

const generateFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
    (navigator as any).deviceMemory || 'unknown',
  ];
  
  const str = components.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

const isMobileDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

export const useDeviceInfo = (userId?: string) => {
  const deviceInfo: DeviceInfo = useMemo(() => {
    const browserInfo = getBrowserInfo();
    const osInfo = getOSInfo();
    const deviceDetails = getDeviceDetails();
    
    return {
      deviceName: deviceDetails.name,
      deviceModel: deviceDetails.model,
      deviceVendor: deviceDetails.vendor,
      deviceType: deviceDetails.type,
      os: osInfo.name,
      osVersion: osInfo.version,
      browser: browserInfo.name,
      browserVersion: browserInfo.version,
      fingerprint: generateFingerprint(),
      timestamp: new Date().toLocaleString(),
      screenWidth: screen.width,
      screenHeight: screen.height,
      language: navigator.language,
      isMobile: isMobileDevice(),
    };
  }, []);

  const getKnownDevices = useCallback((): string[] => {
    if (!userId) return [];
    try {
      const saved = localStorage.getItem(`${KNOWN_DEVICES_KEY}-${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [userId]);

  const saveKnownDevice = useCallback((fingerprint: string) => {
    if (!userId) return;
    const known = getKnownDevices();
    if (!known.includes(fingerprint)) {
      const updated = [...known, fingerprint].slice(-10); // Keep last 10 devices
      localStorage.setItem(`${KNOWN_DEVICES_KEY}-${userId}`, JSON.stringify(updated));
    }
  }, [userId, getKnownDevices]);

  const isNewDevice = useCallback((): boolean => {
    if (!userId) return false;
    const known = getKnownDevices();
    return !known.includes(deviceInfo.fingerprint);
  }, [userId, getKnownDevices, deviceInfo.fingerprint]);

  const clearKnownDevices = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`${KNOWN_DEVICES_KEY}-${userId}`);
    }
  }, [userId]);

  return {
    deviceInfo,
    isNewDevice,
    saveKnownDevice,
    getKnownDevices,
    clearKnownDevices,
  };
};

export default useDeviceInfo;
