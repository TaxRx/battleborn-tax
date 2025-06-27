import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { TaxInfo, TaxRates, TaxBreakdown } from '../types';
import { TaxStrategy } from '../lib/core/types/strategy';
import { calculateTaxBreakdown, calculateMarginalRate } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface ProgressBarData {
  totalIncome: number;
  shiftedIncome: number;
  deferredIncome: number;
  baseBreakdown: TaxBreakdown;
  strategyBreakdown: TaxBreakdown;
  charitableDonationAmount: number;
  progressColors: { [key: string]: string };
  effectiveRate?: number;
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
  isTaxChart?: boolean;
  effectiveRate?: number;
}

function CleanProgressBar({ title, data, total, isTaxChart = false, effectiveRate }: CleanProgressBarProps) {
  const validData = data.filter(item => item.value > 0);
  
  // Calculate total tax for tax charts
  const totalTax = isTaxChart ? validData.reduce((sum, item) => {
    if (item.label !== 'Take Home' && item.label !== 'Income Shifted' && item.label !== 'Income Deferred') {
      return sum + item.value;
    }
    return sum;
  }, 0) : total;
  
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {isTaxChart ? 'Total Tax' : 'Total'}: <span className="font-semibold text-gray-900">${Math.round(totalTax).toLocaleString()}</span>
          </div>
          {isTaxChart && effectiveRate !== undefined && (
            <div className="text-sm text-gray-600">
              <span>
                Effective: <span className="font-semibold text-gray-900">{effectiveRate.toFixed(1)}%</span>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Sleek stacked progress bar */}
      <div>
        <div className="w-full bg-gray-100 h-4 flex overflow-hidden rounded-full shadow-inner">
          {validData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div
                key={index}
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                }}
                title={`${item.label}: $${Math.round(item.value).toLocaleString()} (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        
        {/* Compact legend */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 mt-2">
          {validData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={index} className="flex items-center space-x-1.5 text-xs">
                <div
                  className="w-2.5 h-2.5 flex-shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 font-medium truncate">
                  {item.label}
                </span>
                <span className="text-gray-500">
                  ${Math.round(item.value).toLocaleString()}
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

  // Calculate effective and marginal tax rates
  const baseEffectiveRate = useMemo(() => {
    const totalTax = baseBreakdown.federal + baseBreakdown.state + (includeFica ? baseBreakdown.fica : 0);
    return totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;
  }, [baseBreakdown, totalIncome, includeFica]);

  const strategyEffectiveRate = useMemo(() => {
    const totalTax = strategyBreakdown.federal + strategyBreakdown.state + (includeFica ? strategyBreakdown.fica : 0);
    const adjustedIncome = totalIncome - shiftedIncome - deferredIncome;
    return adjustedIncome > 0 ? (totalTax / adjustedIncome) * 100 : 0;
  }, [strategyBreakdown, totalIncome, shiftedIncome, deferredIncome, includeFica]);

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
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
        >
          <span>{isExpanded ? 'Hide' : 'Show'} Tax Bracket Breakdown</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        
        {/* Payroll Taxes Toggle - only show when expanded */}
        {isExpanded && (
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
        )}
        
        {/* Payroll Taxes Toggle - show in title bar when collapsed */}
        {!isExpanded && (
          <div className="relative group">
            <button
              onClick={() => setIncludeFica(!includeFica)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              {includeFica ? (
                <ToggleRight className="w-5 h-5 text-emerald-600" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </button>
            
            {/* Rollover tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Include Payroll Taxes
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <>
          {/* Progress Bars Section */}
          {progressBarData && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Income & Tax Analysis</h3>
                <p className="text-blue-100 text-sm mt-1">Visual breakdown of your income distribution and tax impact</p>
              </div>
              <div className="p-6 space-y-8">
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
                  isTaxChart={true}
                  effectiveRate={baseEffectiveRate}
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
                  isTaxChart={true}
                  effectiveRate={strategyEffectiveRate}
                />
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h4 className="text-xl font-bold text-white">Income & Deduction Summary</h4>
              <p className="text-emerald-100 text-sm mt-1">Detailed breakdown of income, deductions, and tax calculations</p>
            </div>
            
            {taxInfo.deductionLimitReached && (
              <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Deduction Limit Reached
                    </h3>
                    <div className="mt-1 text-sm text-amber-700">
                      <p>Total deductions have been capped at 80% of taxable income to maintain minimum tax liability.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4 grid grid-cols-4 mb-3">
                  <div className="font-semibold text-gray-700"></div>
                  <div className="text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">Before</div>
                  <div className="text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">After</div>
                  <div className="text-center font-semibold text-gray-700 uppercase text-xs tracking-wider">Change</div>
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
          </div>

          {showFederalBrackets && (
            <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h5 className="text-lg font-bold text-white">Federal Tax Brackets</h5>
                <p className="text-purple-100 text-sm mt-1">Detailed breakdown of federal tax calculations by bracket</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bracket Range</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tax Before</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tax After</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Savings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {baseBreakdown.federalBrackets.map((bracket, index) => {
                      const afterBracket = strategyBreakdown.federalBrackets[index];
                      const savings = bracket.tax - (afterBracket?.tax || 0);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {(bracket.rate * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            ${bracket.min.toLocaleString()} - {bracket.max === Infinity ? 'Higher' : '$' + bracket.max.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap text-sm font-medium text-gray-900">
                            ${bracket.tax.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap text-sm font-medium text-gray-900">
                            ${(afterBracket?.tax || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap">
                            {savings > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ${savings.toLocaleString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-bold border-t-2 border-gray-200">
                      <td colSpan={2} className="px-6 py-4 text-gray-900">Total</td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ${baseBreakdown.federal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ${strategyBreakdown.federal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                          ${(baseBreakdown.federal - strategyBreakdown.federal).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showStateBrackets && rates.state?.[taxInfo.state]?.brackets && (
            <div className="mb-6 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                <h5 className="text-lg font-bold text-white">State Tax Brackets</h5>
                <p className="text-indigo-100 text-sm mt-1">Detailed breakdown of state tax calculations by bracket</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bracket Range</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tax Before</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Tax After</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Savings</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {baseBreakdown.stateBrackets.map((bracket, index) => {
                      const afterBracket = strategyBreakdown.stateBrackets[index];
                      const savings = bracket.tax - (afterBracket?.tax || 0);
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {(bracket.rate * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                            ${bracket.min.toLocaleString()} - {bracket.max === Infinity ? 'Higher' : '$' + bracket.max.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap text-sm font-medium text-gray-900">
                            ${bracket.tax.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap text-sm font-medium text-gray-900">
                            ${(afterBracket?.tax || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right whitespace-nowrap">
                            {savings > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ${savings.toLocaleString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-bold border-t-2 border-gray-200">
                      <td colSpan={2} className="px-6 py-4 text-gray-900">Total</td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ${baseBreakdown.state.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900">
                        ${strategyBreakdown.state.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                          ${(baseBreakdown.state - strategyBreakdown.state).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}