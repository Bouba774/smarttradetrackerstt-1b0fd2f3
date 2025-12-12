import React from 'react';
import { Check, X } from 'lucide-react';
import { passwordRequirements } from '@/lib/passwordValidation';
import { useLanguage } from '@/contexts/LanguageContext';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const { language } = useLanguage();

  const getStrengthPercentage = () => {
    if (!password) return 0;
    const passed = passwordRequirements.filter((req) => req.validator(password)).length;
    return (passed / passwordRequirements.length) * 100;
  };

  const getStrengthColor = () => {
    const percentage = getStrengthPercentage();
    if (percentage <= 20) return 'bg-loss';
    if (percentage <= 40) return 'bg-loss/70';
    if (percentage <= 60) return 'bg-warning';
    if (percentage <= 80) return 'bg-profit/70';
    return 'bg-profit';
  };

  const getStrengthLabel = () => {
    const percentage = getStrengthPercentage();
    if (percentage <= 20) return language === 'fr' ? 'Très faible' : 'Very weak';
    if (percentage <= 40) return language === 'fr' ? 'Faible' : 'Weak';
    if (percentage <= 60) return language === 'fr' ? 'Moyen' : 'Medium';
    if (percentage <= 80) return language === 'fr' ? 'Fort' : 'Strong';
    return language === 'fr' ? 'Très fort' : 'Very strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-3 mt-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {language === 'fr' ? 'Force du mot de passe' : 'Password strength'}
          </span>
          <span className={`font-medium ${getStrengthPercentage() === 100 ? 'text-profit' : 'text-muted-foreground'}`}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${getStrengthPercentage()}%` }}
          />
        </div>
      </div>

      {/* Requirements list */}
      <div className="grid grid-cols-1 gap-1">
        {passwordRequirements.map((req) => {
          const isValid = req.validator(password);
          return (
            <div
              key={req.id}
              className={`flex items-center gap-2 text-xs transition-colors ${
                isValid ? 'text-profit' : 'text-muted-foreground'
              }`}
            >
              {isValid ? (
                <Check className="w-3 h-3" />
              ) : (
                <X className="w-3 h-3" />
              )}
              <span>{req.label[language]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
