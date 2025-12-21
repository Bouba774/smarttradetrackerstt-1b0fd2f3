-- ================================================
-- SECURITY ENHANCEMENT: Anti-attack + Anomaly Detection + GDPR
-- ================================================

-- 1. Table pour la détection d'anomalies de session
CREATE TABLE IF NOT EXISTS public.session_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.user_sessions(id),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('new_device', 'new_ip', 'new_country', 'suspicious_activity', 'concurrent_sessions', 'impossible_travel')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table pour les tokens de requête anti-replay
CREATE TABLE IF NOT EXISTS public.request_nonces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  user_id UUID,
  endpoint TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Index pour nettoyer les nonces expirés
CREATE INDEX IF NOT EXISTS idx_request_nonces_expires ON public.request_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_request_nonces_nonce ON public.request_nonces(nonce);

-- 3. Table pour le consentement RGPD
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'marketing', 'analytics', 'cookies')),
  granted BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, consent_type)
);

-- 4. Table pour les demandes RGPD (export/suppression)
CREATE TABLE IF NOT EXISTS public.gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'rectification', 'access')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'rejected')) DEFAULT 'pending',
  reason TEXT,
  data_export_url TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table pour le registre des traitements RGPD
CREATE TABLE IF NOT EXISTS public.data_processing_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  processing_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_interest', 'legitimate_interests')),
  data_categories TEXT[] NOT NULL,
  recipients TEXT[],
  retention_period TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Table pour les appareils de confiance
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser_name TEXT,
  os_name TEXT,
  country TEXT,
  ip_address TEXT,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_trusted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS on all new tables
ALTER TABLE public.session_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processing_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for session_anomalies (users see their own, admins see all)
CREATE POLICY "Users can view their own anomalies"
  ON public.session_anomalies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all anomalies"
  ON public.session_anomalies FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert anomalies"
  ON public.session_anomalies FOR INSERT
  WITH CHECK (true);

-- RLS Policies for request_nonces (system only via service role)
CREATE POLICY "No direct access to nonces"
  ON public.request_nonces FOR ALL
  USING (false);

-- RLS Policies for user_consents
CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for gdpr_requests
CREATE POLICY "Users can view their own GDPR requests"
  ON public.gdpr_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create GDPR requests"
  ON public.gdpr_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all GDPR requests"
  ON public.gdpr_requests FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update GDPR requests"
  ON public.gdpr_requests FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- RLS Policies for data_processing_registry (public read)
CREATE POLICY "Anyone can view processing registry"
  ON public.data_processing_registry FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage processing registry"
  ON public.data_processing_registry FOR ALL
  USING (public.is_admin(auth.uid()));

-- RLS Policies for trusted_devices
CREATE POLICY "Users can view their own devices"
  ON public.trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own devices"
  ON public.trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices"
  ON public.trusted_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices"
  ON public.trusted_devices FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================
-- SECURITY FUNCTIONS
-- ================================================

