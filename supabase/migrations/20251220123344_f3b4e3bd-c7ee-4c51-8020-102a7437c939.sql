-- Create a table for banned users
CREATE TABLE public.banned_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  banned_by UUID NOT NULL,
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view banned users
CREATE POLICY "Admins can view banned users"
ON public.banned_users
FOR SELECT
USING (is_admin(auth.uid()));

-- Only admins can ban users
CREATE POLICY "Admins can ban users"
ON public.banned_users
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can update bans
CREATE POLICY "Admins can update bans"
ON public.banned_users
FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can unban users
CREATE POLICY "Admins can unban users"
ON public.banned_users
FOR DELETE
USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_banned_users_updated_at
BEFORE UPDATE ON public.banned_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.banned_users
    WHERE user_id = _user_id
      AND (is_permanent = true OR expires_at > now())
  )
$$;