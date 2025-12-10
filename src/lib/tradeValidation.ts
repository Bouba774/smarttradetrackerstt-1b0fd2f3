import { z } from 'zod';

// Maximum lengths for text fields
const MAX_NOTES_LENGTH = 2000;
const MAX_ASSET_LENGTH = 50;
const MAX_SETUP_LENGTH = 100;

// Validation schema for trade form
export const tradeFormSchema = z.object({
  asset: z.string()
    .min(1, 'Asset is required')
    .max(MAX_ASSET_LENGTH, `Asset must be less than ${MAX_ASSET_LENGTH} characters`)
    .regex(/^[a-zA-Z0-9\s\-\/\.]+$/, 'Asset contains invalid characters'),
  
  direction: z.enum(['buy', 'sell']),
  
  entryPrice: z.string()
    .min(1, 'Entry price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Entry price must be a positive number'),
  
  exitPrice: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    }, 'Exit price must be a non-negative number'),
  
  stopLoss: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Stop loss must be a positive number'),
  
  takeProfit: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Take profit must be a positive number'),
  
  lotSize: z.string()
    .min(1, 'Lot size is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1000;
    }, 'Lot size must be between 0 and 1000'),
  
  pnl: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val);
      return !isNaN(num);
    }, 'P&L must be a valid number'),
  
  risk: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, 'Risk must be between 0 and 100%'),
  
  setup: z.string()
    .max(MAX_SETUP_LENGTH, `Setup must be less than ${MAX_SETUP_LENGTH} characters`)
    .optional(),
  
  customSetup: z.string()
    .max(MAX_SETUP_LENGTH, `Custom setup must be less than ${MAX_SETUP_LENGTH} characters`)
    .regex(/^[a-zA-Z0-9\s\-\_\.àâäéèêëïîôùûüç]*$/i, 'Custom setup contains invalid characters')
    .optional(),
  
  timeframe: z.string()
    .max(10, 'Timeframe must be less than 10 characters')
    .optional(),
  
  emotion: z.string()
    .max(50, 'Emotion must be less than 50 characters')
    .optional(),
  
  notes: z.string()
    .max(MAX_NOTES_LENGTH, `Notes must be less than ${MAX_NOTES_LENGTH} characters`)
    .optional(),
});

export type TradeFormData = z.infer<typeof tradeFormSchema>;

// Validation function that returns friendly error messages
export const validateTradeForm = (data: {
  asset: string;
  direction: 'buy' | 'sell';
  entryPrice: string;
  exitPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
  lotSize: string;
  pnl?: string;
  risk?: string;
  setup?: string;
  customSetup?: string;
  timeframe?: string;
  emotion?: string;
  notes?: string;
}): { success: boolean; errors: string[] } => {
  const result = tradeFormSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, errors: [] };
  }
  
  const errors = result.error.errors.map(err => {
    const field = err.path.join('.');
    return `${field}: ${err.message}`;
  });
  
  return { success: false, errors };
};

// Sanitize text input to prevent XSS
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, MAX_NOTES_LENGTH);
};

// Validate image files
export const validateImageFiles = (files: File[]): { valid: boolean; errors: string[] } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const maxFiles = 4;
  const errors: string[] = [];

  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} images allowed`);
  }

  files.forEach((file, index) => {
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Image ${index + 1}: Invalid file type. Allowed: JPEG, PNG, GIF, WebP`);
    }
    if (file.size > maxSize) {
      errors.push(`Image ${index + 1}: File too large. Maximum 5MB`);
    }
  });

  return { valid: errors.length === 0, errors };
};
