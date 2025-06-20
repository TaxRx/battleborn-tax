import React from 'react';
import { cn } from '../../utils/styles';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  noPadding?: boolean;
  border?: boolean;
  hover?: boolean;
  delay?: number;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  gradient?: boolean;
  accentColor?: 'none' | 'blue' | 'purple' | 'green' | 'gray';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  title,
  subtitle,
  children,
  footer,
  className,
  headerAction,
  noPadding = false,
  border = true,
  hover = false,
  delay = 0,
  elevation = 'sm',
  gradient = false,
  accentColor = 'none',
  ...props
}, ref) => {
  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  const accentColorClasses = {
    none: '',
    blue: 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[#0b2b9d]',
    purple: 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-purple-500',
    green: 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-green-500',
    gray: 'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gray-300'
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: delay * 0.1,
        type: "spring",
        damping: 20,
        stiffness: 300
      }}
      whileHover={hover ? { 
        y: -4,
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        "relative overflow-hidden rounded-xl bg-white",
        gradient && "bg-gradient-to-b from-white to-gray-50/50",
        border && "border border-gray-200/50",
        elevationClasses[elevation],
        accentColorClasses[accentColor],
        hover && "transition-all duration-300 hover:shadow-xl hover:border-gray-300/50",
        className
      )}
      {...props}
    >
      {(title || subtitle) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (delay * 0.1) + 0.1 }}
          className={cn(
            "flex justify-between items-start px-8 pt-6 pb-4",
            accentColor === 'blue' && "bg-[#0b2b9d] text-white",
            accentColor === 'purple' && "bg-purple-500 text-white",
            accentColor === 'green' && "bg-green-500 text-white",
            accentColor === 'gray' && "bg-gray-300 text-gray-900"
          )}
        >
          <div>
            {title && (
              <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (delay * 0.1) + 0.2 }}
                className={cn(
                  "text-xl font-semibold",
                  accentColor === 'blue' ? "text-white" : accentColor === 'purple' ? "text-white" : accentColor === 'green' ? "text-white" : "text-gray-900"
                )}
              >
                {title}
              </motion.h3>
            )}
            {subtitle && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (delay * 0.1) + 0.3 }}
                className={cn(
                  "mt-1.5 text-sm",
                  accentColor === 'blue' ? "text-blue-100" : accentColor === 'purple' ? "text-purple-100" : accentColor === 'green' ? "text-green-100" : "text-gray-500"
                )}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          {headerAction && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (delay * 0.1) + 0.2 }}
              className="ml-4"
            >
              {headerAction}
            </motion.div>
          )}
        </motion.div>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: (delay * 0.1) + 0.3 }}
        className={noPadding ? "" : "px-8 py-6"}
      >
        {children}
      </motion.div>
      
      {footer && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (delay * 0.1) + 0.4 }}
          className={cn(
            "px-8 py-5 border-t",
            gradient ? "border-gray-100/50 bg-gray-50/50" : "border-gray-100 bg-gray-50"
          )}
        >
          {footer}
        </motion.div>
      )}
    </motion.div>
  );
});

Card.displayName = 'Card';

export default Card;