import React, { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react';
import { X, Plus, Flame, Link2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { TaxStrategy } from '../types';
import { useTaxStore } from '../store/taxStore';
import AugustaRuleCalculator from './AugustaRuleCalculator';
import HireChildrenCalculator from './HireChildrenCalculator';
import CharitableDonationCalculator from './CharitableDonationCalculator';
import CostSegregationCalculator from './CostSegregationCalculator';
import FmcModal from './FmcModal';
import { debug } from '../debug';

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
  income_shifted: 'Shift Income to a Lower Tax Bracket',
  income_deferred: 'Turn Ordinary Income into Long-Term Capital Gains',
  new_deductions: 'Qualify for New Deductions',
  new_credits: 'Offset Taxes with Credits'
};

const categoryGradients = {
  income_shifted: 'from-blue-500 to-blue-600',
  income_deferred: 'from-purple-500 to-purple-600',
  new_deductions: 'from-emerald-500 to-emerald-600',
  new_credits: 'from-amber-500 to-amber-600'
};

const categoryIcons = {
  income_shifted: '↓',
  income_deferred: '→',
  new_deductions: '-',
  new_credits: '+'
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

  return (
    <div 
      className={`p-8 cursor-pointer transition-all duration-300 relative border ${
        strategy.enabled 
          ? 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-600 shadow-sm hover:shadow-md' 
          : hasMeaningfulData(strategy)
            ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-500 shadow-sm hover:shadow-md'
            : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
      }`}
      style={{ borderRadius: '4px' }}
      onClick={handleCardClick}
    >
      {strategy.featured && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-xs text-white px-4 py-2 rounded-full shadow-lg font-medium">
            Featured
          </div>
        </div>
      )}
      
      {/* Data entered indicator - professional dot in top corner */}
      {!strategy.enabled && strategy.details && hasMeaningfulData(strategy) && (
        <div className="absolute top-4 right-4 z-10">
          <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm">
            <div className="absolute inset-0 bg-amber-500 rounded-full animate-pulse opacity-75"></div>
          </div>
        </div>
      )}

      {/* Strategy enabled indicator - professional dot in bottom corner */}
      {strategy.enabled && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="w-3 h-3 bg-blue-600 rounded-full shadow-sm">
            <div className="absolute inset-0 bg-blue-600 rounded-full animate-pulse opacity-75"></div>
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between group">
        <div className="flex items-start space-x-3 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h3 className="heading-tertiary text-gray-900 group-hover:text-blue-700 transition-colors">
                {strategy.name}
              </h3>
              {strategy.highIncome && (
                <div className="relative">
                  <Flame className="h-5 w-5 text-amber-600" />
                  <div className="hidden group-hover:block absolute left-1/2 transform -translate-x-1/2 -top-10 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    High Income Strategy
                  </div>
                </div>
              )}
            </div>
            <p className="body-regular text-gray-600 group-hover:text-gray-800 transition-colors mb-4">{strategy.description}</p>
            
            {/* Status indicator text */}
            <div className="body-small font-medium mb-4">
              {strategy.enabled ? (
                <span className="text-blue-600">✓ Active & Calculating</span>
              ) : hasMeaningfulData(strategy) ? (
                <span className="text-amber-600">⚡ Data Entered - Click to Enable</span>
              ) : (
                <span className="text-gray-500">Click to Configure</span>
              )}
            </div>

            {strategy.steps && (
              <div className="mt-4 space-y-3">
                <div className="flex space-x-2">
                  {strategy.steps.map((step, i) => (
                    <div 
                      key={i}
                      className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                        step.completed ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="body-small text-gray-500">
                  {strategy.steps.filter(s => s.completed).length} of {strategy.steps.length} steps completed
                </p>
              </div>
            )}
            {strategy.synergy && (
              <div className="mt-2 flex items-center space-x-1 text-blue-600">
                <Link2 size={16} className="text-blue-600" />
                <span className="text-sm hover:text-blue-700 transition-colors">{strategy.synergy.label}</span>
              </div>
            )}
          </div>
        </div>
        <div className="heading-tertiary text-professional-navy group-hover:text-blue-700 transition-colors font-semibold">
          ${Math.round(displayValue).toLocaleString()}
        </div>
      </div>

      {strategy.enabled && (
        <div className="mt-3 pl-7 flex items-center justify-between">
          {strategy.link && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStrategyAction(strategy.id, 'get_started');
              }}
              className="text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center space-x-1 group"
            >
              <span>Get Started</span>
              <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
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
    if (activeStrategy) {
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
      } else {
        onSavingsChange(activeStrategy.id, details);
      }
      
      // Note: Removed auto-enable logic to prevent circular dependencies
      // Users can manually enable strategies by clicking the card or "Enable Strategy" button
    }
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
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-300 ${isLoading ? 'opacity-50' : ''}`}>
        {Object.entries(groupedStrategies).map(([category, categoryStrategies]) => (
          <div key={category} className="bg-white shadow-xl overflow-hidden transform hover:scale-[1.01] transition-all duration-300" style={{ borderRadius: '4px' }}>
            <div className={`bg-gradient-to-r ${categoryGradients[category as keyof typeof categoryGradients]} px-6 py-4`}>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-white">
                  {categoryIcons[category as keyof typeof categoryIcons]}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {categoryTitles[category as keyof typeof categoryTitles]}
                </h3>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
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

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[998]" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white shadow-2xl z-[999] focus:outline-none" style={{ borderRadius: '4px' }}>
            {activeStrategy && (
              <>
                <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center border-b">
                  <div className="flex items-center space-x-3">
                    <Dialog.Title className="text-xl font-bold text-white">
                      {activeStrategy.name}
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Configure and calculate tax savings for {activeStrategy.name}
                    </Dialog.Description>
                    {activeStrategy.enabled && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-emerald-500/20 rounded-full">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-emerald-300 text-sm font-medium">Active</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    {!activeStrategy.enabled && (
                      <button
                        onClick={handleAddStrategy}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Enable Strategy</span>
                      </button>
                    )}
                    {activeStrategy.enabled && (
                      <div className="text-emerald-300 text-sm">
                        Strategy is active and calculating savings
                      </div>
                    )}
                    <Dialog.Close asChild>
                      <button 
                        className="text-white/70 hover:text-white transition-colors"
                        onClick={handleClose}
                      >
                        <X size={24} />
                      </button>
                    </Dialog.Close>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-b from-white to-gray-50">
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
                </div>

                {activeStrategy.link && activeStrategy.enabled && (
                  <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
                    <button
                      onClick={() => onStrategyAction(activeStrategy.id, 'get_started')}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                    >
                      <span>Get Started</span>
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