import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { TaxInfo, TaxRates, TaxStrategy } from '../types/tax';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface HireChildrenCalculatorProps {
  taxInfo: TaxInfo;
  rates: TaxRates;
  strategies: TaxStrategy[];
  onSavingsChange?: (savings: any) => void;
}

export default function HireChildrenCalculator({
  taxInfo,
  rates,
  strategies,
  onSavingsChange
}: HireChildrenCalculatorProps) {
  const [children, setChildren] = useState<Array<{ age: string; filing_status: string; salary: number }>>([
    { age: '14-17', filing_status: 'single', salary: 12000 }
  ]);
  const { include_fica } = useTaxStore();

  // Guard against missing rates
  if (!rates || !taxInfo || !taxInfo.business_owner) {
    return null;
  }

  // Calculate total salaries
  const totalSalaries = children.reduce((total, child) => total + child.salary, 0);

  // Calculate tax savings
  const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
  const modifiedTaxInfo = {
    ...taxInfo,
    wages_income: taxInfo.wages_income - totalSalaries,
    ordinary_k1_income: (taxInfo.ordinary_k1_income || 0) - totalSalaries
  };
  const childrenBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

  const stateBenefit = Math.max(0, baseBreakdown.state - childrenBreakdown.state);
  const federalBenefit = Math.max(0, baseBreakdown.federal - childrenBreakdown.federal);
  const ficaBenefit = Math.max(
    0,
    (baseBreakdown.social_security + baseBreakdown.medicare + baseBreakdown.self_employment) -
    (childrenBreakdown.social_security + childrenBreakdown.medicare + childrenBreakdown.self_employment)
  );

  const totalBenefit = stateBenefit + federalBenefit + ficaBenefit;

  useEffect(() => {
    if (onSavingsChange) {
      onSavingsChange({
        children,
        total_salaries: totalSalaries,
        state_benefit: stateBenefit,
        federal_benefit: federalBenefit,
        fica_benefit: ficaBenefit,
        total_benefit: include_fica ? totalBenefit : totalBenefit - ficaBenefit
      });
    }
  }, [children, totalSalaries, stateBenefit, federalBenefit, ficaBenefit, totalBenefit, include_fica, onSavingsChange]);

  const handleAddChild = () => {
    setChildren([...children, { age: '14-17', filing_status: 'single', salary: 12000 }]);
  };

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const handleChildChange = (index: number, field: string, value: string | number) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {children.map((child, index) => (
          <div key={index} className="bg-gray-50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold">Child {index + 1}</h4>
              {children.length > 1 && (
                <button
                  onClick={() => handleRemoveChild(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Age Range
                </label>
                <select
                  value={child.age}
                  onChange={(e) => handleChildChange(index, 'age', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="14-17">14-17 years old</option>
                  <option value="18-21">18-21 years old</option>
                  <option value="22+">22+ years old</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Filing Status
                </label>
                <select
                  value={child.filing_status}
                  onChange={(e) => handleChildChange(index, 'filing_status', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="single">Single</option>
                  <option value="married_joint">Married Filing Jointly</option>
                  <option value="married_separate">Married Filing Separately</option>
                  <option value="head_household">Head of Household</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Annual Salary
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={child.salary}
                    onChange={(e) => handleChildChange(index, 'salary', Math.max(0, parseInt(e.target.value) || 0))}
                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleAddChild}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Another Child
        </button>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Salaries</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalSalaries.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">State Benefit</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${stateBenefit.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Federal Benefit</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${federalBenefit.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">FICA Benefit</p>
            <p className={`text-2xl font-bold ${include_fica ? 'text-emerald-600' : 'text-gray-400'}`}>
              ${ficaBenefit.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Benefit</p>
            <p className="text-4xl font-bold text-emerald-600">
              ${(include_fica ? totalBenefit : totalBenefit - ficaBenefit).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}