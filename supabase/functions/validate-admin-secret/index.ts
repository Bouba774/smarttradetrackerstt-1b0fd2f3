import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Secret admin attendu (stocké en dur pour le moment, pourrait être hashé en DB)
const ADMIN_SECRET = "Mouliom André";
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MINUTES = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier l'authentification
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

    // Vérifier si l'utilisateur est admin
    const { data: isAdminData, error: adminCheckError } = await supabaseAdmin.rpc("is_admin", {
      _user_id: user.id,
    });

    if (adminCheckError || !isAdminData) {
      return new Response(
        JSON.stringify({ error: "Accès refusé" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { secret } = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Vérifier si l'admin est bloqué
    const { data: isBlocked } = await supabaseAdmin.rpc("is_admin_blocked", {
      p_admin_id: user.id,
    });

    if (isBlocked) {
      // Journaliser la tentative bloquée
      await supabaseAdmin.from("admin_login_attempts").insert({
        admin_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: false,
      });

      return new Response(
        JSON.stringify({
          success: false,
          blocked: true,
          message: "Trop de tentatives. Veuillez réessayer plus tard.",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier le nombre d'échecs récents
    const { data: failureCount } = await supabaseAdmin.rpc("count_admin_failures", {
      p_admin_id: user.id,
    });

    const currentFailures = failureCount || 0;

    // Vérifier le secret
    const isValid = secret === ADMIN_SECRET;

    if (isValid) {
      // Succès - journaliser et réinitialiser les compteurs
      await supabaseAdmin.from("admin_login_attempts").insert({
        admin_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: true,
      });

      // Journaliser dans l'audit
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_id: user.id,
        action: "admin_login_success",
        ip_address: ipAddress,
        details: { user_agent: userAgent },
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Échec - journaliser
      const newFailureCount = currentFailures + 1;
      const shouldBlock = newFailureCount >= MAX_ATTEMPTS;
      const blockedUntil = shouldBlock
        ? new Date(Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000).toISOString()
        : null;

      await supabaseAdmin.from("admin_login_attempts").insert({
        admin_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
        success: false,
        blocked_until: blockedUntil,
      });

      // Journaliser dans l'audit
      await supabaseAdmin.from("admin_audit_logs").insert({
        admin_id: user.id,
        action: "admin_login_failed",
        ip_address: ipAddress,
        details: {
          user_agent: userAgent,
          attempt_number: newFailureCount,
          blocked: shouldBlock,
        },
      });

      const attemptsRemaining = MAX_ATTEMPTS - newFailureCount;

      return new Response(
        JSON.stringify({
          success: false,
          blocked: shouldBlock,
          attemptsRemaining: Math.max(0, attemptsRemaining),
          message: shouldBlock
            ? "Trop de tentatives. Veuillez réessayer plus tard."
            : `Mot de passe incorrect. ${attemptsRemaining} tentative(s) restante(s).`,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in validate-admin-secret:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
