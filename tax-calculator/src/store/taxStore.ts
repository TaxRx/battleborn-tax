import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { TaxInfo, TaxStrategy, TaxBreakdown } from '../types/tax';

const defaultTaxInfo: TaxInfo = {
  user_id: '',
  standard_deduction: true,
  custom_deduction: 0,
  business_owner: false,
  full_name: '',
  email: '',
  filing_status: 'single',
  dependents: 0,
  home_address: '',
  state: '',
  wages_income: 0,
  passive_income: 0,
  unearned_income: 0,
  capital_gains: 0,
  business_name: '',
  entity_type: 'Sole Prop',
  business_address: '',
  ordinary_k1_income: 0,
  guaranteed_k1_income: 0,
  deduction_limit_reached: false,
  household_income: 0
};

interface TaxStore {
  tax_info: TaxInfo;
  breakdown: TaxBreakdown | null;
  strategies: TaxStrategy[];
  include_fica: boolean;
  setTaxInfo: (info: Partial<TaxInfo>) => void;
  resetTaxInfo: () => void;
  setBreakdown: (breakdown: TaxBreakdown | null) => void;
  setStrategies: (strategies: TaxStrategy[]) => void;
  setIncludeFica: (include: boolean) => void;
  saveCalculation: () => Promise<void>;
  loadCalculation: (year: number) => Promise<void>;
}

export const useTaxStore = create<TaxStore>()(
  persist(
    (set, get) => ({
      tax_info: defaultTaxInfo,
      breakdown: null,
      strategies: [],
      include_fica: true,
      
      setTaxInfo: (info) => {
        set((state) => ({
          tax_info: { ...state.tax_info, ...info },
        }));
      },

      resetTaxInfo: () => {
        set(() => ({
          tax_info: defaultTaxInfo,
          breakdown: null,
          strategies: [],
          include_fica: true,
        }));
      },

      setBreakdown: (breakdown) => set({ breakdown }),
      setStrategies: (strategies) => set({ strategies }),
      setIncludeFica: (include) => set({ include_fica: include }),

      saveCalculation: async () => {
        const { tax_info, breakdown, strategies } = get();
        if (!tax_info.user_id || !breakdown) return;

        try {
          const { error } = await supabase
            .from('tax_calculations')
            .insert({
              user_id: tax_info.user_id,
              year: new Date().getFullYear(),
              date: new Date().toISOString(),
              tax_info,
              breakdown,
              strategies,
            });

          if (error) throw error;
        } catch (error) {
          console.error('Error saving calculation:', error);
          throw error;
        }
      },

      loadCalculation: async (year) => {
        const { tax_info } = get();
        if (!tax_info.user_id) return;

        try {
          const { data, error } = await supabase
            .from('tax_calculations')
            .select('*')
            .eq('user_id', tax_info.user_id)
            .eq('year', year)
            .order('date', { ascending: false })
            .limit(1)
            .single();

          if (error) throw error;
          if (data) {
            set({
              tax_info: data.tax_info,
              breakdown: data.breakdown,
              strategies: data.strategies,
            });
          }
        } catch (error) {
          console.error('Error loading calculation:', error);
          throw error;
        }
      },
    }),
    {
      name: 'tax-storage',
      partialize: (state) => ({
        tax_info: state.tax_info,
        breakdown: state.breakdown,
        strategies: state.strategies,
        include_fica: state.include_fica,
      }),
    }
  )
);