import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
    flowType: 'pkce'
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

// Test connection function with retries and proper error handling
export const testConnection = async (retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Testing Supabase connection (attempt ${attempt}/${retries})...`);

      // First, verify the client is initialized
      if (!supabase) {
        console.error('Supabase client not initialized');
        continue;
      }

      // Check if we have valid credentials
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase credentials');
        continue;
      }

      // Test a simple query to verify database access
      const { data, error: queryError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);

      if (queryError) {
        // Check if it's a permissions error (which is actually good - means we can connect)
        if (queryError.code === 'PGRST301') {
          console.log('Connection test successful (permission denied but connection works)');
          return true;
        }
        console.error('Database connection test failed:', queryError);
        if (attempt < retries) {
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        return false;
      }

      console.log('Connection test successful');
      return true;

    } catch (error) {
      console.error(`Connection test attempt ${attempt} failed:`, error);
      if (attempt < retries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return false;
    }
  }

  console.error('All connection attempts failed');
  return false;
};

// Set up auth state change listener with error handling
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, {
    email: session?.user?.email,
    id: session?.user?.id,
    timestamp: new Date().toISOString()
  });
});

export default supabase;