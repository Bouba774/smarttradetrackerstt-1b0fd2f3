import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";

interface DeviceInfo {
  browserName?: string;
  browserVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceType?: string;
  deviceVendor?: string;
  deviceModel?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  userAgent?: string;
  isMobile?: boolean;
}

interface GeoData {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  timezone?: string;
  isp?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get authorization header and extract token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create admin client for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('User error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const deviceInfo: DeviceInfo = body.deviceInfo || {};

    console.log(`Tracking session for user: ${user.id}`);

    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip') 
      || req.headers.get('x-real-ip')
      || 'unknown';

    console.log(`Client IP: ${clientIP}`);

    // Fetch geolocation data from free API
    let geoData: GeoData = {};
    
    if (clientIP && clientIP !== 'unknown' && clientIP !== '127.0.0.1') {
      try {
        // Using ip-api.com (free, no API key required, 45 requests/min limit)
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,message,country,countryCode,region,regionName,city,timezone,isp`);
        
        if (geoResponse.ok) {
          const geoJson = await geoResponse.json();
          console.log('Geo response:', JSON.stringify(geoJson));
          
          if (geoJson.status === 'success') {
            geoData = {
              country: geoJson.country,
              countryCode: geoJson.countryCode,
              region: geoJson.regionName || geoJson.region,
              city: geoJson.city,
              timezone: geoJson.timezone,
              isp: geoJson.isp,
            };
          } else {
            console.log('Geo lookup failed:', geoJson.message);
          }
        }
      } catch (geoError) {
        console.error('Geolocation fetch error:', geoError);
        // Continue without geo data
      }
    }

    // Insert session record
    const { data: session, error: insertError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        browser_name: deviceInfo.browserName,
        browser_version: deviceInfo.browserVersion,
        os_name: deviceInfo.osName,
        os_version: deviceInfo.osVersion,
        device_type: deviceInfo.deviceType,
        device_vendor: deviceInfo.deviceVendor,
        device_model: deviceInfo.deviceModel,
        screen_width: deviceInfo.screenWidth,
        screen_height: deviceInfo.screenHeight,
        language: deviceInfo.language,
        user_agent: deviceInfo.userAgent,
        is_mobile: deviceInfo.isMobile,
        ip_address: clientIP,
        country: geoData.country,
        country_code: geoData.countryCode,
        region: geoData.region,
        city: geoData.city,
        timezone: geoData.timezone,
        isp: geoData.isp,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Session created successfully: ${session.id}`);

    return new Response(
      JSON.stringify({ success: true, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
