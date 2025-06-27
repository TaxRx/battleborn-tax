import React, { useState, useEffect, useMemo, ChangeEvent } from 'react';
import { Check, Info } from 'lucide-react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { TaxInfo } from '../types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';
import { strategyService } from '../lib/core/services/strategy.service';

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

    // --- TAX BENEFIT CALCULATION (with/without deduction) ---
    // Baseline: no cost segregation deduction
    const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
    
    // With cost segregation: add deduction to customDeduction, force itemized if better
    const standardDeduction = rates.federal.standardDeduction[taxInfo.filingStatus] || 0;
    const currentItemizedDeductions = taxInfo.standardDeduction ? 0 : (taxInfo.customDeduction || 0);
    const newItemizedTotal = currentItemizedDeductions + firstYearDeduction;
    
    let modifiedTaxInfo = { ...taxInfo };
    let federalSavings = 0;
    let stateSavings = 0;
    let ficaSavings = 0;
    
    // Only itemize if the new total exceeds standard deduction
    if (newItemizedTotal > standardDeduction) {
      modifiedTaxInfo = {
        ...taxInfo,
        standardDeduction: false,
        customDeduction: newItemizedTotal
      };
      
      const strategyBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);
      
      // Tax savings = difference in total tax
      federalSavings = Math.max(0, baseBreakdown.federal - strategyBreakdown.federal);
      stateSavings = Math.max(0, baseBreakdown.state - strategyBreakdown.state);
      ficaSavings = Math.max(0, baseBreakdown.fica - strategyBreakdown.fica);
    }

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
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-600 font-bold mb-2">Business Owner Required</h3>
        <p className="text-red-700">
          Cost segregation is only available for business owners with qualifying property.
          To use this strategy, you must own commercial or residential rental property.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Information Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-900 font-semibold mb-2">Cost Segregation Strategy</h3>
            <p className="text-blue-800 text-sm">
              Accelerate depreciation deductions by identifying and reclassifying building components 
              that qualify for shorter recovery periods. This engineering-based study can result in 
              significant tax savings in the early years of property ownership.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Inputs and Services */}
        <div className="space-y-6">
          {/* Property Configuration */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year Acquired
                </label>
                <select
                  value={yearAcquired}
                  onChange={handleYearBuiltChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map((year: number) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={handlePropertyTypeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="residential">Residential (27.5 years)</option>
                  <option value="commercial">Commercial (39 years)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Depreciation Rate
                </label>
                <select
                  value={bonusDepreciationRate}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setBonusDepreciationRate(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={100}>100% Bonus</option>
                  <option value={80}>80% Bonus</option>
                  <option value={60}>60% Bonus</option>
                  <option value={40}>40% Bonus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <NumericFormat
                    value={propertyValue}
                    onValueChange={handlePurchasePriceChange}
                    thousandSeparator={true}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Land Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <NumericFormat
                    value={landValue}
                    onValueChange={handleLandValueChange}
                    thousandSeparator={true}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Improvement Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <NumericFormat
                    value={improvementValue}
                    onValueChange={(values: { floatValue: number | undefined }) => setImprovementValue(values.floatValue || 0)}
                    thousandSeparator={true}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services Overview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Comprehensive Services</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Engineering-Based Study</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Certified engineers conduct detailed component-level analysis, property classification, 
                    remaining life calculations, and bonus depreciation optimization.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Complete Documentation</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Detailed asset schedules, engineering reports, IRS compliance documentation, 
                    and comprehensive audit support package.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-gray-900">Implementation Support</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Tax return integration, depreciation schedule updates, ongoing consultation, 
                    and future year planning assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Tax Benefits Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Tax Benefits Summary</h3>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Accelerated Portion (30%)</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  ${Math.round(calculations.acceleratedPortion).toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">First Year Deduction</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${Math.round(calculations.firstYearDeduction).toLocaleString()}
                </div>
              </div>

              {bonusDepreciationRate < 100 && (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Years 2-5 Annual Deduction</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${Math.round(calculations.years2to5Annual).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tax Savings Breakdown */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4">Tax Savings Breakdown</h3>
            
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Federal Tax Savings</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${Math.round(calculations.federalSavings).toLocaleString()}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">State Tax Savings</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  ${Math.round(calculations.stateSavings).toLocaleString()}
                </div>
              </div>

              {includeFica && calculations.ficaSavings > 0 && (
                <div className="bg-white rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">FICA Tax Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${Math.round(calculations.ficaSavings).toLocaleString()}
                  </div>
                </div>
              )}

              <div className="bg-green-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-100">Total Year 1 Benefit</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  ${Math.round(includeFica ? calculations.totalSavings : (calculations.totalSavings - calculations.ficaSavings)).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}