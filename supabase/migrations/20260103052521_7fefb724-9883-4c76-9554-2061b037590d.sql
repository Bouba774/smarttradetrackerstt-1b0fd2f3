-- ================================================
-- GDPR: IP Retention Policy + Signed Export URLs
-- ================================================

-- 1. Create a bucket for GDPR exports with private access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gdpr-exports', 'gdpr-exports', false, 52428800, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies for GDPR exports bucket
CREATE POLICY "Users can view their own GDPR exports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gdpr-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "System can upload GDPR exports"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gdpr-exports');

CREATE POLICY "Users can delete their own GDPR exports"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gdpr-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Function to clean old IP history (GDPR retention policy - 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_ip_history(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_ip_history
  WHERE last_seen_at < (now() - (retention_days || ' days')::INTERVAL);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Also clean old connection logs
  DELETE FROM public.connection_logs
  WHERE created_at < (now() - (retention_days || ' days')::INTERVAL);
  
  -- Clean old session data (keep active sessions)
  DELETE FROM public.user_sessions
  WHERE session_end IS NOT NULL 
  AND session_end < (now() - (retention_days || ' days')::INTERVAL);
  
  RETURN deleted_count;
END;
$$;

-- 4. Function to schedule cleanup (called via edge function cron)
CREATE OR REPLACE FUNCTION public.scheduled_gdpr_cleanup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ip_deleted INTEGER;
  exports_deleted INTEGER;
  requests_updated INTEGER;
BEGIN
  -- Clean IP history older than 90 days
  SELECT public.cleanup_old_ip_history(90) INTO ip_deleted;
  
  -- Clean expired GDPR export files (older than 7 days)
  DELETE FROM storage.objects
  WHERE bucket_id = 'gdpr-exports'
  AND created_at < (now() - INTERVAL '7 days');
  GET DIAGNOSTICS exports_deleted = ROW_COUNT;
  
  -- Update completed deletion requests that are past grace period
  UPDATE public.gdpr_requests
  SET status = 'ready_for_deletion'
  WHERE request_type = 'deletion'
  AND status = 'pending'
  AND created_at < (now() - INTERVAL '30 days');
  GET DIAGNOSTICS requests_updated = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'ip_records_deleted', ip_deleted,
    'exports_deleted', exports_deleted,
    'deletion_requests_updated', requests_updated,
    'executed_at', now()
  );
END;
$$;

-- 5. Add columns for export expiration tracking
ALTER TABLE public.gdpr_requests 
ADD COLUMN IF NOT EXISTS export_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- 6. Update export_user_data function to include expiration info
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_profile JSONB;
  v_settings JSONB;
  v_trades JSONB;
  v_journal JSONB;
  v_challenges JSONB;
  v_sessions JSONB;
  v_consents JSONB;
BEGIN
  -- Collect profile data
  SELECT to_jsonb(p.*) INTO v_profile
  FROM public.profiles p
  WHERE p.user_id = p_user_id;
  
  -- Collect settings
  SELECT to_jsonb(s.*) INTO v_settings
  FROM public.user_settings s
  WHERE s.user_id = p_user_id;
  
  -- Collect trades
  SELECT COALESCE(jsonb_agg(t.*), '[]'::jsonb) INTO v_trades
  FROM public.trades t
  WHERE t.user_id = p_user_id;
  
  -- Collect journal entries
  SELECT COALESCE(jsonb_agg(j.*), '[]'::jsonb) INTO v_journal
  FROM public.journal_entries j
  WHERE j.user_id = p_user_id;
  
  -- Collect challenges
  SELECT COALESCE(jsonb_agg(c.*), '[]'::jsonb) INTO v_challenges
  FROM public.user_challenges c
  WHERE c.user_id = p_user_id;
  
  -- Collect sessions (masked for privacy)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'session_start', s.session_start,
      'session_end', s.session_end,
      'country', s.country,
      'device_type', s.device_type,
      'browser_name', s.browser_name
    )
  ), '[]'::jsonb) INTO v_sessions
  FROM public.user_sessions s
  WHERE s.user_id = p_user_id;
  
  -- Collect consents
  SELECT COALESCE(jsonb_agg(c.*), '[]'::jsonb) INTO v_consents
  FROM public.user_consents c
  WHERE c.user_id = p_user_id;
  
  -- Build final result
  v_result := jsonb_build_object(
    'profile', COALESCE(v_profile, '{}'::jsonb),
    'settings', COALESCE(v_settings, '{}'::jsonb),
    'trades', v_trades,
    'journal_entries', v_journal,
    'challenges', v_challenges,
    'sessions', v_sessions,
    'consents', v_consents,
    'exported_at', now(),
    'export_format_version', '2.0',
    'data_retention_notice', 'This export link expires in 24 hours'
  );
  
  -- Log the export in GDPR requests with expiration
  INSERT INTO public.gdpr_requests (
    user_id, 
    request_type, 
    status, 
    processed_at,
    export_expires_at
  )
  VALUES (
    p_user_id, 
    'export', 
    'completed', 
    now(),
    now() + INTERVAL '24 hours'
  );
  
  RETURN v_result;
END;
$$;