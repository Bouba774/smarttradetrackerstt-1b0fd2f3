-- Create rate_limit_attempts table for anti-bruteforce protection
CREATE TABLE public.rate_limit_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  attempt_type TEXT NOT NULL DEFAULT 'login',
  attempts_count INTEGER NOT NULL DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on identifier and attempt_type
CREATE UNIQUE INDEX idx_rate_limit_identifier_type ON public.rate_limit_attempts(identifier, attempt_type);

-- Create index for cleanup queries
CREATE INDEX idx_rate_limit_blocked_until ON public.rate_limit_attempts(blocked_until);

-- Enable RLS but allow public access for rate limiting (no auth required)
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Allow insert and update for rate limiting checks (public access needed before auth)
CREATE POLICY "Allow rate limit checks" 
ON public.rate_limit_attempts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_attempt_type TEXT DEFAULT 'login',
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15,
  p_block_minutes INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_record rate_limit_attempts%ROWTYPE;
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_remaining_attempts INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := v_now - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM rate_limit_attempts
  WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
  
  -- Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    RETURN json_build_object(
      'allowed', false,
      'blocked', true,
      'blocked_until', v_record.blocked_until,
      'remaining_attempts', 0,
      'message', 'Too many attempts. Please try again later.'
    );
  END IF;
  
  -- If record exists and within window
  IF v_record.id IS NOT NULL THEN
    -- Reset if outside window
    IF v_record.first_attempt_at < v_window_start THEN
      UPDATE rate_limit_attempts
      SET attempts_count = 1,
          first_attempt_at = v_now,
          last_attempt_at = v_now,
          blocked_until = NULL
      WHERE id = v_record.id;
      
      RETURN json_build_object(
        'allowed', true,
        'blocked', false,
        'remaining_attempts', p_max_attempts - 1,
        'message', 'OK'
      );
    END IF;
    
    -- Check if max attempts reached
    IF v_record.attempts_count >= p_max_attempts THEN
      v_blocked_until := v_now + (p_block_minutes || ' minutes')::INTERVAL;
      
      UPDATE rate_limit_attempts
      SET blocked_until = v_blocked_until,
          last_attempt_at = v_now
      WHERE id = v_record.id;
      
      RETURN json_build_object(
        'allowed', false,
        'blocked', true,
        'blocked_until', v_blocked_until,
        'remaining_attempts', 0,
        'message', 'Too many attempts. Please try again later.'
      );
    END IF;
    
    -- Increment attempts
    UPDATE rate_limit_attempts
    SET attempts_count = attempts_count + 1,
        last_attempt_at = v_now
    WHERE id = v_record.id;
    
    v_remaining_attempts := p_max_attempts - v_record.attempts_count - 1;
    
    RETURN json_build_object(
      'allowed', true,
      'blocked', false,
      'remaining_attempts', v_remaining_attempts,
      'message', 'OK'
    );
  ELSE
    -- Create new record
    INSERT INTO rate_limit_attempts (identifier, attempt_type, attempts_count, first_attempt_at, last_attempt_at)
    VALUES (p_identifier, p_attempt_type, 1, v_now, v_now);
    
    RETURN json_build_object(
      'allowed', true,
      'blocked', false,
      'remaining_attempts', p_max_attempts - 1,
      'message', 'OK'
    );
  END IF;
END;
$$;

-- Function to reset rate limit on successful login
CREATE OR REPLACE FUNCTION public.reset_rate_limit(
  p_identifier TEXT,
  p_attempt_type TEXT DEFAULT 'login'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limit_attempts
  WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
END;
$$;