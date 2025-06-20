import { isDemoMode } from '../utils/demoMode';
import { demoUsers, demoBusinesses } from '../data/demoSeed';
import { supabase, handleSupabaseError } from '../utils/supabaseClient';
import { User } from '../types';

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

function toUser(raw: any): User {
  return {
    id: String(raw.id),
    name: String(raw.name),
    email: String(raw.email),
    role: (raw.role as 'client' | 'admin' | 'master-admin'),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    businesses: Array.isArray(raw.businesses)
      ? raw.businesses.map((b: any) => ({
          ...b,
          user_id: String(b.user_id),
        }))
      : [],
  };
}

export async function getAllClients(): Promise<ServiceResponse<User[]>> {
  if (isDemoMode()) {
    return {
      data: demoUsers
        .filter(u => u.role === 'client')
        .map(u => toUser({ ...u, businesses: demoBusinesses.filter(b => b.user_id === u.id) })),
      error: null,
    };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at, businesses(*)')
      .eq('role', 'client');
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toUser), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function getAllUsers(): Promise<ServiceResponse<User[]>> {
  if (isDemoMode()) {
    return {
      data: demoUsers.map(u => toUser({ ...u, businesses: demoBusinesses.filter(b => b.user_id === u.id) })),
      error: null,
    };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at, updated_at, businesses(*)');
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toUser), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
} 