import React from 'react';
import { cn } from '../../utils/styles';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  // Base classes
  const baseClasses = cn(
    "relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    fullWidth && "w-full",
  );
  
  // Variant classes
  const variantClasses = {
    primary: cn(
      "bg-blue-600 text-white",
      "hover:bg-blue-700 active:bg-blue-800",
      "focus:ring-blue-500",
      "shadow-sm hover:shadow",
      "disabled:bg-blue-400"
    ),
    secondary: cn(
      "bg-white text-blue-600 border border-blue-200",
      "hover:bg-blue-50 active:bg-blue-100",
      "focus:ring-blue-500",
      "disabled:bg-gray-50 disabled:text-blue-400"
    ),
    success: cn(
      "bg-green-600 text-white",
      "hover:bg-green-700 active:bg-green-800",
      "focus:ring-green-500",
      "shadow-sm hover:shadow",
      "disabled:bg-green-400"
    ),
    danger: cn(
      "bg-red-600 text-white",
      "hover:bg-red-700 active:bg-red-800",
      "focus:ring-red-500",
      "shadow-sm hover:shadow",
      "disabled:bg-red-400"
    ),
    outline: cn(
      "bg-transparent text-gray-700 border border-gray-300",
      "hover:bg-gray-50 active:bg-gray-100",
      "focus:ring-gray-500",
      "disabled:bg-gray-50 disabled:text-gray-400"
    ),
    ghost: cn(
      "bg-transparent text-gray-700",
      "hover:bg-gray-100 active:bg-gray-200",
      "focus:ring-gray-500",
      "disabled:bg-transparent disabled:text-gray-400"
    )
  };
  
  // Size classes
  const sizeClasses = {
    sm: "text-sm px-3 py-1.5 gap-1.5",
    md: "text-base px-4 py-2 gap-2",
    lg: "text-lg px-6 py-3 gap-2.5"
  };

  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-spin" />
      )}
      <span className={cn("flex items-center", isLoading && "invisible")}>
        {icon && iconPosition === 'left' && (
          <span className="inline-flex">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="inline-flex">{icon}</span>
        )}
      </span>
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;