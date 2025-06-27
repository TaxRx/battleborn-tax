import React, { useState, useEffect, useMemo } from 'react';
import { NumericFormat } from 'react-number-format';
import { Info } from 'lucide-react';
import { calculateTaxBreakdown } from '../utils/taxCalculations';

interface ReinsuranceCalculatorProps {
  taxInfo: any;
  onSavingsChange: (details: any) => void;
  rates: any;
  strategies: any[];
  existingDetails?: {
    userContribution: number;
    agiReduction: number;
    federalTaxBenefit: number;
    stateTaxBenefit: number;
    totalTaxSavings: number;
    netYear1Cost: number;
    breakevenYears: number;
    futureValue: number;
    capitalGainsTax: number;
  };
}

export default function ReinsuranceCalculator({
  taxInfo,
  onSavingsChange,
  rates,
  strategies,
  existingDetails
}: ReinsuranceCalculatorProps) {
  const [userContribution, setUserContribution] = useState(0);

  // Constants
  const ANNUAL_CONTRIBUTION_CAP = 2800000; // $2.8M per IRC §831(b)
  const AGI_LIMIT_PERCENTAGE = 0.20; // 20% of AGI
  const MIN_AGI_THRESHOLD = 400000; // $80,000 / 20% = $400,000 AGI minimum
  const SETUP_ADMIN_RATE = 0.08; // 8% of contribution
  const ASSUMED_RETURN = 0.08; // 8% annual compounding
  const CAPITAL_GAINS_RATE = 0.20; // 20% capital gains tax rate

  // Get current AGI from tax info
  const currentAGI = useMemo(() => {
    // Calculate AGI from income components
    const totalIncome = taxInfo.wagesIncome + 
                       taxInfo.passiveIncome + 
                       taxInfo.unearnedIncome +
                       (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0);
    
    return totalIncome;
  }, [taxInfo.wagesIncome, taxInfo.passiveIncome, taxInfo.unearnedIncome, taxInfo.businessOwner, taxInfo.ordinaryK1Income, taxInfo.guaranteedK1Income]);

  // Calculate max allowed contribution
  const maxAllowedContribution = useMemo(() => {
    const agiLimit = currentAGI * AGI_LIMIT_PERCENTAGE;
    return Math.min(agiLimit, ANNUAL_CONTRIBUTION_CAP);
  }, [currentAGI]);

  // Check eligibility
  const isEligible = useMemo(() => {
    return currentAGI >= MIN_AGI_THRESHOLD;
  }, [currentAGI]);

  // Calculate AGI reduction (this is what gets deducted from AGI)
  const agiReduction = useMemo(() => {
    return userContribution;
  }, [userContribution]);

  // Calculate setup and admin cost
  const setupAdminCost = useMemo(() => {
    return Math.round(userContribution * SETUP_ADMIN_RATE);
  }, [userContribution]);

  // Calculate net year 1 cost (this will be calculated by the main tax system)
  const netYear1Cost = useMemo(() => {
    return userContribution + setupAdminCost;
  }, [userContribution, setupAdminCost]);

  // Calculate breakeven years
  const breakevenYears = useMemo(() => {
    if (userContribution <= 0) return 0;
    
    let years = 1;
    const maxYears = 50; // Reasonable upper limit
    
    while (years <= maxYears) {
      const futureValue = userContribution * Math.pow(1 + ASSUMED_RETURN, years);
      const gains = futureValue - userContribution;
      const capitalGainsTax = gains * CAPITAL_GAINS_RATE;
      const netAfterTax = futureValue - capitalGainsTax;
      
      if (netAfterTax >= userContribution) {
        return years;
      }
      years++;
    }
    
    return maxYears; // If no breakeven found within reasonable timeframe
  }, [userContribution]);

  // Calculate future value and capital gains tax at breakeven
  const futureValue = useMemo(() => {
    if (breakevenYears <= 0) return 0;
    return Math.round(userContribution * Math.pow(1 + ASSUMED_RETURN, breakevenYears));
  }, [userContribution, breakevenYears]);

  // Calculate capital gains tax on the full contribution amount (not just gains)
  const capitalGainsTax = useMemo(() => {
    // Capital gains tax is calculated on the full amount that will be withdrawn
    // This represents the tax on converting the contribution to long-term capital gains
    return Math.round(userContribution * CAPITAL_GAINS_RATE);
  }, [userContribution]);

  // Calculate actual tax benefit using before/after approach
  const { federalTaxBenefit, stateTaxBenefit, totalTaxSavings } = useMemo(() => {
    if (!taxInfo || !rates || userContribution <= 0) {
      return { federalTaxBenefit: 0, stateTaxBenefit: 0, totalTaxSavings: 0 };
    }
    // Clone strategies and update reinsurance details
    const updatedStrategies = (strategies || []).map(s =>
      s.id === 'reinsurance'
        ? { ...s, enabled: true, details: { ...s.details, reinsurance: { ...s.details?.reinsurance, userContribution } } }
        : s
    );
    // Remove reinsurance for baseline
    const baselineStrategies = (strategies || []).map(s =>
      s.id === 'reinsurance'
        ? { ...s, enabled: false }
        : s
    );
    const base = calculateTaxBreakdown(taxInfo, rates, baselineStrategies);
    const withRe = calculateTaxBreakdown(taxInfo, rates, updatedStrategies);
    const federalTaxBenefit = Math.max(0, base.federal - withRe.federal);
    const stateTaxBenefit = Math.max(0, base.state - withRe.state);
    const totalTaxSavings = Math.max(0, base.total - withRe.total);
    return { federalTaxBenefit, stateTaxBenefit, totalTaxSavings };
  }, [taxInfo, rates, strategies, userContribution]);

  // Update parent component when calculations change
  useEffect(() => {
    if (!onSavingsChange) {
      return;
    }
    
    if (userContribution > 0 && isEligible) {
      const savingsDetails = {
        reinsurance: {
          userContribution,
          agiReduction,
          federalTaxBenefit,
          stateTaxBenefit,
          totalTaxSavings,
          netYear1Cost,
          breakevenYears,
          futureValue,
          capitalGainsTax,
          setupAdminCost
        }
      };
      onSavingsChange(savingsDetails);
    } else {
      onSavingsChange(null);
    }
  }, [userContribution, agiReduction, netYear1Cost, breakevenYears, futureValue, capitalGainsTax, setupAdminCost, isEligible, federalTaxBenefit, stateTaxBenefit, totalTaxSavings, onSavingsChange]);

  // Hydrate state from existingDetails if present
  useEffect(() => {
    if (existingDetails) {
      setUserContribution(existingDetails.userContribution || 0);
    }
  }, [existingDetails]);

  // Auto-adjust contribution if it exceeds limits
  useEffect(() => {
    if (userContribution > maxAllowedContribution) {
      setUserContribution(maxAllowedContribution);
    }
  }, [userContribution, maxAllowedContribution]);

  if (!isEligible) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Not Eligible</h4>
              <p className="text-red-700">
                Based on your current AGI of ${currentAGI.toLocaleString()}, this strategy is not a good fit.
              </p>
              <p className="text-red-600 text-sm mt-2">
                Minimum AGI required: ${MIN_AGI_THRESHOLD.toLocaleString()}
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
            <h4 className="font-semibold text-blue-800 mb-2">How Reinsurance Works</h4>
            <p className="text-blue-700 text-sm mb-2">
              Microcaptive insurance arrangements allow you to reduce your AGI by contributing to a captive insurance company. 
              The contribution is deductible, converting ordinary income to long-term capital gains.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Benefits:</strong> AGI reduction, tax deferral, and potential long-term capital gains treatment. 
              <strong>Requirements:</strong> Minimum AGI of ${MIN_AGI_THRESHOLD.toLocaleString()}, maximum contribution of ${ANNUAL_CONTRIBUTION_CAP.toLocaleString()}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current AGI
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-gray-900">
                ${currentAGI.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Allowed Contribution
            </label>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-green-900">
                ${maxAllowedContribution.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lesser of 20% of AGI or $2.8M cap
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Contribution
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                $
              </span>
              <NumericFormat
                value={userContribution}
                onValueChange={(values) => setUserContribution(values.floatValue || 0)}
                thousandSeparator=","
                decimalScale={0}
                max={maxAllowedContribution}
                className="w-full pl-8 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ${maxAllowedContribution.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setup & Admin Cost
            </label>
            <div className="bg-orange-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-orange-900">
                ${setupAdminCost.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              8% of contribution
            </p>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AGI Reduction
            </label>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-blue-900">
                ${agiReduction.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Federal Tax Benefit
            </label>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-blue-900">
                ${federalTaxBenefit.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State Tax Benefit
            </label>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-blue-900">
                ${stateTaxBenefit.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Tax Savings
            </label>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-green-900">
                ${totalTaxSavings.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Net Year 1 Cost
            </label>
            <div className={`p-3 rounded-lg ${netYear1Cost >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <span className={`text-2xl font-bold ${netYear1Cost >= 0 ? 'text-red-900' : 'text-green-900'}`}>
                ${netYear1Cost.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Contribution + Setup/Admin
            </p>
          </div>
        </div>
      </div>

      {/* Long-Term Capital Gains Modeling */}
      {userContribution > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mt-6">
          <h4 className="font-semibold text-purple-800 mb-4">Long-Term Capital Gains Modeling</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Breakeven Years
              </label>
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <span className="text-2xl font-bold text-purple-900">
                  {breakevenYears}
                </span>
                <span className="text-purple-700 ml-1">years</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Time to recover initial investment
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Future Value
              </label>
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <span className="text-2xl font-bold text-purple-900">
                  ${futureValue.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                At {breakevenYears} years (8% annual return)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-700 mb-2">
                Capital Gains Tax
              </label>
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <span className="text-2xl font-bold text-purple-900">
                  ${capitalGainsTax.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-purple-600 mt-1">
                20% rate on gains
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
            <p className="text-purple-800 text-sm">
              <strong>Investment must remain in the captive at least {breakevenYears} years to break even on capital gains exposure.</strong>
            </p>
            <p className="text-purple-700 text-xs mt-2">
              Assumes 8% annual return and 20% capital gains tax rate. After {breakevenYears} years, 
              the net after-tax value (${(futureValue - capitalGainsTax).toLocaleString()}) will equal or exceed your initial contribution.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 