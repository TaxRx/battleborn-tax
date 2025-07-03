import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types';
import { getTaxStrategies } from '../utils/taxStrategies';
import { calculateTaxBreakdown } from '../utils/taxCalculations';
import { taxRates } from '../data/taxRates';
import { strategyPersistenceService } from '../services/strategyPersistenceService';

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
  removeStrategy: (strategyId: string) => Promise<void>;
  toggleStrategy: (strategyId: string) => Promise<void>;
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

      setTaxInfo: (info) => {
        set({ taxInfo: info });
        // If info is null, we're resetting - no need to save to DB
        if (info) {
          const saveToDb = async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                console.log('No authenticated user found, skipping DB save');
                return;
              }

              console.log('Saving tax info to DB:', {
                user_id: user.id,
                ...info
              });

              const { error } = await supabase
                .from('tax_profiles')
                .upsert({
                  user_id: user.id,
                  filing_status: info.filingStatus,
                  standard_deduction: info.standardDeduction,
                  custom_deduction: info.customDeduction,
                  business_owner: info.businessOwner,
                  full_name: info.fullName,
                  email: info.email,
                  dependents: info.dependents,
                  home_address: info.homeAddress,
                  state: info.state,
                  wages_income: info.wagesIncome,
                  passive_income: info.passiveIncome,
                  unearned_income: info.unearnedIncome,
                  capital_gains: info.capitalGains,
                  business_name: info.businessName,
                  entity_type: info.entityType,
                  business_address: info.businessAddress,
                  ordinary_k1_income: info.ordinaryK1Income,
                  guaranteed_k1_income: info.guaranteedK1Income,
                  household_income: info.householdIncome,
                  deduction_limit_reached: info.deductionLimitReached,
                  updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

              if (error) {
                console.error('Error saving tax info to DB:', error);
                throw error;
              }
              console.log('Successfully saved tax info to DB');
            } catch (error) {
              console.error('Error syncing tax info to DB:', error);
            }
          };
          saveToDb();
        }
      },
      
      setSelectedYear: (year) => set({ selectedYear: year }),
      
      setSavedCalculations: (calculations) => set({ savedCalculations: calculations }),
      
      setSelectedStrategies: (strategies) => set({ selectedStrategies: strategies }),

      setIncludeFica: (include) => set({ includeFica: include }),

      updateStrategy: async (strategyId: string, updatedStrategy: TaxStrategy) => {
        const { taxInfo, selectedYear, selectedStrategies } = get();
        if (!taxInfo) return;

        // Check if strategy already exists
        const existingStrategy = selectedStrategies.find(s => s.id === strategyId);
        if (existingStrategy && existingStrategy.enabled) {
          console.warn(`Strategy ${strategyId} is already enabled. Use removeStrategy first to replace it.`);
          return;
        }

        const filteredStrategies = selectedStrategies.filter(s => s.id !== strategyId);
        const updatedStrategies = [...filteredStrategies, updatedStrategy];
        const breakdown = calculateTaxBreakdown(taxInfo, taxRates[selectedYear], updatedStrategies);

        // Save strategy details to Supabase for persistence
        try {
          await strategyPersistenceService.saveStrategyDetails(updatedStrategy, taxInfo, selectedYear);
        } catch (error) {
          console.error('Failed to persist strategy details:', error);
          // Continue with local state update even if persistence fails
        }

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

      removeStrategy: async (strategyId: string) => {
        const { taxInfo, selectedYear, selectedStrategies } = get();
        if (!taxInfo) return;

        const filteredStrategies = selectedStrategies.filter(s => s.id !== strategyId);
        const breakdown = calculateTaxBreakdown(taxInfo, taxRates[selectedYear], filteredStrategies);

        const calculation: SavedCalculation = {
          id: Date.now().toString(),
          year: selectedYear,
          date: new Date().toISOString(),
          taxInfo,
          breakdown,
          strategies: filteredStrategies
        };

        await get().addSavedCalculation(calculation);
        set({ selectedStrategies: filteredStrategies });
      },

      toggleStrategy: async (strategyId: string) => {
        const { selectedStrategies } = get();
        const existingStrategy = selectedStrategies.find(s => s.id === strategyId);
        
        if (existingStrategy) {
          // Strategy exists, remove it
          await get().removeStrategy(strategyId);
        } else {
          // Strategy doesn't exist, user needs to configure it first
          // This will be handled by opening the appropriate modal/form
          console.log(`Strategy ${strategyId} needs to be configured first`);
        }
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