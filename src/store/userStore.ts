import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
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
        try {
          set({ loading: true, error: null });
          
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) {
            set({ user: null, loading: false });
            return;
          }

          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          if (!profile) {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: authUser.id,
                email: authUser.email,
                full_name: '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) throw createError;

            set({ 
              user: {
                id: authUser.id,
                email: authUser.email!,
                ...newProfile
              },
              loading: false 
            });
          } else {
            set({ 
              user: {
                id: authUser.id,
                email: authUser.email!,
                ...profile
              },
              loading: false 
            });
          }
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          set({ error: error.message, loading: false });
        }
      },

      updateUserProfile: async (data: Partial<User>) => {
        try {
          set({ loading: true, error: null });
          
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) throw new Error('No authenticated user');

          const { id, email, ...updateData } = data;

          const { error } = await supabase
            .from('user_profiles')
            .update({
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', authUser.id);

          if (error) throw error;

          set(state => ({
            user: state.user ? { ...state.user, ...updateData } : null,
            loading: false
          }));

          await get().fetchUserProfile();
        } catch (error: any) {
          console.error('Error updating user profile:', error);
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      reset: () => set({ user: null, loading: false, error: null }),

      cleanup: () => {
        set({ user: null, loading: false, error: null });
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);