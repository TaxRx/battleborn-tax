import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown } from '../../../types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface ProgressBarData {
  totalIncome: number;
  shiftedIncome: number;
  deferredIncome: number;
  baseBreakdown: TaxBreakdown;
  strategyBreakdown: TaxBreakdown;
  charitableDonationAmount: number;
  progressColors: { [key: string]: string };
}

interface TaxBracketBreakdownProps {
  taxInfo: TaxInfo;
  rates: TaxRates;
  strategies: TaxStrategy[];
  isExpanded: boolean;
  onToggle: () => void;
  progressBarData?: ProgressBarData;
}

// Clean Progress Bar Component
interface CleanProgressBarProps {
  title: string;
  data: { label: string; value: number; color: string }[];
  total: number;
}

function CleanProgressBar({ title, data, total }: CleanProgressBarProps) {
  const validData = data.filter(item => item.value > 0);
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="heading-tertiary text-professional-navy mb-1">{title}</h3>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">${Math.round(total).toLocaleString()}</span>
        </div>
      </div>
      
      {/* Single stacked progress bar */}
      <div>
        <div className="w-full bg-gray-200 h-6 flex overflow-hidden" style={{ borderRadius: '4px' }}>
          {validData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div
                key={index}
                className="h-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.label}: $${Math.round(item.value).toLocaleString()} (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
          {validData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center space-x-2 text-xs">
                <div
                  className="w-3 h-3 flex-shrink-0"
                  style={{ backgroundColor: item.color, borderRadius: '2px' }}
                />
                <span className="text-gray-700 truncate">
                  {item.label}: ${Math.round(item.value).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function TaxBracketBreakdown({
  taxInfo,
  rates,
  strategies,
  isExpanded,
  onToggle,
  progressBarData
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
        if (strategy.id === 'reinsurance' && strategy.details?.reinsurance) {
          return total + strategy.details.reinsurance.userContribution;
        }
        return total;
      }, 0);
  }, [strategies]);

  // Calculate deferred income (simplified for now)
  const deferredIncome = useMemo(() => {
    return strategies
      .filter(s => s.enabled && s.category === 'income_deferred')
      .reduce((total, strategy) => {
        // Reinsurance is now in income_shifted category, so no longer handled here
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

  // Calculate CTB AGI Bond Offset
  const ctbAgiBondOffset = useMemo(() => {
    const ctbStrategy = strategies.find(s => s.enabled && s.id === 'convertible_tax_bonds');
    if (!ctbStrategy?.details?.convertibleTaxBonds?.ctbTaxOffset) {
      return 0;
    }

    const ctbTaxOffset = ctbStrategy.details.convertibleTaxBonds.ctbTaxOffset;
    
    // Calculate what AGI reduction would achieve the same tax reduction
    // We need to reverse engineer this by finding the AGI that would result in the same tax burden
    
    // First, calculate current tax burden without CTB
    const strategiesWithoutCtb = strategies.filter(s => s.id !== 'convertible_tax_bonds');
    const breakdownWithoutCtb = calculateTaxBreakdown(taxInfo, rates, strategiesWithoutCtb);
    const currentTaxBurden = breakdownWithoutCtb.federal + breakdownWithoutCtb.state + (includeFica ? breakdownWithoutCtb.fica : 0);
    
    // Target tax burden after CTB
    const targetTaxBurden = currentTaxBurden - ctbTaxOffset;
    
    // Binary search to find the AGI that would result in the target tax burden
    let low = 0;
    let high = totalIncome;
    let result = 0;
    
    for (let i = 0; i < 20; i++) { // Limit iterations to prevent infinite loop
      const mid = (low + high) / 2;
      
      // Create modified tax info with reduced AGI
      const modifiedTaxInfo = {
        ...taxInfo,
        wagesIncome: Math.max(0, taxInfo.wagesIncome - mid),
        passiveIncome: Math.max(0, taxInfo.passiveIncome - Math.max(0, mid - taxInfo.wagesIncome)),
        unearnedIncome: Math.max(0, taxInfo.unearnedIncome - Math.max(0, mid - taxInfo.wagesIncome - taxInfo.passiveIncome)),
        ordinaryK1Income: Math.max(0, (taxInfo.ordinaryK1Income || 0) - Math.max(0, mid - taxInfo.wagesIncome - taxInfo.passiveIncome - taxInfo.unearnedIncome)),
        guaranteedK1Income: Math.max(0, (taxInfo.guaranteedK1Income || 0) - Math.max(0, mid - taxInfo.wagesIncome - taxInfo.passiveIncome - taxInfo.unearnedIncome - (taxInfo.ordinaryK1Income || 0)))
      };
      
      const modifiedBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates, strategiesWithoutCtb);
      const modifiedTaxBurden = modifiedBreakdown.federal + modifiedBreakdown.state + (includeFica ? modifiedBreakdown.fica : 0);
      
      if (Math.abs(modifiedTaxBurden - targetTaxBurden) < 1) {
        result = mid;
        break;
      } else if (modifiedTaxBurden > targetTaxBurden) {
        low = mid;
      } else {
        high = mid;
      }
    }
    
    return Math.round(result);
  }, [strategies, taxInfo, rates, includeFica, totalIncome]);

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
          {/* Progress Bars Section */}
          {progressBarData && (
            <div className="card-professional mb-6">
              <div className="space-y-8">
                {/* Income Distribution */}
                <CleanProgressBar
                  title="Income Distribution"
                  data={[
                    { label: 'W-2 Income', value: taxInfo.wagesIncome, color: progressBarData.progressColors.w2Income },
                    { label: 'Passive Income', value: taxInfo.passiveIncome, color: progressBarData.progressColors.passiveIncome },
                    { label: 'Unearned Income', value: taxInfo.unearnedIncome, color: progressBarData.progressColors.unearnedIncome },
                    { label: 'Ordinary K-1', value: taxInfo.ordinaryK1Income || 0, color: progressBarData.progressColors.ordinaryK1 },
                    { label: 'Guaranteed K-1', value: taxInfo.guaranteedK1Income || 0, color: progressBarData.progressColors.guaranteedK1 }
                  ]}
                  total={progressBarData.totalIncome}
                />

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Before Strategies */}
                <CleanProgressBar
                  title="Before Strategies"
                  data={[
                    { label: 'Federal Tax', value: progressBarData.baseBreakdown.federal, color: progressBarData.progressColors.federal },
                    { label: 'State Tax', value: progressBarData.baseBreakdown.state, color: progressBarData.progressColors.state },
                    { label: 'Social Security', value: progressBarData.baseBreakdown.socialSecurity, color: progressBarData.progressColors.socialSecurity },
                    { label: 'Medicare', value: progressBarData.baseBreakdown.medicare, color: progressBarData.progressColors.medicare },
                    { label: 'Self-Employment Tax', value: progressBarData.baseBreakdown.selfEmployment, color: progressBarData.progressColors.selfEmployment },
                    { label: 'Take Home', value: progressBarData.totalIncome - progressBarData.baseBreakdown.total, color: progressBarData.progressColors.takeHome }
                  ]}
                  total={progressBarData.totalIncome}
                />

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* After Strategies */}
                <CleanProgressBar
                  title="After Strategies"
                  data={[
                    { label: 'Federal Tax', value: progressBarData.strategyBreakdown.federal, color: progressBarData.progressColors.federal },
                    { label: 'State Tax', value: progressBarData.strategyBreakdown.state, color: progressBarData.progressColors.state },
                    { label: 'Social Security', value: progressBarData.strategyBreakdown.socialSecurity, color: progressBarData.progressColors.socialSecurity },
                    { label: 'Medicare', value: progressBarData.strategyBreakdown.medicare, color: progressBarData.progressColors.medicare },
                    { label: 'Self-Employment Tax', value: progressBarData.strategyBreakdown.selfEmployment, color: progressBarData.progressColors.selfEmployment },
                    { label: 'Income Shifted', value: progressBarData.shiftedIncome, color: progressBarData.progressColors.incomeShifted },
                    { label: 'Income Deferred', value: progressBarData.deferredIncome, color: progressBarData.progressColors.incomeDeferred },
                    { label: 'Take Home', value: progressBarData.totalIncome - progressBarData.strategyBreakdown.total - progressBarData.shiftedIncome - progressBarData.deferredIncome, color: progressBarData.progressColors.takeHome }
                  ]}
                  total={progressBarData.totalIncome}
                />
              </div>
            </div>
          )}

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

              {ctbAgiBondOffset > 0 && (
                <>
                  <div className="font-medium">AGI Bond Offset</div>
                  <div className="text-right">-</div>
                  <div className="text-right text-green-600">
                    ${ctbAgiBondOffset.toLocaleString()}
                  </div>
                  <div className="text-right text-green-600">
                    -${ctbAgiBondOffset.toLocaleString()}
                  </div>
                </>
              )}

              <div className="font-medium border-t pt-4">Taxable Income</div>
              <div className="text-right border-t pt-4 font-semibold">
                ${Math.max(0, totalIncome - baseDeduction).toLocaleString()}
              </div>
              <div className="text-right border-t pt-4 font-semibold text-blue-600">
                ${Math.max(0, totalIncome - shiftedIncome - deferredIncome - ctbAgiBondOffset - strategyBreakdown.totalDeductions).toLocaleString()}
              </div>
              <div className="text-right border-t pt-4 font-semibold text-green-600">
                -${(Math.max(0, totalIncome - baseDeduction) - Math.max(0, totalIncome - shiftedIncome - deferredIncome - ctbAgiBondOffset - strategyBreakdown.totalDeductions)).toLocaleString()}
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