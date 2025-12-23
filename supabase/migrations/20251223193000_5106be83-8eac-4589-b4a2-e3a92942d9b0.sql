-- Ensure all existing logins are encrypted and plaintext is masked
UPDATE public.mt_accounts
SET 
  login_encrypted = CASE 
    WHEN login_encrypted IS NULL AND login IS NOT NULL AND login != '********'
    THEN public.encrypt_mt_login(login, user_id)
    ELSE login_encrypted
  END,
  login = '********'
WHERE login IS NOT NULL AND login != '********';

-- Add comment to clarify column usage
COMMENT ON COLUMN public.mt_accounts.login IS 'DEPRECATED: Always contains masked value. Use login_encrypted with decrypt_mt_login function.';
COMMENT ON COLUMN public.mt_accounts.login_encrypted IS 'Encrypted login credentials. Use decrypt_mt_login(login_encrypted, user_id) to retrieve.';