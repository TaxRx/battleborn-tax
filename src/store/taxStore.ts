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
  setTaxInfo: (info: TaxInfo | null) => void;
  setSelectedYear: (year: number) => void;
  setSavedCalculations: (calculations: SavedCalculation[]) => void;
  setSelectedStrategies: (strategies: TaxStrategy[]) => void;
  setIncludeFica: (include: boolean) => void;
  addSavedCalculation: (calculation: SavedCalculation) => Promise<void>;
  loadCalculation: (id: string) => Promise<void>;
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
      
      setSelectedYear: (year) => set({ selectedYear: year }),
      
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

      loadCalculation: async (id) => {
        try {
          console.log('Loading calculation with ID:', id);
          const { data, error } = await supabase
            .from('tax_calculations')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) {
            console.error('Error loading calculation:', error);
            if (error.code === 'PGRST116') {
              console.log('No calculation found with ID:', id);
              return;
            }
            throw error;
          }
          
          if (!data) {
            console.log('No calculation data found');
            return;
          }
          
          console.log('Loaded calculation:', data);
          set({
            taxInfo: data.tax_info as TaxInfo,
            selectedYear: data.year as number,
            selectedStrategies: (data.strategies || []) as TaxStrategy[]
          });
        } catch (error) {
          console.error('Error loading tax calculation:', error);
          throw error;
        }
      },

      saveInitialState: async (info: TaxInfo, year: number) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');
          
          const { data, error } = await supabase
            .from('tax_calculations')
            .insert([
              {
                user_id: user.id,
                tax_info: info,
                year,
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single();
          
          if (error) throw error;
          
          set({ taxInfo: info, selectedYear: year });
        } catch (error) {
          console.error('Error saving tax calculation:', error);
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