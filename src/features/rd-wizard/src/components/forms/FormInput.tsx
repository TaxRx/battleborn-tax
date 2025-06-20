import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  label,
  helperText,
  error,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("mb-4", fullWidth ? "w-full" : "")}
    >
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "block rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "placeholder-gray-400 text-gray-900",
            "transition-all duration-200",
            fullWidth ? "w-full" : "",
            error ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500" : "",
            icon && iconPosition === 'left' ? "pl-10" : "pl-3",
            icon && iconPosition === 'right' ? "pr-10" : "pr-3",
            "py-2",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        
        {icon && iconPosition === 'right' && !error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>
      
      {helperText && !error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mt-1 text-sm text-gray-500" 
          id={`${inputId}-helper`}
        >
          {helperText}
        </motion.p>
      )}
      
      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-1 text-sm text-red-600" 
          id={`${inputId}-error`}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;