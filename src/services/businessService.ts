import { supabase } from '../lib/supabase';

const mockBusinesses = [
  {
    id: 'mock-business-1',
    user_id: 'mock-user',
    name: 'Demo Business',
    ein: '00-0000000',
    address: '123 Demo St',
    created_at: new Date().toISOString(),
  },
];

export const getBusinessesForUser = async (userId: string) => {
  try {
    const { data, error, status } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Supabase error fetching businesses:', error.message);
      // Fallback to mock data if 404 or other error
      return { data: mockBusinesses, error: error.message };
    }
    if (!data || data.length === 0) {
      // Fallback to mock data if no businesses found
      return { data: mockBusinesses, error: null };
    }
    return { data, error: null };
  } catch (err: any) {
    console.error('Exception fetching businesses:', err.message);
    return { data: mockBusinesses, error: err.message };
  }
};

export const createBusiness = async (business: any) => {
  return await supabase
    .from('businesses')
    .insert(business)
    .select()
    .single();
};

export const updateBusiness = async (id: string, updates: any) => {
  return await supabase
    .from('businesses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
};

export const deleteBusiness = async (id: string) => {
  return await supabase
    .from('businesses')
    .delete()
    .eq('id', id);
}; 