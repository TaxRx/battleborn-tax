import { supabase, handleSupabaseError, isDemoMode } from '../utils/supabaseClient';
import { demoActivities } from '../data/demoSeed';

export interface Activity {
  id: string;
  name: string;
  description: string;
  client_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

function toActivity(raw: any): Activity {
  return {
    id: String(raw.id),
    name: String(raw.name),
    description: String(raw.description),
    client_id: String(raw.client_id),
    status: (raw.status as 'pending' | 'approved' | 'rejected') ?? 'pending',
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

export async function getActivitiesForBusiness(businessId: string): Promise<ServiceResponse<Activity[]>> {
  if (isDemoMode()) {
    return { data: demoActivities.map(toActivity), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('business_id', businessId);
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toActivity), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function createActivity(activity: any): Promise<ServiceResponse<Activity>> {
  if (isDemoMode()) {
    demoActivities.push(activity);
    return { data: toActivity(activity), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('activities')
      .insert([activity])
      .single();
    if (error) return { data: null, error: error.message };
    if (data && typeof data === 'object') {
      return { data: toActivity(data), error: null };
    }
    return { data: null, error: 'Invalid activity data' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function updateActivity(activityId: string, updates: any): Promise<ServiceResponse<Activity>> {
  if (isDemoMode()) {
    const idx = demoActivities.findIndex(a => a.id === activityId);
    if (idx !== -1) Object.assign(demoActivities[idx], updates);
    return { data: toActivity(demoActivities[idx]), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', activityId)
      .single();
    if (error) return { data: null, error: error.message };
    if (data && typeof data === 'object') {
      return { data: toActivity(data), error: null };
    }
    return { data: null, error: 'Invalid activity data' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function deleteActivity(activityId: string): Promise<ServiceResponse<boolean>> {
  if (isDemoMode()) {
    const idx = demoActivities.findIndex(a => a.id === activityId);
    if (idx !== -1) demoActivities.splice(idx, 1);
    return { data: true, error: null };
  }
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function getAllActivities(filters = {}): Promise<ServiceResponse<Activity[]>> {
  if (isDemoMode()) {
    let acts = demoActivities.map(toActivity);
    if ((filters as any).statusFilter) {
      acts = acts.filter(a => a.status === (filters as any).statusFilter);
    }
    if ((filters as any).clientFilter) {
      acts = acts.filter(a => a.client_id === (filters as any).clientFilter);
    }
    return { data: acts, error: null };
  }
  try {
    let query = supabase.from('activities').select('*');
    if ((filters as any).statusFilter) query = query.eq('status', (filters as any).statusFilter);
    if ((filters as any).clientFilter) query = query.eq('client_id', (filters as any).clientFilter);
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toActivity), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function updateActivityStatus(activityId: string, status: 'pending' | 'approved' | 'rejected'): Promise<ServiceResponse<Activity>> {
  if (isDemoMode()) {
    const idx = demoActivities.findIndex(a => a.id === activityId);
    if (idx !== -1) {
      demoActivities[idx].status = status;
      demoActivities[idx].updated_at = new Date().toISOString();
      return { data: toActivity(demoActivities[idx]), error: null };
    }
    return { data: null, error: 'Activity not found' };
  }
  try {
    const { data, error } = await supabase
      .from('activities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', activityId)
      .single();
    if (error) return { data: null, error: error.message };
    if (data && typeof data === 'object') {
      return { data: toActivity(data), error: null };
    }
    return { data: null, error: 'Invalid activity data' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
} 