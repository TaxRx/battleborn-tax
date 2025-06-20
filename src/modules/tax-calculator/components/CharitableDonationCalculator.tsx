import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { TaxInfo } from '../../../types';
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="body-large text-gray-700 leading-relaxed">
          Give with Purpose. Save with Confidence. Philanthropic tax benefit pathways allow you to reduce your tax burden while 
          making a meaningful impact through qualified 501(c)(3) charities. These programs are designed to be non-reportable 
          transactions under current IRS guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-12 items-start">
        <div>
          <h3 className="heading-tertiary text-professional-navy mb-8">
            How We Help You Maximize Your Charitable Impact
          </h3>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <Check className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="heading-tertiary text-gray-900 mb-3">Pre-Vetted Assets & Qualified Charities</h4>
                <p className="body-regular text-gray-700">
                  We connect you with wholesale-donated assets and ensure compliant delivery to 501(c)(3) organizations that 
                  serve educational, disaster relief, and humanitarian missions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Check className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="heading-tertiary text-gray-900 mb-3">Complete Filing Support</h4>
                <p className="body-regular text-gray-700 mb-3">We prepare all required documents, including:</p>
                <ul className="mt-3 space-y-2 body-regular text-gray-700">
                  <li>• Appraisal Reports</li>
                  <li>• Structuring (if needed)</li>
                  <li>• IRS-compliant filing guides</li>
                  <li>• Form 8283 (Non-cash Charitable Contributions)</li>
                  <li>• Acknowledgment Letters</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Check className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="heading-tertiary text-gray-900 mb-3">Built-In Audit Support</h4>
                <p className="body-regular text-gray-700 mb-3">Includes audit defense with:</p>
                <ul className="mt-3 space-y-2 body-regular text-gray-700">
                  <li>• Expert response team</li>
                  <li>• Legal fund access</li>
                  <li>• Documentation kits for state and IRS</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="card-professional p-6">
            <p className="form-label mb-4">AGI Deduction Limit</p>
            <select
              value={agiLimit}
              onChange={(e) => setAgiLimit(parseFloat(e.target.value))}
              className="form-select heading-tertiary text-gray-900"
            >
              <option value={0.3}>30% of AGI</option>
              <option value={0.5}>50% of AGI</option>
              <option value={0.6}>60% of AGI</option>
            </select>
          </div>

          <div className="card-professional p-6">
            <p className="form-label mb-4">FMV Multiplier</p>
            <select
              value={fmvMultiplier}
              onChange={(e) => setFmvMultiplier(parseFloat(e.target.value))}
              className="form-select heading-tertiary text-gray-900"
            >
              <option value={4}>4x</option>
              <option value={4.5}>4.5x</option>
              <option value={5}>5x</option>
            </select>
          </div>

          <div className="card-professional p-6">
            <p className="form-label mb-4">Donation Amount</p>
            <div className="flex items-center mb-3">
              <span className="heading-secondary text-gray-900 mr-2">$</span>
              <NumericFormat
                value={donationAmount || ''}
                onValueChange={(values) => setDonationAmount(values.floatValue || null)}
                thousandSeparator={true}
                className="form-input heading-secondary text-gray-900 border-0 p-0 bg-transparent focus:ring-0"
                placeholder="0"
              />
            </div>
            <p className="body-small text-gray-600">
              Maximum allowed: ${maxDonation.toLocaleString()}
            </p>
          </div>

          <div className="card-professional p-6 space-y-6">
            <div>
              <p className="form-label">Total Deduction Value</p>
              <p className="heading-tertiary text-gray-900">${deductionValue.toLocaleString()}</p>
            </div>

            <div>
              <p className="form-label">State Benefit</p>
              <p className="heading-tertiary text-professional-success">${calculatedBenefits.stateSavings.toLocaleString()}</p>
            </div>

            <div>
              <p className="form-label">Federal Benefit</p>
              <p className="heading-tertiary text-professional-success">${calculatedBenefits.federalSavings.toLocaleString()}</p>
            </div>

            <div>
              <p className="form-label">Total Tax Savings</p>
              <p className="heading-tertiary text-professional-success">${(calculatedBenefits.federalSavings + calculatedBenefits.stateSavings).toLocaleString()}</p>
            </div>

            <div className="border-t border-professional pt-6">
              <p className="form-label">Net Benefit</p>
              <p className="heading-primary text-professional-navy">${netSavings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}