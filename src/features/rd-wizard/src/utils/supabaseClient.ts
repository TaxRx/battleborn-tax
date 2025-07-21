import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://drwnbyldbjtuogrkncov.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd25ieWxkYmp0dW9ncmtuY292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMTA0MTUsImV4cCI6MjA2MTc4NjQxNX0.ZBq0aW3Y6FnULWvPWrqanGptNkgzTqNYodnavtdTjYs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'An error occurred with the database');
};

// Helper function to check if we're in demo mode
export const isDemoMode = () => {
  return window.location.pathname.includes('/demo');
}; 