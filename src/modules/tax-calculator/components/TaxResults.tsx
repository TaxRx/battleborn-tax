import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Save, BarChart2, Table as TableIcon, Shield, Lock, Info } from 'lucide-react';
import { TaxInfo, TaxRates, TaxStrategy, TaxBreakdown, SavedCalculation } from '../../../types';
import { taxRates } from '../taxRates';
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
}

interface TaxBreakdownTableProps {
  breakdown: TaxBreakdown;
  totalIncome: number;
  label: string;
}

// Professional Trust Header Component
function ProfessionalHeader() {
  return (
    <div className="professional-header mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="heading-primary text-professional-navy">Tax Strategy Calculator</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="certification-badge">
                Professional Tax Analysis
              </div>
              <div className="security-indicator">
                <Lock className="h-4 w-4" />
                <span>Secure & Confidential</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="trust-badge mb-2">
            <Shield className="h-4 w-4 mr-1" />
            Licensed Professional
          </div>
          <div className="text-sm text-gray-600">
            Calculations based on current tax code
          </div>
        </div>
      </div>
    </div>
  );
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
                {percentage.toFixed(1)}%
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
  onStrategyAction
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
    rawSavings,
    annualSavings,
    fiveYearValue,
    beforeRate,
    afterRate
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
        return total;
      }, 0);

    const deferredIncome = strategies
      .filter(s => s.enabled && s.category === 'income_deferred')
      .reduce((total, s) => total + s.estimatedSavings, 0);

    // Get charitable donation details
    const charitableStrategy = strategies.find(s => s.enabled && s.id === 'charitable_donation');
    const charitableDonationAmount = charitableStrategy?.details?.charitableDonation?.donationAmount || 0;

    // Calculate raw savings (total tax reduction) - this is the TRUE combined benefit
    const rawSavings = Math.round(baseBreakdown.total - strategyBreakdown.total);

    // For charitable donations, we need to subtract the donation cost from the tax savings
    const charitableDonationCost = charitableStrategy?.details?.charitableDonation?.donationAmount || 0;
    
    // Net annual savings = tax savings minus any costs (like charitable donations)
    const annualSavings = Math.round(rawSavings - charitableDonationCost);

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

    const beforeRate = ((baseBreakdown.total / totalIncome) * 100).toFixed(1);
    const afterRate = ((strategyBreakdown.total / (totalIncome - shiftedIncome - deferredIncome)) * 100).toFixed(1);

    return {
      totalIncome,
      shiftedIncome,
      deferredIncome,
      charitableDonationAmount,
      rawSavings,
      annualSavings,
      fiveYearValue,
      beforeRate,
      afterRate
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
    const newStrategies = getTaxStrategies(updatedInfo, calculateTaxBreakdown(updatedInfo, rates));
    setStrategies(newStrategies);
    setShowInfoForm(false);
  }, [rates]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Professional Header */}
      <ProfessionalHeader />
      
      {/* Professional Disclaimer */}
      <ProfessionalDisclaimer />
      
      {/* User Info Bar */}
      <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-[#1a1a3f] to-[#2d2d67] shadow-xl p-6 text-white" style={{ borderRadius: '4px' }}>
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

      {/* Sticky Tax Savings Value */}
      <div className="sticky top-0 z-30 bg-white shadow-xl overflow-hidden mb-8" style={{ borderRadius: '4px' }}>
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
          <h3 className="text-xl font-semibold text-white">Tax Savings Value</h3>
        </div>
        <div className="p-6 bg-gradient-to-b from-white to-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 relative group shadow-lg hover:shadow-xl transition-shadow" style={{ borderRadius: '4px' }}>
              <span className="block heading-primary text-professional-navy mb-3">
                ${Math.max(0, Math.round(rawSavings - charitableDonationAmount)).toLocaleString()}
              </span>
              <span className="body-regular text-gray-600 font-medium uppercase tracking-wider">Annual Savings</span>
              {charitableDonationAmount > 0 && (
                <div className="absolute hidden group-hover:block bg-gray-800 text-white text-sm p-3 -mt-2 z-10 shadow-xl" style={{ borderRadius: '4px' }}>
                  Net benefit after subtracting ${Math.round(charitableDonationAmount).toLocaleString()} donation
                </div>
              )}
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 shadow-lg hover:shadow-xl transition-shadow" style={{ borderRadius: '4px' }}>
              <span className="block heading-primary text-professional-success mb-3">
                ${Math.max(0, Math.round((rawSavings - charitableDonationAmount) * 5 * 1.08)).toLocaleString()}
              </span>
              <span className="body-regular text-gray-600 font-medium uppercase tracking-wider">5 Year Value at 8%</span>
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