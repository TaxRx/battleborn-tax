import React, { useState, useEffect, useMemo } from 'react';
import { TaxInfo, TaxRates, TaxStrategy } from '../types/tax';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface AugustaRuleCalculatorProps {
  taxInfo: TaxInfo;
  rates: TaxRates;
  strategies: TaxStrategy[];
  onSavingsChange?: (savings: any) => void;
}

export default function AugustaRuleCalculator({
  taxInfo,
  rates,
  strategies,
  onSavingsChange
}: AugustaRuleCalculatorProps) {
  const [daysRented, setDaysRented] = useState<number>(14);
  const [dailyRate, setDailyRate] = useState<number>(1500);
  const { include_fica } = useTaxStore();

  // Guard against missing rates
  if (!rates || !taxInfo || !taxInfo.business_owner) {
    return null;
  }

  // Calculate total rent
  const totalRent = daysRented * dailyRate;

  // Calculate tax savings
  const baseBreakdown = calculateTaxBreakdown(taxInfo, rates);
  const modifiedTaxInfo = {
    ...taxInfo,
    wages_income: taxInfo.wages_income - totalRent,
    ordinary_k1_income: (taxInfo.ordinary_k1_income || 0) - totalRent
  };
  const augustaBreakdown = calculateTaxBreakdown(modifiedTaxInfo, rates);

  const stateBenefit = Math.max(0, baseBreakdown.state - augustaBreakdown.state);
  const federalBenefit = Math.max(0, baseBreakdown.federal - augustaBreakdown.federal);
  const ficaBenefit = Math.max(
    0,
    (baseBreakdown.social_security + baseBreakdown.medicare + baseBreakdown.self_employment) -
    (augustaBreakdown.social_security + augustaBreakdown.medicare + augustaBreakdown.self_employment)
  );

  const totalBenefit = stateBenefit + federalBenefit + ficaBenefit;

  useEffect(() => {
    if (onSavingsChange) {
      onSavingsChange({
        days_rented: daysRented,
        daily_rate: dailyRate,
        total_rent: totalRent,
        state_benefit: stateBenefit,
        federal_benefit: federalBenefit,
        fica_benefit: ficaBenefit,
        total_benefit: include_fica ? totalBenefit : totalBenefit - ficaBenefit
      });
    }
  }, [daysRented, dailyRate, totalRent, stateBenefit, federalBenefit, ficaBenefit, totalBenefit, include_fica, onSavingsChange]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Days Rented
          </label>
          <input
            type="number"
            min={1}
            max={14}
            value={daysRented}
            onChange={(e) => setDaysRented(Math.min(14, Math.max(1, parseInt(e.target.value) || 0)))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-2 text-sm text-gray-500">
            Maximum of 14 days per year
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Daily Rate
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              min={0}
              value={dailyRate}
              onChange={(e) => setDailyRate(Math.max(0, parseInt(e.target.value) || 0))}
              className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Rent</p>
            <p className="text-2xl font-bold text-gray-900">
              ${totalRent.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">State Benefit</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${stateBenefit.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Federal Benefit</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${federalBenefit.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">FICA Benefit</p>
            <p className={`text-2xl font-bold ${include_fica ? 'text-emerald-600' : 'text-gray-400'}`}>
              ${ficaBenefit.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Benefit</p>
            <p className="text-4xl font-bold text-emerald-600">
              ${(include_fica ? totalBenefit : totalBenefit - ficaBenefit).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}