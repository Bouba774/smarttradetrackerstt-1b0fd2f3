-- Table pour les tokens de confirmation de connexion
CREATE TABLE public.login_confirmation_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  CONSTRAINT token_not_expired CHECK (expires_at > created_at)
);

-- Index pour recherche rapide par token
CREATE INDEX idx_login_tokens_hash ON public.login_confirmation_tokens(token_hash);
CREATE INDEX idx_login_tokens_user_expires ON public.login_confirmation_tokens(user_id, expires_at);

-- Enable RLS
ALTER TABLE public.login_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Politique: Aucun accès direct - géré via edge functions avec service role
CREATE POLICY "No direct access to login tokens"
ON public.login_confirmation_tokens
FOR ALL
TO authenticated
USING (false);

-- Ajouter welcome_email_sent au profil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Fonction pour nettoyer les tokens expirés (appelée périodiquement)
CREATE OR REPLACE FUNCTION public.cleanup_expired_login_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.login_confirmation_tokens
  WHERE expires_at < now() OR used_at IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Fonction pour créer un token de connexion (appelée par edge function)
CREATE OR REPLACE FUNCTION public.create_login_token(
  p_user_id UUID,
  p_token_hash TEXT,
  p_expires_minutes INTEGER DEFAULT 15,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_token_id UUID;
BEGIN
  -- Invalider les anciens tokens non utilisés pour cet utilisateur
  UPDATE public.login_confirmation_tokens
  SET used_at = now()
  WHERE user_id = p_user_id AND used_at IS NULL;
  
  -- Créer le nouveau token
  INSERT INTO public.login_confirmation_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
  VALUES (p_user_id, p_token_hash, now() + (p_expires_minutes || ' minutes')::interval, p_ip_address, p_user_agent)
  RETURNING id INTO new_token_id;
  
  RETURN new_token_id;
END;
$$;

-- Fonction pour vérifier un token de connexion
CREATE OR REPLACE FUNCTION public.verify_login_token(
  p_token_hash TEXT
)
RETURNS TABLE(
  user_id UUID,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
BEGIN
  -- Chercher le token
  SELECT t.user_id, t.expires_at, t.used_at
  INTO v_token
  FROM public.login_confirmation_tokens t
  WHERE t.token_hash = p_token_hash;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Token invalide ou inexistant'::TEXT;
    RETURN;
  END IF;
  
  IF v_token.used_at IS NOT NULL THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Ce lien a déjà été utilisé'::TEXT;
    RETURN;
  END IF;
  
  IF v_token.expires_at < now() THEN
    RETURN QUERY SELECT NULL::UUID, false, 'Ce lien a expiré'::TEXT;
    RETURN;
  END IF;
  
  -- Marquer comme utilisé
  UPDATE public.login_confirmation_tokens
  SET used_at = now()
  WHERE token_hash = p_token_hash;
  
  RETURN QUERY SELECT v_token.user_id, true, NULL::TEXT;
END;
$$;

-- Fonction pour vérifier si un utilisateur a besoin de confirmer son email (ancien utilisateur)
CREATE OR REPLACE FUNCTION public.check_user_needs_email_confirmation(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_confirmed_at TIMESTAMP WITH TIME ZONE;
  v_profile_confirmed_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Vérifier dans auth.users
  SELECT email_confirmed_at INTO v_email_confirmed_at
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Si confirmé dans auth.users, c'est bon
  IF v_email_confirmed_at IS NOT NULL THEN
    RETURN false;
  END IF;
  
  -- Vérifier dans profiles (pour les anciens utilisateurs migrés)
  SELECT email_confirmed_at INTO v_profile_confirmed_at
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF v_profile_confirmed_at IS NOT NULL THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;