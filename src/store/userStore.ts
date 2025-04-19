import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, testConnection } from '../lib/supabase';
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
        set({ loading: true, error: null });
        console.log('Starting user profile fetch...');
        
        try {
          // Test database connection first
          const isConnected = await testConnection();
          if (!isConnected) {
            throw new Error('Unable to connect to the authentication service. Please check your network connection.');
          }

          // Get the current user
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError) {
            console.error('Auth error:', authError);
            throw new Error('Authentication error. Please try logging in again.');
          }

          if (!authUser) {
            console.error('No authenticated user found');
            set({ user: null, loading: false });
            return;
          }

          console.log('Found authenticated user:', authUser.id);

          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', authUser.id)
            .single();

          if (profileError) {
            // If profile doesn't exist, create it
            if (profileError.code === 'PGRST116') {
              console.log('Creating new user profile...');
              const { data: newProfile, error: createError } = await supabase
                .from('user_profiles')
                .insert([
                  {
                    user_id: authUser.id,
                    email: authUser.email,
                    full_name: authUser.user_metadata?.full_name || '',
                    is_admin: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ])
                .select()
                .single();

              if (createError) {
                console.error('Error creating profile:', createError);
                throw new Error('Failed to create user profile. Please try again.');
              }

              if (!newProfile) {
                throw new Error('Failed to create user profile. No data returned.');
              }

              const userData: User = {
                id: authUser.id,
                email: authUser.email || '',
                fullName: newProfile.full_name,
                isAdmin: newProfile.is_admin,
                user_metadata: authUser.user_metadata,
                app_metadata: authUser.app_metadata
              };

              console.log('Successfully created new profile:', userData);
              set({ user: userData, loading: false, error: null });
              return;
            }

            // Handle other profile errors
            console.error('Profile fetch error:', profileError);
            throw new Error('Failed to fetch user profile. Please try again.');
          }

          if (!profile) {
            throw new Error('No profile data found.');
          }

          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            fullName: profile.full_name,
            isAdmin: profile.is_admin,
            user_metadata: authUser.user_metadata,
            app_metadata: authUser.app_metadata
          };

          console.log('Successfully fetched existing profile:', userData);
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
        set({ loading: true, error: null });
        
        try {
          const currentUser = get().user;
          if (!currentUser) {
            throw new Error('No user logged in');
          }

          const isConnected = await testConnection();
          if (!isConnected) {
            throw new Error('Unable to connect to the database. Please check your connection.');
          }

          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              full_name: data.fullName,
              is_admin: data.isAdmin,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', currentUser.id);

          if (updateError) {
            throw new Error(`Failed to update profile: ${updateError.message}`);
          }

          const updatedUser = {
            ...currentUser,
            ...data
          };

          console.log('Successfully updated profile:', updatedUser);
          set({
            user: updatedUser,
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

      reset: () => {
        console.log('Resetting user store');
        set({ user: null, loading: false, error: null });
      },

      cleanup: () => {
        console.log('Cleaning up user store');
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