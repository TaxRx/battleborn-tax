import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
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
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-600 font-bold mb-2">Dependents Required</h3>
        <p className="text-red-700">
          To implement this strategy, you must have dependents under the age of 18 who can work in your business.
          Please update your profile to include your dependents.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-600">
          Employ your children in your business to shift income to their lower tax brackets while teaching valuable 
          business skills. This strategy can provide significant tax savings when properly structured.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-8 items-start">
        <div>
          <h3 className="text-[#12ab61] font-bold text-lg mb-6">
            How We Help You Implement This Strategy
          </h3>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Complete Payroll Setup</h4>
                <p className="text-base text-gray-600">
                  We handle all the paperwork and setup, including:
                </p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• W-4 and I-9 Documentation</li>
                  <li>• Direct Deposit Setup</li>
                  <li>• Time Tracking System</li>
                  <li>• Job Description Templates</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Compliance Package</h4>
                <p className="text-base text-gray-600">
                  Stay compliant with labor laws:
                </p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Child Labor Law Guidelines</li>
                  <li>• Safety Requirements</li>
                  <li>• Work Permit Processing</li>
                  <li>• Record Keeping Templates</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Tax Planning Support</h4>
                <p className="text-base text-gray-600">
                  Maximize tax benefits with:
                </p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Salary Optimization</li>
                  <li>• Roth IRA Planning</li>
                  <li>• College Savings Integration</li>
                  <li>• Audit Defense Package</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {children.map((child, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded space-y-4">
              <p className="text-sm font-medium text-gray-900">Child {index + 1}</p>
              
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Age Group</p>
                <select
                  value={child.age}
                  onChange={(e) => {
                    const newChildren = [...children];
                    newChildren[index] = { ...child, age: e.target.value };
                    setChildren(newChildren);
                  }}
                  className="text-lg font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
                >
                  <option value="Under 18">Under 18</option>
                  <option value="18-21">18-21</option>
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Annual Salary</p>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-gray-900">$</span>
                  <NumericFormat
                    value={child.salary}
                    onValueChange={(values) => {
                      const newChildren = [...children];
                      newChildren[index] = { ...child, salary: values.floatValue || 0 };
                      setChildren(newChildren);
                    }}
                    thousandSeparator={true}
                    className="text-2xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">TOTAL SALARIES</p>
              <p className="text-2xl font-bold text-gray-900">${totalSalaries.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">STATE BENEFIT</p>
              <p className="text-2xl font-bold text-emerald-600">${stateBenefit.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">FEDERAL BENEFIT</p>
              <p className="text-2xl font-bold text-emerald-600">${federalBenefit.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">FICA BENEFIT</p>
              <p className={`text-2xl font-bold ${includeFica ? 'text-emerald-600' : 'text-gray-400'}`}>
                ${ficaBenefit.toLocaleString()}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs font-medium text-gray-500 uppercase">TOTAL BENEFIT</p>
              <p className="text-4xl font-bold text-emerald-600">
                ${(includeFica ? totalBenefit : totalBenefit - ficaBenefit).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}