-- Function to validate and consume a nonce (anti-replay)
CREATE OR REPLACE FUNCTION public.validate_request_nonce(
  p_nonce TEXT,
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if nonce exists and is not expired
  SELECT EXISTS (
    SELECT 1 FROM public.request_nonces
    WHERE nonce = p_nonce
    AND expires_at > now()
  ) INTO v_exists;
  
  -- If nonce exists, it's a replay attack
  IF v_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Insert the nonce to mark it as used
  INSERT INTO public.request_nonces (nonce, user_id, endpoint)
  VALUES (p_nonce, p_user_id, p_endpoint);
  
  -- Clean up expired nonces (async-like, runs every call)
  DELETE FROM public.request_nonces WHERE expires_at < now();
  
  RETURN TRUE;
END;
$$;

-- Function to detect session anomalies
CREATE OR REPLACE FUNCTION public.detect_session_anomaly(
  p_user_id UUID,
  p_session_id UUID,
  p_ip_address TEXT,
  p_country TEXT,
  p_device_fingerprint TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anomalies JSONB := '[]'::JSONB;
  v_last_session RECORD;
  v_known_device BOOLEAN;
  v_known_country BOOLEAN;
  v_concurrent_sessions INTEGER;
BEGIN
  -- Get last session info
  SELECT * INTO v_last_session
  FROM public.user_sessions
  WHERE user_id = p_user_id
  AND id != p_session_id
  ORDER BY session_start DESC
  LIMIT 1;
  
  -- Check if device is known
  SELECT EXISTS (
    SELECT 1 FROM public.trusted_devices
    WHERE user_id = p_user_id
    AND device_fingerprint = p_device_fingerprint
    AND is_trusted = true
  ) INTO v_known_device;
  
  -- Check if country is known
  SELECT EXISTS (
    SELECT 1 FROM public.user_sessions
    WHERE user_id = p_user_id
    AND country = p_country
    AND session_start > now() - interval '30 days'
  ) INTO v_known_country;
  
  -- Count concurrent active sessions
  SELECT COUNT(*) INTO v_concurrent_sessions
  FROM public.user_sessions
  WHERE user_id = p_user_id
  AND session_end IS NULL
  AND session_start > now() - interval '24 hours';
  
  -- New device detection
  IF NOT v_known_device AND p_device_fingerprint IS NOT NULL THEN
    v_anomalies := v_anomalies || jsonb_build_object(
      'type', 'new_device',
      'severity', 'medium',
      'details', jsonb_build_object('device_fingerprint', p_device_fingerprint)
    );
    
    INSERT INTO public.session_anomalies (user_id, session_id, anomaly_type, severity, details)
    VALUES (p_user_id, p_session_id, 'new_device', 'medium', 
      jsonb_build_object('device_fingerprint', p_device_fingerprint));
  END IF;
  
  -- New country detection
  IF NOT v_known_country AND p_country IS NOT NULL THEN
    v_anomalies := v_anomalies || jsonb_build_object(
      'type', 'new_country',
      'severity', 'high',
      'details', jsonb_build_object('country', p_country)
    );
    
    INSERT INTO public.session_anomalies (user_id, session_id, anomaly_type, severity, details)
    VALUES (p_user_id, p_session_id, 'new_country', 'high', 
      jsonb_build_object('country', p_country));
  END IF;
  
  -- Impossible travel detection (if last session was in different country within 2 hours)
  IF v_last_session IS NOT NULL 
    AND v_last_session.country IS NOT NULL 
    AND p_country IS NOT NULL
    AND v_last_session.country != p_country
    AND v_last_session.session_start > now() - interval '2 hours' THEN
    
    v_anomalies := v_anomalies || jsonb_build_object(
      'type', 'impossible_travel',
      'severity', 'critical',
      'details', jsonb_build_object(
        'previous_country', v_last_session.country,
        'current_country', p_country,
        'time_diff_minutes', EXTRACT(EPOCH FROM (now() - v_last_session.session_start)) / 60
      )
    );
    
    INSERT INTO public.session_anomalies (user_id, session_id, anomaly_type, severity, details)
    VALUES (p_user_id, p_session_id, 'impossible_travel', 'critical', 
      jsonb_build_object(
        'previous_country', v_last_session.country,
        'current_country', p_country
      ));
  END IF;
  
  -- Concurrent sessions detection (more than 3)
  IF v_concurrent_sessions > 3 THEN
    v_anomalies := v_anomalies || jsonb_build_object(
      'type', 'concurrent_sessions',
      'severity', 'medium',
      'details', jsonb_build_object('count', v_concurrent_sessions)
    );
    
    INSERT INTO public.session_anomalies (user_id, session_id, anomaly_type, severity, details)
    VALUES (p_user_id, p_session_id, 'concurrent_sessions', 'medium', 
      jsonb_build_object('count', v_concurrent_sessions));
  END IF;
  
  RETURN jsonb_build_object('anomalies', v_anomalies, 'count', jsonb_array_length(v_anomalies));
END;
$$;

-- Function to export user data (GDPR)
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Verify caller is the user or an admin
  IF auth.uid() != p_user_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT jsonb_build_object(
    'profile', (SELECT row_to_json(p.*) FROM public.profiles p WHERE p.user_id = p_user_id),
    'settings', (SELECT row_to_json(s.*) FROM public.user_settings s WHERE s.user_id = p_user_id),
    'trades', (SELECT jsonb_agg(row_to_json(t.*)) FROM public.trades t WHERE t.user_id = p_user_id),
    'journal_entries', (SELECT jsonb_agg(row_to_json(j.*)) FROM public.journal_entries j WHERE j.user_id = p_user_id),
    'challenges', (SELECT jsonb_agg(row_to_json(c.*)) FROM public.user_challenges c WHERE c.user_id = p_user_id),
    'sessions', (
      SELECT jsonb_agg(jsonb_build_object(
        'session_start', s.session_start,
        'session_end', s.session_end,
        'country', s.country,
        'device_type', s.device_type,
        'browser_name', s.browser_name
      ))
      FROM public.user_sessions s 
      WHERE s.user_id = p_user_id
    ),
    'consents', (SELECT jsonb_agg(row_to_json(c.*)) FROM public.user_consents c WHERE c.user_id = p_user_id),
    'exported_at', now(),
    'export_format_version', '1.0'
  ) INTO v_result;
  
  -- Log the export in GDPR requests
  INSERT INTO public.gdpr_requests (user_id, request_type, status, processed_at)
  VALUES (p_user_id, 'export', 'completed', now());
  
  RETURN v_result;
END;
$$;

-- Function to request account deletion (GDPR)
CREATE OR REPLACE FUNCTION public.request_account_deletion(
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Create deletion request
  INSERT INTO public.gdpr_requests (user_id, request_type, reason, status)
  VALUES (v_user_id, 'deletion', p_reason, 'pending')
  RETURNING id INTO v_request_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'message', 'Your deletion request has been submitted. It will be processed within 30 days.'
  );
END;
$$;

-- Function to get unresolved anomalies count for a user
CREATE OR REPLACE FUNCTION public.get_user_anomalies_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.session_anomalies
  WHERE user_id = p_user_id
  AND resolved = false
  AND created_at > now() - interval '7 days';
$$;

-- Insert default data processing registry entries
INSERT INTO public.data_processing_registry (processing_name, purpose, legal_basis, data_categories, recipients, retention_period)
VALUES 
  ('User Authentication', 'Account creation and secure access', 'contract', ARRAY['email', 'password_hash', 'session_data'], ARRAY['Internal systems'], '5 years after last activity'),
  ('Trade Tracking', 'Core service functionality', 'contract', ARRAY['trade_data', 'performance_metrics'], ARRAY['Internal systems'], '10 years (tax purposes)'),
  ('Analytics', 'Service improvement', 'legitimate_interests', ARRAY['usage_patterns', 'device_info'], ARRAY['Internal systems'], '2 years'),
  ('Security Monitoring', 'Fraud prevention and security', 'legitimate_interests', ARRAY['ip_address', 'session_data', 'device_fingerprint'], ARRAY['Internal systems'], '1 year')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_anomalies_user ON public.session_anomalies(user_id, resolved);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON public.trusted_devices(user_id, is_trusted);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user ON public.gdpr_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents(user_id);