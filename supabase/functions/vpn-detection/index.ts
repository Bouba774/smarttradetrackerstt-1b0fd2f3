import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Risk scoring configuration
const RISK_SCORES = {
  VPN_DETECTED: 40,
  PROXY_DETECTED: 30,
  TOR_DETECTED: 60,
  HOSTING_ASN: 25,
  TIMEZONE_MISMATCH: 15,
  LANGUAGE_MISMATCH: 10,
  SHARED_IP: 20,
  RAPID_IP_CHANGE: 15,
};

// Risk level thresholds
const RISK_LEVELS = {
  LOW: { min: 0, max: 20 },
  MEDIUM: { min: 21, max: 50 },
  HIGH: { min: 51, max: 75 },
  CRITICAL: { min: 76, max: 100 },
};

// Known datacenter/hosting ASN patterns
const HOSTING_ASN_PATTERNS = [
  'amazon', 'aws', 'google', 'microsoft', 'azure', 'digitalocean',
  'linode', 'vultr', 'ovh', 'hetzner', 'cloudflare', 'oracle',
  'alibaba', 'tencent', 'datacenter', 'hosting', 'server', 'vps',
  'dedicated', 'colocation', 'colo'
];

// Country to timezone mapping (simplified)
const COUNTRY_TIMEZONES: Record<string, string[]> = {
  'US': ['America/', 'Pacific/', 'US/'],
  'CA': ['America/', 'Canada/'],
  'GB': ['Europe/London', 'GMT', 'BST'],
  'DE': ['Europe/Berlin', 'CET', 'CEST'],
  'FR': ['Europe/Paris', 'CET', 'CEST'],
  'ES': ['Europe/Madrid', 'CET', 'CEST'],
  'IT': ['Europe/Rome', 'CET', 'CEST'],
  'JP': ['Asia/Tokyo', 'JST'],
  'CN': ['Asia/Shanghai', 'Asia/Hong_Kong', 'CST'],
  'AU': ['Australia/', 'AEST', 'AEDT'],
  'BR': ['America/Sao_Paulo', 'BRT'],
  'IN': ['Asia/Kolkata', 'IST'],
  'RU': ['Europe/Moscow', 'Asia/'],
  'KR': ['Asia/Seoul', 'KST'],
  'NL': ['Europe/Amsterdam', 'CET', 'CEST'],
  'BE': ['Europe/Brussels', 'CET', 'CEST'],
  'CH': ['Europe/Zurich', 'CET', 'CEST'],
  'AT': ['Europe/Vienna', 'CET', 'CEST'],
  'PL': ['Europe/Warsaw', 'CET', 'CEST'],
  'SE': ['Europe/Stockholm', 'CET', 'CEST'],
  'NO': ['Europe/Oslo', 'CET', 'CEST'],
  'DK': ['Europe/Copenhagen', 'CET', 'CEST'],
  'FI': ['Europe/Helsinki', 'EET', 'EEST'],
  'PT': ['Europe/Lisbon', 'WET', 'WEST'],
  'IE': ['Europe/Dublin', 'GMT', 'IST'],
  'NZ': ['Pacific/Auckland', 'NZST', 'NZDT'],
  'SG': ['Asia/Singapore', 'SGT'],
  'HK': ['Asia/Hong_Kong', 'HKT'],
  'AE': ['Asia/Dubai', 'GST'],
  'ZA': ['Africa/Johannesburg', 'SAST'],
  'MX': ['America/Mexico_City', 'CST', 'CDT'],
  'AR': ['America/Argentina/', 'ART'],
};

