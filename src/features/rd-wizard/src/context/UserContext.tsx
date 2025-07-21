import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User as SupabaseUser, AuthError, Session } from '@supabase/supabase-js';

interface AuthResponse {
  data: {
    user: SupabaseUser | null;
    session: Session | null;
  };
  error: AuthError | null;
}

interface UserContextType {
  user: SupabaseUser | null;
  setUser: React.Dispatch<React.SetStateAction<SupabaseUser | null>>;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };
    getSession();
    console.log('UserContextProvider')
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setUser(data.user);
    return { data, error };
  };

  const signUp = async (email: string, password: string): Promise<AuthResponse> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (!error) setUser(data.user);
    return { data, error };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    return { error };
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, signIn, signUp, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}; 