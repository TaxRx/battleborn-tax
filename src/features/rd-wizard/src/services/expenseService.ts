import { supabase, handleSupabaseError, isDemoMode } from '../utils/supabaseClient';
import { demoExpenses } from '../data/demoSeed';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  type: 'employee' | 'contractor' | 'supply';
  client_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  year?: number;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

function toExpense(raw: any): Expense {
  return {
    id: String(raw.id),
    name: String(raw.name ?? raw.description ?? ''),
    amount: Number(raw.amount),
    type: (raw.type as 'employee' | 'contractor' | 'supply') ?? 'employee',
    client_id: String(raw.client_id),
    status: (raw.status as 'pending' | 'approved' | 'rejected') ?? 'pending',
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    year: raw.year !== undefined ? Number(raw.year) : undefined,
  };
}

export async function getExpensesForClient(clientId: string): Promise<ServiceResponse<Expense[]>> {
  if (isDemoMode()) {
    return { data: demoExpenses.filter(e => e.client_id === clientId).map(toExpense), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('client_id', clientId);
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toExpense), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function createExpense(expense: any): Promise<ServiceResponse<Expense>> {
  if (isDemoMode()) {
    demoExpenses.push(expense);
    return { data: toExpense(expense), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .single();
    if (error) return { data: null, error: error.message };
    if (data && typeof data === 'object') {
      return { data: toExpense(data), error: null };
    }
    return { data: null, error: 'Invalid expense data' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function updateExpense(expenseId: string, updates: any): Promise<ServiceResponse<Expense>> {
  if (isDemoMode()) {
    const idx = demoExpenses.findIndex(e => e.id === expenseId);
    if (idx !== -1) Object.assign(demoExpenses[idx], updates);
    return { data: toExpense(demoExpenses[idx]), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .single();
    if (error) return { data: null, error: error.message };
    if (data && typeof data === 'object') {
      return { data: toExpense(data), error: null };
    }
    return { data: null, error: 'Invalid expense data' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function deleteExpense(expenseId: string): Promise<ServiceResponse<boolean>> {
  if (isDemoMode()) {
    const idx = demoExpenses.findIndex(e => e.id === expenseId);
    if (idx !== -1) demoExpenses.splice(idx, 1);
    return { data: true, error: null };
  }
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function getContractorExpensesForBusiness(businessId: string) {
  if (isDemoMode()) {
    return { data: [] };
  }
  return await supabase
    .from('contractor_expenses')
    .select('*')
    .eq('business_id', businessId);
}

export async function getSupplyExpensesForBusiness(businessId: string) {
  if (isDemoMode()) {
    return { data: [] };
  }
  return await supabase
    .from('supply_expenses')
    .select('*')
    .eq('business_id', businessId);
}

export async function createContractorExpense(expense: any) {
  if (isDemoMode()) {
    return { data: expense };
  }
  return await supabase
    .from('contractor_expenses')
    .insert([expense]);
}

export async function updateContractorExpense(id: string, updates: any) {
  if (isDemoMode()) {
    return { data: { id, ...updates } };
  }
  return await supabase
    .from('contractor_expenses')
    .update(updates)
    .eq('id', id);
}

export async function deleteContractorExpense(id: string) {
  if (isDemoMode()) {
    return { data: true };
  }
  return await supabase
    .from('contractor_expenses')
    .delete()
    .eq('id', id);
}

export async function createSupplyExpense(expense: any) {
  if (isDemoMode()) {
    return { data: expense };
  }
  return await supabase
    .from('supply_expenses')
    .insert([expense]);
}

export async function updateSupplyExpense(id: string, updates: any) {
  if (isDemoMode()) {
    return { data: { id, ...updates } };
  }
  return await supabase
    .from('supply_expenses')
    .update(updates)
    .eq('id', id);
}

export async function deleteSupplyExpense(id: string) {
  if (isDemoMode()) {
    return { data: true };
  }
  return await supabase
    .from('supply_expenses')
    .delete()
    .eq('id', id);
}

export async function getAllExpenses(filters: any = {}): Promise<ServiceResponse<Expense[]>> {
  if (isDemoMode()) {
    let exps = demoExpenses.map(toExpense);
    if (filters.typeFilter) {
      exps = exps.filter(e => e.type === filters.typeFilter);
    }
    if (filters.statusFilter) {
      exps = exps.filter(e => e.status === filters.statusFilter);
    }
    if (filters.clientFilter) {
      exps = exps.filter(e => e.client_id === filters.clientFilter);
    }
    if (filters.yearFilter) {
      exps = exps.filter(e => e.year === parseInt(filters.yearFilter));
    }
    return { data: exps, error: null };
  }
  try {
    let query = supabase.from('expenses').select('*');
    if (filters.typeFilter) query = query.eq('type', filters.typeFilter);
    if (filters.statusFilter) query = query.eq('status', filters.statusFilter);
    if (filters.clientFilter) query = query.eq('client_id', filters.clientFilter);
    if (filters.yearFilter) query = query.eq('year', parseInt(filters.yearFilter));
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toExpense), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function updateExpenseStatus(expenseId: string, status: 'pending' | 'approved' | 'rejected'): Promise<ServiceResponse<Expense>> {
  if (isDemoMode()) {
    const idx = demoExpenses.findIndex(e => e.id === expenseId);
    if (idx !== -1) {
      demoExpenses[idx].status = status;
      demoExpenses[idx].updated_at = new Date().toISOString();
      return { data: toExpense(demoExpenses[idx]), error: null };
    }
    return { data: null, error: 'Expense not found' };
  }
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', expenseId)
      .single();
    if (error) return { data: null, error: error.message };
    if (data && typeof data === 'object') {
      return { data: toExpense(data), error: null };
    }
    return { data: null, error: 'Invalid expense data' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
} 