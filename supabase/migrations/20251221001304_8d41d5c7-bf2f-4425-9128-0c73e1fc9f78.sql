-- Ajouter une fonction pour hacher et vérifier le secret admin
-- Le secret sera stocké hashé dans admin_secrets

-- Fonction pour initialiser le secret admin (à appeler une seule fois)
-- Hash du secret "Mouliom André" sera inséré

-- Créer une fonction sécurisée pour vérifier le secret admin
CREATE OR REPLACE FUNCTION public.verify_admin_secret(p_admin_id UUID, p_secret TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash TEXT;
  v_computed_hash TEXT;
BEGIN
  -- Récupérer le hash stocké pour cet admin
  SELECT secret_hash INTO v_stored_hash
  FROM public.admin_secrets
  WHERE admin_id = p_admin_id;
  
  -- Si pas de secret configuré, vérifier le secret global
  IF v_stored_hash IS NULL THEN
    SELECT secret_hash INTO v_stored_hash
    FROM public.admin_secrets
    LIMIT 1;
  END IF;
  
  IF v_stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Comparer le hash du secret fourni avec le hash stocké
  -- Utilise encode/digest pour le hachage SHA-256
  v_computed_hash := encode(digest(p_secret, 'sha256'), 'hex');
  
  RETURN v_stored_hash = v_computed_hash;
END;
$$;

-- Insérer le hash initial du secret admin "Mouliom André"
-- Hash SHA-256 de "Mouliom André"
INSERT INTO public.admin_secrets (admin_id, secret_hash)
SELECT 
  (SELECT user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1),
  encode(digest('Mouliom André', 'sha256'), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM public.admin_secrets LIMIT 1)
ON CONFLICT DO NOTHING;

-- Créer une fonction pour journaliser les accès admin aux données utilisateur
CREATE OR REPLACE FUNCTION public.log_admin_data_access(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_audit_logs (
    admin_id,
    target_user_id,
    action,
    ip_address,
    details
  ) VALUES (
    p_admin_id,
    p_target_user_id,
    p_action,
    p_ip_address,
    jsonb_build_object('table', p_table_name, 'timestamp', now())
  );
END;
$$;