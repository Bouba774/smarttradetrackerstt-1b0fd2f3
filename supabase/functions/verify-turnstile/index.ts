import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Get allowed origins from environment or use defaults
const getAllowedOrigin = (origin: string): string => {
  const allowedOrigins = [
    'https://sfdudueswogeusuofbbi.lovableproject.com',
    'https://91e24412-c7c2-4228-b362-70375a18844d.lovableproject.com',
    'https://smarttradetracker.lovable.app',
    'https://smarttradetrackerstt.lovable.app',
    'https://smarttradetracker.app',
    'https://www.smarttradetracker.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  return 'https://sfdudueswogeusuofbbi.lovableproject.com';
};

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(origin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      console.error('No token provided');
      return new Response(
        JSON.stringify({ success: false, error: 'Token is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Turnstile not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the token with Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const verifyResult = await verifyResponse.json();
    console.log('Turnstile verification result:', verifyResult);

    if (verifyResult.success) {
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification failed',
          'error-codes': verifyResult['error-codes']
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
