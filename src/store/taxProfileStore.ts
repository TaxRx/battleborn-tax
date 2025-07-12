import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { TaxInfo } from '../types';

interface TaxProfileState {
  taxProfile: TaxInfo | null;
  loading: boolean;
  error: string | null;
  fetchTaxProfile: () => Promise<void>;
  updateTaxProfile: (updates: Partial<TaxInfo>) => Promise<void>;
}

export const useTaxProfileStore = create<TaxProfileState>((set, get) => ({
  taxProfile: null,
  loading: false,
  error: null,

  fetchTaxProfile: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      // Skip tax profile fetch for admin users
      if (user.email === 'admin@taxrxgroup.com') {
        set({ taxProfile: null, loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('tax_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        set({ taxProfile: {
          fullName: data.full_name || '',
          email: user.email || '',
          filingStatus: data.filing_status || 'single',
          state: data.state || 'CA',
          dependents: data.dependents || 0,
          homeAddress: data.home_address || '',
          businessOwner: !!data.business_name,
          businessName: data.business_name || '',
          businessAddress: data.business_address || '',
          entityType: data.entity_type,
          wagesIncome: data.wages_income || 0,
          passiveIncome: data.passive_income || 0,
          unearnedIncome: data.unearned_income || 0,
          capitalGains: data.capital_gains || 0,
          ordinaryK1Income: data.ordinary_k1_income || 0,
          guaranteedK1Income: data.guaranteed_k1_income || 0,
          householdIncome: data.household_income || 0,
          standardDeduction: data.standard_deduction ?? true,
          customDeduction: data.custom_deduction || 0,
          deductionLimitReached: data.deduction_limit_reached || false
        }, loading: false });
      } else {
        set({ taxProfile: null, loading: false });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error', loading: false });
    }
  },

  updateTaxProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user');

      // Skip tax profile update for admin users
      if (user.email === 'admin@taxrxgroup.com') {
        set({ loading: false });
        return;
      }

      const { error } = await supabase
        .from('tax_profiles')
        .upsert({
          uuid: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'uuid' });
      if (error) throw error;
      // Refetch after update
      await get().fetchTaxProfile();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      set({ loading: false });
    }
  }
})); 