import React from 'react';
import { cn } from '../../utils/styles';
import { motion } from 'framer-motion';

interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  onChange: (year: number) => void;
  className?: string;
}

const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  selectedYear,
  onChange,
  className
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-center space-x-2", className)}
    >
      <label className="text-sm font-medium text-gray-700">Tax Year:</label>
      <select
        value={selectedYear}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-all duration-200"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </motion.div>
  );
};

export default YearSelector;