// Country to primary languages mapping
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  'US': ['en'],
  'CA': ['en', 'fr'],
  'GB': ['en'],
  'DE': ['de'],
  'FR': ['fr'],
  'ES': ['es'],
  'IT': ['it'],
  'JP': ['ja'],
  'CN': ['zh'],
  'AU': ['en'],
  'BR': ['pt'],
  'IN': ['en', 'hi'],
  'RU': ['ru'],
  'KR': ['ko'],
  'NL': ['nl'],
  'BE': ['nl', 'fr', 'de'],
  'CH': ['de', 'fr', 'it'],
  'AT': ['de'],
  'PL': ['pl'],
  'SE': ['sv'],
  'NO': ['no', 'nb', 'nn'],
  'DK': ['da'],
  'FI': ['fi', 'sv'],
  'PT': ['pt'],
  'IE': ['en', 'ga'],
  'NZ': ['en'],
  'SG': ['en', 'zh', 'ms', 'ta'],
  'HK': ['zh', 'en'],
  'AE': ['ar', 'en'],
  'ZA': ['en', 'af', 'zu'],
  'MX': ['es'],
  'AR': ['es'],
};

interface ClientEnvironment {
  timezone: string;
  language: string;
  platform: string;
  screenResolution: string;
  userAgent: string;
}

interface IPInfoResponse {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
  asn?: {
    asn: string;
    name: string;
    domain: string;
    route: string;
    type: string;
  };
  privacy?: {
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    relay: boolean;
    hosting: boolean;
    service: string;
  };
}

interface IPApiResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  proxy: boolean;
  hosting: boolean;
  mobile: boolean;
}

interface DetectionResult {
  success: boolean;
  riskScore: number;
  riskLevel: string;
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
    country: string;
    countryCode: string;
    city: string;
    region: string;
    isp: string;
    asn: string;
    organization: string;
  };
}

function getRiskLevel(score: number): string {
  if (score <= RISK_LEVELS.LOW.max) return 'low';
  if (score <= RISK_LEVELS.MEDIUM.max) return 'medium';
  if (score <= RISK_LEVELS.HIGH.max) return 'high';
  return 'critical';
}

function checkTimezoneMismatch(countryCode: string, clientTimezone: string): boolean {
  if (!countryCode || !clientTimezone) return false;
  
  const expectedTimezones = COUNTRY_TIMEZONES[countryCode.toUpperCase()];
  if (!expectedTimezones) return false;
  
  return !expectedTimezones.some(tz => 
    clientTimezone.toLowerCase().includes(tz.toLowerCase()) ||
    tz.toLowerCase().includes(clientTimezone.toLowerCase())
  );
}

function checkLanguageMismatch(countryCode: string, clientLanguage: string): boolean {
  if (!countryCode || !clientLanguage) return false;
  
  const expectedLanguages = COUNTRY_LANGUAGES[countryCode.toUpperCase()];
  if (!expectedLanguages) return false;
  
  const langCode = clientLanguage.split('-')[0].toLowerCase();
  return !expectedLanguages.includes(langCode);
}

function isHostingASN(org: string, asn: string): boolean {
  const combined = `${org} ${asn}`.toLowerCase();
  return HOSTING_ASN_PATTERNS.some(pattern => combined.includes(pattern));
}

async function fetchIPInfoPrimary(ip: string): Promise<Partial<IPInfoResponse> | null> {
  try {
    // Using ip-api.com as primary (free, no key required, includes proxy/hosting detection)
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!response.ok) return null;
    
    const data: IPApiResponse = await response.json();
    
    if (data.status !== 'success') return null;
    
    // Convert to unified format
    return {
      ip,
      city: data.city,
      region: data.regionName,
      country: data.countryCode,
      org: data.org,
      timezone: data.timezone,
      privacy: {
        vpn: false, // ip-api doesn't detect VPN specifically
        proxy: data.proxy,
        tor: false,
        relay: false,
        hosting: data.hosting,
        service: ''
      },
      asn: {
        asn: data.as?.split(' ')[0] || '',
        name: data.isp,
        domain: '',
        route: '',
        type: data.hosting ? 'hosting' : (data.mobile ? 'isp' : 'business')
      }
    };
  } catch (error) {
    console.error('Primary IP API error:', error);
    return null;
  }
}

