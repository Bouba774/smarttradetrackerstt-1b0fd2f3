-- Table pour journaliser les tentatives de connexion admin
CREATE TABLE public.admin_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX idx_admin_login_attempts_admin_id ON public.admin_login_attempts(admin_id);
CREATE INDEX idx_admin_login_attempts_attempt_at ON public.admin_login_attempts(attempt_at DESC);

-- Enable RLS
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les logs
CREATE POLICY "Admins can view login attempts"
ON public.admin_login_attempts
FOR SELECT
USING (is_admin(auth.uid()));

-- Table pour stocker le secret admin (hashé)
CREATE TABLE public.admin_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    secret_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;

-- Aucun accès direct - géré via edge functions
CREATE POLICY "No direct access to admin secrets"
ON public.admin_secrets
FOR ALL
USING (false)
WITH CHECK (false);

-- Table pour l'audit des actions admin
CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent voir les logs d'audit
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (is_admin(auth.uid()));

-- Fonction pour vérifier si un admin est bloqué
CREATE OR REPLACE FUNCTION public.is_admin_blocked(p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_blocked_until TIMESTAMP WITH TIME ZONE;
    v_recent_failures INTEGER;
BEGIN
    -- Vérifier s'il y a un blocage actif
    SELECT blocked_until INTO v_blocked_until
    FROM admin_login_attempts
    WHERE admin_id = p_admin_id
    AND blocked_until IS NOT NULL
    AND blocked_until > now()
    ORDER BY attempt_at DESC
    LIMIT 1;
    
    IF v_blocked_until IS NOT NULL THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

-- Fonction pour compter les échecs récents
CREATE OR REPLACE FUNCTION public.count_admin_failures(p_admin_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
    v_last_success TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Trouver la dernière connexion réussie
    SELECT MAX(attempt_at) INTO v_last_success
    FROM admin_login_attempts
    WHERE admin_id = p_admin_id AND success = true;
    
    -- Compter les échecs depuis la dernière réussite (ou tous si jamais de réussite)
    SELECT COUNT(*) INTO v_count
    FROM admin_login_attempts
    WHERE admin_id = p_admin_id 
    AND success = false
    AND (v_last_success IS NULL OR attempt_at > v_last_success);
    
    RETURN COALESCE(v_count, 0);
END;
$$;