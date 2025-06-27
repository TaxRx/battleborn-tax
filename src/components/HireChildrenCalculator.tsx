import React, { useState, useEffect, useMemo } from 'react';
import { Check, Info } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface HireChildrenCalculatorProps {
  dependents: number;
  onSavingsChange: (details: any) => void;
  taxInfo: any;
  rates: any;
}

export default function HireChildrenCalculator({
  dependents,
  onSavingsChange,
  taxInfo,
  rates
}: HireChildrenCalculatorProps) {
  const [children, setChildren] = useState<Array<{
    age: string;
    filingStatus: string;
    salary: number;
  }>>(Array(dependents).fill({
    age: 'Under 18',
    filingStatus: 'Single',
    salary: 13850
  }));
  const { includeFica } = useTaxStore();

  const totalSalaries = children.reduce((sum, child) => sum + child.salary, 0);

  // Memoize tax savings calculation
  const { stateBenefit, federalBenefit, ficaBenefit, totalBenefit } = useMemo(() => {
    if (!rates || !taxInfo) {
      return { stateBenefit: 0, federalBenefit: 0, ficaBenefit: 0, totalBenefit: 0 };
    }

    // Calculate tax without income shifting
    const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);

    // Create modified tax info with reduced income
    const modifiedTaxInfo = { ...taxInfo };

    // If W2 income is over $160,000, reduce it first up to that threshold
    if (modifiedTaxInfo.wagesIncome > 160000) {
      const w2Reduction = Math.min(
        modifiedTaxInfo.wagesIncome - 160000,
        totalSalaries
      );
      modifiedTaxInfo.wagesIncome -= w2Reduction;

      // Any remaining amount reduces business income
      const remainingReduction = totalSalaries - w2Reduction;
      if (remainingReduction > 0 && modifiedTaxInfo.ordinaryK1Income) {
        modifiedTaxInfo.ordinaryK1Income = Math.max(
          0,
          modifiedTaxInfo.ordinaryK1Income - remainingReduction
        );
      }
    } else {
      // If W2 is under $160,000, reduce business income first
      if (modifiedTaxInfo.ordinaryK1Income) {
        modifiedTaxInfo.ordinaryK1Income = Math.max(
          0,
          modifiedTaxInfo.ordinaryK1Income - totalSalaries
        );
      }
    }

    // Calculate tax with income shifted to children
    const shiftedBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

    // Calculate the differences
    const stateBenefit = Math.max(0, baseBreakdown.state - shiftedBreakdown.state);
    const federalBenefit = Math.max(0, baseBreakdown.federal - shiftedBreakdown.federal);
    const ficaBenefit = Math.max(0, baseBreakdown.fica - shiftedBreakdown.fica);

    return {
      stateBenefit,
      federalBenefit,
      ficaBenefit,
      totalBenefit: stateBenefit + federalBenefit + ficaBenefit
    };
  }, [taxInfo, rates, totalSalaries]);

  // Memoize savings details
  const savingsDetails = useMemo(() => ({
    hireChildren: {
      children,
      totalSalaries,
      stateBenefit,
      federalBenefit,
      ficaBenefit,
      totalBenefit: includeFica ? totalBenefit : totalBenefit - ficaBenefit
    }
  }), [children, totalSalaries, stateBenefit, federalBenefit, ficaBenefit, totalBenefit, includeFica]);

  useEffect(() => {
    onSavingsChange(savingsDetails);
  }, [onSavingsChange, savingsDetails]);

  if (dependents === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Dependents Required</h4>
              <p className="text-red-700">
                To implement this strategy, you must have dependents under the age of 18 who can work in your business.
                Please update your profile to include your dependents.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">How Hiring Your Children Works</h4>
            <p className="text-blue-700 text-sm mb-2">
              Employ your children in your business to shift income to their lower tax brackets while teaching valuable 
              business skills. This strategy can provide significant tax savings when properly structured.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Benefits:</strong> Income shifting to lower tax brackets, FICA savings, business skill development. 
              <strong>Requirements:</strong> Children under 18, legitimate work performed, reasonable compensation.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Children
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-gray-900">
                {dependents}
              </span>
            </div>
          </div>

          {children.map((child, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold text-gray-900">Child {index + 1}</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group
                </label>
                <select
                  value={child.age}
                  onChange={(e) => {
                    const newChildren = [...children];
                    newChildren[index] = { ...child, age: e.target.value };
                    setChildren(newChildren);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Under 18">Under 18</option>
                  <option value="18-21">18-21</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Salary
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                    $
                  </span>
                  <NumericFormat
                    value={child.salary}
                    onValueChange={(values) => {
                      const newChildren = [...children];
                      newChildren[index] = { ...child, salary: values.floatValue || 0 };
                      setChildren(newChildren);
                    }}
                    thousandSeparator=","
                    decimalScale={0}
                    className="w-full pl-8 pr-3 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Salaries
            </label>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-green-900">
                ${totalSalaries.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State Tax Benefit
            </label>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-blue-900">
                ${stateBenefit.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Federal Tax Benefit
            </label>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-blue-900">
                ${federalBenefit.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FICA Benefit
            </label>
            <div className={`p-3 rounded-lg ${includeFica ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <span className={`text-2xl font-bold ${includeFica ? 'text-blue-900' : 'text-gray-400'}`}>
                ${ficaBenefit.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {includeFica ? 'Included in total' : 'Excluded from total'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Tax Savings
            </label>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-green-900">
                ${(includeFica ? totalBenefit : totalBenefit - ficaBenefit).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Services */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-6">
        <h4 className="font-semibold text-purple-800 mb-4">Implementation Services</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-purple-900 mb-2">Complete Payroll Setup</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• W-4 and I-9 Documentation</li>
                  <li>• Direct Deposit Setup</li>
                  <li>• Time Tracking System</li>
                  <li>• Job Description Templates</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-purple-900 mb-2">Compliance Package</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Child Labor Law Guidelines</li>
                  <li>• Safety Requirements</li>
                  <li>• Work Permit Processing</li>
                  <li>• Record Keeping Templates</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-purple-900 mb-2">Tax Planning Support</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Salary Optimization</li>
                  <li>• Roth IRA Planning</li>
                  <li>• College Savings Integration</li>
                  <li>• Audit Defense Package</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
          <p className="text-purple-800 text-sm">
            <strong>We handle all the paperwork and compliance requirements to ensure your children's employment is properly structured for maximum tax benefits.</strong>
          </p>
          <p className="text-purple-700 text-xs mt-2">
            This strategy requires legitimate work to be performed by your children. We help you create appropriate job descriptions 
            and maintain proper documentation to withstand IRS scrutiny.
          </p>
        </div>
      </div>
    </div>
  );
}