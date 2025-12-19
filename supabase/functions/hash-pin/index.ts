import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PBKDF2 implementation for secure PIN hashing
async function hashPinSecure(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  const saltData = encoder.encode(salt);
  
  // Import the PIN as a key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    pinData,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  // Derive bits using PBKDF2 with 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltData,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  
  // Convert to hex string
  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return hashHex;
}

// Generate a random salt
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pin, action, existingHash, existingSalt } = await req.json();
    
    if (!pin || typeof pin !== 'string') {
      console.error('Invalid PIN provided');
      return new Response(
        JSON.stringify({ error: 'PIN is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      console.error('Invalid PIN format');
      return new Response(
        JSON.stringify({ error: 'PIN must be 4-6 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'verify') {
      // Verify an existing PIN
      if (!existingHash || !existingSalt) {
        console.error('Missing hash or salt for verification');
        return new Response(
          JSON.stringify({ error: 'Hash and salt required for verification' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const computedHash = await hashPinSecure(pin, existingSalt);
      const isValid = computedHash === existingHash;
      
      console.log(`PIN verification attempt: ${isValid ? 'success' : 'failed'}`);
      
      return new Response(
        JSON.stringify({ valid: isValid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Create a new hash (for setup or change)
      const salt = generateSalt();
      const hash = await hashPinSecure(pin, salt);
      
      console.log('New PIN hash created successfully');
      
      return new Response(
        JSON.stringify({ hash, salt }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in hash-pin function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
