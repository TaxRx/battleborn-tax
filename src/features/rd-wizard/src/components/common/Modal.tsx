import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { cn } from '../../utils/styles';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | '2xl' | '3xl' | '4xl' | '5xl';
  showCloseButton?: boolean;
  contentClassName?: string;
  description?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'md',
  showCloseButton = true,
  contentClassName,
  description
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = (
      <AnimatePresence>
        {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
            onClick={onClose}
              />
          
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300
              }}
                className={cn(
                "relative w-full",
                maxWidthClasses[maxWidth],
                "bg-white rounded-2xl shadow-2xl border border-gray-200/50"
              )}
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="flex items-start justify-between px-8 pt-6 pb-4 border-b border-gray-200/75">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-1.5 text-sm text-gray-500">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 -mr-2"
                    icon={<XMarkIcon className="h-5 w-5" />}
                    aria-label="Close dialog"
                  />
                )}
              </div>

              {/* Content */}
              <div className={cn("px-8 py-6", contentClassName)}>
                  {children}
                </div>

              {/* Footer */}
                {footer && (
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200/75 rounded-b-2xl">
                    {footer}
                  </div>
                )}
              </motion.div>
          </div>
        </div>
        )}
      </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;