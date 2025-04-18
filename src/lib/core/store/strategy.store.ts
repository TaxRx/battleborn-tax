import { create } from 'zustand';
import { produce } from 'immer';
import { TaxStrategy, TaxInfo } from '../types';
import { taxService } from '../services';

interface StrategyState {
  availableStrategies: TaxStrategy[];
  
  // Actions
  setAvailableStrategies: (strategies: TaxStrategy[]) => void;
  
  // Complex Actions
  loadStrategiesForTaxInfo: (taxInfo: TaxInfo, year: number) => void;
  calculateStrategyImpact: (strategy: TaxStrategy, taxInfo: TaxInfo, year: number) => {
    federal: number;
    state: number;
    fica: number;
  };
  reset: () => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  availableStrategies: [],

  setAvailableStrategies: (strategies) => set(produce((state) => {
    state.availableStrategies = strategies;
  })),

  loadStrategiesForTaxInfo: (taxInfo, year) => {
    const rates = taxService.getRatesForYear(year);
    const breakdown = taxService.calculateBreakdown(taxInfo, rates);
    
    // Strategy generation logic here
    const strategies: TaxStrategy[] = [];
    
    set(produce((state) => {
      state.availableStrategies = strategies;
    }));
  },

  calculateStrategyImpact: (strategy, taxInfo, year) => {
    const rates = taxService.getRatesForYear(year);
    return taxService.calculateStrategyImpact(taxInfo, rates, strategy);
  },

  reset: () => set(produce((state) => {
    state.availableStrategies = [];
  }))
}));