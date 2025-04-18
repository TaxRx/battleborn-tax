import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isProd = import.meta.env.PROD;

console.log('Initializing Supabase client:', {
  url: supabaseUrl,
  environment: isProd ? 'production' : 'development',
  anonKey: supabaseAnonKey?.substring(0, 10) + '...' // Only log part of the key for security
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
    flowType: 'pkce',
    storage: isProd ? window.localStorage : window.sessionStorage // Use sessionStorage for development
  },
  global: {
    headers: {
      'X-Client-Info': `tax-calculator@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
    }
  }
});

// Test connection immediately
;(async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Supabase connection test result:', {
      environment: isProd ? 'production' : 'development',
      hasSession: !!session,
      error: error?.message || null
    });

    // Test CORS with a simple query
    const { error: corsError } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)
      .single();

    if (corsError) {
      console.log('CORS test result:', {
        error: corsError.message,
        code: corsError.code,
        details: corsError.details
      });
    } else {
      console.log('CORS test successful');
    }
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
  }
})();

export default supabase;