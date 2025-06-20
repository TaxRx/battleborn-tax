import React from 'react';
import { cn } from '../../utils/styles';

interface PercentageSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  error?: string;
  className?: string;
  description?: string;
  name?: string;
}

const PercentageSlider: React.FC<PercentageSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  helperText,
  error,
  className,
  description,
  name
}) => {
  // Handle slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue !== value) {
      onChange(Math.round(newValue * 100) / 100);
    }
  };

  // Handle button clicks
  const handleButtonClick = (increment: boolean) => {
    const newValue = increment ? Math.min(max, value + step) : Math.max(min, value - step);
    if (newValue !== value) {
      onChange(Math.round(newValue * 100) / 100);
    }
  };

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {description && (
            <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
          )}
        </label>
        <div className="flex items-center">
          <span className="font-medium text-blue-600 text-lg">
            {value.toFixed(2)}%
          </span>
          <div className="ml-2 flex gap-1">
            <button
              type="button"
              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              onClick={() => handleButtonClick(false)}
              aria-label="Decrease percentage"
            >
              -
            </button>
            <button
              type="button"
              className="p-1 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
              onClick={() => handleButtonClick(true)}
              aria-label="Increase percentage"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="relative py-2">
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          aria-label={label}
          name={name}
        />
      </div>

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default PercentageSlider;