import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { TaxInfo } from '../types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface AugustaRuleCalculatorProps {
  taxInfo: TaxInfo;
  onSavingsChange: (details: any) => void;
  rates: any;
}

export default function AugustaRuleCalculator({
  taxInfo,
  onSavingsChange,
  rates
}: AugustaRuleCalculatorProps) {
  const [daysRented, setDaysRented] = useState<number>(14);
  const [dailyRate, setDailyRate] = useState<number>(1500);
  const { includeFica } = useTaxStore();

  // Guard against missing rates
  if (!rates || !taxInfo) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-600 font-bold mb-2">Configuration Error</h3>
        <p className="text-red-700">
          Unable to calculate tax savings. Please try again or contact support if the issue persists.
        </p>
      </div>
    );
  }

  // Calculate total rent
  const totalRent = daysRented * dailyRate;

  // Memoize tax savings calculation
  const { stateBenefit, federalBenefit, ficaBenefit, totalBenefit } = useMemo(() => {
    if (!rates || !taxInfo || !taxInfo.businessOwner) {
      return { stateBenefit: 0, federalBenefit: 0, ficaBenefit: 0, totalBenefit: 0 };
    }

    // Calculate tax without Augusta Rule
    const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);

    // Create modified tax info with reduced income
    const modifiedTaxInfo = { ...taxInfo };

    // If W2 income is over $160,000, reduce it first up to that threshold
    if (modifiedTaxInfo.wagesIncome > 160000) {
      const w2Reduction = Math.min(
        modifiedTaxInfo.wagesIncome - 160000,
        totalRent
      );
      modifiedTaxInfo.wagesIncome -= w2Reduction;

      // Any remaining rental amount reduces business income
      const remainingReduction = totalRent - w2Reduction;
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
          modifiedTaxInfo.ordinaryK1Income - totalRent
        );
      }
    }

    // Calculate tax with Augusta Rule income reduction
    const augustaBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

    // Calculate the differences
    const stateBenefit = Math.max(0, baseBreakdown.state - augustaBreakdown.state);
    const federalBenefit = Math.max(0, baseBreakdown.federal - augustaBreakdown.federal);
    const ficaBenefit = Math.max(
      0,
      (baseBreakdown.socialSecurity + baseBreakdown.medicare) -
      (augustaBreakdown.socialSecurity + augustaBreakdown.medicare)
    );

    return {
      stateBenefit,
      federalBenefit,
      ficaBenefit,
      totalBenefit: stateBenefit + federalBenefit + ficaBenefit
    };
  }, [taxInfo, rates, totalRent]);

  // Memoize savings details
  const savingsDetails = useMemo(() => ({
    augustaRule: {
      daysRented,
      dailyRate,
      totalRent,
      stateBenefit,
      federalBenefit,
      ficaBenefit,
      totalBenefit: includeFica ? totalBenefit : totalBenefit - ficaBenefit
    }
  }), [daysRented, dailyRate, totalRent, stateBenefit, federalBenefit, ficaBenefit, totalBenefit, includeFica]);

  useEffect(() => {
    onSavingsChange(savingsDetails);
  }, [onSavingsChange, savingsDetails]);

  if (!taxInfo.businessOwner) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-600 font-bold mb-2">Business Owner Required</h3>
        <p className="text-red-700">
          The Augusta Rule is only available to business owners. To qualify, you must have a business
          that can rent your personal residence for legitimate business purposes.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-600">
          The Augusta Rule allows homeowners to rent out their property for up to 14 days each year without having to report the rental 
          income on their federal income taxes. That's tax-free income.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-8 items-start">
        <div>
          <h3 className="text-[#12ab61] font-bold text-lg mb-6">
            How We Help You Qualify for the Augusta Rule
          </h3>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Turnkey Lease Setup</h4>
                <p className="text-base text-gray-600">
                  We establish the short-term rental structure, including funds transfer automation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Custom Document Suite</h4>
                <p className="text-base text-gray-600">Required reports provided, including:</p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Short-Term Rental Lease Agreement</li>
                  <li>• Jurat (attestation of accuracy)</li>
                  <li>• Comparable Market Valuation Report</li>
                  <li>• Corporate Board Meeting Minutes</li>
                  <li>• Pro Forma IRS Filing Guidelines</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">AuditShield Enrollment</h4>
                <p className="text-base text-gray-600">We protect your filings in the event of audit:</p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Dedicated IRS audit support</li>
                  <li>• Penalty protection for Augusta Rule filings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total rental days</p>
            <input
              type="number"
              value={daysRented}
              onChange={(e) => setDaysRented(Math.min(14, Math.max(0, parseInt(e.target.value) || 0)))}
              className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
              max="14"
            />
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Daily amount</p>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">$</span>
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(Math.max(0, parseInt(e.target.value) || 0))}
                className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">TOTAL RENT</p>
              <p className="text-2xl font-bold text-gray-900">${totalRent.toLocaleString()}</p>
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