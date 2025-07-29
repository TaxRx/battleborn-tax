import React from 'react';

interface ExpenseDistributionChartProps {
  employeeQRE: number;
  contractorQRE: number;
  supplyQRE: number;
  title?: string;
  variant?: 'dark' | 'light';
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const ExpenseDistributionChart: React.FC<ExpenseDistributionChartProps> = ({
  employeeQRE,
  contractorQRE,
  supplyQRE,
  title = 'Expense Distribution',
  variant = 'light'
}) => {
  const totalQRE = employeeQRE + contractorQRE + supplyQRE;

  const isDark = variant === 'dark';
  const textColor = isDark ? 'text-blue-100' : 'text-gray-700';
  const textColorSecondary = isDark ? 'text-blue-100' : 'text-gray-600';
  const borderColor = isDark ? 'border-blue-200' : 'border-gray-300';
  const bgColor = isDark ? 'bg-blue-100/20' : 'bg-gray-200';

  if (totalQRE === 0) {
    return (
      <div className="space-y-3">
        <div className={`text-sm font-medium ${textColor}`}>{title}</div>
        <div className={`text-center ${textColorSecondary} text-sm py-4`}>
          No QRE data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`text-sm font-medium ${textColor}`}>{title}</div>
      
      {/* Single Horizontal Bar */}
      <div className={`w-full h-6 rounded-lg overflow-hidden flex border ${borderColor} ${bgColor}`}>
        <div 
          style={{ width: `${(employeeQRE / totalQRE) * 100 || 0}%` }} 
          className="bg-blue-500 h-full" 
          title={`Employees: ${formatCurrency(employeeQRE)}`}
        />
        <div 
          style={{ width: `${(contractorQRE / totalQRE) * 100 || 0}%` }} 
          className="bg-orange-500 h-full" 
          title={`Contractors: ${formatCurrency(contractorQRE)}`}
        />
        <div 
          style={{ width: `${(supplyQRE / totalQRE) * 100 || 0}%` }} 
          className="bg-emerald-500 h-full" 
          title={`Supplies: ${formatCurrency(supplyQRE)}`}
        />
      </div>
      
      {/* Legend */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
          <span className={`text-xs font-semibold ${textColorSecondary}`}>Employees</span>
          <span className={`text-xs font-semibold ${textColorSecondary}`}>{formatCurrency(employeeQRE)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-500" />
          <span className={`text-xs font-semibold ${textColorSecondary}`}>Contractors</span>
          <span className={`text-xs font-semibold ${textColorSecondary}`}>{formatCurrency(contractorQRE)}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
          <span className={`text-xs font-semibold ${textColorSecondary}`}>Supplies</span>
          <span className={`text-xs font-semibold ${textColorSecondary}`}>{formatCurrency(supplyQRE)}</span>
        </div>
      </div>
    </div>
  );
}; 