import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, testConnection } from '../lib/supabase';
import { User } from '../types/user';
import type { UserProfile } from '../types';

interface UserStore {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateTaxInfo: (taxInfo: User['taxInfo']) => Promise<void>;
  updatePreferences: (preferences: User['preferences']) => Promise<void>;
  reset: () => void;
  cleanup: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,

      setUser: (user) => set({ user }),

      fetchUserProfile: async () => {
        set({ loading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ user: null, loading: false });
            return;
          }

          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .limit(1);

          if (error) throw error;
          
          if (!profiles || profiles.length === 0) {
            set({ user: null, loading: false });
            return;
          }

          set({ user: profiles[0], loading: false });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          set({ error: 'Failed to fetch user profile', loading: false });
        }
      },

      updateUserProfile: async (profile: Partial<UserProfile>) => {
        set({ loading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No authenticated user');

          const { error } = await supabase
            .from('profiles')
            .update(profile)
            .eq('id', user.id);

          if (error) throw error;
          
          set(state => ({
            user: state.user ? { ...state.user, ...profile } : null,
            loading: false
          }));
        } catch (error) {
          console.error('Error updating user profile:', error);
          set({ error: 'Failed to update user profile', loading: false });
        }
      },

      updateTaxInfo: async (taxInfo) => {
        set({ loading: true, error: null });
        try {
          const { user } = get();
          if (!user) throw new Error('No user logged in');

          // First ensure the tax profile exists
          const { data: existingTaxProfile, error: checkError } = await supabase
            .from('tax_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
          }

          let result;
          if (!existingTaxProfile) {
            // Create new tax profile
            const { data, error } = await supabase
              .from('tax_profiles')
              .insert({
                user_id: user.id,
                ...taxInfo,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (error) throw error;
            result = data;
          } else {
            // Update existing tax profile
            const { data, error } = await supabase
              .from('tax_profiles')
              .update({
                ...taxInfo,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .select()
              .single();

            if (error) throw error;
            result = data;
          }

          // Update the user store
          set({ 
            user: { ...user, taxInfo: result },
            loading: false 
          });
        } catch (err) {
          console.error('Error updating tax info:', err);
          set({ 
            error: err instanceof Error ? err.message : 'Failed to update tax information',
            loading: false 
          });
        }
      },

      updatePreferences: async (preferences) => {
        set({ loading: true, error: null });
        try {
          const { user } = get();
          if (!user) throw new Error('No user logged in');

          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              ...preferences,
              updated_at: new Date().toISOString()
            });

          if (error) throw error;

          set({ 
            user: { ...user, preferences },
            loading: false 
          });
        } catch (err) {
          console.error('Error updating preferences:', err);
          set({ 
            error: err instanceof Error ? err.message : 'Failed to update preferences',
            loading: false 
          });
        }
      },

      reset: () => set({ user: null, loading: false, error: null }),
      cleanup: () => set({ user: null, loading: false, error: null })
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);