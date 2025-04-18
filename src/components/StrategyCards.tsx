import React, { useState, useCallback, memo, useMemo } from 'react';
import { X, Plus, Flame, Link2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { TaxStrategy } from '../types';
import AugustaRuleCalculator from './AugustaRuleCalculator';
import HireChildrenCalculator from './HireChildrenCalculator';
import CharitableDonationCalculator from './CharitableDonationCalculator';
import CostSegregationCalculator from './CostSegregationCalculator';
import FmcModal from './FmcModal';

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
  const displayValue = useMemo(() => {
    if (!strategy.details) return strategy.estimatedSavings;
    
    // Direct access to totalBenefit for each strategy type
    if (strategy.details.costSegregation) {
      return strategy.details.costSegregation.totalBenefit || 0;
    }
    if (strategy.details.familyManagementCompany) {
      return strategy.details.familyManagementCompany.totalBenefit || 0;
    }
    if (strategy.details.charitableDonation) {
      return strategy.details.charitableDonation.totalBenefit || 0;
    }
    if (strategy.details.augustaRule) {
      return strategy.details.augustaRule.totalBenefit || 0;
    }
    if (strategy.details.hireChildren) {
      return strategy.details.hireChildren.totalBenefit || 0;
    }
    
    return strategy.estimatedSavings;
  }, [strategy]);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStrategyChange(strategy.id);
  };

  return (
    <div 
      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200 relative"
      onClick={onClick}
    >
      {strategy.featured && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-xs text-white px-3 py-1 rounded-full shadow-lg font-medium tracking-wide">
            Featured
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between group">
        <label className="flex items-start space-x-3 flex-1">
          <div className="relative">
            <input
              type="checkbox"
              checked={strategy.enabled}
              onClick={handleCheckboxClick}
              onChange={() => {}}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#12ab61] focus:ring-[#12ab61] transition-colors"
            />
            {strategy.enabled && (
              <>
                <div className="absolute -inset-1 bg-emerald-100 rounded-full animate-pulse-subtle -z-10" />
                <div className="absolute right-4 top-4">
                  <div className="animate-ping-slow h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                  <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              </>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {strategy.name}
              </span>
              {strategy.highIncome && (
                <div className="relative">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <div className="hidden group-hover:block absolute left-1/2 transform -translate-x-1/2 -top-8 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    High Income Strategy
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{strategy.description}</p>
            {strategy.steps && (
              <div className="mt-3 space-y-2">
                <div className="flex space-x-1">
                  {strategy.steps.map((step, i) => (
                    <div 
                      key={i}
                      className={`h-1 w-6 rounded-full transition-colors duration-300 ${
                        step.completed ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
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
        </label>
        <div className="font-bold text-[#12ab61] group-hover:scale-110 transform transition-transform">
          ${Math.round(displayValue).toLocaleString()}
        </div>
      </div>

      {strategy.enabled && strategy.link && (
        <div className="mt-3 pl-7">
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
  console.log('Strategies passed to StrategyCards:', strategies);
  
  const [activeStrategy, setActiveStrategy] = useState<TaxStrategy | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showFmcModal, setShowFmcModal] = useState(false);

  const handleStrategyToggle = useCallback((strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
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
      if (activeStrategy.id === 'charitable_donation') {
        onSavingsChange(activeStrategy.id, {
          charitableDonation: {
            ...details.charitableDonation,
            totalBenefit: details.charitableDonation.totalBenefit
          }
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
    }
  }, [activeStrategy, onSavingsChange]);

  const handleAddStrategy = useCallback(() => {
    if (activeStrategy) {
      onStrategyChange(activeStrategy.id);
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
          <div key={category} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
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
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-[999] focus:outline-none">
            {activeStrategy && (
              <>
                <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center border-b">
                  <Dialog.Title className="text-xl font-bold text-white">
                    {activeStrategy.name}
                  </Dialog.Title>
                  <div className="flex items-center space-x-4">
                    {!activeStrategy.enabled && (
                      <button
                        onClick={handleAddStrategy}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 inline-flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add Strategy</span>
                      </button>
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