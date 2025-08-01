// Import and re-export the main Supabase client to avoid multiple instances
export { supabase, supabaseAdmin, testConnection } from '../../../lib/supabase';
import { supabase as supabaseClient } from '../../../lib/supabase';
export default supabaseClient;