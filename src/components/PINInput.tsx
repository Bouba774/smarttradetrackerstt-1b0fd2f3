import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Delete, Fingerprint } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PINInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  onBiometric?: () => void;
  showBiometric?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export const PINInput: React.FC<PINInputProps> = ({
  length = 4,
  onComplete,
  onBiometric,
  showBiometric = false,
  disabled = false,
  error = false,
  className,
}) => {
  const { language } = useLanguage();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
    }
  }, [pin, length, onComplete]);

  const handleDigit = useCallback((digit: string) => {
    if (disabled || pin.length >= length) return;
    setPin((prev) => prev + digit);
  }, [disabled, pin.length, length]);

  const handleDelete = useCallback(() => {
    if (disabled) return;
    setPin((prev) => prev.slice(0, -1));
  }, [disabled]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    setPin('');
  }, [disabled]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className={cn('flex flex-col items-center gap-8', className)}>
      {/* PIN Dots */}
      <div 
        className={cn(
          'flex gap-4 transition-transform',
          shake && 'animate-shake'
        )}
      >
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-200',
              i < pin.length
                ? 'bg-primary border-primary scale-110'
                : 'bg-transparent border-muted-foreground/40',
              error && 'border-destructive bg-destructive'
            )}
          />
        ))}
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-4">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={disabled}
            className={cn(
              'w-16 h-16 rounded-full text-2xl font-medium',
              'bg-secondary/50 hover:bg-secondary active:bg-primary active:text-primary-foreground',
              'transition-all duration-150 active:scale-95',
              'flex items-center justify-center',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Biometric / 0 / Delete */}
        <button
          type="button"
          onClick={onBiometric}
          disabled={disabled || !showBiometric}
          className={cn(
            'w-16 h-16 rounded-full',
            'flex items-center justify-center',
            'transition-all duration-150 active:scale-95',
            showBiometric
              ? 'bg-secondary/50 hover:bg-secondary active:bg-primary active:text-primary-foreground'
              : 'opacity-0 cursor-default'
          )}
        >
          {showBiometric && <Fingerprint className="w-6 h-6" />}
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          disabled={disabled}
          className={cn(
            'w-16 h-16 rounded-full text-2xl font-medium',
            'bg-secondary/50 hover:bg-secondary active:bg-primary active:text-primary-foreground',
            'transition-all duration-150 active:scale-95',
            'flex items-center justify-center',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={disabled || pin.length === 0}
          className={cn(
            'w-16 h-16 rounded-full',
            'bg-secondary/50 hover:bg-secondary active:bg-destructive active:text-destructive-foreground',
            'transition-all duration-150 active:scale-95',
            'flex items-center justify-center',
            'disabled:opacity-30 disabled:cursor-not-allowed'
          )}
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default PINInput;
