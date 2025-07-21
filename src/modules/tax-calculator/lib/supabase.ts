import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Initializing Supabase client:', {
  url: supabaseUrl,
  environment: import.meta.env.MODE,
  hasAnonKey: !!supabaseAnonKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
  throw new Error('Missing required environment variables for Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'tax-calculator@1.0.0',
      'X-Client-Site': typeof window !== 'undefined' ? window.location.origin : '',
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

export const testConnection = async () => {
  try {
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return false;
    }

    // Try to make a simple query to test the connection
    const { error: queryError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    // PGRST116 means no rows found, which is fine for a connection test
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Query error:', queryError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    return false;
  }
};

// Set up auth state change listener with error handling
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed (tax-calculator):', event, {
    email: session?.user?.email,
    id: session?.user?.id,
    timestamp: new Date().toISOString()
  });
});

export default supabase;