import { createClient } from '@supabase/supabase-js';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  filing_status: string;
  home_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  account_id?: string;
  created_at: string;
}

interface Account {
  id: string;
  name: string;
  type: 'admin' | 'operator' | 'affiliate' | 'client' | 'expert';
  contact_email: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

// Database connection configuration
// const supabaseUrl = 'http://127.0.0.1:54321'; // Local Supabase instance
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = 'https://kiogxpdjhopdlxhttprg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpb2d4cGRqaG9wZGx4aHR0cHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTUzNTEsImV4cCI6MjA1OTc5MTM1MX0.DEIHWFAHfXZrwAwORUjWd-G6fdlyufbgwUfGwW_hZng';

// Note: Using anon key since RLS is currently disabled for these tables

// Create Supabase client with anon key (RLS is disabled for these tables)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanupOrphanedClients(): Promise<void> {
  try {
    console.log('🔍 Starting database cleanup for orphaned clients...\n');

    // Step 1: Find all clients with missing or invalid account_id
    console.log('📋 Step 1: Finding clients with missing or invalid account_id...');
    
    // First get all clients, then filter in JavaScript to avoid UUID parsing issues
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select(`
        id,
        full_name,
        email,
        phone,
        filing_status,
        home_address,
        city,
        state,
        zip_code,
        account_id,
        created_at
      `) as { data: Client[] | null; error: any };

    if (allClientsError) {
      console.error('❌ Error fetching clients:', allClientsError);
      return;
    }

    if (!allClients) {
      console.log('❌ No clients found in database.');
      return;
    }

    // Filter clients with missing or empty account_id in JavaScript
    const orphanedClients = allClients.filter(client => 
      !client.account_id || client.account_id.trim() === ''
    );

    if (!orphanedClients || orphanedClients.length === 0) {
      console.log('✅ No orphaned clients found. All clients have valid account_id references.');
      return;
    }

    console.log(`⚠️  Found ${orphanedClients.length} clients with missing account_id:`);
    orphanedClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.full_name} (${client.email}) - ID: ${client.id}`);
    });

    // Step 2: For each client with account_id, check if account exists
    console.log('\n📋 Step 2: Checking for clients with invalid account_id references...');
    
    const clientsWithInvalidAccounts: Client[] = [];
    
    for (const client of orphanedClients) {
      if (client.account_id && client.account_id.trim() !== '') {
        // Check if account exists
        const { data: account, error: accountError } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', client.account_id)
          .single();

        if (accountError && accountError.code === 'PGRST116') {
          // Account doesn't exist
          clientsWithInvalidAccounts.push(client);
          console.log(`   ⚠️  Client ${client.full_name} (${client.email}) references non-existent account: ${client.account_id}`);
        }
      }
    }

    // Step 3: Create accounts for orphaned clients
    console.log('\n📋 Step 3: Creating accounts for orphaned clients...');
    
    const accountsCreated: Account[] = [];
    const clientsUpdated: Client[] = [];

    for (const client of orphanedClients) {
      try {
        // Create new account based on client information
        const accountData = {
          name: client.full_name || 'Client Account',
          type: 'client' as const,
          contact_email: client.email,
          status: 'active' as const,
          created_at: new Date().toISOString()
        };

        console.log(`   🔄 Creating account for: ${client.full_name} (${client.email})`);
        
        const { data: newAccount, error: accountCreateError } = await supabase
          .from('accounts')
          .insert([accountData])
          .select()
          .single() as { data: Account | null; error: any };

        if (accountCreateError) {
          console.error(`   ❌ Error creating account for ${client.full_name}:`, accountCreateError);
          continue;
        }

        if (!newAccount) {
          console.error(`   ❌ No account data returned for ${client.full_name}`);
          continue;
        }

        accountsCreated.push(newAccount);
        console.log(`   ✅ Created account: ${newAccount.id} for ${client.full_name}`);

        // Update client with new account_id
        console.log(`   🔄 Updating client ${client.full_name} with account_id: ${newAccount.id}`);
        
        const { data: updatedClient, error: clientUpdateError } = await supabase
          .from('clients')
          .update({ account_id: newAccount.id })
          .eq('id', client.id)
          .select()
          .single() as { data: Client | null; error: any };

        if (clientUpdateError) {
          console.error(`   ❌ Error updating client ${client.full_name}:`, clientUpdateError);
          
          // Clean up the account we just created
          await supabase
            .from('accounts')
            .delete()
            .eq('id', newAccount.id);
          
          continue;
        }

        if (!updatedClient) {
          console.error(`   ❌ No client data returned for ${client.full_name}`);
          continue;
        }

        clientsUpdated.push(updatedClient);
        console.log(`   ✅ Updated client: ${client.full_name} with account_id: ${newAccount.id}`);

      } catch (error) {
        console.error(`   ❌ Unexpected error processing client ${client.full_name}:`, error);
      }
    }

    // Step 4: Summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`   • Total orphaned clients found: ${orphanedClients.length}`);
    console.log(`   • Accounts created: ${accountsCreated.length}`);
    console.log(`   • Clients updated: ${clientsUpdated.length}`);
    
    if (accountsCreated.length > 0) {
      console.log('\n✅ New accounts created:');
      accountsCreated.forEach((account, index) => {
        console.log(`   ${index + 1}. Account ID: ${account.id} | Name: ${account.name} | Email: ${account.contact_email}`);
      });
    }

    if (clientsUpdated.length > 0) {
      console.log('\n✅ Clients updated:');
      clientsUpdated.forEach((client, index) => {
        console.log(`   ${index + 1}. Client ID: ${client.id} | Name: ${client.full_name} | Account ID: ${client.account_id}`);
      });
    }

    // Step 5: Verification
    console.log('\n📋 Step 5: Verifying cleanup results...');
    
    const { data: allClientsVerify, error: verifyError } = await supabase
      .from('clients')
      .select('id, full_name, email, account_id') as { data: Client[] | null; error: any };

    if (verifyError) {
      console.error('❌ Error during verification:', verifyError);
      return;
    }

    const remainingOrphans = allClientsVerify?.filter(client => 
      !client.account_id || client.account_id.trim() === ''
    ) || [];

    if (!remainingOrphans || remainingOrphans.length === 0) {
      console.log('✅ Verification complete: All clients now have valid account_id references!');
    } else {
      console.log(`⚠️  Warning: ${remainingOrphans.length} clients still have missing account_id:`);
      remainingOrphans.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.full_name} (${client.email}) - ID: ${client.id}`);
      });
    }

    console.log('\n🎉 Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedClients()
  .then(() => {
    console.log('\n🏁 Script execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });