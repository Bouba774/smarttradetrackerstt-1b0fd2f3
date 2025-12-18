import { useMemo, useCallback } from 'react';

export interface DeviceInfo {
  deviceName: string;
  os: string;
  browser: string;
  fingerprint: string;
  timestamp: string;
}

const KNOWN_DEVICES_KEY = 'smart-trade-tracker-known-devices';

const getOS = (): string => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  if (/Win/.test(platform)) {
    if (/Windows NT 10/.test(userAgent)) return 'Windows 10/11';
    if (/Windows NT 6.3/.test(userAgent)) return 'Windows 8.1';
    if (/Windows NT 6.2/.test(userAgent)) return 'Windows 8';
    if (/Windows NT 6.1/.test(userAgent)) return 'Windows 7';
    return 'Windows';
  }
  if (/Mac/.test(platform)) {
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      const match = userAgent.match(/OS (\d+)_(\d+)/);
      if (match) return `iOS ${match[1]}.${match[2]}`;
      return 'iOS';
    }
    return 'macOS';
  }
  if (/Linux/.test(platform)) {
    if (/Android/.test(userAgent)) {
      const match = userAgent.match(/Android (\d+\.?\d*)/);
      if (match) return `Android ${match[1]}`;
      return 'Android';
    }
    return 'Linux';
  }
  if (/CrOS/.test(userAgent)) return 'Chrome OS';
  
  return 'Unknown OS';
};

const getBrowser = (): string => {
  const userAgent = navigator.userAgent;
  
  // Order matters - check more specific browsers first
  if (/Edg\//.test(userAgent)) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return match ? `Edge ${match[1]}` : 'Edge';
  }
  if (/OPR\/|Opera/.test(userAgent)) {
    const match = userAgent.match(/OPR\/(\d+)/);
    return match ? `Opera ${match[1]}` : 'Opera';
  }
  if (/SamsungBrowser/.test(userAgent)) {
    const match = userAgent.match(/SamsungBrowser\/(\d+)/);
    return match ? `Samsung Browser ${match[1]}` : 'Samsung Browser';
  }
  if (/Firefox\//.test(userAgent)) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return match ? `Firefox ${match[1]}` : 'Firefox';
  }
  if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return match ? `Chrome ${match[1]}` : 'Chrome';
  }
  if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) {
    const match = userAgent.match(/Version\/(\d+)/);
    return match ? `Safari ${match[1]}` : 'Safari';
  }
  
  return 'Unknown Browser';
};

const getDeviceName = (): string => {
  const userAgent = navigator.userAgent;
  
  // Mobile devices
  if (/iPhone/.test(userAgent)) {
    return 'iPhone';
  }
  if (/iPad/.test(userAgent)) {
    return 'iPad';
  }
  if (/Android/.test(userAgent)) {
    // Try to extract device model
    const match = userAgent.match(/;\s*([^;)]+)\s*Build/);
    if (match) {
      return match[1].trim();
    }
    if (/Mobile/.test(userAgent)) {
      return 'Android Phone';
    }
    return 'Android Tablet';
  }
  
  // Desktop
  const os = getOS();
  if (os.includes('Windows')) return 'PC Windows';
  if (os.includes('macOS')) return 'Mac';
  if (os.includes('Linux')) return 'PC Linux';
  if (os.includes('Chrome OS')) return 'Chromebook';
  
  return 'Unknown Device';
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

export const useDeviceInfo = (userId?: string) => {
  const deviceInfo: DeviceInfo = useMemo(() => ({
    deviceName: getDeviceName(),
    os: getOS(),
    browser: getBrowser(),
    fingerprint: generateFingerprint(),
    timestamp: new Date().toLocaleString(),
  }), []);

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
