import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { TaxInfo } from '../types';
import { calculateCharitableDonationNetSavings } from '../utils/taxCalculations';
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
  const [fmvMultiplier, setFmvMultiplier] = useState(existingDetails?.fmvMultiplier || 5);
  const [donationAmount, setDonationAmount] = useState<number | null>(existingDetails?.donationAmount || null);
  const [agiLimit, setAgiLimit] = useState(0.3);

  // Calculate total income (AGI)
  const totalIncome = taxInfo.wagesIncome + 
    taxInfo.passiveIncome + 
    taxInfo.unearnedIncome +
    (taxInfo.businessOwner ? (taxInfo.ordinaryK1Income || 0) + (taxInfo.guaranteedK1Income || 0) : 0);

  // Calculate maximum allowed donation based on AGI limit
  const maxDonation = Math.floor(totalIncome * agiLimit / fmvMultiplier);

  // Calculate deduction value (capped at AGI limit)
  const deductionValue = donationAmount ? Math.min(donationAmount * fmvMultiplier, totalIncome * agiLimit) : 0;

  // Calculate tax savings
  const { federal: federalSavings, state: stateSavings, net: netSavings } = calculateCharitableDonationNetSavings(
    taxInfo,
    rates,
    donationAmount || 0,
    deductionValue,
    strategies
  );

  // Update savings whenever values change
  useEffect(() => {
    if (donationAmount !== null) {
      onSavingsChange({
        charitableDonation: {
          donationAmount,
          fmvMultiplier,
          deductionValue,
          federalSavings,
          stateSavings,
          totalBenefit: netSavings
        }
      });
    }
  }, [donationAmount, fmvMultiplier, deductionValue, federalSavings, stateSavings, netSavings, onSavingsChange]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-600">
          Give with Purpose. Save with Confidence. Philanthropic tax benefit pathways allow you to reduce your tax burden while 
          making a meaningful impact through qualified 501(c)(3) charities. These programs are designed to be non-reportable 
          transactions under current IRS guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-8 items-start">
        <div>
          <h3 className="text-[#12ab61] font-bold text-lg mb-6">
            How We Help You Maximize Your Charitable Impact
          </h3>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Pre-Vetted Assets & Qualified Charities</h4>
                <p className="text-base text-gray-600">
                  We connect you with wholesale-donated assets and ensure compliant delivery to 501(c)(3) organizations that 
                  serve educational, disaster relief, and humanitarian missions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Complete Filing Support</h4>
                <p className="text-base text-gray-600">We prepare all required documents, including:</p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Appraisal Reports</li>
                  <li>• Structuring (if needed)</li>
                  <li>• IRS-compliant filing guides</li>
                  <li>• Form 8283 (Non-cash Charitable Contributions)</li>
                  <li>• Acknowledgment Letters</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Built-In Audit Support</h4>
                <p className="text-base text-gray-600">Includes audit defense with:</p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Expert response team</li>
                  <li>• Legal fund access</li>
                  <li>• Documentation kits for state and IRS</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">AGI Deduction Limit</p>
            <select
              value={agiLimit}
              onChange={(e) => setAgiLimit(parseFloat(e.target.value))}
              className="text-xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
            >
              <option value={0.3}>30% of AGI (Appreciated Property)</option>
              <option value={0.5}>50% of AGI (Cash Donations)</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">FMV Multiplier</p>
            <select
              value={fmvMultiplier}
              onChange={(e) => setFmvMultiplier(parseInt(e.target.value))}
              className="text-xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
            >
              <option value={3}>3x</option>
              <option value={4}>4x</option>
              <option value={5}>5x</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Donation Amount</p>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">$</span>
              <NumericFormat
                value={donationAmount || ''}
                onValueChange={(values) => setDonationAmount(values.floatValue || null)}
                thousandSeparator={true}
                className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
                placeholder="0"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Maximum allowed: ${maxDonation.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">TOTAL DEDUCTION VALUE</p>
              <p className="text-2xl font-bold text-gray-900">${deductionValue.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">STATE BENEFIT</p>
              <p className="text-2xl font-bold text-emerald-600">${stateSavings.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">FEDERAL BENEFIT</p>
              <p className="text-2xl font-bold text-emerald-600">${federalSavings.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">TOTAL TAX SAVINGS</p>
              <p className="text-2xl font-bold text-emerald-600">${(federalSavings + stateSavings).toLocaleString()}</p>
            </div>

            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs font-medium text-gray-500 uppercase">NET BENEFIT</p>
              <p className="text-4xl font-bold text-emerald-600">${netSavings.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}