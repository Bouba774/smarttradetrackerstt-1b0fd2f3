-- Table pour les logs de connexion avec détection VPN/Proxy/Tor
CREATE TABLE public.connection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
  
  -- IP and geo data
  ip_address TEXT,
  country TEXT,
  country_code TEXT,
  city TEXT,
  region TEXT,
  isp TEXT,
  asn TEXT,
  organization TEXT,
  
  -- Privacy detection
  vpn_detected BOOLEAN DEFAULT false,
  proxy_detected BOOLEAN DEFAULT false,
  tor_detected BOOLEAN DEFAULT false,
  hosting_detected BOOLEAN DEFAULT false,
  connection_masked BOOLEAN DEFAULT false,
  
  -- Risk analysis
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  
  -- Client environment (for coherence analysis)
  client_timezone TEXT,
  client_language TEXT,
  client_platform TEXT,
  client_screen_resolution TEXT,
  user_agent TEXT,
  
  -- Coherence flags
  timezone_mismatch BOOLEAN DEFAULT false,
  language_mismatch BOOLEAN DEFAULT false,
  
  -- User context
  user_role TEXT DEFAULT 'user',
  action_taken TEXT,
  is_admin_access BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Metadata
  detection_source TEXT DEFAULT 'ipinfo',
  raw_detection_data JSONB
);

-- Enable RLS
ALTER TABLE public.connection_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view connection logs
CREATE POLICY "Admins can view all connection logs"
ON public.connection_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- System can insert logs (via service role)
CREATE POLICY "System can insert connection logs"
ON public.connection_logs
FOR INSERT
WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_connection_logs_user_id ON public.connection_logs(user_id);
CREATE INDEX idx_connection_logs_created_at ON public.connection_logs(created_at DESC);
CREATE INDEX idx_connection_logs_risk_level ON public.connection_logs(risk_level);
CREATE INDEX idx_connection_logs_vpn ON public.connection_logs(vpn_detected) WHERE vpn_detected = true;

-- Table for tracking rapid IP changes per user
CREATE TABLE public.user_ip_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  country_code TEXT,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  times_seen INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.user_ip_history ENABLE ROW LEVEL SECURITY;

-- Only system can manage IP history
CREATE POLICY "System can manage IP history"
ON public.user_ip_history
FOR ALL
USING (true)
WITH CHECK (true);

-- Unique constraint
CREATE UNIQUE INDEX idx_user_ip_unique ON public.user_ip_history(user_id, ip_address);
CREATE INDEX idx_user_ip_history_user ON public.user_ip_history(user_id);

-- Function to check for rapid IP changes (returns count of unique IPs in last X minutes)
CREATE OR REPLACE FUNCTION public.count_recent_ips(
  p_user_id UUID,
  p_minutes INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT ip_address)
    FROM public.connection_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - (p_minutes || ' minutes')::interval
  );
END;
$$;

-- Function to detect if user is admin
CREATE OR REPLACE FUNCTION public.get_user_role_for_security(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'moderator' THEN 2 
      ELSE 3 
    END
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'user');
END;
$$;