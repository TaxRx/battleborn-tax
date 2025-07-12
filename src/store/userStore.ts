import { create } from 'zustand';
// import { persist } from 'zustand/middleware'; // Remove persist for user store
import { User } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserState {
  user: User | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (updates: any) => Promise<void>;
  updateTaxProfile: (updates: any) => Promise<void>;
  reset: () => void;
  setProfile: (profile: any) => void;
}

const initialState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
};

// Do NOT persist user/session in Zustand. Supabase manages its own session persistence.
export const useUserStore = create<UserState>()((set, get) => ({
  ...initialState,

  reset: () => {
    set(initialState);
  },

  fetchUserProfile: async () => {
    set({ loading: true, error: null });
    try {
      // Get current user from Supabase auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        set({ user: null, profile: null, loading: false });
        return;
      }

      set({ user });

      // Try to fetch existing profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              role: user.email === 'admin@taxrxgroup.com' ? 'admin' : 'user',
              is_admin: user.email === 'admin@taxrxgroup.com',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single();

          if (createError) throw createError;
          set({ profile: newProfile });
        } else {
          throw profileError;
        }
      } else {
        // If profile exists but is admin@taxrxgroup.com, ensure role is admin
        if (user.email === 'admin@taxrxgroup.com' && profileData.role !== 'admin') {
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({
              role: 'admin',
              is_admin: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single();

          if (updateError) throw updateError;
          set({ profile: updatedProfile });
        } else {
          set({ profile: profileData });
        }
      }

      // Try to fetch tax profile if it exists
      const { data: taxProfileData } = await supabase
        .from('tax_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (taxProfileData) {
        set((state) => ({
          profile: { ...state.profile, taxProfile: taxProfileData }
        }));
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  updateUserProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      set({ profile: updateData });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  updateTaxProfile: async (updates) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: taxData, error: taxError } = await supabase
        .from('tax_profiles')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (taxError) throw taxError;
      set((state) => ({
        profile: { ...state.profile, taxProfile: taxData }
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  setProfile: (profile) => set({ profile }),
}));