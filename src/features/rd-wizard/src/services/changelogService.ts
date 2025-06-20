import { supabase, handleSupabaseError, isDemoMode } from '../utils/supabaseClient';
import { demoChangelog } from '../data/demoSeed';

interface ChangelogEntry {
  actor_id: string; // admin
  target_user_id: string; // client
  action: string;
  details: string;
  metadata?: Record<string, any>;
}

export const createChangelogEntry = async (entry: ChangelogEntry) => {
  if (isDemoMode()) {
    demoChangelog.push({ ...entry, id: Math.random().toString(), created_at: new Date().toISOString() });
    return { data: entry };
  }
  try {
    const { error } = await supabase
      .from('changelog')
      .insert({
        ...entry,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
  }
};

export const getChangelogEntries = async (userId?: string) => {
  if (isDemoMode()) {
    return demoChangelog.filter(e => !userId || e.target_user_id === userId);
  }
  try {
    let query = supabase
      .from('changelog')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('target_user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
  }
};

export async function getChangelogForBusiness(businessId: string) {
  if (isDemoMode()) {
    return demoChangelog.filter(e => e.business_id === businessId);
  }
  try {
    const { data, error } = await supabase
      .from('changelog')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
  }
}

export async function getAllChangelogEntries() {
  if (isDemoMode()) {
    return { data: demoChangelog };
  }
  try {
    const { data, error } = await supabase
      .from('changelog')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data };
  } catch (error) {
    handleSupabaseError(error);
  }
} 