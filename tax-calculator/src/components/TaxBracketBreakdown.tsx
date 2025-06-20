import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown } from '../types/tax';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface TaxBracketBreakdownProps {
  taxInfo: TaxInfo;
  rates: TaxRates;
  strategies: TaxStrategy[];
  isExpanded: boolean;
  onToggle: () => void;
}

export default function TaxBracketBreakdown({
  taxInfo,
  rates,
  strategies,
  isExpanded,
  onToggle
}: TaxBracketBreakdownProps) {
  const [showFederalBrackets, setShowFederalBrackets] = useState(false);
  const [showStateBrackets, setShowStateBrackets] = useState(false);
  const { include_fica, setIncludeFica } = useTaxStore();

  // Calculate base deduction (standard or itemized)
  const baseDeduction = useMemo(() => {
    const standardDeduction = rates.federal.standard_deduction[taxInfo.filing_status] || 0;
    return taxInfo.standard_deduction ? standardDeduction : (taxInfo.custom_deduction || 0);
  }, [taxInfo, rates]);

  // Calculate strategy deductions
  const strategyDeductions = useMemo(() => {
    return strategies
      .filter(s => s.enabled)
      .reduce((total, strategy) => {
        if (strategy.id === 'charitable_donation' && strategy.details?.charitable_donation) {
          return total + strategy.details.charitable_donation.deduction_value;
        }
        if (strategy.id === 'cost_segregation' && strategy.details?.cost_segregation) {
          return total + strategy.details.cost_segregation.current_year_deduction;
        }
        return total;
      }, 0);
  }, [strategies]);

  // Calculate shifted income
  const shiftedIncome = useMemo(() => {
    return strategies
      .filter(s => s.enabled && s.category === 'income_shifted')
      .reduce((total, strategy) => {
        if (strategy.id === 'hire_children' && strategy.details?.hire_children) {
          return total + strategy.details.hire_children.total_salaries;
        }
        if (strategy.id === 'augusta_rule' && strategy.details?.augusta_rule) {
          return total + (strategy.details.augusta_rule.days_rented * strategy.details.augusta_rule.daily_rate);
        }
        if (strategy.id === 'family_management_company' && strategy.details?.family_management_company) {
          return total + strategy.details.family_management_company.total_salaries;
        }
        return total;
      }, 0);
  }, [strategies]);

  // Calculate deferred income
  const deferredIncome = useMemo(() => {
    return strategies
      .filter(s => s.enabled && s.category === 'income_deferred')
      .reduce((total, strategy) => {
        if (strategy.details?.deferred_income?.deferred_amount) {
          return total + strategy.details.deferred_income.deferred_amount;
        }
        return total;
      }, 0);
  }, [strategies]);

  // Calculate total income
  const totalIncome = useMemo(() => {
    return taxInfo.wages_income + 
           taxInfo.passive_income + 
           taxInfo.unearned_income +
           (taxInfo.business_owner ? (taxInfo.ordinary_k1_income || 0) + (taxInfo.guaranteed_k1_income || 0) : 0);
  }, [taxInfo]);

  // Calculate tax breakdowns
  const baseBreakdown = useMemo(() => 
    calculateTaxBreakdown(taxInfo, rates),
    [taxInfo, rates]
  );

  const strategyBreakdown = useMemo(() => 
    calculateTaxBreakdown(taxInfo, rates, strategies),
    [taxInfo, rates, strategies]
  );

  // Calculate total tax savings
  const totalSavings = useMemo(() => ({
    federal: baseBreakdown.federal - strategyBreakdown.federal,
    state: baseBreakdown.state - strategyBreakdown.state,
    fica: baseBreakdown.fica - strategyBreakdown.fica,
    total: (baseBreakdown.federal + baseBreakdown.state + baseBreakdown.fica) - 
           (strategyBreakdown.federal + strategyBreakdown.state + strategyBreakdown.fica)
  }), [baseBreakdown, strategyBreakdown]);

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onToggle}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Hide' : 'Show'} Tax Bracket Breakdown
        </button>
        <button
          onClick={() => setIncludeFica(!include_fica)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          {include_fica ? (
            <ToggleRight className="w-6 h-6 text-emerald-600" />
          ) : (
            <ToggleLeft className="w-6 h-6" />
          )}
          <span>Include Payroll Taxes</span>
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            {taxInfo.deduction_limit_reached && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-medium">
                  Deduction Limit Reached
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Total deductions have been capped at 80% of taxable income to maintain minimum tax liability.
                </p>
              </div>
            )}

            <h4 className="text-lg font-bold mb-4">Income & Deduction Summary</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4 grid grid-cols-4 mb-2">
                <div className="font-medium text-gray-500"></div>
                <div className="text-center font-medium text-gray-500 uppercase text-xs tracking-wider">Before</div>
                <div className="text-center font-medium text-gray-500 uppercase text-xs tracking-wider">After</div>
                <div className="text-center font-medium text-gray-500 uppercase text-xs tracking-wider">Change</div>
              </div>

              <div className="font-medium">Gross Income</div>
              <div className="text-right font-semibold">${totalIncome.toLocaleString()}</div>
              <div className="text-right font-semibold">${(totalIncome - shiftedIncome - deferredIncome).toLocaleString()}</div>
              <div className="text-right font-semibold text-green-600">-${(shiftedIncome + deferredIncome).toLocaleString()}</div>

              <div className="font-medium">Total Deductions</div>
              <div className="text-right font-semibold">${baseDeduction.toLocaleString()}</div>
              <div className="text-right font-semibold">${(baseDeduction + strategyDeductions).toLocaleString()}</div>
              <div className="text-right font-semibold text-green-600">+${strategyDeductions.toLocaleString()}</div>

              <div className="font-medium">Taxable Income</div>
              <div className="text-right font-semibold">${Math.max(0, totalIncome - baseDeduction).toLocaleString()}</div>
              <div className="text-right font-semibold text-blue-600">${Math.max(0, totalIncome - shiftedIncome - deferredIncome - strategyBreakdown.total_deductions).toLocaleString()}</div>
              <div className="text-right font-semibold text-green-600">-${(Math.max(0, totalIncome - baseDeduction) - Math.max(0, totalIncome - shiftedIncome - deferredIncome - strategyBreakdown.total_deductions)).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold mb-4">Tax Savings Summary</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4 grid grid-cols-4 mb-2">
                <div className="font-medium text-gray-500"></div>
                <div className="text-center font-medium text-gray-500 uppercase text-xs tracking-wider">Before</div>
                <div className="text-center font-medium text-gray-500 uppercase text-xs tracking-wider">After</div>
                <div className="text-center font-medium text-gray-500 uppercase text-xs tracking-wider">Savings</div>
              </div>

              <div className="font-medium">Federal Tax</div>
              <div className="text-right font-semibold">${baseBreakdown.federal.toLocaleString()}</div>
              <div className="text-right font-semibold">${strategyBreakdown.federal.toLocaleString()}</div>
              <div className="text-right font-semibold text-green-600">-${totalSavings.federal.toLocaleString()}</div>

              <div className="font-medium">State Tax</div>
              <div className="text-right font-semibold">${baseBreakdown.state.toLocaleString()}</div>
              <div className="text-right font-semibold">${strategyBreakdown.state.toLocaleString()}</div>
              <div className="text-right font-semibold text-green-600">-${totalSavings.state.toLocaleString()}</div>

              {include_fica && (
                <>
                  <div className="font-medium">Social Security Tax</div>
                  <div className="text-right font-semibold">${baseBreakdown.social_security.toLocaleString()}</div>
                  <div className="text-right font-semibold">${strategyBreakdown.social_security.toLocaleString()}</div>
                  <div className="text-right font-semibold text-green-600">-${(baseBreakdown.social_security - strategyBreakdown.social_security).toLocaleString()}</div>

                  <div className="font-medium">Medicare Tax</div>
                  <div className="text-right font-semibold">${baseBreakdown.medicare.toLocaleString()}</div>
                  <div className="text-right font-semibold">${strategyBreakdown.medicare.toLocaleString()}</div>
                  <div className="text-right font-semibold text-green-600">-${(baseBreakdown.medicare - strategyBreakdown.medicare).toLocaleString()}</div>

                  <div className="font-medium">Self-Employment Tax</div>
                  <div className="text-right font-semibold">${baseBreakdown.self_employment.toLocaleString()}</div>
                  <div className="text-right font-semibold">${strategyBreakdown.self_employment.toLocaleString()}</div>
                  <div className="text-right font-semibold text-green-600">-${(baseBreakdown.self_employment - strategyBreakdown.self_employment).toLocaleString()}</div>
                </>
              )}

              <div className="font-medium">Total Tax</div>
              <div className="text-right font-semibold">${(baseBreakdown.federal + baseBreakdown.state + (include_fica ? baseBreakdown.fica : 0)).toLocaleString()}</div>
              <div className="text-right font-semibold">${(strategyBreakdown.federal + strategyBreakdown.state + (include_fica ? strategyBreakdown.fica : 0)).toLocaleString()}</div>
              <div className="text-right font-semibold text-green-600">-${((baseBreakdown.federal + baseBreakdown.state + (include_fica ? baseBreakdown.fica : 0)) - (strategyBreakdown.federal + strategyBreakdown.state + (include_fica ? strategyBreakdown.fica : 0))).toLocaleString()}</div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setShowFederalBrackets(!showFederalBrackets)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {showFederalBrackets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Federal Tax Brackets</span>
              </button>

              {showFederalBrackets && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bracket</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Before</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">After</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {baseBreakdown.federal_brackets.map((bracket, index) => {
                        const afterBracket = strategyBreakdown.federal_brackets[index];
                        const savings = bracket.tax - (afterBracket?.tax || 0);
                        
                        return (
                          <tr key={bracket.rate}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${bracket.min.toLocaleString()} - ${bracket.max.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {(bracket.rate * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ${bracket.tax.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ${(afterBracket?.tax || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                              -${savings.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={() => setShowStateBrackets(!showStateBrackets)}
                className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {showStateBrackets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>State Tax Brackets</span>
              </button>

              {showStateBrackets && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bracket</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Before</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">After</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {baseBreakdown.state_brackets.map((bracket, index) => {
                        const afterBracket = strategyBreakdown.state_brackets[index];
                        const savings = bracket.tax - (afterBracket?.tax || 0);
                        
                        return (
                          <tr key={bracket.rate}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${bracket.min.toLocaleString()} - ${bracket.max.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {(bracket.rate * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ${bracket.tax.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              ${(afterBracket?.tax || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">
                              -${savings.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}