import React, { useState, useEffect } from 'react';
import { Check, Info } from 'lucide-react';
import { TaxInfo } from '../types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { NumericFormat } from 'react-number-format';

interface CharitableDonationCalculatorProps {
  taxInfo: TaxInfo;
  rates: any;
  strategies: any[];
  onSavingsChange: (details: any) => void;
}

export default function CharitableDonationCalculator({
  taxInfo,
  rates,
  strategies,
  onSavingsChange
}: CharitableDonationCalculatorProps) {
  // Find existing charitable donation strategy
  const existingStrategy = strategies.find(s => s.id === 'charitable_donation');
  const existingDetails = existingStrategy?.details?.charitableDonation;

  // Initialize state with existing details if they exist
  const [donationAmount, setDonationAmount] = useState(existingDetails?.donationAmount || 34444);
  const [fmvMultiplier, setFmvMultiplier] = useState(existingDetails?.fmvMultiplier || 5);
  const [agiLimit, setAgiLimit] = useState(existingDetails?.agiLimit || 0.6);
  
  // State to store calculated benefits
  const [calculatedBenefits, setCalculatedBenefits] = useState({
    federalSavings: 0,
    stateSavings: 0,
    totalBenefit: 0
  });

  // Calculate total income (AGI)
  const totalIncome = taxInfo.wagesIncome + 
    taxInfo.passiveIncome + 
    taxInfo.unearnedIncome +
    (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0);

  // Calculate maximum allowed donation based on AGI limit
  const maxDonation = Math.floor(totalIncome * agiLimit);

  // Calculate deduction value (capped at AGI limit)
  const deductionValue = (donationAmount || 0) * fmvMultiplier;

  // Only calculate if we have a valid donation amount
  const shouldCalculate = donationAmount && donationAmount > 0;

  // Calculate benefits and update state
  useEffect(() => {
    if (shouldCalculate) {
      // SIMPLE APPROACH: Use before/after comparison just like Tax Savings Value card
      // Calculate baseline tax (no charitable deduction)
      const baselineBreakdown = calculateTaxBreakdown(taxInfo, rates);
      
      // Calculate tax WITH charitable deduction
      // Use the same logic as the working system - modify customDeduction and disable standardDeduction
      const standardDeduction = rates.federal.standardDeduction[taxInfo.filingStatus] || 0;
      const currentItemizedDeductions = taxInfo.standardDeduction ? 0 : (taxInfo.customDeduction || 0);
      const newItemizedTotal = currentItemizedDeductions + deductionValue;
      
      let modifiedTaxInfo = taxInfo;
      let federalSavings = 0;
      let stateSavings = 0;
      let totalBenefit = 0;
      
      // Only itemize if the new total exceeds standard deduction
      if (newItemizedTotal > standardDeduction) {
        modifiedTaxInfo = {
          ...taxInfo,
          standardDeduction: false,
          customDeduction: newItemizedTotal
        };
        
        const withCharityBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);
        
        // Tax savings = difference in total tax
        federalSavings = Math.round(baselineBreakdown.federal - withCharityBreakdown.federal);
        stateSavings = Math.round(baselineBreakdown.state - withCharityBreakdown.state);
        totalBenefit = federalSavings + stateSavings;
      }

      // Update state with calculated values
      setCalculatedBenefits({
        federalSavings,
        stateSavings,
        totalBenefit
      });

      console.log('[CHARITABLE DONATION TRACE] BENEFITS_CALCULATED:', {
        donationAmount,
        deductionValue,
        fmvMultiplier,
        totalBenefit,
        federalSavings,
        stateSavings,
        netBenefit: totalBenefit - (donationAmount || 0),
        standardDeduction,
        currentItemizedDeductions,
        newItemizedTotal,
        willItemize: newItemizedTotal > standardDeduction
      });

      const savingsData = {
        charitableDonation: {
          donationAmount: donationAmount || 0,
          fmvMultiplier,
          agiLimit,
          deductionValue,
          federalSavings,
          stateSavings,
          totalBenefit
        }
      };

      onSavingsChange(savingsData);
    } else {
      // Clear calculated values when no donation amount
      setCalculatedBenefits({
        federalSavings: 0,
        stateSavings: 0,
        totalBenefit: 0
      });
      
      const savingsData = {
        charitableDonation: {
          donationAmount: donationAmount || 0,
          fmvMultiplier,
          agiLimit,
          deductionValue: 0,
          federalSavings: 0,
          stateSavings: 0,
          totalBenefit: 0
        }
      };
      onSavingsChange(savingsData);
    }
  }, [shouldCalculate, donationAmount, fmvMultiplier, agiLimit, deductionValue, totalIncome, taxInfo, rates, onSavingsChange]);

  // Use calculated values instead of hardcoded rates
  const netSavings = shouldCalculate ? Math.max(0, calculatedBenefits.totalBenefit - (donationAmount || 0)) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Information Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How Charitable Donations Work</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              Give with Purpose. Save with Confidence. Philanthropic tax benefit pathways allow you to reduce your tax burden while 
              making a meaningful impact through qualified 501(c)(3) charities. These programs are designed to be non-reportable 
              transactions under current IRS guidance. The FMV multiplier allows you to claim a deduction value higher than your actual cash contribution.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Inputs and Services */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AGI Deduction Limit
                </label>
                <select
                  value={agiLimit}
                  onChange={(e) => setAgiLimit(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0.3}>30% of AGI</option>
                  <option value={0.5}>50% of AGI</option>
                  <option value={0.6}>60% of AGI</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum allowed: ${maxDonation.toLocaleString()}
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FMV Multiplier
                </label>
                <select
                  value={fmvMultiplier}
                  onChange={(e) => setFmvMultiplier(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={4}>4x Fair Market Value</option>
                  <option value={4.5}>4.5x Fair Market Value</option>
                  <option value={5}>5x Fair Market Value</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Multiplies your donation amount for deduction purposes
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <NumericFormat
                    value={donationAmount || ''}
                    onValueChange={(values) => setDonationAmount(values.floatValue || null)}
                    thousandSeparator={true}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum allowed: ${maxDonation.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Implementation Services</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-gray-900">Pre-Vetted Assets & Qualified Charities</h5>
                  <p className="text-sm text-gray-600">We connect you with wholesale-donated assets and ensure compliant delivery to 501(c)(3) organizations</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-gray-900">Complete Filing Support</h5>
                  <p className="text-sm text-gray-600">Appraisal reports, IRS-compliant filing guides, Form 8283, and acknowledgment letters</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <h5 className="font-medium text-gray-900">Built-In Audit Support</h5>
                  <p className="text-sm text-gray-600">Expert response team, legal fund access, and documentation kits for state and IRS</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Benefit Summary</h3>
            
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Deduction Value</span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <span className="text-2xl font-bold text-blue-900">
                    ${deductionValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">State Tax Benefit</span>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="text-2xl font-bold text-green-900">
                    ${calculatedBenefits.stateSavings.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Federal Tax Benefit</span>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="text-2xl font-bold text-green-900">
                    ${calculatedBenefits.federalSavings.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Tax Savings</span>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <span className="text-2xl font-bold text-green-900">
                    ${calculatedBenefits.totalBenefit.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-emerald-100">Net Benefit</span>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <span className="text-3xl font-bold text-white">
                    ${netSavings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Key Benefits</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>FMV multiplier allows deduction value higher than cash contribution</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Qualified 501(c)(3) charities ensure full tax deductibility</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Non-reportable transactions under current IRS guidance</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Complete audit defense and documentation support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}