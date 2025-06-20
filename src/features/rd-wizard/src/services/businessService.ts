import { supabase, handleSupabaseError, isDemoMode } from '../utils/supabaseClient';
import { demoBusinesses, demoBusinessLinks } from '../data/demoSeed';
import { Business, BusinessLink, ServiceResponse } from '../types';

function toBusiness(raw: any): Business {
  return {
    id: String(raw.id),
    name: String(raw.name),
    businessDBA: String(raw.business_dba || ''),
    ein: String(raw.ein || ''),
    yearStarted: Number(raw.year_started) || new Date().getFullYear(),
    state: String(raw.state || ''),
    address: String(raw.address || ''),
    city: String(raw.city || ''),
    zipCode: String(raw.zip_code || ''),
    phone: String(raw.phone || ''),
    entityType: String(raw.entity_type || ''),
    category: String(raw.category || ''),
    area: String(raw.area || ''),
    focus: String(raw.focus || ''),
    naicsCode: String(raw.naics_code || ''),
    practiceType: String(raw.practice_type || ''),
    specialty: String(raw.specialty || ''),
    website: String(raw.website || ''),
    contactName: String(raw.contact_name || ''),
    contactEmail: String(raw.contact_email || ''),
    user_id: String(raw.user_id),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

function toBusinessLink(raw: any): BusinessLink {
  return {
    id: String(raw.id),
    user_id: String(raw.user_id),
    business_id: String(raw.business_id),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

export async function getBusinessesForUser(userId: string): Promise<ServiceResponse<Business[]>> {
  if (isDemoMode()) {
    return {
      data: demoBusinesses
        .filter(b => b.user_id === userId)
        .map(toBusiness),
      error: null
    };
  }
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId);
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toBusiness), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function getAllBusinesses(): Promise<ServiceResponse<Business[]>> {
  if (isDemoMode()) {
    return { data: demoBusinesses.map(toBusiness), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*, users(name, email, role)');
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toBusiness), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function getBusinessById(id: string): Promise<ServiceResponse<Business>> {
  if (isDemoMode()) {
    const business = demoBusinesses.find(b => b.id === id);
    return business ? { data: toBusiness(business), error: null } : { data: null, error: 'Business not found' };
  }
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return { data: null, error: error.message };
    if (data) {
      return { data: toBusiness(data), error: null };
    }
    return { data: null, error: 'Business not found' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function createBusiness(business: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Business>> {
  if (isDemoMode()) {
    const newBusiness: Business = {
      ...business,
      id: Math.random().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoBusinesses.push(newBusiness);
    return { data: newBusiness, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('businesses')
      .insert([business])
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    if (data) {
      return { data: toBusiness(data), error: null };
    }
    return { data: null, error: 'Failed to create business' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function updateBusiness(id: string, updates: Partial<Business>): Promise<ServiceResponse<Business>> {
  if (isDemoMode()) {
    const idx = demoBusinesses.findIndex(b => b.id === id);
    if (idx === -1) return { data: null, error: 'Business not found' };
    const updatedBusiness = { ...demoBusinesses[idx], ...updates, updated_at: new Date().toISOString() };
    demoBusinesses[idx] = updatedBusiness;
    return { data: toBusiness(updatedBusiness), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    if (data) {
      return { data: toBusiness(data), error: null };
    }
    return { data: null, error: 'Failed to update business' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function deleteBusiness(id: string): Promise<ServiceResponse<boolean>> {
  if (isDemoMode()) {
    const idx = demoBusinesses.findIndex(b => b.id === id);
    if (idx === -1) return { data: null, error: 'Business not found' };
    demoBusinesses.splice(idx, 1);
    return { data: true, error: null };
  }
  try {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function getAllBusinessLinks(): Promise<ServiceResponse<BusinessLink[]>> {
  if (isDemoMode()) {
    return { data: demoBusinessLinks.map(toBusinessLink), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('business_links')
      .select('*');
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toBusinessLink), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function linkBusinessToUser(userId: string, businessId: string): Promise<ServiceResponse<BusinessLink>> {
  if (isDemoMode()) {
    const link: BusinessLink = {
      id: Math.random().toString(),
      user_id: userId,
      business_id: businessId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoBusinessLinks.push(link);
    return { data: link, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('business_links')
      .insert([{ user_id: userId, business_id: businessId }])
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    if (data) {
      return { data: toBusinessLink(data), error: null };
    }
    return { data: null, error: 'Failed to create business link' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function unlinkBusinessFromUser(linkId: string): Promise<ServiceResponse<boolean>> {
  if (isDemoMode()) {
    const idx = demoBusinessLinks.findIndex(l => l.id === linkId);
    if (idx === -1) return { data: null, error: 'Business link not found' };
    demoBusinessLinks.splice(idx, 1);
    return { data: true, error: null };
  }
  try {
    const { error } = await supabase
      .from('business_links')
      .delete()
      .eq('id', linkId);
    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
} 