import { create } from 'zustand';
import { produce } from 'immer';
import { SavedCalculation, TaxInfo, TaxStrategy } from '../types';
import { taxService, calculationService } from '../services';
import { realtimeService } from '../services/realtime.service';

interface CalculationState {
  calculations: SavedCalculation[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setCalculations: (calculations: SavedCalculation[]) => void;
  addCalculation: (calculation: SavedCalculation) => void;
  updateCalculation: (id: string, calculation: SavedCalculation) => void;
  deleteCalculation: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Complex Actions
  fetchCalculations: (userId: string) => Promise<void>;
  saveCalculation: (userId: string, calculation: SavedCalculation) => Promise<void>;
  createCalculation: (taxInfo: TaxInfo, year: number, strategies: TaxStrategy[]) => SavedCalculation;
  setupRealtimeSync: (userId: string) => void;
  cleanup: () => void;
  reset: () => void;
}

export const useCalculationStore = create<CalculationState>((set, get) => ({
  calculations: [],
  loading: false,
  error: null,

  setCalculations: (calculations) => set(produce((state) => {
    state.calculations = calculations;
  })),

  addCalculation: (calculation) => set(produce((state) => {
    state.calculations.push(calculation);
  })),

  updateCalculation: (id, calculation) => set(produce((state) => {
    const index = state.calculations.findIndex(calc => calc.id === id);
    if (index !== -1) {
      state.calculations[index] = calculation;
    }
  })),

  deleteCalculation: (id) => set(produce((state) => {
    state.calculations = state.calculations.filter(calc => calc.id !== id);
  })),

  setLoading: (loading) => set(produce((state) => {
    state.loading = loading;
  })),

  setError: (error) => set(produce((state) => {
    state.error = error;
  })),

  fetchCalculations: async (userId) => {
    set(produce((state) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      const calculations = await calculationService.getCalculations(userId);
      set(produce((state) => {
        state.calculations = calculations;
        state.loading = false;
      }));
    } catch (error: any) {
      set(produce((state) => {
        state.error = error.message;
        state.loading = false;
      }));
    }
  },

  saveCalculation: async (userId, calculation) => {
    set(produce((state) => {
      state.loading = true;
      state.error = null;
    }));

    try {
      await calculationService.saveCalculation(userId, calculation);
      set(produce((state) => {
        state.loading = false;
      }));
    } catch (error: any) {
      set(produce((state) => {
        state.error = error.message;
        state.loading = false;
      }));
    }
  },

  createCalculation: (taxInfo, year, strategies) => {
    const rates = taxService.getRatesForYear(year);
    const breakdown = taxService.calculateBreakdown(taxInfo, rates, strategies);

    return {
      id: Date.now().toString(),
      year,
      date: new Date().toISOString(),
      taxInfo,
      breakdown,
      strategies
    };
  },

  setupRealtimeSync: (userId) => {
    realtimeService.subscribeToCalculations(
      userId,
      (calculation) => {
        set(produce((state) => {
          const index = state.calculations.findIndex(calc => calc.id === calculation.id);
          if (index !== -1) {
            state.calculations[index] = calculation;
          } else {
            state.calculations.push(calculation);
          }
        }));
      },
      (id) => {
        set(produce((state) => {
          state.calculations = state.calculations.filter(calc => calc.id !== id);
        }));
      }
    );
  },

  cleanup: () => {
    realtimeService.unsubscribeAll();
  },

  reset: () => {
    realtimeService.unsubscribeAll();
    set(produce((state) => {
      state.calculations = [];
      state.loading = false;
      state.error = null;
    }));
  }
}));