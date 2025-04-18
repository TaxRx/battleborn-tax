import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types';
import { getTaxStrategies } from '../utils/taxStrategies';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { taxRates } from '../data/taxRates';

interface TaxStore {
  taxInfo: TaxInfo | null;
  selectedYear: number;
  savedCalculations: SavedCalculation[];
  selectedStrategies: TaxStrategy[];
  strategies: TaxStrategy[];
  includeFica: boolean;
  setTaxInfo: (info: TaxInfo) => void;
  setSelectedYear: (year: number) => void;
  setSavedCalculations: (calculations: SavedCalculation[]) => void;
  setSelectedStrategies: (strategies: TaxStrategy[]) => void;
  setIncludeFica: (include: boolean) => void;
  addSavedCalculation: (calculation: SavedCalculation) => Promise<void>;
  loadCalculation: (year: number) => Promise<void>;
  saveInitialState: (info: TaxInfo, year: number) => Promise<void>;
  updateStrategy: (strategyId: string, updatedStrategy: TaxStrategy) => Promise<void>;
  reset: () => void;
}

export const useTaxStore = create<TaxStore>()(
  persist(
    (set, get) => ({
      taxInfo: null,
      selectedYear: new Date().getFullYear(),
      savedCalculations: [],
      selectedStrategies: [],
      strategies: [],
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

        const filteredStrategies = selectedStrategies.filter(s => s.id !== strategyId);
        const updatedStrategies = [...filteredStrategies, updatedStrategy];
        const breakdown = calculateTaxBreakdown(taxInfo, taxRates[selectedYear], updatedStrategies);

        const calculation: SavedCalculation = {
          id: Date.now().toString(),
          year: selectedYear,
          date: new Date().toISOString(),
          taxInfo,
          breakdown,
          strategies: updatedStrategies
        };

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
            calculation.id = data.id;
          }

          // Always update local state
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
        } catch (error) {
          console.error('Failed to save calculation:', error);
          throw error;
        }
      },

      loadCalculation: async (year) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          // If user is authenticated, try to load from database first
          if (user) {
            const { data: calculation, error } = await supabase
              .from('tax_calculations')
              .select('*')
              .eq('user_id', user.id)
              .eq('year', year)
              .order('updated_at', { ascending: false })
              .limit(1)
              .single();

            if (!error && calculation) {
              set({
                taxInfo: calculation.tax_info,
                selectedStrategies: calculation.strategies,
                savedCalculations: get().savedCalculations.map(calc =>
                  calc.year === year ? calculation : calc
                )
              });
              return;
            }
          }

          // If not authenticated or no database record, load from local storage
          const localCalculation = get().savedCalculations.find(calc => calc.year === year);
          if (localCalculation) {
            set({
              taxInfo: localCalculation.taxInfo,
              selectedStrategies: localCalculation.strategies
            });
          }
        } catch (error) {
          console.error('Failed to load calculation:', error);
          // Don't throw error here, as we want to fallback to local data
        }
      },

      saveInitialState: async (info: TaxInfo, year: number) => {
        try {
          set({ selectedYear: year });

          const strategies = getTaxStrategies(info, calculateTaxBreakdown(info, taxRates[year]));
          const updatedStrategies = strategies.map(strategy => 
            strategy.id === 'augusta_rule' ? { ...strategy, enabled: true } : strategy
          );

          const calculation: SavedCalculation = {
            id: Date.now().toString(),
            year,
            date: new Date().toISOString(),
            taxInfo: info,
            breakdown: calculateTaxBreakdown(info, taxRates[year], updatedStrategies),
            strategies: updatedStrategies
          };

          await get().addSavedCalculation(calculation);
        } catch (error) {
          console.error('Failed to save initial state:', error);
          throw error;
        }
      },

      reset: () => set({
        taxInfo: null,
        selectedYear: new Date().getFullYear(),
        savedCalculations: [],
        selectedStrategies: [],
        includeFica: true
      })
    }),
    {
      name: 'tax-store', // unique name for localStorage
      partialize: (state) => ({
        // Only persist these fields
        taxInfo: state.taxInfo,
        selectedYear: state.selectedYear,
        savedCalculations: state.savedCalculations,
        selectedStrategies: state.selectedStrategies,
        includeFica: state.includeFica
      })
    }
  )
);