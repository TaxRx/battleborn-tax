import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements = [
    {
      label: 'At least 8 characters',
      test: () => password.length >= 8
    },
    {
      label: 'Contains uppercase letter',
      test: () => /[A-Z]/.test(password)
    },
    {
      label: 'Contains lowercase letter',
      test: () => /[a-z]/.test(password)
    },
    {
      label: 'Contains number',
      test: () => /[0-9]/.test(password)
    },
    {
      label: 'Contains symbol',
      test: () => /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  ];

  return (
    <div className="mt-2 space-y-2">
      {requirements.map((req, index) => (
        <div key={index} className="flex items-center space-x-2">
          {req.test() ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${req.test() ? 'text-green-600' : 'text-gray-600'}`}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
}