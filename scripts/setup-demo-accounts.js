import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDemoAccounts() {
  try {
    // Create admin account
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@taxrxgroup.com',
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        name: 'Demo Admin'
      }
    });

    if (adminError) {
      console.error('Error creating admin account:', adminError);
    } else {
      console.log('Admin account created:', adminData);
    }

    // Create client account
    const { data: clientData, error: clientError } = await supabase.auth.admin.createUser({
      email: 'demo.client@example.com',
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        role: 'client',
        name: 'Demo Client'
      }
    });

    if (clientError) {
      console.error('Error creating client account:', clientError);
    } else {
      console.log('Client account created:', clientData);
    }

    console.log('Demo accounts setup complete!');
  } catch (error) {
    console.error('Error setting up demo accounts:', error);
  }
}

setupDemoAccounts(); 