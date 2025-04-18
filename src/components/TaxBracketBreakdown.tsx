import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { TaxInfo, TaxRates, TaxStrategy } from '../types';
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
  const { includeFica, setIncludeFica } = useTaxStore();

  // Calculate base deduction (standard or itemized)
  const baseDeduction = useMemo(() => {
    const standardDeduction = rates.federal.standardDeduction[taxInfo.filingStatus] || 0;
    return taxInfo.standardDeduction ? standardDeduction : (taxInfo.customDeduction || 0);
  }, [taxInfo, rates]);

  // Calculate strategy deductions
  const strategyDeductions = useMemo(() => {
    return strategies
      .filter(s => s.enabled)
      .reduce((total, strategy) => {
        if (strategy.id === 'charitable_donation' && strategy.details?.charitableDonation) {
          return total + strategy.details.charitableDonation.deductionValue;
        }
        if (strategy.id === 'cost_segregation' && strategy.details?.costSegregation) {
          return total + strategy.details.costSegregation.currentYearDeduction;
        }
        return total;
      }, 0);
  }, [strategies]);

  // Calculate shifted income
  const shiftedIncome = useMemo(() => {
    return strategies
      .filter(s => s.enabled && s.category === 'income_shifted')
      .reduce((total, strategy) => {
        if (strategy.id === 'hire_children' && strategy.details?.hireChildren) {
          return total + strategy.details.hireChildren.totalSalaries;
        }
        if (strategy.id === 'augusta_rule' && strategy.details?.augustaRule) {
          return total + (strategy.details.augustaRule.daysRented * strategy.details.augustaRule.dailyRate);
        }
        if (strategy.id === 'family_management_company' && strategy.details?.familyManagementCompany) {
          return total + strategy.details.familyManagementCompany.totalSalaries;
        }
        return total;
      }, 0);
  }, [strategies]);

  // Calculate deferred income
  const deferredIncome = useMemo(() => {
    return strategies
      .filter(s => s.enabled && s.category === 'income_deferred')
      .reduce((total, strategy) => {
        if (strategy.details?.deferredAmount) {
          return total + strategy.details.deferredAmount;
        }
        return total;
      }, 0);
  }, [strategies]);

  // Calculate total income
  const totalIncome = useMemo(() => {
    return taxInfo.wagesIncome + 
           taxInfo.passiveIncome + 
           taxInfo.unearnedIncome +
           (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0);
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
          onClick={() => setIncludeFica(!includeFica)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          {includeFica ? (
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
            {taxInfo.deductionLimitReached && (
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
              <div className="text-right">${totalIncome.toLocaleString()}</div>
              <div className="text-right">${totalIncome.toLocaleString()}</div>
              <div className="text-right">-</div>

              <div className="font-medium">Base Deduction</div>
              <div className="text-right">
                ${baseDeduction.toLocaleString()}
                <span className="text-sm text-gray-500 ml-1">
                  ({taxInfo.standardDeduction ? 'Standard' : 'Itemized'})
                </span>
              </div>
              <div className="text-right">
                {taxInfo.standardDeduction && strategyDeductions > baseDeduction ? (
                  <span className="text-gray-400">$0</span>
                ) : (
                  <>
                    ${baseDeduction.toLocaleString()}
                    <span className="text-sm text-gray-500 ml-1">
                      ({taxInfo.standardDeduction ? 'Standard' : 'Itemized'})
                    </span>
                  </>
                )}
              </div>
              <div className="text-right">
                {taxInfo.standardDeduction && strategyDeductions > baseDeduction ? (
                  <span className="text-red-600">-${baseDeduction.toLocaleString()}</span>
                ) : (
                  '-'
                )}
              </div>

              {strategyDeductions > 0 && (
                <>
                  <div className="font-medium">Strategy Deductions</div>
                  <div className="text-right">-</div>
                  <div className="text-right text-green-600">
                    ${strategyDeductions.toLocaleString()}
                  </div>
                  <div className="text-right text-green-600">
                    +${strategyDeductions.toLocaleString()}
                  </div>
                </>
              )}

              {shiftedIncome > 0 && (
                <>
                  <div className="font-medium">Income Shifted</div>
                  <div className="text-right">-</div>
                  <div className="text-right text-green-600">
                    ${shiftedIncome.toLocaleString()}
                  </div>
                  <div className="text-right text-green-600">
                    -${shiftedIncome.toLocaleString()}
                  </div>
                </>
              )}

              {deferredIncome > 0 && (
                <>
                  <div className="font-medium">Income Deferred</div>
                  <div className="text-right">-</div>
                  <div className="text-right text-green-600">
                    ${deferredIncome.toLocaleString()}
                  </div>
                  <div className="text-right text-green-600">
                    -${deferredIncome.toLocaleString()}
                  </div>
                </>
              )}

              <div className="font-medium border-t pt-4">Taxable Income</div>
              <div className="text-right border-t pt-4 font-semibold">
                ${Math.max(0, totalIncome - baseDeduction).toLocaleString()}
              </div>
              <div className="text-right border-t pt-4 font-semibold text-blue-600">
                ${Math.max(0, totalIncome - shiftedIncome - deferredIncome - strategyBreakdown.totalDeductions).toLocaleString()}
              </div>
              <div className="text-right border-t pt-4 font-semibold text-green-600">
                -${(Math.max(0, totalIncome - baseDeduction) - Math.max(0, totalIncome - shiftedIncome - deferredIncome - strategyBreakdown.totalDeductions)).toLocaleString()}
              </div>

              <div 
                className="font-medium cursor-pointer flex items-center"
                onClick={() => setShowFederalBrackets(!showFederalBrackets)}
              >
                Federal Tax
                {showFederalBrackets ? (
                  <ChevronUp className="ml-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4" />
                )}
              </div>
              <div className="text-right font-semibold">
                ${baseBreakdown.federal.toLocaleString()}
              </div>
              <div className="text-right font-semibold">
                ${strategyBreakdown.federal.toLocaleString()}
              </div>
              <div className="text-right font-semibold text-green-600">
                -${totalSavings.federal.toLocaleString()}
              </div>

              {rates.state?.[taxInfo.state]?.brackets && (
                <>
                  <div 
                    className="font-medium cursor-pointer flex items-center"
                    onClick={() => setShowStateBrackets(!showStateBrackets)}
                  >
                    State Tax
                    {showStateBrackets ? (
                      <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                  <div className="text-right font-semibold">
                    ${baseBreakdown.state.toLocaleString()}
                  </div>
                  <div className="text-right font-semibold">
                    ${strategyBreakdown.state.toLocaleString()}
                  </div>
                  <div className="text-right font-semibold text-green-600">
                    -${totalSavings.state.toLocaleString()}
                  </div>
                </>
              )}

              {includeFica && (
                <>
                  <div className="font-medium">Social Security Tax</div>
                  <div className="text-right font-semibold">
                    ${baseBreakdown.socialSecurity.toLocaleString()}
                  </div>
                  <div className="text-right font-semibold">
                    ${strategyBreakdown.socialSecurity.toLocaleString()}
                  </div>
                  <div className="text-right font-semibold text-green-600">
                    -${(baseBreakdown.socialSecurity - strategyBreakdown.socialSecurity).toLocaleString()}
                  </div>

                  <div className="font-medium">Medicare Tax</div>
                  <div className="text-right font-semibold">
                    ${baseBreakdown.medicare.toLocaleString()}
                  </div>
                  <div className="text-right font-semibold">
                    ${strategyBreakdown.medicare.toLocaleString()}
                  </div>
                  <div className="text-right font-semibold text-green-600">
                    -${(baseBreakdown.medicare - strategyBreakdown.medicare).toLocaleString()}
                  </div>
                </>
              )}

              <div className="font-medium border-t-2 pt-4">Total Tax Savings</div>
              <div className="text-right border-t-2 pt-4 font-semibold">-</div>
              <div className="text-right border-t-2 pt-4 font-semibold">-</div>
              <div className="text-right border-t-2 pt-4 font-semibold text-green-600">
                ${totalSavings.total.toLocaleString()}
              </div>
            </div>
          </div>

          {showFederalBrackets && (
            <div className="mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h5 className="font-semibold">Federal Tax Brackets</h5>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bracket Range</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Before</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax After</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {baseBreakdown.federalBrackets.map((bracket, index) => {
                    const afterBracket = strategyBreakdown.federalBrackets[index];
                    const savings = bracket.tax - (afterBracket?.tax || 0);
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(bracket.rate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${bracket.min.toLocaleString()} - {bracket.max === Infinity ? 'Higher' : '$' + bracket.max.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          ${bracket.tax.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          ${(afterBracket?.tax || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {savings > 0 && (
                            <span className="text-green-600">
                              ${savings.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={2} className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right">
                      ${baseBreakdown.federal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ${strategyBreakdown.federal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-600">
                        ${(baseBreakdown.federal - strategyBreakdown.federal).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {showStateBrackets && rates.state?.[taxInfo.state]?.brackets && (
            <div className="mb-6 bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h5 className="font-semibold">State Tax Brackets</h5>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bracket Range</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Before</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax After</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Savings</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {baseBreakdown.stateBrackets.map((bracket, index) => {
                    const afterBracket = strategyBreakdown.stateBrackets[index];
                    const savings = bracket.tax - (afterBracket?.tax || 0);
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(bracket.rate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${bracket.min.toLocaleString()} - {bracket.max === Infinity ? 'Higher' : '$' + bracket.max.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          ${bracket.tax.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          ${(afterBracket?.tax || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {savings > 0 && (
                            <span className="text-green-600">
                              ${savings.toLocaleString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={2} className="px-6 py-4">Total</td>
                    <td className="px-6 py-4 text-right">
                      ${baseBreakdown.state.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      ${strategyBreakdown.state.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-600">
                        ${(baseBreakdown.state - strategyBreakdown.state).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}