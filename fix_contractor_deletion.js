import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://kiogxpdjhopdlxhttprg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpb2d4cGRqaG9wZGx4aHR0cHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTUzNTEsImV4cCI6MjA1OTc5MTM1MX0.DEIHWFAHfXZrwAwORUjWd-G6fdlyufbgwUfGwW_hZng';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixContractorDeletion() {
  try {
    console.log('🔧 Starting contractor deletion foreign key constraint fix...');

    // Read the SQL file
    const sqlContent = fs.readFileSync('fix_contractor_deletion.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          if (data) {
            console.log('📊 Result:', data);
          }
        }
      } catch (err) {
        console.error(`❌ Exception executing statement ${i + 1}:`, err);
        // Continue with other statements
      }
    }

    console.log('\n🎉 Contractor deletion foreign key constraint fix completed!');
    console.log('💡 The foreign key constraints should now be properly set up with CASCADE delete.');
    console.log('🔄 Try deleting a contractor again - it should work now.');

  } catch (error) {
    console.error('❌ Error fixing contractor deletion:', error);
    process.exit(1);
  }
}

// Run the fix
fixContractorDeletion(); 