async function fetchIPInfoFallback(ip: string): Promise<Partial<IPInfoResponse> | null> {
  try {
    // Fallback to ipwho.is (free, no key required)
    const response = await fetch(
      `https://ipwho.is/${ip}`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (!data.success) return null;
    
    return {
      ip,
      city: data.city,
      region: data.region,
      country: data.country_code,
      org: data.connection?.org,
      timezone: data.timezone?.id,
      asn: {
        asn: data.connection?.asn?.toString() || '',
        name: data.connection?.isp || '',
        domain: data.connection?.domain || '',
        route: '',
        type: data.type || ''
      }
    };
  } catch (error) {
    console.error('Fallback IP API error:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { 
      clientEnvironment,
      sessionId,
      isAdminAccess = false
    }: {
      clientEnvironment: ClientEnvironment;
      sessionId?: string;
      isAdminAccess?: boolean;
    } = body;

    console.log(`[VPN Detection] Starting for user ${user.id}, admin access: ${isAdminAccess}`);

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';

    console.log(`[VPN Detection] Client IP: ${clientIP}`);

    // Skip detection for local/private IPs
    const isPrivateIP = clientIP === 'unknown' || 
                        clientIP.startsWith('192.168.') ||
                        clientIP.startsWith('10.') ||
                        clientIP.startsWith('172.') ||
                        clientIP === '127.0.0.1' ||
                        clientIP === 'localhost';

    let ipInfo: Partial<IPInfoResponse> | null = null;
    
    if (!isPrivateIP) {
      // Try primary API first, then fallback
      ipInfo = await fetchIPInfoPrimary(clientIP);
      if (!ipInfo) {
        console.log('[VPN Detection] Primary API failed, trying fallback');
        ipInfo = await fetchIPInfoFallback(clientIP);
      }
    }

    // Initialize detection result
    const riskFactors: string[] = [];
    let riskScore = 0;
    let vpnDetected = false;
    let proxyDetected = false;
    let torDetected = false;
    let hostingDetected = false;
    let timezoneMismatch = false;
    let languageMismatch = false;

    if (ipInfo) {
      // Check privacy flags from API
      if (ipInfo.privacy?.vpn) {
        vpnDetected = true;
        riskScore += RISK_SCORES.VPN_DETECTED;
        riskFactors.push('VPN connection detected');
      }

      if (ipInfo.privacy?.proxy) {
        proxyDetected = true;
        riskScore += RISK_SCORES.PROXY_DETECTED;
        riskFactors.push('Proxy connection detected');
      }

      if (ipInfo.privacy?.tor) {
        torDetected = true;
        riskScore += RISK_SCORES.TOR_DETECTED;
        riskFactors.push('Tor network detected');
      }

      if (ipInfo.privacy?.hosting) {
        hostingDetected = true;
        riskScore += RISK_SCORES.HOSTING_ASN;
        riskFactors.push('Connection from hosting/datacenter');
      }

      // Check ASN for hosting patterns if not already detected
      if (!hostingDetected && ipInfo.asn) {
        if (isHostingASN(ipInfo.org || '', ipInfo.asn.name || '')) {
          hostingDetected = true;
          riskScore += RISK_SCORES.HOSTING_ASN;
          riskFactors.push('ASN associated with datacenter/hosting');
        }
      }

      // Check timezone coherence
      if (clientEnvironment?.timezone && ipInfo.country) {
        timezoneMismatch = checkTimezoneMismatch(ipInfo.country, clientEnvironment.timezone);
        if (timezoneMismatch) {
          riskScore += RISK_SCORES.TIMEZONE_MISMATCH;
          riskFactors.push('Timezone does not match IP location');
        }
      }

      // Check language coherence
      if (clientEnvironment?.language && ipInfo.country) {
        languageMismatch = checkLanguageMismatch(ipInfo.country, clientEnvironment.language);
        if (languageMismatch) {
          riskScore += RISK_SCORES.LANGUAGE_MISMATCH;
          riskFactors.push('Browser language does not match IP location');
        }
      }
    }

    // Check for rapid IP changes
    const { data: recentIPCount } = await supabase.rpc('count_recent_ips', {
      p_user_id: user.id,
      p_minutes: 30
    });

    if (recentIPCount && recentIPCount >= 3) {
      riskScore += RISK_SCORES.RAPID_IP_CHANGE;
      riskFactors.push(`Rapid IP changes detected (${recentIPCount} IPs in 30 min)`);
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Determine risk level
    const riskLevel = getRiskLevel(riskScore);
    const connectionMasked = vpnDetected || proxyDetected || torDetected || hostingDetected;

    // Get user role
    const { data: userRole } = await supabase.rpc('get_user_role_for_security', {
      p_user_id: user.id
    });

    const role = userRole || 'user';

    // Determine action to take
    let actionTaken = 'ALLOWED';

    if (isAdminAccess && role === 'admin') {
      if (connectionMasked) {
        if (riskLevel === 'critical' || torDetected) {
          actionTaken = 'ADMIN_BLOCKED';
        } else if (riskLevel === 'high') {
          actionTaken = 'MFA_REQUIRED';
        } else {
          actionTaken = 'ADMIN_WARNING';
        }
      }
    } else if (riskLevel === 'critical') {
      actionTaken = 'RESTRICTED';
    } else if (riskLevel === 'high' && connectionMasked) {
      actionTaken = 'MONITORED';
    }

    console.log(`[VPN Detection] Risk: ${riskScore} (${riskLevel}), Masked: ${connectionMasked}, Action: ${actionTaken}`);

    // Log the connection
    const { error: logError } = await supabase
      .from('connection_logs')
      .insert({
        user_id: user.id,
        session_id: sessionId || null,
        ip_address: clientIP,
        country: ipInfo?.country ? undefined : null, // We don't store country name to avoid geolocation
        country_code: ipInfo?.country,
        city: null, // We don't store city for GDPR compliance
        region: null, // We don't store region for GDPR compliance
        isp: ipInfo?.asn?.name,
        asn: ipInfo?.asn?.asn,
        organization: ipInfo?.org,
        vpn_detected: vpnDetected,
        proxy_detected: proxyDetected,
        tor_detected: torDetected,
        hosting_detected: hostingDetected,
        connection_masked: connectionMasked,
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        client_timezone: clientEnvironment?.timezone,
        client_language: clientEnvironment?.language,
        client_platform: clientEnvironment?.platform,
        client_screen_resolution: clientEnvironment?.screenResolution,
        user_agent: clientEnvironment?.userAgent,
        timezone_mismatch: timezoneMismatch,
        language_mismatch: languageMismatch,
        user_role: role,
        action_taken: actionTaken,
        is_admin_access: isAdminAccess,
        detection_source: 'ip-api',
        raw_detection_data: ipInfo as any
      });

    if (logError) {
      console.error('[VPN Detection] Failed to log connection:', logError);
    }

    // Update IP history
    if (!isPrivateIP) {
      await supabase
        .from('user_ip_history')
        .upsert({
          user_id: user.id,
          ip_address: clientIP,
          country_code: ipInfo?.country,
          last_seen_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,ip_address'
        });
    }

    const result: DetectionResult = {
      success: true,
      riskScore,
      riskLevel,
      riskFactors,
      vpnDetected,
      proxyDetected,
      torDetected,
      hostingDetected,
      connectionMasked,
      timezoneMismatch,
      languageMismatch,
      actionTaken,
      ipInfo: {
        country: '', // Don't expose for privacy
        countryCode: ipInfo?.country || '',
        city: '', // Don't expose for privacy
        region: '', // Don't expose for privacy
        isp: ipInfo?.asn?.name || '',
        asn: ipInfo?.asn?.asn || '',
        organization: ipInfo?.org || ''
      }
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[VPN Detection] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Detection failed',
        success: false,
        riskScore: 0,
        riskLevel: 'low',
        riskFactors: [],
        vpnDetected: false,
        proxyDetected: false,
        torDetected: false,
        hostingDetected: false,
        connectionMasked: false,
        actionTaken: 'ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
