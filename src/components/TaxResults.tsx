import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Save, BarChart2, Table as TableIcon, Shield, Lock, Info } from 'lucide-react';
import { TaxInfo, TaxRates, TaxBreakdown } from '../lib/core/types/tax';
import { TaxStrategy } from '../types';
import { SavedCalculation } from '../types';
import { taxRates } from '../data/taxRates';
import { calculateTaxBreakdown, calculateStrategyTaxSavings } from '../utils/taxCalculations';
import { debugCalculations } from '../utils/debug';
import { getTaxStrategies } from '../utils/taxStrategies';
import TaxBracketBreakdown from './TaxBracketBreakdown';
import AugustaRuleCalculator from './AugustaRuleCalculator';
import HireChildrenCalculator from './HireChildrenCalculator';
import CharitableDonationCalculator from './CharitableDonationCalculator';
import CostSegregationCalculator from './CostSegregationCalculator';
import FmcModal from './FmcModal';
import InfoForm from './InfoForm';
import StrategyCards from './StrategyCards';
import styled from 'styled-components';
import { useTaxStore } from '../store/taxStore';
import * as Dialog from '@radix-ui/react-dialog';

interface TaxResultsProps {
  taxInfo: TaxInfo;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onStrategiesSelect: (strategies: TaxStrategy[]) => void;
  onSaveCalculation: (calc: SavedCalculation) => void;
  onStrategyAction?: (strategyId: string, action: string) => void;
  initialStrategies?: TaxStrategy[]; // For demo mode strategy persistence
}

interface TaxBreakdownTableProps {
  breakdown: TaxBreakdown;
  totalIncome: number;
  label: string;
}

