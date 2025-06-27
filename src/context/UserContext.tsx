import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import useAuthStore from '../store/authStore';

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { demoMode, login, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setError(sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Sync with auth store if user is authenticated and not in demo mode
          if (!demoMode && !isAuthenticated) {
            login('admin'); // Default to admin for now
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user);
      
      if (session?.user) {
        setUser(session.user);
        // Sync with auth store if not in demo mode
        if (!demoMode && !isAuthenticated) {
          login('admin'); // Default to admin for now
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [demoMode, login, isAuthenticated]);

  // Always return the user if authenticated, regardless of demo mode
  const contextValue = {
    user: user || (isAuthenticated ? { id: 'demo-user', email: 'demo@example.com' } as User : null),
    loading,
    error
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}; 