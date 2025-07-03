import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Info } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { TaxInfo, TaxStrategy } from '../types';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { useTaxStore } from '../store/taxStore';

interface ConvertibleTaxBondsCalculatorProps {
  taxInfo: TaxInfo;
  onSavingsChange: (details: any) => void;
  rates: any;
  strategies: TaxStrategy[];
  existingDetails?: {
    ctbPayment: number;
    ctbTaxOffset: number;
    netSavings: number;
    remainingTaxAfterCtb: number;
    reductionRatio?: number;
    totalBenefit?: number;
  };
}

export default function ConvertibleTaxBondsCalculator({
  taxInfo,
  onSavingsChange,
  rates,
  strategies,
  existingDetails
}: ConvertibleTaxBondsCalculatorProps) {
  const [ctbPayment, setCtbPayment] = useState<number>(existingDetails?.ctbPayment || 0);
  const [maintainRatio, setMaintainRatio] = useState<boolean>(existingDetails?.reductionRatio !== undefined ? true : true);
  const [initialRatio, setInitialRatio] = useState<number>(existingDetails?.reductionRatio || 0);
  const { includeFica } = useTaxStore();
  const prevRemainingTaxBurden = useRef<number>(0);

  // Guard against missing data
  if (!rates || !taxInfo) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h3 className="text-red-600 font-bold mb-2">Configuration Error</h3>
        <p className="text-red-700">
          Unable to calculate CTB savings. Please try again or contact support if the issue persists.
        </p>
      </div>
    );
  }

  // Calculate remaining tax burden from current strategies
  const remainingTaxBurden = useMemo(() => {
    const strategyBreakdown = calculateTaxBreakdown(taxInfo, rates, strategies);
    const ficaTax = includeFica ? strategyBreakdown.fica : 0;
    return Math.round(strategyBreakdown.federal + strategyBreakdown.state + ficaTax);
  }, [taxInfo, rates, strategies, includeFica]);

  // Calculate CTB tax offset (every $0.75 offsets $1.00 of tax)
  const ctbTaxOffset = useMemo(() => {
    return Math.round(ctbPayment / 0.75);
  }, [ctbPayment]);

  // Constrain CTB tax offset to remaining tax burden
  const constrainedCtbTaxOffset = useMemo(() => {
    return Math.min(ctbTaxOffset, remainingTaxBurden);
  }, [ctbTaxOffset, remainingTaxBurden]);

  // Calculate actual CTB payment needed for constrained offset
  const actualCtbPayment = useMemo(() => {
    const calculatedPayment = Math.round(constrainedCtbTaxOffset * 0.75);
    // Enforce minimum purchase of $75,000
    return Math.max(calculatedPayment, 75000);
  }, [constrainedCtbTaxOffset]);

  // Calculate net savings
  const netSavings = useMemo(() => {
    return Math.round(constrainedCtbTaxOffset - actualCtbPayment);
  }, [constrainedCtbTaxOffset, actualCtbPayment]);

  // Calculate remaining tax after CTB
  const remainingTaxAfterCtb = useMemo(() => {
    return Math.round(remainingTaxBurden - constrainedCtbTaxOffset);
  }, [remainingTaxBurden, constrainedCtbTaxOffset]);

  // Calculate reduction ratio
  const reductionRatio = useMemo(() => {
    return remainingTaxBurden > 0 ? (constrainedCtbTaxOffset / remainingTaxBurden) : 0;
  }, [constrainedCtbTaxOffset, remainingTaxBurden]);

  // Store initial ratio when user first sets a CTB payment
  useEffect(() => {
    if (ctbPayment > 0 && initialRatio === 0 && remainingTaxBurden > 0) {
      const ratio = (ctbPayment / 0.75) / remainingTaxBurden;
      if (ratio > 0 && ratio < 1) {
        setInitialRatio(ratio);
      }
    }
  }, [ctbPayment, initialRatio, remainingTaxBurden]);

  // Auto-adjust CTB payment based on maintain ratio setting
  useEffect(() => {
    if (maintainRatio && initialRatio > 0 && remainingTaxBurden > 0 && remainingTaxBurden !== prevRemainingTaxBurden.current) {
      const targetCtbPayment = Math.round((initialRatio * remainingTaxBurden * 0.75) / (1 - initialRatio));
      // Only update if the difference is significant to prevent infinite loops
      if (Math.abs(targetCtbPayment - ctbPayment) > 1) {
        setCtbPayment(targetCtbPayment);
      }
    }
    prevRemainingTaxBurden.current = remainingTaxBurden;
  }, [remainingTaxBurden, maintainRatio, initialRatio, ctbPayment]);

  // Update parent component when calculations change
  useEffect(() => {
    if (!onSavingsChange) {
      return;
    }
    
    if (actualCtbPayment > 0) {
      const savingsDetails = {
        convertibleTaxBonds: {
          ctbPayment: actualCtbPayment,
          ctbTaxOffset: constrainedCtbTaxOffset,
          netSavings: netSavings,
          remainingTaxAfterCtb: remainingTaxAfterCtb,
          reductionRatio: reductionRatio
        }
      };
      onSavingsChange(savingsDetails);
    } else {
      // Only call onSavingsChange with null if we have a valid onSavingsChange function
      onSavingsChange(null);
    }
  }, [actualCtbPayment, constrainedCtbTaxOffset, netSavings, remainingTaxAfterCtb, reductionRatio, onSavingsChange]);

  // Auto-adjust CTB payment if it would exceed remaining tax burden
  useEffect(() => {
    if (ctbTaxOffset > remainingTaxBurden) {
      setCtbPayment(actualCtbPayment);
    }
  }, [ctbTaxOffset, remainingTaxBurden, actualCtbPayment]);

  // Hydrate state from existingDetails if present (on mount or when existingDetails changes)
  useEffect(() => {
    if (existingDetails) {
      setCtbPayment(existingDetails.ctbPayment || 0);
      setInitialRatio(existingDetails.reductionRatio || 0);
      setMaintainRatio(existingDetails.reductionRatio !== undefined ? true : true);
    }
  }, [existingDetails]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">How CTBs Work</h4>
            <p className="text-blue-700 text-sm mb-2">
              Convertible Tax Bonds allow you to offset your remaining tax burden. For every $0.75 you invest, 
              you can offset $1.00 of your tax liability.
            </p>
            <p className="text-blue-700 text-sm">
              <strong>Eligibility:</strong> Available to accredited investors only. Refunds are based on 
              IRS-approved tax offsets and may be delayed depending on IRS processing timelines.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remaining Tax Burden (Live)
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-gray-900">
                ${remainingTaxBurden.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Current tax liability after all other strategies
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTB Payment
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                $
              </span>
              <NumericFormat
                value={ctbPayment}
                onValueChange={(values) => setCtbPayment(values.floatValue || 0)}
                thousandSeparator=","
                decimalScale={0}
                className="w-full pl-8 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Every $0.75 offsets $1.00 of tax
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="maintainRatio"
              checked={maintainRatio}
              onChange={(e) => setMaintainRatio(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="maintainRatio" className="text-sm font-medium text-gray-700">
              Maintain Ratio?
            </label>
          </div>
          
          {reductionRatio > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                <strong>Reduction Ratio:</strong> {(reductionRatio * 100).toFixed(1)}%
              </p>
              <p className="text-blue-700 text-xs mt-1">
                Tax Offset Generated / Remaining Tax Burden
              </p>
            </div>
          )}

          {ctbTaxOffset > remainingTaxBurden && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Your CTB payment has been automatically adjusted to not exceed your remaining tax burden.
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Offset Generated
            </label>
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-blue-900">
                ${constrainedCtbTaxOffset.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Net Savings
            </label>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-green-900">
                ${netSavings.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tax offset minus CTB payment
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remaining Tax After CTB
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-2xl font-bold text-gray-900">
                ${remainingTaxAfterCtb.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 