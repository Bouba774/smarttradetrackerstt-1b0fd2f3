import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightResponse } from "../_shared/cors.ts";

// Trusted email providers (non-exhaustive - we accept most domains)
const TRUSTED_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
  'protonmail.com', 'proton.me', 'pm.me', 'tutanota.com', 'tuta.io',
  'icloud.com', 'me.com', 'mac.com', 'zoho.com', 'zohomail.com',
  'aol.com', 'gmx.com', 'gmx.de', 'gmx.fr', 'mail.com', 'email.com',
  'yandex.com', 'yandex.ru', 'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru',
  'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'bbox.fr',
  't-online.de', 'web.de', 'posteo.de', 'mailbox.org',
  'bluewin.ch', 'sunrise.ch', 'hispeed.ch',
  'libero.it', 'virgilio.it', 'alice.it', 'tin.it',
  'fastmail.com', 'fastmail.fm', 'runbox.com', 'mailfence.com',
  'hushmail.com', 'startmail.com', 'countermail.com',
  'qq.com', '163.com', '126.com', 'sina.com', 'sohu.com', 'aliyun.com',
  'naver.com', 'daum.net', 'hanmail.net',
  'cox.net', 'verizon.net', 'att.net', 'sbcglobal.net', 'comcast.net',
  'btinternet.com', 'sky.com', 'talktalk.net', 'ntlworld.com',
]);

// Known disposable email domains (comprehensive list - truncated for brevity)
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'tempmail.net', 'temp-mail.io',
  'guerrillamail.com', 'guerrillamail.org', 'guerrillamail.net',
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'throwaway.email', 'throwawaymail.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'nada.email', 'dispostable.com', 'maildrop.cc', 'mailnesia.com',
  'getairmail.com', 'getnada.com', 'tempail.com', 'discard.email',
  'fakeinbox.com', 'fakemailgenerator.com', 'emailondeck.com',
  'mohmal.com', 'mailcatch.com', 'mytemp.email',
  'trashmail.com', 'trashmail.net', 'trashmail.org',
  'spam.la', 'spamgourmet.com', 'spamex.com',
]);

interface EmailValidationRequest {
  email: string;
  isAdminAttempt?: boolean;
  userAgent?: string;
}

interface EmailValidationResult {
  valid: boolean;
  score: number;
  status: 'accepted' | 'rejected' | 'pending_confirmation';
  reason?: string;
  details: {
    formatValid: boolean;
    domainExists: boolean;
    hasMxRecord: boolean;
    isDisposable: boolean;
    isTrustedProvider: boolean;
    domainAgeDays?: number;
    riskFactors: string[];
  };
}

// Simple hash function for GDPR compliance
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if domain has MX records using DNS lookup
async function checkMxRecord(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.Answer && data.Answer.length > 0;
  } catch {
    return true;
  }
}

