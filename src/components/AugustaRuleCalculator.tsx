import React, { useState, useEffect, useMemo } from 'react';
import { Check, Info } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { TaxInfo } from '../types';
import { calculateTaxBreakdown, calculateEffectiveStrategyBenefit } from '../utils/taxCalculations';
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
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Configuration Error</h4>
              <p className="text-red-700">
                Unable to calculate tax savings. Please try again or contact support if the issue persists.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total rent
  const totalRent = daysRented * dailyRate;

  // Memoize tax savings calculation using unified effective approach
  const { stateBenefit, federalBenefit, ficaBenefit, totalBenefit } = useMemo(() => {
    if (!rates || !taxInfo || !taxInfo.businessOwner || totalRent <= 0) {
      return { stateBenefit: 0, federalBenefit: 0, ficaBenefit: 0, totalBenefit: 0 };
    }

    // Create Augusta Rule strategy for effective calculation
    const augustaStrategy = {
      id: 'augusta_rule',
      name: 'Augusta Rule',
      category: 'income_shifted' as const,
      description: 'Rent your home to your business tax-free for up to 14 days per year',
      estimatedSavings: 0,
      enabled: true,
      details: {
        augustaRule: {
          daysRented,
          dailyRate,
          totalRent,
          stateBenefit: 0,
          federalBenefit: 0,
          ficaBenefit: 0,
          totalBenefit: 0
        }
      }
    };

    // Use unified effective strategy benefit calculation
    const { federal, state, fica, total } = calculateEffectiveStrategyBenefit(taxInfo, rates, augustaStrategy, []);

    return {
      federalBenefit: federal,
      stateBenefit: state,
      ficaBenefit: fica,
      totalBenefit: total
    };
  }, [taxInfo, rates, totalRent, daysRented, dailyRate]);

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
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">Business Owner Required</h4>
              <p className="text-red-700">
                The Augusta Rule is only available to business owners. To qualify, you must have a business
                that can rent your personal residence for legitimate business purposes.
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
            <h4 className="font-semibold text-blue-800 mb-2">How the Augusta Rule Works</h4>
            <p className="text-blue-700 text-sm mb-2">
              The Augusta Rule allows homeowners to rent out their property for up to 14 days each year without having to report the rental 
              income on their federal income taxes. That's tax-free income.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Benefits:</strong> Tax-free rental income, legitimate business expense, no reporting required. 
              <strong>Requirements:</strong> Business owner, maximum 14 days per year, legitimate business purpose.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rental Days
            </label>
            <div className="relative">
              <NumericFormat
                value={daysRented}
                onValueChange={(values) => setDaysRented(Math.min(14, Math.max(0, values.floatValue || 0)))}
                thousandSeparator=","
                decimalScale={0}
                max={14}
                className="w-full px-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: 14 days per year
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                $
              </span>
              <NumericFormat
                value={dailyRate}
                onValueChange={(values) => setDailyRate(Math.max(0, values.floatValue || 0))}
                thousandSeparator=","
                decimalScale={0}
                className="w-full pl-8 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Market rate for similar properties
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Rent
            </label>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-green-900">
                ${totalRent.toLocaleString()}
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
                <h5 className="font-semibold text-purple-900 mb-2">Turnkey Lease Setup</h5>
                <p className="text-sm text-purple-700">
                  We establish the short-term rental structure, including funds transfer automation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-purple-900 mb-2">Custom Document Suite</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Short-Term Rental Lease Agreement</li>
                  <li>• Jurat (attestation of accuracy)</li>
                  <li>• Comparable Market Valuation Report</li>
                  <li>• Corporate Board Meeting Minutes</li>
                  <li>• Pro Forma IRS Filing Guidelines</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-purple-200">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-purple-900 mb-2">AuditShield Enrollment</h5>
                <p className="text-sm text-purple-700 mb-2">We protect your filings in the event of audit:</p>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Dedicated IRS audit support</li>
                  <li>• Penalty protection for Augusta Rule filings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
          <p className="text-purple-800 text-sm">
            <strong>We handle all the paperwork and compliance requirements to ensure your Augusta Rule rental is properly structured for maximum tax benefits.</strong>
          </p>
          <p className="text-purple-700 text-xs mt-2">
            The Augusta Rule requires legitimate business purposes and proper documentation. We help you create appropriate 
            lease agreements and maintain proper records to withstand IRS scrutiny.
          </p>
        </div>
      </div>
    </div>
  );
}