// Professional Disclaimer Component
function ProfessionalDisclaimer() {
  return (
    <div className="alert-info">
      <div className="flex items-start space-x-2">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Professional Disclaimer</p>
          <p>
            This calculator provides estimates based on current tax laws and your inputs. 
            Results are for informational purposes only and should not be considered as tax advice. 
            Individual circumstances may affect actual tax liability. 
            <strong> Consult with a qualified tax professional for personalized advice.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function TaxBreakdownTable({ breakdown, totalIncome, label }: TaxBreakdownTableProps) {
  const getMarginalRate = (type: string) => {
    switch (type) {
      case 'federal':
        return '37.00%';
      case 'state':
        return '12.30%';
      case 'selfEmployment':
        return '2.90%';
      case 'socialSecurity':
        return '6.20%';
      case 'medicare':
        return '2.35%';
      default:
        return '-';
    }
  };

  const getAverageRate = (amount: number) => {
    return ((amount / totalIncome) * 100).toFixed(2) + '%';
  };

  return (
    <div className="w-full">
      <div className="data-table">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">
                {label}
              </th>
              <th className="text-right">
                ANNUAL RESULTS
              </th>
              <th className="text-right">
                MARGINAL
              </th>
              <th className="text-right">
                AVERAGE
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Federal Tax:</td>
              <td className="text-right font-semibold">${breakdown.federal.toLocaleString()}</td>
              <td className="text-right">{getMarginalRate('federal')}</td>
              <td className="text-right">{getAverageRate(breakdown.federal)}</td>
            </tr>
            <tr>
              <td>State Tax:</td>
              <td className="text-right font-semibold">${breakdown.state.toLocaleString()}</td>
              <td className="text-right">{getMarginalRate('state')}</td>
              <td className="text-right">{getAverageRate(breakdown.state)}</td>
            </tr>
            <tr>
              <td>Self-Employment Tax:</td>
              <td className="text-right font-semibold">${breakdown.selfEmployment.toLocaleString()}</td>
              <td className="text-right">{getMarginalRate('selfEmployment')}</td>
              <td className="text-right">{getAverageRate(breakdown.selfEmployment)}</td>
            </tr>
            <tr>
              <td>Social Security Tax:</td>
              <td className="text-right font-semibold">${breakdown.socialSecurity.toLocaleString()}</td>
              <td className="text-right">{getMarginalRate('socialSecurity')}</td>
              <td className="text-right">{getAverageRate(breakdown.socialSecurity)}</td>
            </tr>
            <tr>
              <td>Medicare Tax:</td>
              <td className="text-right font-semibold">${breakdown.medicare.toLocaleString()}</td>
              <td className="text-right">{getMarginalRate('medicare')}</td>
              <td className="text-right">{getAverageRate(breakdown.medicare)}</td>
            </tr>
            <tr className="bg-gray-50 font-bold">
              <td className="font-bold">TOTAL TAX:</td>
              <td className="text-right font-bold text-lg">${breakdown.total.toLocaleString()}</td>
              <td className="text-right">-</td>
              <td className="text-right">{getAverageRate(breakdown.total)}</td>
            </tr>
            <tr className="bg-green-50 font-bold text-green-700">
              <td className="font-bold">YOU KEEP:</td>
              <td className="text-right font-bold text-lg">${(totalIncome - breakdown.total).toLocaleString()}</td>
              <td className="text-right">-</td>
              <td className="text-right">{((1 - breakdown.total / totalIncome) * 100).toFixed(2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Progress bar colors
const progressColors = {
  federal: '#3b82f6',      // Blue
  state: '#ef4444',        // Red  
  socialSecurity: '#f59e0b', // Yellow
  medicare: '#8b5cf6',     // Purple
  selfEmployment: '#f97316', // Orange
  takeHome: '#10b981',     // Green
  incomeShifted: '#dc2626', // Dark Red
  incomeDeferred: '#059669', // Dark Green
  w2Income: '#3b82f6',     // Blue
  passiveIncome: '#ef4444', // Red
  unearnedIncome: '#f59e0b', // Yellow
  ordinaryK1: '#8b5cf6',   // Purple
  guaranteedK1: '#f97316'  // Orange
};

// Clean Progress Bar Component matching the provided image design
interface CleanProgressBarProps {
  title: string;
  data: { label: string; value: number; color: string }[];
  total: number;
}

function CleanProgressBar({ title, data, total }: CleanProgressBarProps) {
  const validData = data.filter(item => item.value > 0);
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="heading-tertiary text-professional-navy mb-1">{title}</h3>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">${Math.round(total).toLocaleString()}</span>
        </div>
      </div>
      
      {/* Single stacked progress bar */}
      <div>
        <div className="w-full bg-gray-200 h-6 flex overflow-hidden" style={{ borderRadius: '4px' }}>
          {validData.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div
                key={index}
                className="h-full flex items-center justify-center text-xs font-medium text-white"
                style={{
                  backgroundColor: item.color,
                  width: `${percentage}%`,
                  minWidth: percentage > 5 ? 'auto' : '0px'
                }}
              >
                {percentage > 8 && `${percentage.toFixed(1)}%`}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {validData.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 flex-shrink-0" 
                style={{ 
                  backgroundColor: item.color,
                  borderRadius: '2px'
                }}
              />
              <span className="text-sm text-gray-700 flex-1">
                {item.label}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {percentage.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TaxResults({ 
  taxInfo, 
  selectedYear, 
  onYearChange,
  onStrategiesSelect,
  onSaveCalculation,
  onStrategyAction,
  initialStrategies
}: TaxResultsProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['income_shifted']);
  const [expandedStrategies, setExpandedStrategies] = useState<string[]>([]);
  const [showBracketBreakdown, setShowBracketBreakdown] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [showBeforeTable, setShowBeforeTable] = useState(false);
  const [showAfterTable, setShowAfterTable] = useState(false);
  const [showFmcModal, setShowFmcModal] = useState(false);
  const [currentTaxInfo, setCurrentTaxInfo] = useState<TaxInfo>(taxInfo);
  const [strategies, setStrategies] = useState<TaxStrategy[]>(() => {
    // Use initialStrategies if provided (for demo mode), otherwise generate strategies
    if (initialStrategies && initialStrategies.length > 0) {
      console.log('Using initial strategies from demo mode:', initialStrategies);
      return initialStrategies;
    }
    
    const generatedStrategies = getTaxStrategies(currentTaxInfo, calculateTaxBreakdown(currentTaxInfo, taxRates[selectedYear]));
    console.log('Generated strategies:', generatedStrategies);
    return generatedStrategies;
  });

  const previousStrategiesRef = useRef<TaxStrategy[]>([]);

  const rates = useMemo(() => taxRates[selectedYear], [selectedYear]);
  
  const baseBreakdown = useMemo(() => 
    calculateTaxBreakdown(currentTaxInfo, rates),
    [currentTaxInfo, rates]
  );

  const strategyBreakdown = useMemo(() => 
    calculateTaxBreakdown(currentTaxInfo, rates, strategies.filter(s => s.enabled)),
    [currentTaxInfo, rates, strategies]
  );

  const { setTaxInfo, selectedStrategies, updateStrategy, removeStrategy } = useTaxStore();

  useEffect(() => {
    setCurrentTaxInfo(taxInfo);
  }, [taxInfo]);

  // Sync strategies with store - merge local generated strategies with store strategies
  useEffect(() => {
    const generatedStrategies = getTaxStrategies(currentTaxInfo, calculateTaxBreakdown(currentTaxInfo, taxRates[selectedYear]));
    
    // Merge store strategies with generated strategies
    const mergedStrategies = generatedStrategies.map(generated => {
      const storeStrategy = selectedStrategies.find(s => s.id === generated.id);
      if (storeStrategy) {
        // Use store strategy if it exists (it's enabled and has details)
        return storeStrategy;
      }
      return generated;
    });

    setStrategies(mergedStrategies);
  }, [currentTaxInfo, selectedYear, selectedStrategies]);

  useEffect(() => {
    const enabledStrategies = strategies.filter(s => s.enabled);
    const prevEnabledStrategies = previousStrategiesRef.current.filter(s => s.enabled);
    
    const hasChanges = JSON.stringify(enabledStrategies) !== JSON.stringify(prevEnabledStrategies);
    
    if (hasChanges) {
      onStrategiesSelect(enabledStrategies);
      previousStrategiesRef.current = strategies;
    }
  }, [strategies, onStrategiesSelect]);

  const handleStrategySelect = useCallback((strategyId: string) => {
    setExpandedStrategies(prev =>
      prev.includes(strategyId)
        ? prev.filter(id => id !== strategyId)
        : [...prev, strategyId]
    );
    
    // Special handling for Family Management Company
    if (strategyId === 'family_management_company') {
      const strategy = strategies.find(s => s.id === strategyId);
      if (strategy?.enabled) {
        // If enabled, remove it from the store
        removeStrategy(strategyId);
      } else {
        // If disabled, open modal to configure it
        setShowFmcModal(true);
      }
      return;
    }
    
    setStrategies(prevStrategies => {
      const updatedStrategies = prevStrategies.map(strategy => {
        if (strategy.id === strategyId) {
          const enabled = !strategy.enabled;
          if (!enabled) return { ...strategy, enabled };

          const { federal, state } = calculateStrategyTaxSavings(currentTaxInfo, rates, strategy);
          const totalSavings = federal + state;

          return {
            ...strategy,
            enabled,
            estimatedSavings: totalSavings
          };
        }
        return strategy;
      });

      return updatedStrategies;
    });
  }, [currentTaxInfo, rates, strategies, removeStrategy]);

  const handleStrategySavingsChange = useCallback((strategyId: string, details: any) => {
    console.log(`TaxResults: handleStrategySavingsChange for ${strategyId}:`, details);
    
    setStrategies(prevStrategies => {
      const updatedStrategies = prevStrategies.map(s => {
        if (s.id === strategyId) {
          const updatedStrategy = { ...s, details };
          
          // For display purposes, show the gross tax benefit (not net for charitable donations)
          let displayValue = 0;
          if (strategyId === 'charitable_donation' && details.charitableDonation?.federalSavings !== undefined) {
            // Show total tax savings, not net benefit for charitable donations in the card
            displayValue = details.charitableDonation.federalSavings + details.charitableDonation.stateSavings;
          } else if (strategyId === 'augusta_rule' && details.augustaRule?.totalBenefit !== undefined) {
            displayValue = details.augustaRule.totalBenefit;
          } else if (strategyId === 'family_management_company' && details.familyManagementCompany?.totalBenefit !== undefined) {
            displayValue = details.familyManagementCompany.totalBenefit;
          } else if (strategyId === 'hire_children' && details.hireChildren?.totalBenefit !== undefined) {
            displayValue = details.hireChildren.totalBenefit;
          } else if (strategyId === 'cost_segregation' && details.costSegregation?.totalBenefit !== undefined) {
            displayValue = details.costSegregation.totalBenefit;
          } else {
            // Fallback to tax savings calculation
            const { federal, state } = calculateStrategyTaxSavings(currentTaxInfo, rates, updatedStrategy);
            displayValue = federal + state;
          }

          return {
            ...updatedStrategy,
            estimatedSavings: displayValue
          };
        }
        return s;
      });

      return updatedStrategies;
    });
  }, [currentTaxInfo, rates]);

  const handleStrategyAction = useCallback((strategyId: string, action: string) => {
    if (action === 'get_started') {
      switch (strategyId) {
        case 'family_management_company':
          setShowFmcModal(true);
          break;
        case 'augusta_rule':
          if (onStrategyAction) {
            onStrategyAction(strategyId, action);
          }
          break;
        default:
          break;
      }
    }
  }, [onStrategyAction]);

  const {
    totalIncome,
    shiftedIncome,
    deferredIncome,
    charitableDonationAmount,
    ctbPaymentAmount,
    reinsuranceContribution,
    reinsuranceSetupCost,
    totalStrategyCosts,
    rawSavings,
    annualSavings,
    fiveYearValue,
    beforeRate,
    afterRate,
    rateReduction
  } = useMemo(() => {
    const totalIncome = currentTaxInfo.wagesIncome + 
                       currentTaxInfo.passiveIncome + 
                       currentTaxInfo.unearnedIncome +
                       (currentTaxInfo.businessOwner ? (currentTaxInfo.ordinaryK1Income || 0) + (currentTaxInfo.guaranteedK1Income || 0) : 0);

    const shiftedIncome = strategies
      .filter(s => s.enabled && s.category === 'income_shifted')
      .reduce((total, strategy) => {
        if (strategy.id === 'augusta_rule' && strategy.details?.augustaRule) {
          return total + (strategy.details.augustaRule.daysRented * strategy.details.augustaRule.dailyRate);
        }
        if (strategy.id === 'hire_children' && strategy.details?.hireChildren) {
          return total + strategy.details.hireChildren.children.reduce((sum, child) => sum + child.salary, 0);
        }
        if (strategy.id === 'family_management_company' && strategy.details?.familyManagementCompany) {
          return total + strategy.details.familyManagementCompany.totalSalaries;
        }
        if (strategy.id === 'reinsurance' && strategy.details?.reinsurance) {
          return total + strategy.details.reinsurance.userContribution;
        }
        return total;
      }, 0);

    const deferredIncome = strategies
      .filter(s => s.enabled && s.category === 'income_deferred')
      .reduce((total, strategy) => {
        // Reinsurance is now in income_shifted category, so no longer handled here
        return total + strategy.estimatedSavings;
      }, 0);

    // Get strategy costs
    const charitableStrategy = strategies.find(s => s.enabled && s.id === 'charitable_donation');
    const charitableDonationAmount = charitableStrategy?.details?.charitableDonation?.donationAmount || 0;
    
    const ctbStrategy = strategies.find(s => s.enabled && s.id === 'convertible_tax_bonds');
    const ctbPaymentAmount = ctbStrategy?.details?.convertibleTaxBonds?.ctbPayment || 0;

    const reinsuranceStrategy = strategies.find(s => s.enabled && s.id === 'reinsurance');
    const reinsuranceContribution = reinsuranceStrategy?.details?.reinsurance?.userContribution || 0;
    const reinsuranceSetupCost = reinsuranceStrategy?.details?.reinsurance?.setupAdminCost || 0;

    // Calculate total out-of-pocket costs (setup/admin costs only, not deferred income)
    const totalStrategyCosts = charitableDonationAmount + ctbPaymentAmount + reinsuranceSetupCost;

    // Calculate raw savings (total tax reduction) - this is the TRUE combined benefit
    const rawSavings = Math.round(baseBreakdown.total - strategyBreakdown.total);
    
    // Net annual savings = tax savings minus all strategy costs
    const annualSavings = Math.round(rawSavings - totalStrategyCosts);

    // Debug logging for reinsurance (moved after annualSavings calculation)
    if (reinsuranceStrategy) {
      console.log('=== REINSURANCE DEBUG ===');
      console.log('Reinsurance strategy:', reinsuranceStrategy);
      console.log('Base breakdown total:', baseBreakdown.total);
      console.log('Strategy breakdown total:', strategyBreakdown.total);
      console.log('Raw savings:', rawSavings);
      console.log('Reinsurance contribution (deferred income):', reinsuranceContribution);
      console.log('Reinsurance setup cost (out-of-pocket):', reinsuranceSetupCost);
      console.log('Total strategy costs (out-of-pocket only):', totalStrategyCosts);
      console.log('Annual savings (net benefit):', annualSavings);
      console.log('========================');
    }

    // Debug calculations (only when needed)
    if (strategies.some(s => s.enabled) && process.env.NODE_ENV === 'development') {
      // Only debug when there are significant changes to prevent spam
      const enabledIds = strategies.filter(s => s.enabled).map(s => s.id).sort().join(',');
      if (enabledIds !== (window as any).lastDebugIds) {
        debugCalculations(currentTaxInfo, rates, strategies);
        (window as any).lastDebugIds = enabledIds;
      }
    }

    // Calculate 5-year value with 8% growth
    const fiveYearValue = annualSavings * 5 * 1.08;

    // Calculate effective tax rates consistently
    // Before rate: (Total Tax / Total Income) * 100
    const beforeRate = ((baseBreakdown.total / totalIncome) * 100).toFixed(1);
    
    // After rate: (Total Tax - Net Benefit) / Total Income * 100
    const afterRate = (((baseBreakdown.total - annualSavings) / totalIncome) * 100).toFixed(1);
    
    // Calculate rate reduction based on net benefit
    const rateReduction = parseFloat(beforeRate) - parseFloat(afterRate);

    return {
      totalIncome,
      shiftedIncome,
      deferredIncome,
      charitableDonationAmount,
      ctbPaymentAmount,
      reinsuranceContribution,
      reinsuranceSetupCost,
      totalStrategyCosts,
      rawSavings,
      annualSavings,
      fiveYearValue,
      beforeRate,
      afterRate,
      rateReduction
    };
  }, [currentTaxInfo, strategies, baseBreakdown, strategyBreakdown]);

  const saveCalculation = useCallback(() => {
    const calculation: SavedCalculation = {
      id: Date.now().toString(),
      year: selectedYear,
      date: new Date().toISOString(),
      taxInfo: currentTaxInfo,
      breakdown: strategyBreakdown,
      strategies: strategies.filter(s => s.enabled)
    };
    onSaveCalculation(calculation);
  }, [currentTaxInfo, selectedYear, strategyBreakdown, strategies, onSaveCalculation]);

  const handleUpdateInfo = useCallback((updatedInfo: TaxInfo) => {
    setCurrentTaxInfo(updatedInfo);
    const newStrategies = getTaxStrategies(updatedInfo, calculateTaxBreakdown(updatedInfo, taxRates[selectedYear]));
    setStrategies(newStrategies);
    setShowInfoForm(false);
  }, [rates]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <ProfessionalDisclaimer />
      {/* User Info Bar */}
      <div className="flex justify-between items-center mb-4 bg-gradient-to-r from-[#1a1a3f] to-[#2d2d67] shadow-xl p-4 text-white" style={{ borderRadius: '4px' }}>
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">{currentTaxInfo.fullName}</h2>
          <span className="text-gray-300">|</span>
          <span className="text-gray-300">{currentTaxInfo.state}</span>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="rounded-md border-none bg-white/10 text-white shadow-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <button
            onClick={() => setShowInfoForm(true)}
            className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            Update Info
          </button>
          <button
            onClick={saveCalculation}
            className="flex items-center space-x-2 px-4 py-2 rounded-md transition-colors bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
          >
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Modern Tax Savings Value Section */}
      <div className="sticky top-0 z-30 bg-white shadow-2xl overflow-hidden mb-6 rounded-2xl border border-gray-100">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Tax Savings Value</h3>
                <p className="text-blue-100 text-sm">Your personalized tax optimization results</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-blue-100 text-sm font-medium">Live Results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Annual Savings Card */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wider">Net Benefit</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-900 mb-2">
                    ${Math.max(0, annualSavings).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Annual Savings</div>
                </div>

                {/* Enhanced tooltip */}
                {totalStrategyCosts > 0 && (
                  <div className="absolute hidden group-hover:block bg-gray-900 text-white text-sm p-4 -mt-2 z-50 shadow-2xl min-w-80 max-w-96 rounded-xl border border-gray-700 transform -translate-x-1/2 left-1/2">
                    <div className="flex items-center mb-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <div className="font-semibold">Net Benefit Breakdown</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-gray-300 text-xs mb-2">After subtracting strategy costs:</div>
                      {charitableDonationAmount > 0 && (
                        <div className="flex items-center text-red-300">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>
                          <span>${Math.round(charitableDonationAmount).toLocaleString()} Donation Purchase</span>
                        </div>
                      )}
                      {ctbPaymentAmount > 0 && (
                        <div className="flex items-center text-red-300">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>
                          <span>${Math.round(ctbPaymentAmount).toLocaleString()} Bond Purchase</span>
                        </div>
                      )}
                      {reinsuranceSetupCost > 0 && (
                        <div className="flex items-center text-red-300">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>
                          <span>${Math.round(reinsuranceSetupCost).toLocaleString()} 831b Setup Costs</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5 Year Value Card */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-green-600 font-medium uppercase tracking-wider">Growth</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-900 mb-2">
                    ${Math.max(0, fiveYearValue).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 font-medium">5 Year Value at 8%</div>
                </div>

                {/* Growth indicator */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center text-xs text-green-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>+8% Annual Growth</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Rate Comparison Card */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-indigo-50 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-purple-600 font-medium uppercase tracking-wider">Rate</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 mb-3">
                    <div>
                      <div className="text-lg font-bold text-red-600">{beforeRate}%</div>
                      <div className="text-xs text-gray-600">Before</div>
                    </div>
                    <div className="text-purple-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{afterRate}%</div>
                      <div className="text-xs text-gray-600">After</div>
                    </div>
                  </div>
                  <div className="text-sm text-purple-700 font-medium">Effective Tax Rate</div>
                </div>

                {/* Rate reduction indicator */}
                <div className="mt-4 flex items-center justify-center">
                  <div className="flex items-center text-xs text-purple-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span>-{rateReduction.toFixed(1)}% Reduction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional metrics row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Total Income</div>
                  <div className="text-lg font-semibold text-gray-900">${totalIncome.toLocaleString()}</div>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Raw Tax Savings</div>
                  <div className="text-lg font-semibold text-blue-900">${rawSavings.toLocaleString()}</div>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Strategy Costs</div>
                  <div className="text-lg font-semibold text-red-600">${totalStrategyCosts.toLocaleString()}</div>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-xl overflow-hidden" style={{ borderRadius: '4px' }}>
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
          <h3 className="text-xl font-semibold text-white">Tax Bracket Analysis</h3>
        </div>
        <div className="p-6 bg-gradient-to-b from-white to-gray-50">
          <TaxBracketBreakdown
            taxInfo={currentTaxInfo}
            rates={rates}
            strategies={strategies}
            isExpanded={showBracketBreakdown}
            onToggle={() => setShowBracketBreakdown(!showBracketBreakdown)}
            progressBarData={{
              totalIncome,
              shiftedIncome,
              deferredIncome,
              baseBreakdown,
              strategyBreakdown,
              charitableDonationAmount,
              progressColors
            }}
          />
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="heading-secondary text-gray-900">Available Tax Benefits</h3>
        <StrategyCards
          strategies={strategies}
          onStrategyChange={handleStrategySelect}
          onStrategyAction={handleStrategyAction}
          onSavingsChange={handleStrategySavingsChange}
          taxInfo={taxInfo}
          rates={rates}
        />
      </div>

      {showInfoForm && (
        <Dialog.Root open={showInfoForm} onOpenChange={setShowInfoForm}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl p-0 w-full max-w-2xl z-50 focus:outline-none" style={{ borderRadius: '4px' }}>
              <Dialog.Title className="text-xl font-bold px-8 pt-8">Update Tax Information</Dialog.Title>
              <Dialog.Description className="px-8 pb-2 text-gray-500">Update your tax profile and recalculate your strategies.</Dialog.Description>
              <InfoForm
                initialData={taxInfo}
                onSubmit={(data, year) => {
                  setTaxInfo(data);
                  setCurrentTaxInfo(data);
                  const newStrategies = getTaxStrategies(data, calculateTaxBreakdown(data, taxRates[selectedYear]));
                  setStrategies(newStrategies);
                  setShowInfoForm(false);
                }}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      <FmcModal
        isOpen={showFmcModal}
        onClose={() => setShowFmcModal(false)}
      />
    </div>
  );
}