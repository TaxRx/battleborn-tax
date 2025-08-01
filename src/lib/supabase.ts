import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

console.log('Initializing Supabase client:', {
  url: supabaseUrl,
  environment: import.meta.env.MODE,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey
  });
  throw new Error('Missing required environment variables for Supabase');
}

// Create and export the supabase client
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
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Create admin client for admin operations (requires service key)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'tax-calculator-admin@1.0.0',
        },
      },
    })
  : null;

console.log('Supabase Admin client available:', !!supabaseAdmin);

// Test the connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('rd_businesses').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('✅ Supabase connection test successful');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection test error:', err);
    return false;
  }
};

// Initialize auth state listener only after client is created
if (supabase) {
  try {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, {
        email: session?.user?.email,
        id: session?.user?.id,
        timestamp: new Date().toISOString()
      });
    });
    console.log('✅ Auth state listener initialized');
  } catch (error) {
    console.error('❌ Failed to initialize auth state listener:', error);
  }
} else {
  console.error('❌ Supabase client not initialized - auth listener not set up');
}

export default supabase;