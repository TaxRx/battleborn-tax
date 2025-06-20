import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Check } from 'lucide-react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { TaxInfo } from '../../../types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';
import { strategyService } from '../lib/core/services/strategy.service';
import TaxBracketBreakdown from './TaxBracketBreakdown';

interface CostSegregationCalculatorProps {
  taxInfo: TaxInfo;
  onSavingsChange: (details: any) => void;
  rates: any;
}

export default function CostSegregationCalculator({
  taxInfo,
  onSavingsChange,
  rates
}: CostSegregationCalculatorProps) {
  const [propertyValue, setPropertyValue] = useState<number>(1000000);
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential');
  const [landValue, setLandValue] = useState<number>(200000);
  const [improvementValue, setImprovementValue] = useState<number>(800000);
  const [bonusDepreciationRate, setBonusDepreciationRate] = useState<number>(60);
  const [yearAcquired, setYearAcquired] = useState<number>(new Date().getFullYear());
  const [showBracketBreakdown, setShowBracketBreakdown] = useState(false);
  const { includeFica } = useTaxStore();

  // Calculate depreciation components
  const calculations = useMemo(() => {
    // Calculate total depreciable basis
    const totalDepreciableBasis = propertyValue - landValue + improvementValue;
    
    // Calculate accelerated portion (30% of total basis)
    const acceleratedPortion = totalDepreciableBasis * 0.30;
    
    // Calculate years of ownership
    const currentYear = new Date().getFullYear();
    const yearsOwned = currentYear - yearAcquired;

    // Calculate previously recognized depreciation
    const regularDepreciationPeriod = propertyType === 'residential' ? 27.5 : 39;
    const annualRegularRate = 1 / regularDepreciationPeriod;
    const previousRegularDepreciation = yearsOwned > 0 ? 
      (totalDepreciableBasis * annualRegularRate * yearsOwned) : 0;

    // Calculate remaining basis
    const remainingBasis = totalDepreciableBasis - previousRegularDepreciation;

    // Calculate current year depreciation
    const regularDepreciation = remainingBasis * annualRegularRate;
    const acceleratedDepreciation = acceleratedPortion * (bonusDepreciationRate / 100);
    const firstYearDeduction = Math.round(regularDepreciation + acceleratedDepreciation);

    // Calculate remaining accelerated depreciation for years 2-5
    const remainingAccelerated = acceleratedPortion - acceleratedDepreciation;
    const years2to5Annual = Math.round(remainingAccelerated / 4);

    // Calculate tax impact using TBB
    const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
    const modifiedTaxInfo = { ...taxInfo };
    modifiedTaxInfo.customDeduction = (taxInfo.customDeduction || 0) + firstYearDeduction;
    const strategyBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

    const federalSavings = Math.max(0, baseBreakdown.federal - strategyBreakdown.federal);
    const stateSavings = Math.max(0, baseBreakdown.state - strategyBreakdown.state);
    const ficaSavings = Math.max(0, baseBreakdown.fica - strategyBreakdown.fica);
    const totalSavings = federalSavings + stateSavings + ficaSavings;

    return {
      totalDepreciableBasis,
      acceleratedPortion,
      previousRegularDepreciation,
      regularDepreciation,
      acceleratedDepreciation,
      firstYearDeduction,
      years2to5Annual,
      federalSavings,
      stateSavings,
      ficaSavings,
      totalSavings,
      modifiedTaxInfo
    };
  }, [propertyValue, propertyType, landValue, improvementValue, bonusDepreciationRate, yearAcquired, taxInfo, rates]);

  useEffect(() => {
    if (onSavingsChange) {
      const totalBenefit = includeFica
        ? calculations.federalSavings + calculations.stateSavings + calculations.ficaSavings
        : calculations.federalSavings + calculations.stateSavings;

      onSavingsChange({
        costSegregation: {
          propertyValue,
          propertyType,
          landValue,
          improvementValue,
          bonusDepreciationRate,
          yearAcquired,
          currentYearDeduction: calculations.firstYearDeduction,
          years2to5Annual: calculations.years2to5Annual,
          federalSavings: calculations.federalSavings,
          stateSavings: calculations.stateSavings,
          ficaSavings: calculations.ficaSavings,
          totalBenefit: totalBenefit,
          totalSavings: calculations.totalSavings
        }
      });
    }
  }, [propertyValue, propertyType, landValue, improvementValue, bonusDepreciationRate, yearAcquired, 
      calculations.federalSavings, calculations.stateSavings, calculations.ficaSavings, includeFica, onSavingsChange]);

  // Generate year options
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);
  }, []);

  const handlePropertyTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPropertyType(e.target.value as 'residential' | 'commercial');
  };

  const handleYearBuiltChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setYearAcquired(parseInt(e.target.value));
  };

  const handlePurchasePriceChange = ({ floatValue }: { floatValue: number | undefined }) => {
    setPropertyValue(floatValue || 0);
  };

  const handleLandValueChange = ({ floatValue }: { floatValue: number | undefined }) => {
    setLandValue(floatValue || 0);
  };

  if (!taxInfo.businessOwner) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-600 font-bold mb-2">Business Owner Required</h3>
        <p className="text-red-700">
          Cost segregation is only available for business owners with qualifying property.
          To use this strategy, you must own commercial or residential rental property.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="text-gray-600">
          Cost segregation accelerates depreciation deductions by identifying and reclassifying building components 
          that qualify for shorter recovery periods, resulting in significant tax savings in the early years of ownership.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.5fr,1fr] gap-8 items-start">
        <div>
          <h3 className="text-[#12ab61] font-bold text-lg mb-6">
            How We Help You Maximize Depreciation Benefits
          </h3>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Engineering-Based Study</h4>
                <p className="text-base text-gray-600">
                  Our certified engineers conduct a detailed analysis:
                </p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Component-level asset review</li>
                  <li>• Property classification analysis</li>
                  <li>• Remaining life calculations</li>
                  <li>• Bonus depreciation opportunities</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Complete Documentation</h4>
                <p className="text-base text-gray-600">
                  We prepare all required documentation:
                </p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Detailed asset schedules</li>
                  <li>• Engineering report</li>
                  <li>• IRS compliance documentation</li>
                  <li>• Audit support package</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900">Implementation Support</h4>
                <p className="text-base text-gray-600">
                  Full support through the process:
                </p>
                <ul className="mt-2 space-y-1 text-base text-gray-600">
                  <li>• Tax return integration</li>
                  <li>• Depreciation schedule updates</li>
                  <li>• Ongoing consultation</li>
                  <li>• Future year planning</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Year Acquired</p>
            <select
              value={yearAcquired}
              onChange={handleYearBuiltChange}
              className="text-xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
            >
              {yearOptions.map((year: number) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Property Type</p>
            <select
              value={propertyType}
              onChange={handlePropertyTypeChange}
              className="text-xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
            >
              <option value="residential">Residential (27.5 years)</option>
              <option value="commercial">Commercial (39 years)</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Bonus Depreciation Rate</p>
            <select
              value={bonusDepreciationRate}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setBonusDepreciationRate(parseInt(e.target.value))}
              className="text-xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
            >
              <option value={100}>100% Bonus</option>
              <option value={80}>80% Bonus</option>
              <option value={60}>60% Bonus</option>
              <option value={40}>40% Bonus</option>
            </select>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Property Value</p>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">$</span>
              <NumericFormat
                value={propertyValue}
                onValueChange={handlePurchasePriceChange}
                thousandSeparator={true}
                className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Land Value</p>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">$</span>
              <NumericFormat
                value={landValue}
                onValueChange={handleLandValueChange}
                thousandSeparator={true}
                className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Improvement Value</p>
            <div className="flex items-center">
              <span className="text-3xl font-bold text-gray-900">$</span>
              <NumericFormat
                value={improvementValue}
                onValueChange={(values: { floatValue: number | undefined }) => setImprovementValue(values.floatValue || 0)}
                thousandSeparator={true}
                className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">ACCELERATED PORTION (30%)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Math.round(calculations.acceleratedPortion).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">FIRST YEAR DEDUCTION</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${Math.round(calculations.firstYearDeduction).toLocaleString()}
              </p>
            </div>

            {bonusDepreciationRate < 100 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">YEARS 2-5 ANNUAL DEDUCTION</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${Math.round(calculations.years2to5Annual).toLocaleString()}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">STATE BENEFIT</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${Math.round(calculations.stateSavings).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">FEDERAL BENEFIT</p>
              <p className="text-2xl font-bold text-emerald-600">
                ${Math.round(calculations.federalSavings).toLocaleString()}
              </p>
            </div>

            {includeFica && calculations.ficaSavings > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">FICA BENEFIT</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${Math.round(calculations.ficaSavings).toLocaleString()}
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-2">
              <p className="text-xs font-medium text-gray-500 uppercase">YEAR 1 BENEFIT</p>
              <p className="text-4xl font-bold text-emerald-600">
                ${Math.round(includeFica ? calculations.totalSavings : (calculations.totalSavings - calculations.ficaSavings)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <TaxBracketBreakdown
          taxInfo={calculations.modifiedTaxInfo}
          rates={rates}
          strategies={[]}
          isExpanded={showBracketBreakdown}
          onToggle={() => setShowBracketBreakdown(!showBracketBreakdown)}
        />
      </div>
    </div>
  );
}