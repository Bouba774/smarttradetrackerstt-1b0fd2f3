import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-nonce',
};

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

// Generate device fingerprint from available info
function generateFingerprint(deviceInfo: DeviceInfo, ip: string): string {
  const data = [
    deviceInfo.browserName || '',
    deviceInfo.osName || '',
    deviceInfo.screenWidth?.toString() || '',
    deviceInfo.screenHeight?.toString() || '',
    deviceInfo.language || '',
    deviceInfo.isMobile?.toString() || '',
  ].join('|');
  
  // Simple hash function for fingerprint
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user token for auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for security operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, deviceInfo, sessionId } = body;

    // Get client IP
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || 'unknown';

    // Validate nonce for sensitive actions (anti-replay)
    const nonce = req.headers.get('x-request-nonce');
    if (action !== 'check' && nonce) {
      const { data: nonceValid } = await supabaseAdmin.rpc('validate_request_nonce', {
        p_nonce: nonce,
        p_endpoint: `security-check/${action}`,
        p_user_id: user.id
      });

      if (!nonceValid) {
        console.log(`[security-check] Replay attack detected for user ${user.id}`);
        return new Response(
          JSON.stringify({ error: 'Invalid request' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    switch (action) {
      case 'track-session': {
        // Generate device fingerprint
        const fingerprint = deviceInfo?.fingerprint || generateFingerprint(deviceInfo || {}, clientIP);

        // Fetch geolocation
        let geoData: any = {};
        if (clientIP && clientIP !== 'unknown' && clientIP !== '127.0.0.1') {
          try {
            const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,countryCode,region,regionName,city,timezone,isp`);
            if (geoResponse.ok) {
              const geoJson = await geoResponse.json();
              if (geoJson.status === 'success') {
                geoData = {
                  country: geoJson.country,
                  countryCode: geoJson.countryCode,
                  region: geoJson.regionName || geoJson.region,
                  city: geoJson.city,
                  timezone: geoJson.timezone,
                  isp: geoJson.isp,
                };
              }
            }
          } catch (e) {
            console.error('Geo lookup error:', e);
          }
        }

        // Insert session
        const { data: session, error: sessionError } = await supabaseAdmin
          .from('user_sessions')
          .insert({
            user_id: user.id,
            browser_name: deviceInfo?.browserName,
            browser_version: deviceInfo?.browserVersion,
            os_name: deviceInfo?.osName,
            os_version: deviceInfo?.osVersion,
            device_type: deviceInfo?.deviceType,
            screen_width: deviceInfo?.screenWidth,
            screen_height: deviceInfo?.screenHeight,
            language: deviceInfo?.language,
            user_agent: deviceInfo?.userAgent,
            is_mobile: deviceInfo?.isMobile,
            ip_address: clientIP,
            ...geoData,
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Session insert error:', sessionError);
          return new Response(
            JSON.stringify({ error: 'Failed to track session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Detect anomalies
        const { data: anomalyResult } = await supabaseAdmin.rpc('detect_session_anomaly', {
          p_user_id: user.id,
          p_session_id: session.id,
          p_ip_address: clientIP,
          p_country: geoData.country || null,
          p_device_fingerprint: fingerprint
        });

        // Check if this is a trusted device, if not and no critical anomalies, add it
        const { data: trustedDevice } = await supabaseAdmin
          .from('trusted_devices')
          .select('id')
          .eq('user_id', user.id)
          .eq('device_fingerprint', fingerprint)
          .maybeSingle();

        if (!trustedDevice && fingerprint) {
          // Auto-trust first 3 devices
          const { count } = await supabaseAdmin
            .from('trusted_devices')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if ((count || 0) < 3) {
            await supabaseAdmin
              .from('trusted_devices')
              .insert({
                user_id: user.id,
                device_fingerprint: fingerprint,
                device_name: `${deviceInfo?.browserName || 'Unknown'} on ${deviceInfo?.osName || 'Unknown'}`,
                browser_name: deviceInfo?.browserName,
                os_name: deviceInfo?.osName,
                country: geoData.country,
                ip_address: clientIP,
              });
          }
        } else if (trustedDevice) {
          // Update last used
          await supabaseAdmin
            .from('trusted_devices')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', trustedDevice.id);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            sessionId: session.id,
            anomalies: anomalyResult,
            requiresVerification: anomalyResult?.count > 0 && anomalyResult?.anomalies?.some((a: any) => a.severity === 'critical')
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-anomalies': {
        const { data: anomalies } = await supabaseAdmin
          .from('session_anomalies')
          .select('*')
          .eq('user_id', user.id)
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(10);

        return new Response(
          JSON.stringify({ success: true, anomalies: anomalies || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'resolve-anomaly': {
        const { anomalyId } = body;
        
        if (!anomalyId) {
          return new Response(
            JSON.stringify({ error: 'Missing anomaly ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('session_anomalies')
          .update({ 
            resolved: true, 
            resolved_at: new Date().toISOString(),
            resolved_by: user.id 
          })
          .eq('id', anomalyId)
          .eq('user_id', user.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to resolve anomaly' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'trust-device': {
        const { fingerprint: fp, deviceName } = body;
        
        if (!fp) {
          return new Response(
            JSON.stringify({ error: 'Missing fingerprint' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('trusted_devices')
          .upsert({
            user_id: user.id,
            device_fingerprint: fp,
            device_name: deviceName || 'Trusted Device',
            is_trusted: true,
            last_used_at: new Date().toISOString()
          }, { onConflict: 'user_id,device_fingerprint' });

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to trust device' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'untrust-device': {
        const { deviceId } = body;
        
        if (!deviceId) {
          return new Response(
            JSON.stringify({ error: 'Missing device ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('trusted_devices')
          .delete()
          .eq('id', deviceId)
          .eq('user_id', user.id);

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Failed to remove device' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get-trusted-devices': {
        const { data: devices } = await supabaseAdmin
          .from('trusted_devices')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_trusted', true)
          .order('last_used_at', { ascending: false });

        return new Response(
          JSON.stringify({ success: true, devices: devices || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('[security-check] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
