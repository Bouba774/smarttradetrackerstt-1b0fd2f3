import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface MTTradeData {
  ticket: number;
  symbol: string;
  type: number; // 0=BUY, 1=SELL
  lots: number;
  openPrice: number;
  closePrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit?: number;
  openTime: string;
  closeTime?: string;
  comment?: string;
  magic?: number;
  accountNumber: string;
  action: 'open' | 'close' | 'modify' | 'sync';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user token from header (set in EA configuration)
    const userToken = req.headers.get('x-user-token');
    
    if (!userToken) {
      console.error('Missing user token');
      return new Response(
        JSON.stringify({ error: 'Missing user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate user token (it should be the user's ID from the app)
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userToken)
      .single();

    if (userError || !userData) {
      console.error('Invalid user token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user_id;
    const body = await req.json();
    
    console.log('Received trade data:', JSON.stringify(body));

    // Handle single trade or array of trades
    const trades: MTTradeData[] = Array.isArray(body) ? body : [body];
    
    const results = [];
    
    for (const trade of trades) {
      const { 
        ticket, 
        symbol, 
        type, 
        lots, 
        openPrice, 
        closePrice, 
        stopLoss, 
        takeProfit, 
        profit, 
        openTime, 
        closeTime, 
        comment,
        action 
      } = trade;

      // Determine direction based on MT order type
      const direction = type === 0 ? 'long' : 'short';
      
      // Determine result based on profit
      let result = null;
      if (closePrice !== undefined && profit !== undefined) {
        result = profit > 0 ? 'win' : profit < 0 ? 'loss' : 'breakeven';
      }

      // Parse dates
      const tradeDate = new Date(openTime).toISOString().split('T')[0];
      const exitTimestamp = closeTime ? new Date(closeTime).toISOString() : null;

      // Calculate duration if trade is closed
      let durationSeconds = null;
      if (closeTime && openTime) {
        durationSeconds = Math.floor((new Date(closeTime).getTime() - new Date(openTime).getTime()) / 1000);
      }

      // Check if trade already exists (by ticket number in notes)
      const { data: existingTrade } = await supabase
        .from('trades')
        .select('id')
        .eq('user_id', userId)
        .ilike('notes', `%MT Ticket: ${ticket}%`)
        .single();

      if (existingTrade && (action === 'close' || action === 'modify' || action === 'sync')) {
        // Update existing trade
        const { error: updateError } = await supabase
          .from('trades')
          .update({
            exit_price: closePrice,
            exit_timestamp: exitTimestamp,
            profit_loss: profit,
            result: result,
            stop_loss: stopLoss,
            take_profit: takeProfit,
            duration_seconds: durationSeconds,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingTrade.id);

        if (updateError) {
          console.error('Error updating trade:', updateError);
          results.push({ ticket, status: 'error', message: updateError.message });
        } else {
          console.log('Trade updated:', ticket);
          results.push({ ticket, status: 'updated' });
        }
      } else if (!existingTrade && (action === 'open' || action === 'sync')) {
        // Insert new trade
        const { error: insertError } = await supabase
          .from('trades')
          .insert({
            user_id: userId,
            asset: symbol,
            direction: direction,
            entry_price: openPrice,
            exit_price: closePrice || null,
            exit_timestamp: exitTimestamp,
            lot_size: lots,
            stop_loss: stopLoss || null,
            take_profit: takeProfit || null,
            profit_loss: profit || null,
            result: result,
            trade_date: tradeDate,
            duration_seconds: durationSeconds,
            notes: `MT Ticket: ${ticket}${comment ? ` | ${comment}` : ''}`,
            setup: 'MetaTrader Import',
          });

        if (insertError) {
          console.error('Error inserting trade:', insertError);
          results.push({ ticket, status: 'error', message: insertError.message });
        } else {
          console.log('Trade inserted:', ticket);
          results.push({ ticket, status: 'inserted' });
        }
      } else {
        results.push({ ticket, status: 'skipped', message: 'Trade already exists or invalid action' });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in mt-trade-webhook:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
