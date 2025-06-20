import { supabase } from '../lib/supabase';
import { ContractorExpense, SupplyExpense } from '../types';

export const getContractorExpensesForBusiness = async (businessId: string) => {
  return await supabase
    .from('contractor_expenses')
    .select('*')
    .eq('business_id', businessId);
};

export const createContractorExpense = async (expense: ContractorExpense) => {
  return await supabase
    .from('contractor_expenses')
    .insert(expense)
    .select()
    .single();
};

export const updateContractorExpense = async (id: string, updates: Partial<ContractorExpense>) => {
  return await supabase
    .from('contractor_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

export const deleteContractorExpense = async (id: string) => {
  return await supabase
    .from('contractor_expenses')
    .delete()
    .eq('id', id);
};

export const getSupplyExpensesForBusiness = async (businessId: string) => {
  return await supabase
    .from('supply_expenses')
    .select('*')
    .eq('business_id', businessId);
};

export const createSupplyExpense = async (expense: SupplyExpense) => {
  return await supabase
    .from('supply_expenses')
    .insert(expense)
    .select()
    .single();
};

export const updateSupplyExpense = async (id: string, updates: Partial<SupplyExpense>) => {
  return await supabase
    .from('supply_expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

export const deleteSupplyExpense = async (id: string) => {
  return await supabase
    .from('supply_expenses')
    .delete()
    .eq('id', id);
}; 