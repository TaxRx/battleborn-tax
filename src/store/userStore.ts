import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

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
        set({ loading: true, error: null, user: null });
        console.log('Fetching user profile...');
        
        try {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            throw new Error(authError.message);
          }
          
          if (!authUser) {
            throw new Error('No authenticated user found');
          }
          
          console.log('Authenticated user:', authUser.id);
          
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();
          
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              console.log('Creating new user profile...');
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert([
                  {
                    user_id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || '',
                    is_admin: authUser.user_metadata?.is_admin || false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ])
                .select()
                .single();
              
              if (createError) {
                throw new Error(createError.message);
              }
              
              if (!newProfile) {
                throw new Error('Failed to create user profile');
              }
              
              const userData: User = {
                id: authUser.id,
                email: authUser.email || '',
                fullName: newProfile.full_name,
                isAdmin: newProfile.is_admin,
                user_metadata: authUser.user_metadata,
                app_metadata: authUser.app_metadata
              };
              
              set({ user: userData, loading: false, error: null });
              return;
            }
            
            throw new Error(profileError.message);
          }
          
          if (!profile) {
            set({ error: 'No profile data received', loading: false, user: null });
            return;
          }
          
          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            fullName: profile.full_name,
            isAdmin: profile.is_admin,
            user_metadata: authUser.user_metadata,
            app_metadata: authUser.app_metadata
          };
          
          set({ user: userData, loading: false, error: null });
        } catch (error) {
          console.error('Error in fetchUserProfile:', error);
          set({ 
            user: null, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred', 
            loading: false 
          });
        }
      },

      updateUserProfile: async (data: Partial<User>) => {
        try {
          set({ loading: true, error: null });
          const currentUser = get().user;
          
          if (!currentUser) {
            throw new Error('No user logged in');
          }
          
          const { error } = await supabase
            .from('user_profiles')
            .update({
              full_name: data.fullName,
              is_admin: data.isAdmin,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);
          
          if (error) {
            throw new Error(error.message);
          }
          
          set({ 
            user: { ...currentUser, ...data },
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Error updating user profile:', error);
          set({ 
            error: error instanceof Error ? error.message : 'An unexpected error occurred', 
            loading: false 
          });
        }
      },

      reset: () => set({ user: null, loading: false, error: null }),

      cleanup: () => {
        const subscription = supabase.auth.onAuthStateChange(() => {});
        subscription.data.subscription.unsubscribe();
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user })
    }
  )
);