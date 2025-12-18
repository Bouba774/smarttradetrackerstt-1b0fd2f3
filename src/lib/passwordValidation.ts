import { z } from 'zod';

export interface PasswordRequirement {
  id: string;
  label: { fr: string; en: string };
  validator: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: { fr: 'Au moins 8 caractères', en: 'At least 8 characters' },
    validator: (password) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: { fr: 'Une lettre majuscule', en: 'One uppercase letter' },
    validator: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: { fr: 'Une lettre minuscule', en: 'One lowercase letter' },
    validator: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: { fr: 'Un chiffre', en: 'One number' },
    validator: (password) => /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: { fr: 'Un caractère spécial (!@#$%^&*)', en: 'One special character (!@#$%^&*)' },
    validator: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  passwordRequirements.forEach((req) => {
    if (!req.validator(password)) {
      errors.push(req.id);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const createPasswordSchema = (language: string) => {
  return z
    .string()
    .min(8, language === 'fr' ? 'Au moins 8 caractères requis' : 'At least 8 characters required')
    .regex(/[A-Z]/, language === 'fr' ? 'Une majuscule requise' : 'One uppercase letter required')
    .regex(/[a-z]/, language === 'fr' ? 'Une minuscule requise' : 'One lowercase letter required')
    .regex(/[0-9]/, language === 'fr' ? 'Un chiffre requis' : 'One number required')
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      language === 'fr' ? 'Un caractère spécial requis' : 'One special character required'
    );
};
