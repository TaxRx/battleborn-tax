import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PasswordStrengthMeterProps {
  password: string;
  onStrengthChange?: (strength: number, isValid: boolean) => void;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (password) => password.length >= 8
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter',
    test: (password) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter',
    test: (password) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    label: 'At least one number',
    test: (password) => /\d/.test(password)
  },
  {
    id: 'special',
    label: 'At least one special character (!@#$%^&*)',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

export default function PasswordStrengthMeter({ password, onStrengthChange }: PasswordStrengthMeterProps) {
  const results = passwordRequirements.map(req => ({
    ...req,
    passed: req.test(password)
  }));

  const passedCount = results.filter(r => r.passed).length;
  const strength = Math.round((passedCount / passwordRequirements.length) * 100);
  const isValid = passedCount === passwordRequirements.length;

  // Call the callback when strength changes
  React.useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(strength, isValid);
    }
  }, [strength, isValid, onStrengthChange]);

  const getStrengthColor = () => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  if (!password) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Strength Bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-medium ${
            strength < 40 ? 'text-red-600' : 
            strength < 70 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
        {results.map((result) => (
          <div key={result.id} className="flex items-center space-x-2">
            <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
              result.passed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {result.passed ? (
                <CheckIcon className="w-3 h-3 text-green-600" />
              ) : (
                <XMarkIcon className="w-3 h-3 text-gray-400" />
              )}
            </div>
            <span className={`text-sm ${
              result.passed ? 'text-green-700' : 'text-gray-600'
            }`}>
              {result.label}
            </span>
          </div>
        ))}
      </div>

      {/* Security Tips */}
      {!isValid && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">💡 Security Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Use a mix of uppercase and lowercase letters</li>
              <li>Include numbers and special characters</li>
              <li>Avoid common words or personal information</li>
              <li>Consider using a passphrase with spaces</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to validate password strength
export function validatePasswordStrength(password: string): { isValid: boolean; strength: number; failedRequirements: string[] } {
  const results = passwordRequirements.map(req => ({
    ...req,
    passed: req.test(password)
  }));

  const passedCount = results.filter(r => r.passed).length;
  const strength = Math.round((passedCount / passwordRequirements.length) * 100);
  const isValid = passedCount === passwordRequirements.length;
  const failedRequirements = results.filter(r => !r.passed).map(r => r.label);

  return { isValid, strength, failedRequirements };
} 