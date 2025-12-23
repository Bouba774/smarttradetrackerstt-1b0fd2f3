-- Add admin access to tables that are missing it
-- This is per user request: admins should have full access to all user data

-- Add admin SELECT access to ai_conversations
CREATE POLICY "Admins can view all conversations"
ON public.ai_conversations
FOR SELECT
USING (is_admin(auth.uid()));

-- Add admin SELECT access to ai_messages  
CREATE POLICY "Admins can view all messages"
ON public.ai_messages
FOR SELECT
USING (is_admin(auth.uid()));

-- Add admin SELECT access to mt_accounts
CREATE POLICY "Admins can view all MT accounts"
ON public.mt_accounts
FOR SELECT
USING (is_admin(auth.uid()));

-- Add admin SELECT access to secure_credentials
CREATE POLICY "Admins can view all credentials"
ON public.secure_credentials
FOR SELECT
USING (is_admin(auth.uid()));

-- Add admin SELECT access to trusted_devices
CREATE POLICY "Admins can view all trusted devices"
ON public.trusted_devices
FOR SELECT
USING (is_admin(auth.uid()));

-- Add admin SELECT access to user_consents
CREATE POLICY "Admins can view all consents"
ON public.user_consents
FOR SELECT
USING (is_admin(auth.uid()));