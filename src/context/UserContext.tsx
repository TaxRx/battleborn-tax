import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import useAuthStore from '../store/authStore';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  is_admin?: boolean;
  account_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface ExtendedUser {
  id: string;
  email: string;
  profile?: UserProfile;
  account?: Account;
}

interface UserContextType {
  user: ExtendedUser | null;
  loading: boolean;
  error: Error | null;
  setUser: (user: ExtendedUser | null) => void;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  setUser: () => {}
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { demoMode, login, isAuthenticated, logout: authLogout } = useAuthStore();


  const fetchUserDetails = useCallback(async (supabaseUser: User): Promise<ExtendedUser> => {
    try {
      // Fetch profile with account information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          account:accounts (
            id,
            name,
            type,
            status
          )
        `)
        .eq('id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Return basic user info if profile fetch fails
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || ''
        };
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        profile: profile,
        account: profile?.account || undefined
      };
    } catch (err) {
      console.error('Error in fetchUserDetails:', err);
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || ''
      };
    }
  }, []);

  useEffect(() => {
    console.log('useEffect', {demoMode, isAuthenticated})
    const initializeAuth = async () => {
      try {
        console.log('initializeAuth', {demoMode, isAuthenticated})
        // Skip Supabase auth initialization in demo mode
        if (demoMode) {
          setLoading(false);
          return;
        }

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(sessionError);
          setLoading(false);
          return;
        }
        console.log('session', {session, sessionError})
        if (session?.user) {
          const extendedUser = await fetchUserDetails(session.user);
          setUser(extendedUser);
          // Sync with auth store - set authenticated and determine user type
          if (!isAuthenticated) {
            const userType = extendedUser.account?.type || 'client';
            login(userType);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Skip auth listener setup in demo mode
    if (demoMode) {
      return;
    }
    console.log('Setting up auth listener')
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed (UserProvider):', event, session);
      
      if (session?.user) {
        console.log('fetching user details')
        fetchUserDetails(session.user).then(extendedUser => {
          console.log('fetched user details', extendedUser)
          setUser(extendedUser);
          // Sync with auth store
          if (!isAuthenticated) {
            const userType = extendedUser.account?.type || 'client';
            login(userType);
          }
        });
      } else if(event !== 'INITIAL_SESSION'){
        setUser(null);
        // Clear auth store when logged out
        authLogout();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [demoMode, login, isAuthenticated, authLogout, fetchUserDetails]);

  // Always return the user if authenticated, regardless of demo mode
  const contextValue = {
    user: user || (isAuthenticated ? { 
      id: demoMode ? 'demo-user' : 'authenticated-user', 
      email: demoMode ? 'demo@example.com' : 'user@example.com'
    } : null),
    loading,
    error,
    setUser
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}; 