import { create } from 'zustand';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types';
import { getTaxStrategies } from '../utils/taxStrategies';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { taxRates } from '../data/taxRates';
import { strategyService } from '../services/strategy.service';
import { supabase } from '../../supabase';

interface TaxStore {
  taxInfo: TaxInfo | null;
  selectedYear: number;
  savedCalculations: SavedCalculation[];
  selectedStrategies: TaxStrategy[];
  includeFica: boolean;
  setTaxInfo: (info: TaxInfo) => void;
  setSelectedYear: (year: number) => void;
  setSavedCalculations: (calculations: SavedCalculation[]) => void;
  setSelectedStrategies: (strategies: TaxStrategy[]) => void;
  setIncludeFica: (include: boolean) => void;
  addSavedCalculation: (calculation: SavedCalculation) => Promise<void>;
  loadCalculation: (year: number) => Promise<void>;
  saveInitialState: (info: TaxInfo, strategies: TaxStrategy[]) => Promise<void>;
  updateStrategy: (strategyId: string, updatedStrategy: TaxStrategy) => Promise<void>;
  reset: () => void;
}

export const useTaxStore = create<TaxStore>()((set, get) => ({
  taxInfo: null,
  selectedYear: new Date().getFullYear(),
  savedCalculations: [],
  selectedStrategies: [],
  includeFica: true,

  setTaxInfo: (info) => set({ taxInfo: info }),
  
  setSelectedYear: async (year) => {
    set({ selectedYear: year });
    await get().loadCalculation(year);
  },
  
  setSavedCalculations: (calculations) => set({ savedCalculations: calculations }),
  
  setSelectedStrategies: (strategies) => set({ selectedStrategies: strategies }),

  setIncludeFica: (include) => set({ includeFica: include }),

  updateStrategy: async (strategyId: string, updatedStrategy: TaxStrategy) => {
    const { taxInfo, selectedYear, selectedStrategies } = get();
    if (!taxInfo) return;

    // Remove any existing version of this strategy
    const filteredStrategies = selectedStrategies.filter(s => s.id !== strategyId);
    
    // Add the updated strategy
    const updatedStrategies = [...filteredStrategies, updatedStrategy];

    // Calculate new breakdown with updated strategies
    const breakdown = strategyService.calculateCombinedImpact(
      updatedStrategies,
      taxInfo,
      taxRates[selectedYear]
    );

    // Create new calculation
    const calculation: SavedCalculation = {
      id: Date.now().toString(),
      year: selectedYear,
      date: new Date().toISOString(),
      taxInfo,
      breakdown,
      strategies: updatedStrategies
    };

    // Save calculation and update state
    await get().addSavedCalculation(calculation);
    set({ selectedStrategies: updatedStrategies });
  },

  addSavedCalculation: async (calculation) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If user is authenticated, save to database
      if (user) {
        const { data, error } = await supabase
          .from('tax_calculations')
          .upsert({
            user_id: user.id,
            year: calculation.year,
            tax_info: calculation.taxInfo,
            breakdown: calculation.breakdown,
            strategies: calculation.strategies,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        set((state) => {
          const existingIndex = state.savedCalculations.findIndex(
            calc => calc.year === calculation.year
          );

          if (existingIndex !== -1) {
            const updatedCalculations = [...state.savedCalculations];
            updatedCalculations[existingIndex] = {
              ...calculation,
              id: data.id
            };
            return { 
              savedCalculations: updatedCalculations,
              selectedStrategies: calculation.strategies,
              taxInfo: calculation.taxInfo
            };
          }

          return {
            savedCalculations: [...state.savedCalculations, { ...calculation, id: data.id }],
            selectedStrategies: calculation.strategies,
            taxInfo: calculation.taxInfo
          };
        });
      } else {
        // If not authenticated, store locally
        set((state) => {
          const existingIndex = state.savedCalculations.findIndex(
            calc => calc.year === calculation.year
          );

          if (existingIndex !== -1) {
            const updatedCalculations = [...state.savedCalculations];
            updatedCalculations[existingIndex] = calculation;
            return { 
              savedCalculations: updatedCalculations,
              selectedStrategies: calculation.strategies,
              taxInfo: calculation.taxInfo
            };
          }

          return {
            savedCalculations: [...state.savedCalculations, calculation],
            selectedStrategies: calculation.strategies,
            taxInfo: calculation.taxInfo
          };
        });
      }
    } catch (error) {
      console.error('Failed to save calculation:', error);
      throw error;
    }
  },

  loadCalculation: async (year) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: calculation, error } = await supabase
        .from('tax_calculations')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', year)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (calculation) {
        set({
          taxInfo: calculation.tax_info,
          selectedStrategies: calculation.strategies,
          savedCalculations: get().savedCalculations.map(calc =>
            calc.year === year ? calculation : calc
          )
        });
      }
    } catch (error) {
      console.error('Failed to load calculation:', error);
      throw error;
    }
  },

  saveInitialState: async (info: TaxInfo, strategies: TaxStrategy[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const year = get().selectedYear;
      const updatedStrategies = strategies.map(strategy => ({
        ...strategy,
        savings: calculateStrategySavings(strategy, info, taxRates[year])
      }));

      const calculation: SavedCalculation = {
        id: Date.now().toString(),
        year,
        date: new Date().toISOString(),
        taxInfo: info,
        breakdown: calculateTaxBreakdown(info, taxRates[year], updatedStrategies),
        strategies: updatedStrategies
      };

      // Update local state first
      set({ 
        taxInfo: info,
        selectedStrategies: updatedStrategies,
        savedCalculations: [...get().savedCalculations, calculation]
      });

      // If authenticated, also save to database
      if (user) {
        try {
          const { error } = await supabase
            .from('tax_calculations')
            .upsert({
              user_id: user.id,
              ...calculation
            });
          
          if (error) throw error;
        } catch (dbError) {
          console.error('Failed to save to database:', dbError);
          // Don't throw here - we've already updated local state
        }
      }
    } catch (error) {
      console.error('Failed to save initial state:', error);
      throw error;
    }
  },

  reset: () => set({
    taxInfo: null,
    selectedYear: new Date().getFullYear(),
    savedCalculations: [],
    selectedStrategies: []
  })
}));