import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Delete, Check } from 'lucide-react';

interface PINInputProps {
  length: 4 | 6;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  error?: boolean;
  showConfirm?: boolean;
  disabled?: boolean;
}

export const PINInput: React.FC<PINInputProps> = ({
  length,
  onComplete,
  onCancel,
  error = false,
  showConfirm = false,
  disabled = false,
}) => {
  const { language } = useLanguage();
  const [pin, setPin] = useState<string>('');
  const [shake, setShake] = useState(false);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNumberClick = (num: number) => {
    if (disabled || pin.length >= length) return;
    
    const newPin = pin + num.toString();
    setPin(newPin);
    
    // Auto-submit when complete
    if (newPin.length === length && !showConfirm) {
      setTimeout(() => onComplete(newPin), 100);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    setPin(pin.slice(0, -1));
  };

  const handleConfirm = () => {
    if (pin.length === length) {
      const currentPin = pin;
      setPin('');
      onComplete(currentPin);
    }
  };

  const dots = Array.from({ length }, (_, i) => (
    <div
      key={i}
      className={cn(
        "w-4 h-4 rounded-full border-2 transition-all duration-200",
        i < pin.length
          ? "bg-primary border-primary scale-110"
          : "bg-transparent border-muted-foreground/50",
        error && "border-destructive bg-destructive/20"
      )}
    />
  ));

  const numberButtons = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    [null, 0, 'delete'],
  ];

  return (
    <div className={cn("flex flex-col items-center gap-8", shake && "animate-shake")}>
      {/* PIN Dots */}
      <div className="flex gap-3">
        {dots}
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-4">
        {numberButtons.flat().map((item, index) => {
          if (item === null) {
            return <div key={index} className="w-16 h-16" />;
          }
          
          if (item === 'delete') {
            return (
              <button
                key={index}
                onClick={handleDelete}
                disabled={disabled || pin.length === 0}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  "text-muted-foreground transition-all",
                  "hover:bg-secondary/50 active:scale-95",
                  "disabled:opacity-30 disabled:pointer-events-none"
                )}
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={index}
              onClick={() => handleNumberClick(item as number)}
              disabled={disabled || pin.length >= length}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                "text-2xl font-medium text-foreground",
                "bg-secondary/30 border border-border/50",
                "transition-all duration-150",
                "hover:bg-secondary/60 hover:border-primary/50",
                "active:scale-95 active:bg-primary/20",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Confirm Button (for setup mode) */}
      {showConfirm && pin.length === length && (
        <button
          onClick={handleConfirm}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-lg",
            "bg-primary text-primary-foreground font-medium",
            "transition-all hover:opacity-90 active:scale-95"
          )}
        >
          <Check className="w-5 h-5" />
          {language === 'fr' ? 'Confirmer' : 'Confirm'}
        </button>
      )}

      {/* Cancel Button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-muted-foreground text-sm hover:text-foreground transition-colors"
        >
          {language === 'fr' ? 'Annuler' : 'Cancel'}
        </button>
      )}
    </div>
  );
};

export default PINInput;