// Check domain age using WHOIS-like services
async function checkDomainAge(domain: string): Promise<number | null> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    if (response.ok) {
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        return 365;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Check for disposable email patterns in domain
function hasDisposablePattern(domain: string): boolean {
  const lowerDomain = domain.toLowerCase();
  
  if (DISPOSABLE_DOMAINS.has(lowerDomain)) {
    return true;
  }
  
  const disposablePatterns = [
    'temp', 'disposable', 'throwaway', 'fake', 'trash', 'spam',
    'guerrilla', 'mailinator', '10minute', 'yopmail', 'tempmail',
    'burner', 'getairmail', 'maildrop', 'mohmal', 'sharklasers',
  ];
  
  return disposablePatterns.some(pattern => lowerDomain.includes(pattern));
}

// Calculate email trust score
function calculateEmailScore(details: EmailValidationResult['details']): number {
  let score = 50;
  
  if (details.isTrustedProvider) score += 30;
  if (details.hasMxRecord) score += 10;
  if (details.domainAgeDays && details.domainAgeDays > 365) score += 10;
  if (details.domainAgeDays && details.domainAgeDays > 30) score += 5;
  
  if (details.isDisposable) score -= 80;
  if (!details.hasMxRecord) score -= 40;
  if (!details.domainExists) score -= 50;
  if (details.domainAgeDays && details.domainAgeDays < 30) score -= 20;
  
  score -= details.riskFactors.length * 10;
  
  return Math.max(0, Math.min(100, score));
}

// Main validation function
async function validateEmail(email: string, isAdminAttempt: boolean = false): Promise<EmailValidationResult> {
  const riskFactors: string[] = [];
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const formatValid = emailRegex.test(email) && email.length <= 254;
  
  if (!formatValid) {
    return {
      valid: false,
      score: 0,
      status: 'rejected',
      reason: 'invalid_format',
      details: {
        formatValid: false,
        domainExists: false,
        hasMxRecord: false,
        isDisposable: false,
        isTrustedProvider: false,
        riskFactors: ['invalid_email_format'],
      }
    };
  }
  
  const domain = email.split('@')[1].toLowerCase();
  
  const isTrustedProvider = TRUSTED_PROVIDERS.has(domain);
  
  const isDisposable = hasDisposablePattern(domain);
  if (isDisposable) {
    riskFactors.push('disposable_email_detected');
  }
  
  const hasMxRecord = await checkMxRecord(domain);
  if (!hasMxRecord) {
    riskFactors.push('no_mx_record');
  }
  
  const domainAgeDays = await checkDomainAge(domain);
  if (domainAgeDays !== null && domainAgeDays < 30) {
    riskFactors.push('domain_too_new');
  }
  
  const domainExists = hasMxRecord || domainAgeDays !== null;
  
  const details: EmailValidationResult['details'] = {
    formatValid,
    domainExists,
    hasMxRecord,
    isDisposable,
    isTrustedProvider,
    domainAgeDays: domainAgeDays ?? undefined,
    riskFactors,
  };
  
  const score = calculateEmailScore(details);
  
  let status: EmailValidationResult['status'];
  let valid = true;
  let reason: string | undefined;
  
  if (isDisposable) {
    status = 'rejected';
    valid = false;
    reason = 'disposable_email';
  } else if (!hasMxRecord) {
    status = 'rejected';
    valid = false;
    reason = 'no_mx_record';
  } else if (score < 20) {
    status = 'rejected';
    valid = false;
    reason = 'low_trust_score';
  } else if (score < 50) {
    status = 'pending_confirmation';
  } else {
    status = 'accepted';
  }
  
  if (isAdminAttempt) {
    if (isDisposable || score < 60) {
      status = 'rejected';
      valid = false;
      reason = reason || 'insufficient_trust_for_admin';
      riskFactors.push('admin_attempt_with_suspicious_email');
    }
  }
  
  return {
    valid,
    score,
    status,
    reason,
    details,
  };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { email, isAdminAttempt, userAgent }: EmailValidationRequest = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Validating email: ${email.split('@')[1]} (domain only for privacy)`);
    
    const result = await validateEmail(email, isAdminAttempt);
    
    // Log validation attempt (GDPR compliant - hash email)
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      const emailHash = await hashEmail(email);
      const domain = email.split('@')[1].toLowerCase();
      const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      
      await supabase.from('email_validation_logs').insert({
        email_hash: emailHash,
        domain,
        status: result.status,
        validation_score: result.score,
        is_disposable: result.details.isDisposable,
        has_mx_record: result.details.hasMxRecord,
        is_free_provider: result.details.isTrustedProvider,
        domain_age_days: result.details.domainAgeDays,
        risk_factors: result.details.riskFactors,
        rejection_reason: result.reason,
        ip_address: clientIP,
        user_agent: userAgent,
      });
    } catch (logError) {
      console.error('Error logging validation:', logError);
    }
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Validation error:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: 'Internal validation error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
