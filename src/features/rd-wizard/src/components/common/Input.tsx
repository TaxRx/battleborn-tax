import React, { forwardRef } from 'react';
import { cn } from '../../utils/styles';
import { motion } from 'framer-motion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(({
  label,
  error,
  helperText,
  multiline = false,
  rows = 3,
  fullWidth = true,
  className,
  containerClassName,
  ...props
}, ref) => {
  const inputClasses = cn(
    "block w-full rounded-lg border bg-white px-3 py-2 text-gray-900 placeholder-gray-500",
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    error
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
    "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
    !fullWidth && "w-auto",
    className
  );

  const Component = multiline ? 'textarea' : 'input';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", !fullWidth && "w-auto", containerClassName)}
    >
      {label && (
        <motion.label
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
        </motion.label>
      )}
      <div className="relative">
        <Component
          ref={ref as any}
          rows={multiline ? rows : undefined}
          className={inputClasses}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"
          >
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}
      </div>
      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "mt-1.5 text-sm",
            error ? "text-red-600" : "text-gray-500"
          )}
          id={error ? `${props.id}-error` : undefined}
        >
          {error || helperText}
        </motion.p>
      )}
    </motion.div>
  );
});

Input.displayName = 'Input';

export default Input; 