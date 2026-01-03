-- =====================================================
-- SECURITY FIX: Résoudre les problèmes de sécurité identifiés
-- =====================================================

-- 1. Supprimer la fonction existante get_own_pin_status
DROP FUNCTION IF EXISTS public.get_own_pin_status();

-- 2. Recréer la fonction avec la même signature
CREATE OR REPLACE FUNCTION public.get_own_pin_status()
RETURNS TABLE (
    user_id uuid,
    has_pin boolean,
    pin_length integer,
    biometric_enabled boolean,
    max_attempts integer,
    wipe_on_max_attempts boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        sc.user_id,
        (sc.pin_hash IS NOT NULL) as has_pin,
        COALESCE(sc.pin_length, 4) as pin_length,
        COALESCE(sc.biometric_enabled, false) as biometric_enabled,
        COALESCE(sc.max_attempts, 5) as max_attempts,
        COALESCE(sc.wipe_on_max_attempts, false) as wipe_on_max_attempts
    FROM public.secure_credentials sc
    WHERE sc.user_id = auth.uid();
$$;

-- 3. USER_IP_HISTORY: Fonction pour permettre aux utilisateurs de demander la suppression RGPD
CREATE OR REPLACE FUNCTION public.request_ip_history_deletion()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_deleted_count integer;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Not authenticated');
    END IF;
    
    SELECT COUNT(*) INTO v_deleted_count 
    FROM public.user_ip_history 
    WHERE user_id = v_user_id;
    
    DELETE FROM public.user_ip_history WHERE user_id = v_user_id;
    
    INSERT INTO public.gdpr_requests (user_id, request_type, status, reason, processed_at)
    VALUES (v_user_id, 'ip_history_deletion', 'completed', 'User requested IP history deletion', now());
    
    RETURN json_build_object(
        'success', true, 
        'deleted_count', v_deleted_count,
        'message', 'IP history deleted successfully'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_ip_history_deletion() TO authenticated;