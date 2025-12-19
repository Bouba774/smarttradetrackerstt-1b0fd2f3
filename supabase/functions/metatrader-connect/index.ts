import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectRequest {
  action: 'connect' | 'disconnect' | 'sync' | 'list';
  platform?: 'MT4' | 'MT5';
  accountName?: string;
  server?: string;
  login?: string;
  password?: string;
  initialBalance?: number;
  currency?: string;
  accountId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const METAAPI_TOKEN = Deno.env.get('METAAPI_TOKEN');
    if (!METAAPI_TOKEN) {
      console.error('METAAPI_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'MetaApi token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ConnectRequest = await req.json();
    const { action } = body;

    console.log(`MetaTrader action: ${action} for user: ${user.id}`);

    if (action === 'connect') {
      const { platform, accountName, server, login, password, initialBalance, currency } = body;
      
      if (!platform || !accountName || !server || !login || !password) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create account via MetaApi
      console.log(`Creating MetaApi account for ${login}@${server}`);
      
      const provisioningResponse = await fetch('https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts', {
        method: 'POST',
        headers: {
          'auth-token': METAAPI_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: accountName,
          type: 'cloud',
          platform: platform.toLowerCase(),
          login: login,
          password: password,
          server: server,
          magic: 0,
          copyFactoryRoles: [],
        }),
      });

      if (!provisioningResponse.ok) {
        const errorText = await provisioningResponse.text();
        console.error('MetaApi provisioning error:', provisioningResponse.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to connect to MetaTrader account',
            details: errorText 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const metaAccount = await provisioningResponse.json();
      console.log('MetaApi account created:', metaAccount.id);

      // Deploy the account
      await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${metaAccount.id}/deploy`, {
        method: 'POST',
        headers: {
          'auth-token': METAAPI_TOKEN,
        },
      });

      // Save to database
      const { data: mtAccount, error: insertError } = await supabase
        .from('mt_accounts')
        .insert({
          user_id: user.id,
          account_name: accountName,
          platform,
          server,
          login,
          initial_balance: initialBalance || 0,
          currency: currency || 'USD',
          metaapi_account_id: metaAccount.id,
          is_connected: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, account: mtAccount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'disconnect') {
      const { accountId } = body;
      
      if (!accountId) {
        return new Response(
          JSON.stringify({ error: 'Account ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the account first
      const { data: account } = await supabase
        .from('mt_accounts')
        .select('metaapi_account_id')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (account?.metaapi_account_id) {
        // Undeploy and remove from MetaApi
        await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${account.metaapi_account_id}/undeploy`, {
          method: 'POST',
          headers: { 'auth-token': METAAPI_TOKEN },
        });

        await fetch(`https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${account.metaapi_account_id}`, {
          method: 'DELETE',
          headers: { 'auth-token': METAAPI_TOKEN },
        });
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('mt_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to disconnect account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync') {
      const { accountId } = body;
      
      if (!accountId) {
        return new Response(
          JSON.stringify({ error: 'Account ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the account
      const { data: account, error: fetchError } = await supabase
        .from('mt_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !account) {
        return new Response(
          JSON.stringify({ error: 'Account not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!account.metaapi_account_id) {
        return new Response(
          JSON.stringify({ error: 'Account not connected to MetaApi' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Syncing trades for account ${account.metaapi_account_id}`);

      // Fetch history deals from MetaApi
      const historyResponse = await fetch(
        `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${account.metaapi_account_id}/history-deals/time/${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()}/${new Date().toISOString()}`,
        {
          headers: { 'auth-token': METAAPI_TOKEN },
        }
      );

      if (!historyResponse.ok) {
        const errorText = await historyResponse.text();
        console.error('MetaApi history error:', historyResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch trade history' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const deals = await historyResponse.json();
      console.log(`Fetched ${deals.length} deals`);

      // Process and insert trades
      const trades = [];
      for (const deal of deals) {
        if (deal.type === 'DEAL_TYPE_BUY' || deal.type === 'DEAL_TYPE_SELL') {
          const direction = deal.type === 'DEAL_TYPE_BUY' ? 'long' : 'short';
          let result: 'win' | 'loss' | 'breakeven' | 'pending' = 'pending';
          
          if (deal.profit !== undefined) {
            if (deal.profit > 0) result = 'win';
            else if (deal.profit < 0) result = 'loss';
            else result = 'breakeven';
          }

          trades.push({
            user_id: user.id,
            asset: deal.symbol,
            direction,
            entry_price: deal.price,
            exit_price: deal.price,
            lot_size: deal.volume,
            profit_loss: deal.profit,
            result,
            trade_date: deal.time,
            notes: `Imported from MetaTrader - Deal #${deal.id}`,
          });
        }
      }

      if (trades.length > 0) {
        const { error: insertError } = await supabase
          .from('trades')
          .upsert(trades, { onConflict: 'id' });

        if (insertError) {
          console.error('Trade insert error:', insertError);
        }
      }

      // Update last sync time
      await supabase
        .from('mt_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', accountId);

      return new Response(
        JSON.stringify({ success: true, tradesImported: trades.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'list') {
      const { data: accounts, error: listError } = await supabase
        .from('mt_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('List error:', listError);
        return new Response(
          JSON.stringify({ error: 'Failed to list accounts' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ accounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MetaTrader connect error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
