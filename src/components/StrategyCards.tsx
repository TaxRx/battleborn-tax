import React, { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react';
import { X, Plus, Flame, Link2, ChevronRight, CheckCircle, Clock, TrendingUp, Zap, Receipt, DollarSign } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { TaxStrategy } from '../types';
import { useTaxStore } from '../store/taxStore';
import AugustaRuleCalculator from './AugustaRuleCalculator';
import HireChildrenCalculator from './HireChildrenCalculator';
import CharitableDonationCalculator from './CharitableDonationCalculator';
import CostSegregationCalculator from './CostSegregationCalculator';
import FmcModal from './FmcModal';
import { debug } from '../debug';
import ConvertibleTaxBondsCalculator from './ConvertibleTaxBondsCalculator';
import ReinsuranceCalculator from './ReinsuranceCalculator';

interface StrategyCardsProps {
  strategies: TaxStrategy[];
  onStrategyChange: (strategyId: string) => void;
  onStrategyAction: (strategyId: string, action: string) => void;
  onSavingsChange: (strategyId: string, details: any) => void;
  taxInfo: any;
  rates: any;
  isLoading?: boolean;
}

const categoryTitles = {
  income_shifted: 'Income Optimization',
  income_deferred: 'Turn Ordinary Income into Long-Term Capital Gains',
  new_deductions: 'Boost Deductions',
  new_credits: 'Credits & Rebates'
};

const categoryDescriptions = {
  income_shifted: 'Strategies to optimize your income across different tax brackets and family members',
  income_deferred: 'Convert ordinary income to long-term capital gains for significant tax savings',
  new_deductions: 'Create new deductions through business expenses and property optimization',
  new_credits: 'Leverage tax credits to directly reduce your tax liability'
};

const categoryGradients = {
  income_shifted: 'from-blue-500 via-blue-600 to-blue-700',
  income_deferred: 'from-purple-500 via-purple-600 to-purple-700',
  new_deductions: 'from-emerald-500 via-emerald-600 to-emerald-700',
  new_credits: 'from-amber-500 via-amber-600 to-amber-700'
};

const categoryIcons = {
  income_shifted: '⚡',
  income_deferred: '→',
  new_deductions: '📈',
  new_credits: '💰'
};

// Helper function to detect if strategy has meaningful data
const hasMeaningfulData = (strategy: TaxStrategy): boolean => {
  if (!strategy.details) return false;
  
  if (strategy.id === 'charitable_donation' && strategy.details.charitableDonation) {
    return (strategy.details.charitableDonation.donationAmount || 0) > 0;
  }
  
  if (strategy.id === 'augusta_rule' && strategy.details.augustaRule) {
    return (strategy.details.augustaRule.totalBenefit || 0) > 0;
  }
  
  if (strategy.id === 'family_management_company' && strategy.details.familyManagementCompany) {
    return (strategy.details.familyManagementCompany.totalBenefit || 0) > 0;
  }
  
  if (strategy.id === 'hire_children' && strategy.details.hireChildren) {
    return (strategy.details.hireChildren.totalBenefit || 0) > 0;
  }
  
  if (strategy.id === 'cost_segregation' && strategy.details.costSegregation) {
    return (strategy.details.costSegregation.totalBenefit || 0) > 0;
  }
  
  if (strategy.id === 'convertible_tax_bonds' && strategy.details.convertibleTaxBonds) {
    return (strategy.details.convertibleTaxBonds.ctbPayment || 0) > 0;
  }
  
  if (strategy.id === 'reinsurance' && strategy.details.reinsurance) {
    return (strategy.details.reinsurance.userContribution || 0) > 0;
  }
  
  return false;
};

const StrategyCard = memo(function StrategyCard({ 
  strategy, 
  onStrategyChange, 
  onStrategyAction,
  onClick 
}: {
  strategy: TaxStrategy;
  onStrategyChange: (id: string) => void;
  onStrategyAction: (id: string, action: string) => void;
  onClick: () => void;
}) {
  // Calculate display value - for charitable donations, show net benefit (total - donation amount)
  const displayValue = strategy.details?.charitableDonation 
    ? Math.max(0, (strategy.details.charitableDonation.totalBenefit || 0) - (strategy.details.charitableDonation.donationAmount || 0))
    : strategy.details?.augustaRule?.totalBenefit ?? 
      strategy.details?.familyManagementCompany?.totalBenefit ?? 
      strategy.details?.hireChildren?.totalBenefit ?? 
      strategy.details?.costSegregation?.totalBenefit ?? 
      strategy.details?.convertibleTaxBonds?.netSavings ?? 
      strategy.details?.reinsurance?.totalTaxSavings ?? 
      strategy.estimatedSavings;

  const handleCardClick = () => {
    // If strategy has data but isn't enabled, enable it
    if (!strategy.enabled && hasMeaningfulData(strategy)) {
      onStrategyChange(strategy.id);
    } else {
      // Otherwise open the modal
      onClick();
    }
  };

  const getStatusIcon = () => {
    if (strategy.enabled) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (hasMeaningfulData(strategy)) {
      return <Clock className="w-5 h-5 text-amber-600" />;
    } else {
      return <TrendingUp className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (strategy.enabled) {
      return 'Active & Calculating';
    } else if (hasMeaningfulData(strategy)) {
      return 'Ready to Enable';
    } else {
      return 'Click to Configure';
    }
  };

  const getStatusColor = () => {
    if (strategy.enabled) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (hasMeaningfulData(strategy)) {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    } else {
      return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div 
      className={`group relative bg-white border rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
        strategy.enabled 
          ? 'border-green-200 shadow-sm hover:border-green-300' 
          : hasMeaningfulData(strategy)
            ? 'border-amber-200 shadow-sm hover:border-amber-300'
            : 'border-gray-200 shadow-sm hover:border-gray-300'
      }`}
      onClick={handleCardClick}
    >
      {/* Featured Badge */}
      {strategy.featured && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-xs text-white px-3 py-1 rounded-full shadow-lg font-medium">
            Featured
          </div>
        </div>
      )}
      
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        {getStatusIcon()}
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                {strategy.name}
              </h3>
              {strategy.highIncome && (
                <div className="relative">
                  <Flame className="h-4 w-4 text-amber-600" />
                  <div className="hidden group-hover:block absolute left-1/2 transform -translate-x-1/2 -top-8 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg z-20">
                    High Income Strategy
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors line-clamp-2">
              {strategy.description}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>

        {/* Progress Steps */}
        {strategy.steps && (
          <div className="space-y-3">
            <div className="flex space-x-1">
              {strategy.steps.map((step, i) => (
                <div 
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {strategy.steps.filter(s => s.completed).length} of {strategy.steps.length} steps completed
            </p>
          </div>
        )}

        {/* Synergy Indicator */}
        {strategy.synergy && (
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <Link2 size={16} className="text-blue-600" />
            <span className="text-sm font-medium">{strategy.synergy.label}</span>
          </div>
        )}

        {/* Value Display */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
            ${Math.round(displayValue).toLocaleString()}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>

        {/* Action Buttons */}
        {strategy.enabled && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            {strategy.link && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStrategyAction(strategy.id, 'get_started');
                }}
                className="text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center space-x-1 text-sm font-medium"
              >
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStrategyChange(strategy.id);
              }}
              className="text-red-600 hover:text-red-700 transition-colors inline-flex items-center space-x-1 text-sm font-medium"
              title="Remove this strategy"
            >
              <X size={16} />
              <span>Remove</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default function StrategyCards({
  strategies,
  onStrategyChange,
  onStrategyAction,
  onSavingsChange,
  taxInfo,
  rates,
  isLoading = false
}: StrategyCardsProps) {
  // Only log when strategies actually change, not on every render
  const strategiesRef = useRef(strategies);
  useEffect(() => {
    if (JSON.stringify(strategies) !== JSON.stringify(strategiesRef.current)) {
      console.log('Strategies updated:', strategies.length, 'strategies');
      strategiesRef.current = strategies;
    }
  }, [strategies]);
  
  const [activeStrategy, setActiveStrategy] = useState<TaxStrategy | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showFmcModal, setShowFmcModal] = useState(false);
  const { removeStrategy } = useTaxStore();

  const handleStrategyToggle = useCallback((strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
      // Special handling for Family Management Company
      if (strategy.id === 'family_management_company') {
        if (strategy.enabled) {
          // If enabled, remove it from the store
          removeStrategy(strategyId);
        } else {
          // If disabled, open modal to configure it
          setShowFmcModal(true);
        }
        return;
      }

      // If enabling the strategy and it's charitable donation or cost segregation,
      // we need to ensure we have valid details before enabling
      if (!strategy.enabled && (strategy.id === 'charitable_donation' || strategy.id === 'cost_segregation')) {
        if (!strategy.details) {
          // Initialize with minimal required details
          const defaultDetails = strategy.id === 'charitable_donation' ? {
            charitableDonation: {
              donationAmount: 0,
              fmvMultiplier: 1,
              agiLimit: 0.6,
              totalBenefit: 0
            }
          } : {
            costSegregation: {
              federalSavings: 0,
              stateSavings: 0,
              totalBenefit: 0
            }
          };
          onSavingsChange(strategyId, defaultDetails);
        }
      }
      onStrategyChange(strategyId);
    }
  }, [strategies, onStrategyChange, onSavingsChange]);

  const handleStrategyClick = useCallback((strategy: TaxStrategy) => {
    if (strategy.id === 'family_management_company') {
      setShowFmcModal(true);
    } else {
      setActiveStrategy(strategy);
      setIsOpen(true);
    }
  }, []);

  const handleStrategyDetailsChange = useCallback((details: any) => {
    if (!activeStrategy || !details) {
      console.log('StrategyCards: No active strategy or details are null');
      return;
    }
    
    console.log(`StrategyCards: Received details for ${activeStrategy.id}:`, details);
    debug.traceStrategyFlow('RECEIVED_DETAILS', activeStrategy.id, details);
    
    // Update strategy details immediately
    if (activeStrategy.id === 'charitable_donation') {
      debug.traceCharitableDonation('STRATEGYCARDS_RECEIVED', details.charitableDonation);
      
      onSavingsChange(activeStrategy.id, {
        charitableDonation: {
          ...details.charitableDonation,
          totalBenefit: details.charitableDonation.totalBenefit
        }
      });
      
      debug.traceCharitableDonation('STRATEGYCARDS_CALLING_ONSAVINGSCHANGE', {
        ...details.charitableDonation,
        totalBenefit: details.charitableDonation.totalBenefit
      });
    } else if (activeStrategy.id === 'cost_segregation') {
      const { federalSavings, stateSavings, ficaSavings } = details.costSegregation;
      const totalBenefit = ficaSavings !== undefined
        ? federalSavings + stateSavings + (ficaSavings || 0)
        : federalSavings + stateSavings;
      onSavingsChange(activeStrategy.id, {
        costSegregation: {
          ...details.costSegregation,
          totalBenefit,
          totalSavings: totalBenefit
        }
      });
    } else if (activeStrategy.id === 'family_management_company') {
      const { federalBenefit, stateBenefit, ficaBenefit } = details.familyManagementCompany;
      const totalBenefit = federalBenefit + stateBenefit + ficaBenefit;
      onSavingsChange(activeStrategy.id, {
        familyManagementCompany: {
          ...details.familyManagementCompany,
          totalBenefit
        }
      });
    } else if (activeStrategy.id === 'convertible_tax_bonds') {
      if (details && details.convertibleTaxBonds) {
        const { ctbPayment, ctbTaxOffset, netSavings, remainingTaxAfterCtb, reductionRatio } = details.convertibleTaxBonds;
        onSavingsChange(activeStrategy.id, {
          convertibleTaxBonds: {
            ctbPayment,
            ctbTaxOffset,
            netSavings,
            remainingTaxAfterCtb,
            reductionRatio,
            totalBenefit: netSavings
          }
        });
      }
    } else if (activeStrategy.id === 'reinsurance') {
      if (details && details.reinsurance) {
        const { userContribution, agiReduction, federalTaxBenefit, stateTaxBenefit, totalTaxSavings, netYear1Cost, breakevenYears, futureValue, capitalGainsTax, setupAdminCost } = details.reinsurance;
        onSavingsChange(activeStrategy.id, {
          reinsurance: {
            userContribution,
            agiReduction,
            federalTaxBenefit,
            stateTaxBenefit,
            totalTaxSavings,
            netYear1Cost,
            breakevenYears,
            futureValue,
            capitalGainsTax,
            setupAdminCost,
            totalBenefit: totalTaxSavings
          }
        });
        
        // Auto-enable the strategy if it has meaningful data
        if (userContribution > 0 && !activeStrategy.enabled) {
          onStrategyChange(activeStrategy.id);
        }
      }
    } else {
      onSavingsChange(activeStrategy.id, details);
    }
    
    // Note: Removed auto-enable logic to prevent circular dependencies
    // Users can manually enable strategies by clicking the card or "Enable Strategy" button
  }, [activeStrategy, onSavingsChange]);

  const handleAddStrategy = useCallback(() => {
    if (activeStrategy) {
      // Enable the strategy if it's not already enabled
      if (!activeStrategy.enabled) {
        onStrategyChange(activeStrategy.id);
      }
      setIsOpen(false);
      setTimeout(() => setActiveStrategy(null), 200);
    }
  }, [activeStrategy, onStrategyChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setActiveStrategy(null), 200);
  }, []);

  const handleFmcModalClose = useCallback(() => {
    setShowFmcModal(false);
  }, []);

  const groupedStrategies = useMemo(() => {
    return strategies.reduce((acc, strategy) => {
      if (!acc[strategy.category]) {
        acc[strategy.category] = [];
      }
      acc[strategy.category].push(strategy);
      return acc;
    }, {} as Record<string, TaxStrategy[]>);
  }, [strategies]);

  return (
    <>
      {/* Available Tax Benefits Section */}
      <div className="mb-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Tax Benefits</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore our comprehensive suite of tax optimization strategies designed to maximize your savings 
            and minimize your tax burden through proven legal methods.
          </p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-300 ${isLoading ? 'opacity-50' : ''}`}>
          {Object.entries(groupedStrategies).map(([category, categoryStrategies]) => (
            <div key={category} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-300 border border-gray-100">
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${categoryGradients[category as keyof typeof categoryGradients]} px-8 py-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-3xl">
                      {categoryIcons[category as keyof typeof categoryIcons]}
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {categoryTitles[category as keyof typeof categoryTitles]}
                    </h3>
                  </div>
                  <p className="text-white/90 text-sm">
                    {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                  </p>
                </div>
              </div>

              {/* Strategy Cards */}
              <div className="p-6 space-y-4">
                {categoryStrategies.map((strategy) => (
                  <StrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onStrategyChange={handleStrategyToggle}
                    onStrategyAction={onStrategyAction}
                    onClick={() => handleStrategyClick(strategy)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Modal */}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl z-[999] focus:outline-none rounded-2xl">
            {activeStrategy && (
              <>
                <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6 flex justify-between items-center border-b border-gray-700">
                  <div className="flex items-center space-x-4">
                    <Dialog.Title className="text-2xl font-bold text-white">
                      {activeStrategy.id === 'reinsurance'
                        ? '831b Reinsurance'
                        : activeStrategy.name}
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Configure and calculate tax savings for {activeStrategy.name}
                    </Dialog.Description>
                    {activeStrategy.enabled && (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 rounded-full border border-emerald-400/30">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-300 text-sm font-medium">Active</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {!activeStrategy.enabled && (
                      <button
                        onClick={handleAddStrategy}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl font-medium"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Enable Strategy</span>
                      </button>
                    )}
                    {activeStrategy.enabled && (
                      <div className="text-emerald-300 text-sm bg-emerald-500/10 px-4 py-2 rounded-lg">
                        Strategy is active and calculating savings
                      </div>
                    )}
                    <Dialog.Close asChild>
                      <button 
                        className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        onClick={handleClose}
                      >
                        <X size={24} />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-b from-white to-gray-50">
                  {activeStrategy.id === 'augusta_rule' && (
                    <AugustaRuleCalculator
                      taxInfo={taxInfo}
                      onSavingsChange={handleStrategyDetailsChange}
                      rates={rates}
                    />
                  )}
                  {activeStrategy.id === 'hire_children' && (
                    <HireChildrenCalculator
                      dependents={taxInfo.dependents}
                      onSavingsChange={handleStrategyDetailsChange}
                      taxInfo={taxInfo}
                      rates={rates}
                    />
                  )}
                  {activeStrategy.id === 'charitable_donation' && (
                    <CharitableDonationCalculator
                      taxInfo={taxInfo}
                      rates={rates}
                      strategies={strategies}
                      onSavingsChange={handleStrategyDetailsChange}
                    />
                  )}
                  {activeStrategy.id === 'cost_segregation' && (
                    <CostSegregationCalculator
                      taxInfo={taxInfo}
                      onSavingsChange={handleStrategyDetailsChange}
                      rates={rates}
                    />
                  )}
                  {activeStrategy.id === 'convertible_tax_bonds' && (
                    <ConvertibleTaxBondsCalculator
                      taxInfo={taxInfo}
                      onSavingsChange={handleStrategyDetailsChange}
                      rates={rates}
                      strategies={strategies.filter(s => s.id !== 'convertible_tax_bonds')}
                      existingDetails={activeStrategy.details?.convertibleTaxBonds}
                    />
                  )}
                  {activeStrategy.id === 'reinsurance' && (
                    <ReinsuranceCalculator
                      taxInfo={taxInfo}
                      onSavingsChange={handleStrategyDetailsChange}
                      rates={rates}
                      strategies={strategies}
                      existingDetails={activeStrategy.details?.reinsurance}
                    />
                  )}
                </div>

                {activeStrategy.link && activeStrategy.enabled && (
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 flex justify-end">
                    <button
                      onClick={() => onStrategyAction(activeStrategy.id, 'get_started')}
                      className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl font-medium"
                    >
                      <span>Get Started</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <FmcModal
        isOpen={showFmcModal}
        onClose={handleFmcModalClose}
      />
    </>
  );
}