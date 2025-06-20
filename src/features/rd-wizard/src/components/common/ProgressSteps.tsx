import React from 'react';
import { cn } from '../../utils/styles';
import { CheckIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export interface Step {
  id: string;
  name: string;
  description?: string;
  href: string;
  status?: 'completed' | 'current' | 'upcoming';
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

const ProgressSteps: React.FC<ProgressStepsProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}) => {
  const isVertical = orientation === 'vertical';
  
  return (
    <nav
      className={cn(
        isVertical ? "flex flex-col space-y-6" : "flex items-center",
        className
      )}
      aria-label="Progress"
    >
      <ol
        role="list"
        className={isVertical ? "space-y-6" : "flex items-center justify-between w-full relative"}
      >
        {/* Horizontal line that connects all steps */}
        {!isVertical && (
          <div className="absolute top-4 left-0 w-full">
            <div className="h-0.5 bg-gray-200">
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-0.5 bg-blue-600"
              />
            </div>
          </div>
        )}
        
        {steps.map((step, stepIdx) => {
          const isActive = step.id === currentStep;
          const isCompleted = steps.findIndex(s => s.id === currentStep) > stepIdx;
          
          return (
            <li key={step.id} className={cn(
              isVertical ? "" : "relative",
              !isVertical && "flex-1 flex flex-col items-center z-10"
            )}>
              {isVertical ? (
                <div className="flex items-start">
                  <div className="flex items-center h-9">
                    <div className="relative flex items-center justify-center">
                      <motion.span 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          isCompleted ? "bg-blue-600" : isActive ? "bg-blue-200" : "bg-gray-200"
                        )}
                      >
                        {isCompleted ? (
                          <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                        ) : (
                          <span className={cn(
                            "text-sm font-medium",
                            isActive ? "text-blue-600" : "text-gray-500"
                          )}>
                            {stepIdx + 1}
                          </span>
                        )}
                      </motion.span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <motion.p
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={cn(
                        "text-sm font-medium",
                        isActive ? "text-blue-600" : isCompleted ? "text-gray-900" : "text-gray-500"
                      )}
                    >
                      {step.name}
                    </motion.p>
                    {step.description && (
                      <motion.p 
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="text-sm text-gray-500"
                      >
                        {step.description}
                      </motion.p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: stepIdx * 0.1 }}
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center bg-white",
                        isCompleted ? "bg-blue-600" : isActive ? "bg-blue-200" : "bg-gray-200",
                      )}
                    >
                      {isCompleted ? (
                        <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                      ) : (
                        <span className={cn(
                          "text-sm font-medium",
                          isActive ? "text-blue-600" : "text-gray-500"
                        )}>
                          {stepIdx + 1}
                        </span>
                      )}
                    </motion.div>
                    <motion.p
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, delay: stepIdx * 0.1 + 0.2 }}
                      className={cn(
                        "text-sm font-medium mt-2 text-center max-w-[120px]",
                        isActive ? "text-blue-600" : isCompleted ? "text-gray-900" : "text-gray-500"
                      )}
                    >
                      {step.name}
                    </motion.p>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressSteps;