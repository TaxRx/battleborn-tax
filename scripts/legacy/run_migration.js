const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250120000001_update_contractor_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running migration...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('Migration error:', error);
      throw error;
    }
    
    console.log('Migration completed successfully!');
    
    // Test the schema by querying the table
    const { data, error: queryError } = await supabase
      .from('rd_contractors')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.error('Query error:', queryError);
    } else {
      console.log('Table structure verified. Columns:', Object.keys(data[0] || {}));
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 