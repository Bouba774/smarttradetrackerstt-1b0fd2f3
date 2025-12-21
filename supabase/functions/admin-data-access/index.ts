import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Types de données accessibles par les admins
type DataType = 'trades' | 'profile' | 'journal' | 'challenges' | 'settings' | 'sessions';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Vérifier l'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Vérifier STRICTEMENT le rôle admin
    const { data: isAdminData } = await supabaseAdmin.rpc("is_admin", {
      _user_id: user.id,
    });

    if (!isAdminData) {
      console.log("[admin-data-access] Unauthorized access attempt by:", user.id);
      return new Response(
        JSON.stringify({ error: "Accès refusé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parser la requête
    const { targetUserId, dataType, action = 'read' } = await req.json();

    // Validation des paramètres
    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(
        JSON.stringify({ error: "ID utilisateur manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!dataType || !['trades', 'profile', 'journal', 'challenges', 'settings', 'sessions'].includes(dataType)) {
      return new Response(
        JSON.stringify({ error: "Type de données invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Valider le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(targetUserId)) {
      return new Response(
        JSON.stringify({ error: "Format ID invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Seule l'action 'read' est autorisée pour les admins
    if (action !== 'read') {
      console.log("[admin-data-access] Write attempt blocked for admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Action non autorisée" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Extraire l'IP pour l'audit
    const ipAddress = req.headers.get("x-forwarded-for")?.split(',')[0]?.trim() 
      || req.headers.get("cf-connecting-ip") 
      || "unknown";

    // 7. Journaliser l'accès AVANT de récupérer les données
    await supabaseAdmin.rpc("log_admin_data_access", {
      p_admin_id: user.id,
      p_target_user_id: targetUserId,
      p_action: `view_${dataType}`,
      p_table_name: dataType,
      p_ip_address: ipAddress,
    });

    // 8. Récupérer les données selon le type
    let data: unknown = null;
    let error: unknown = null;

    switch (dataType as DataType) {
      case 'trades':
        const tradesResult = await supabaseAdmin
          .from('trades')
          .select('*')
          .eq('user_id', targetUserId)
          .order('trade_date', { ascending: false });
        data = tradesResult.data;
        error = tradesResult.error;
        break;

      case 'profile':
        const profileResult = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();
        data = profileResult.data;
        error = profileResult.error;
        break;

      case 'journal':
        const journalResult = await supabaseAdmin
          .from('journal_entries')
          .select('*')
          .eq('user_id', targetUserId)
          .order('entry_date', { ascending: false });
        data = journalResult.data;
        error = journalResult.error;
        break;

      case 'challenges':
        const challengesResult = await supabaseAdmin
          .from('user_challenges')
          .select('*')
          .eq('user_id', targetUserId);
        data = challengesResult.data;
        error = challengesResult.error;
        break;

      case 'settings':
        const settingsResult = await supabaseAdmin
          .from('user_settings')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();
        // Exclure les données sensibles (PIN, etc.)
        if (settingsResult.data) {
          const { pin_hash, pin_salt, ...safeSettings } = settingsResult.data;
          data = safeSettings;
        }
        error = settingsResult.error;
        break;

      case 'sessions':
        const sessionsResult = await supabaseAdmin
          .from('user_sessions')
          .select('*')
          .eq('user_id', targetUserId)
          .order('session_start', { ascending: false })
          .limit(50);
        data = sessionsResult.data;
        error = sessionsResult.error;
        break;
    }

    if (error) {
      console.error("[admin-data-access] Database error:", error);
      return new Response(
        JSON.stringify({ error: "Erreur de récupération" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[admin-data-access] Admin ${user.id} accessed ${dataType} for user ${targetUserId}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[admin-data-access] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
