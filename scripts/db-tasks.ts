/**
 * Database Management Script - Multi-Task Support
 * 
 * This script provides multiple database management tasks for the Battle Born application.
 * 
 * USAGE:
 * 
 * Basic usage (defaults to task=client and database=local):
 *   node scripts/db-tasks.ts
 * 
 * Specify task and database:
 *   node scripts/db-tasks.ts --task=client --database=local
 *   node scripts/db-tasks.ts --task=links --database=local
 *   node scripts/db-tasks.ts -task=client -db=local
 *   node scripts/db-tasks.ts -t=links -db=local
 * 
 * With service key for automatic auth user creation (client task):
 *   node scripts/db-tasks.ts --task=client --database=local --service-key=your-service-role-key
 *   node scripts/db-tasks.ts -task=client -db=local -key=your-service-role-key
 * 
 * Show help:
 *   node scripts/db-tasks.ts --help
 *   node scripts/db-tasks.ts -h
 * 
 * PARAMETERS:
 * --task=TASK (or -task=TASK or -t=TASK)  Task to perform: client, links - defaults to 'client'
 * --database=ENV (or -db=ENV)             Database environment (local, live, ben) - defaults to 'local'
 * --service-key=KEY (or -key=KEY)         Supabase service role key (optional, for client task)
 *                                          Without this, SQL statements are generated for manual auth user creation
 * 
 * TASKS:
 * 
 * client: Orphaned Clients & Profile Creation
 *   1. Finds clients with missing or invalid account_id references
 *   2. Creates new accounts for orphaned clients
 *   3. Updates client records with proper account_id references
 *   4. Creates profiles for clients without associated user profiles
 *   5. Creates auth.users automatically (with service key) or provides SQL for manual creation
 * 
 * links: Account-Client Access Management
 *   1. Display accounts (operator, affiliate, expert) for selection
 *   2. Show clients already linked to selected account
 *   3. Show unlinked clients available for linking
 *   4. Provide options to link all or select specific clients
 *   5. Create account_client_access records with specified access level
 * 
 * SECURITY NOTE:
 * The service key should be your Supabase service_role key, not the anon key.
 * This gives the script admin privileges to create auth users.
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

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

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_admin: boolean;
  account_id?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  account_id?: string;
  phone?: string;
}

interface AccountClientAccess {
  id: string;
  account_id: string;
  client_id: string;
  access_level: string;
  created_at: string;
  updated_at: string;
}

// Database connection configurations
const databases = {
  local: {
    supabaseUrl: 'http://127.0.0.1:54321',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  },
  ben: {
    supabaseUrl: 'https://kiogxpdjhopdlxhttprg.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpb2d4cGRqaG9wZGx4aHR0cHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTUzNTEsImV4cCI6MjA1OTc5MTM1MX0.DEIHWFAHfXZrwAwORUjWd-G6fdlyufbgwUfGwW_hZng'
  },
  live: {
    supabaseUrl: 'https://ufxwqddayrydbgwaysfw.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeHdxZGRheXJ5ZGJnd2F5c2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODE3ODksImV4cCI6MjA2NTc1Nzc4OX0.FRSq5CgQLsaLe4QNBOgvUQFEsXZypZ2Nrg3Mr5Kswpw'
  }

};

// Service key will be passed as command line argument
// Note: Using anon key for regular operations, service key for auth user creation

// Get command line arguments
const args = process.argv.slice(2);
const serviceKeyArg = args.find(arg => arg.startsWith('--service-key=') || arg.startsWith('-key='));
const databaseArg = args.find(arg => arg.startsWith('--database=') || arg.startsWith('-db='));
const taskArg = args.find(arg => arg.startsWith('--task=') || arg.startsWith('-task=') || arg.startsWith('-t='));

const supabaseServiceKey = serviceKeyArg ? serviceKeyArg.split('=')[1] : null;
const targetDatabase = databaseArg ? databaseArg.split('=')[1] : 'local';
const targetTask = taskArg ? taskArg.split('=')[1] : 'client';

// Validate database selection
if (!databases[targetDatabase as keyof typeof databases]) {
  console.error(`❌ Invalid database selection: ${targetDatabase}`);
  console.error(`Valid options are: ${Object.keys(databases).join(', ')}`);
  process.exit(1);
}

// Validate task selection
const validTasks = ['client', 'links'];
if (!validTasks.includes(targetTask)) {
  console.error(`❌ Invalid task selection: ${targetTask}`);
  console.error(`Valid options are: ${validTasks.join(', ')}`);
  process.exit(1);
}

const dbConfig = databases[targetDatabase as keyof typeof databases];

// Validate database configuration
if (!dbConfig.supabaseUrl || !dbConfig.supabaseAnonKey) {
  console.error(`❌ Incomplete configuration for database: ${targetDatabase}`);
  console.error('Please check the database configuration in the script.');
  process.exit(1);
}

// Create Supabase clients
// If service key is provided, use it for all operations to bypass RLS
const supabase = supabaseServiceKey ? 
  createClient(dbConfig.supabaseUrl, supabaseServiceKey) : 
  createClient(dbConfig.supabaseUrl, dbConfig.supabaseAnonKey);
const supabaseService = supabaseServiceKey ? createClient(dbConfig.supabaseUrl, supabaseServiceKey) : null;

async function runClientTask(): Promise<void> {
  try {
    console.log('🔍 Starting database cleanup for orphaned clients...\n');
    
    console.log(`🎯 Target Database: ${targetDatabase}`);
    console.log(`🔗 Database URL: ${dbConfig.supabaseUrl}`);
    
    if (supabaseServiceKey) {
      console.log('✅ Service key provided - using service role for all operations (bypasses RLS)');
      console.log('🔑 Auth users and profiles will be created automatically');
    } else {
      console.log('⚠️  No service key provided - using anon key (subject to RLS constraints)');
      console.log('📝 SQL statements will be generated for manual auth user creation');
      console.log('💡 To automatically create auth users, run with: --service-key=your-service-role-key');
    }
    console.log('');

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

    // Initialize arrays for all scenarios
    let accountsCreated: Account[] = [];
    let clientsUpdated: Client[] = [];

    if (!orphanedClients || orphanedClients.length === 0) {
      console.log('✅ No orphaned clients found. All clients have valid account_id references.');
    } else {
      console.log(`⚠️  Found ${orphanedClients.length} clients with missing account_id:`);
      orphanedClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.full_name} (${client.email}) - ID: ${client.id}`);
      });
    }

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
    // End of orphaned client processing else block

    // Step 6: Create profiles for clients without profiles
    console.log('\n📋 Step 6: Creating profiles for clients without associated profiles...');
    
    const profilesCreated: Profile[] = [];
    const authUsersCreated: AuthUser[] = [];
    const authUsersNotCreated: AuthUser[] = [];

    // Get all clients with valid account_id
    const { data: validClients, error: validClientsError } = await supabase
      .from('clients')
      .select('id, full_name, email, phone, account_id')
      .not('account_id', 'is', null) as { data: Client[] | null; error: any };

    if (validClientsError) {
      console.error('❌ Error fetching valid clients:', validClientsError);
    } else if (validClients && validClients.length > 0) {
      console.log(`Found ${validClients.length} clients with valid account_id`);
      
      for (const client of validClients) {
        try {
          // Check if there's already a profile with the same account_id
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('id, email, account_id')
            .eq('account_id', client.account_id)
            .limit(1)
            .maybeSingle();

          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            console.error(`   ❌ Error checking profile for client ${client.full_name}:`, profileCheckError);
            continue;
          }

          if (existingProfile) {
            // Profile already exists for this account
            continue;
          }

          console.log(`   🔄 Creating profile for client: ${client.full_name} (${client.email})`);
          
          // Generate a UUID for the profile (this will also be the auth.users id)
          const profileId = crypto.randomUUID();
          
          // Create the profile data structure
          const profileData = {
            id: profileId,
            email: client.email,
            full_name: client.full_name,
            role: 'admin',
            is_admin: false,
            account_id: client.account_id,
            phone: client.phone || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Create auth user and profile - both required due to foreign key constraint
          let authUserCreated = false;
          let profileCreated = false;
          
          if (supabaseServiceKey && supabaseService) {
            try {
              // First, check if auth user already exists
              console.log(`   🔍 Checking if auth user exists for: ${client.email}`);
              
              const { data: existingUsers, error: listError } = await supabaseService.auth.admin.listUsers({
                page: 1,
                perPage: 1000
              });

              let existingAuthUser = null;
              if (!listError && existingUsers?.users) {
                existingAuthUser = existingUsers.users.find(user => 
                  user.email?.toLowerCase() === client.email.toLowerCase()
                );
              }

              if (existingAuthUser) {
                console.log(`   📋 Found existing auth user: ${existingAuthUser.id} for ${client.email}`);
                authUserCreated = true;
                
                // Update profileData to use existing auth user ID
                profileData.id = existingAuthUser.id;
                
                // Check if profile already exists (by ID or email)
                console.log(`   🔍 Checking for existing profile...`);
                const { data: existingProfiles, error: profileCheckError } = await supabase
                  .from('profiles')
                  .select('id, email, account_id, full_name')
                  .or(`id.eq.${existingAuthUser.id},email.eq.${client.email}`)
                  .limit(5); // Get a few in case there are duplicates

                if (profileCheckError) {
                  console.error(`   ❌ Error checking for existing profile:`, profileCheckError);
                } else {
                  const profileById = existingProfiles?.find(p => p.id === existingAuthUser.id);
                  const profileByEmail = existingProfiles?.find(p => p.email?.toLowerCase() === client.email.toLowerCase());
                  const existingProfile = profileById || profileByEmail;

                  if (existingProfile) {
                    console.log(`   📋 Found existing profile: ${existingProfile.id}`);
                    
                    if (!existingProfile.account_id) {
                      // Profile exists but has no account_id, update it
                      console.log(`   🔄 Updating existing profile with account_id: ${client.account_id}`);
                      const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({ 
                          account_id: client.account_id,
                          updated_at: new Date().toISOString()
                        })
                        .eq('id', existingProfile.id)
                        .select()
                        .single() as { data: Profile | null; error: any };

                      if (updateError) {
                        console.error(`   ❌ Error updating profile account_id:`, updateError);
                      } else if (updatedProfile) {
                        profileCreated = true;
                        profilesCreated.push(updatedProfile);
                        console.log(`   ✅ Updated profile: ${updatedProfile.id} with account_id`);
                        
                        authUsersCreated.push({
                          id: existingAuthUser.id,
                          email: existingAuthUser.email || client.email,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        });
                      }
                    } else if (existingProfile.account_id === client.account_id) {
                      // Profile already has correct account_id, skip
                      profileCreated = true;
                      console.log(`   ✅ Profile already exists with correct account_id - skipping`);
                      
                      authUsersCreated.push({
                        id: existingAuthUser.id,
                        email: existingAuthUser.email || client.email,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                    } else {
                      // Profile exists but has different account_id - conflict!
                      console.log(`   ⚠️  WARNING: Profile exists but with different account_id!`);
                      console.log(`      Existing profile account_id: ${existingProfile.account_id}`);
                      console.log(`      Client's expected account_id: ${client.account_id}`);
                      console.log(`      Profile: ${existingProfile.id} (${existingProfile.email})`);
                      console.log(`      Client: ${client.full_name} (${client.email})`);
                      console.log(`   🚫 Skipping profile creation to avoid conflict`);
                    }
                  } else {
                    // No existing profile, create new one
                    const { data: newProfile, error: profileCreateError } = await supabase
                      .from('profiles')
                      .insert([profileData])
                      .select()
                      .single() as { data: Profile | null; error: any };

                    if (profileCreateError) {
                      console.error(`   ❌ Error creating profile for ${client.full_name}:`, profileCreateError);
                    } else if (newProfile) {
                      profileCreated = true;
                      profilesCreated.push(newProfile);
                      console.log(`   ✅ Created profile: ${newProfile.id} for ${client.full_name} (using existing auth user)`);
                      
                      authUsersCreated.push({
                        id: existingAuthUser.id,
                        email: existingAuthUser.email || client.email,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                    }
                  }
                }
              } else {
                // No existing auth user, create a new one
                console.log(`   🔄 Creating new auth user for: ${client.email}`);
                
                const { data: authUser, error: authError } = await supabaseService.auth.admin.createUser({
                  id: profileId,
                  email: client.email,
                  password: 'TempPass123!',
                  email_confirm: true // Auto-confirm the email
                });

                if (authError) {
                  console.error(`   ❌ Error creating auth user for ${client.full_name}:`, authError);
                } else if (authUser.user) {
                  authUserCreated = true;
                  console.log(`   ✅ Created auth user: ${authUser.user.id} for ${client.email}`);
                  
                  // Check if profile already exists (by email - shouldn't exist by ID since auth user is new)
                  console.log(`   🔍 Checking for existing profile by email...`);
                  const { data: existingProfiles, error: profileCheckError } = await supabase
                    .from('profiles')
                    .select('id, email, account_id, full_name')
                    .eq('email', client.email.toLowerCase())
                    .limit(5);

                  if (profileCheckError) {
                    console.error(`   ❌ Error checking for existing profile:`, profileCheckError);
                  } else {
                    const existingProfile = existingProfiles?.[0];

                    if (existingProfile) {
                      console.log(`   📋 Found existing profile by email: ${existingProfile.id}`);
                      
                      if (!existingProfile.account_id) {
                        // Profile exists but has no account_id, update it with new auth user ID and account_id
                        console.log(`   🔄 Updating existing profile with new auth user ID and account_id`);
                        const { data: updatedProfile, error: updateError } = await supabase
                          .from('profiles')
                          .update({ 
                            id: authUser.user.id,
                            account_id: client.account_id,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', existingProfile.id)
                          .select()
                          .single() as { data: Profile | null; error: any };

                        if (updateError) {
                          console.error(`   ❌ Error updating profile:`, updateError);
                          // Clean up the auth user we just created
                          try {
                            await supabaseService.auth.admin.deleteUser(authUser.user.id);
                            console.log(`   🧹 Cleaned up auth user after profile update failed`);
                          } catch (cleanupError) {
                            console.error(`   ⚠️  Failed to cleanup auth user:`, cleanupError);
                          }
                        } else if (updatedProfile) {
                          profileCreated = true;
                          profilesCreated.push(updatedProfile);
                          console.log(`   ✅ Updated existing profile: ${updatedProfile.id} with new auth user ID`);
                          
                          authUsersCreated.push({
                            id: authUser.user.id,
                            email: authUser.user.email || client.email,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          });
                        }
                      } else if (existingProfile.account_id === client.account_id) {
                        // Profile has correct account_id but wrong ID - this is complex
                        console.log(`   ⚠️  WARNING: Profile with same email exists but different ID!`);
                        console.log(`      Existing profile ID: ${existingProfile.id}`);
                        console.log(`      New auth user ID: ${authUser.user.id}`);
                        console.log(`      Both have same account_id: ${client.account_id}`);
                        console.log(`   🚫 Skipping - manual intervention needed for ID mismatch`);
                        
                        // Clean up the auth user we just created since we can't use it
                        try {
                          await supabaseService.auth.admin.deleteUser(authUser.user.id);
                          console.log(`   🧹 Cleaned up auth user due to profile ID conflict`);
                        } catch (cleanupError) {
                          console.error(`   ⚠️  Failed to cleanup auth user:`, cleanupError);
                        }
                      } else {
                        // Profile exists with different account_id - conflict!
                        console.log(`   ⚠️  WARNING: Profile exists but with different account_id!`);
                        console.log(`      Existing profile account_id: ${existingProfile.account_id}`);
                        console.log(`      Client's expected account_id: ${client.account_id}`);
                        console.log(`      Profile: ${existingProfile.id} (${existingProfile.email})`);
                        console.log(`      Client: ${client.full_name} (${client.email})`);
                        console.log(`   🚫 Skipping profile creation to avoid conflict`);
                        
                        // Clean up the auth user we just created since we can't use it
                        try {
                          await supabaseService.auth.admin.deleteUser(authUser.user.id);
                          console.log(`   🧹 Cleaned up auth user due to account_id conflict`);
                        } catch (cleanupError) {
                          console.error(`   ⚠️  Failed to cleanup auth user:`, cleanupError);
                        }
                      }
                    } else {
                      // No existing profile, create new one
                      const { data: newProfile, error: profileCreateError } = await supabase
                        .from('profiles')
                        .insert([profileData])
                        .select()
                        .single() as { data: Profile | null; error: any };

                      if (profileCreateError) {
                        console.error(`   ❌ Error creating profile for ${client.full_name}:`, profileCreateError);
                        // Clean up the auth user we just created
                        try {
                          await supabaseService.auth.admin.deleteUser(authUser.user.id);
                          console.log(`   🧹 Cleaned up auth user after profile creation failed`);
                        } catch (cleanupError) {
                          console.error(`   ⚠️  Failed to cleanup auth user:`, cleanupError);
                        }
                      } else if (newProfile) {
                        profileCreated = true;
                        profilesCreated.push(newProfile);
                        console.log(`   ✅ Created profile: ${newProfile.id} for ${client.full_name}`);
                        
                        authUsersCreated.push({
                          id: authUser.user.id,
                          email: authUser.user.email || client.email,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString()
                        });
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`   ❌ Error in auth user/profile creation for ${client.full_name}:`, error);
            }
          } else {
            console.log(`   ⚠️  Note: Provide --service-key parameter to create auth users and profiles automatically`);
          }

          // Only add to 'not created' list if we couldn't create both auth user and profile
          if (!authUserCreated || !profileCreated) {
            authUsersNotCreated.push({
              id: profileId,
              email: client.email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              full_name: client.full_name,
              account_id: client.account_id,
              phone: client.phone
            });
          }

        } catch (error) {
          console.error(`   ❌ Unexpected error creating profile for ${client.full_name}:`, error);
        }
      }
    }

    // Updated Summary
    console.log('\n📊 Complete Cleanup Summary:');
    console.log(`   • Total orphaned clients found: ${orphanedClients.length}`);
    console.log(`   • Accounts created: ${accountsCreated.length}`);
    console.log(`   • Clients updated: ${clientsUpdated.length}`);
    console.log(`   • Profiles created: ${profilesCreated.length}`);
    console.log(`   • Auth users created automatically: ${authUsersCreated.length}`);
    console.log(`   • Auth users needing manual creation: ${authUsersNotCreated.length}`);
    
    if (profilesCreated.length > 0) {
      console.log('\n✅ New profiles created:');
      profilesCreated.forEach((profile, index) => {
        console.log(`   ${index + 1}. Profile ID: ${profile.id} | Name: ${profile.full_name} | Email: ${profile.email}`);
      });
    }

    if (authUsersCreated.length > 0) {
      console.log('\n✅ Auth users created automatically:');
      authUsersCreated.forEach((user, index) => {
        console.log(`   ${index + 1}. User ID: ${user.id} | Email: ${user.email}`);
      });
    }

    if (authUsersNotCreated.length > 0) {
      console.log('\n⚠️  Auth users that need to be created manually:');
      authUsersNotCreated.forEach((user, index) => {
        console.log(`   ${index + 1}. User ID: ${user.id} | Email: ${user.email}`);
      });
      
      if (supabaseServiceKey) {
        // Service key was provided but some users still couldn't be created
        console.log('\n🚨 ERRORS OCCURRED: Service key was provided but some users could not be created.');
        console.log('📋 Failed users (check error messages above for details):');
        authUsersNotCreated.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}`);
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Name: ${user.full_name}`);
          console.log(`   - Account ID: ${user.account_id}`);
          console.log(`   - Phone: ${user.phone || 'N/A'}`);
          console.log('');
        });
        console.log('💡 Review the error messages above to resolve issues before retrying.');
      } else {
        // No service key was provided
        console.log('\n⚠️  IMPORTANT: Direct SQL insertion into auth.users is not recommended!');
        console.log('📝 Instead, use Supabase Admin API or provide service key to this script.');
        console.log('\n🔧 Alternative approaches:');
        console.log('1. Re-run script with --service-key parameter for automatic creation');
        console.log('2. Use Supabase Dashboard > Authentication > Users > "Add user" manually');
        console.log('3. Use Supabase Admin API calls (recommended for bulk operations)');
        console.log('\n📋 Users needing manual creation:');
        authUsersNotCreated.forEach((user, index) => {
          console.log(`${index + 1}. Email: ${user.email}`);
          console.log(`   - ID: ${user.id}`);
          console.log(`   - Name: ${user.full_name}`);
          console.log(`   - Account ID: ${user.account_id}`);
          console.log(`   - Phone: ${user.phone || 'N/A'}`);
          console.log('');
        });
        
        console.log('📜 JavaScript/Node.js script using Supabase Admin API:');
      console.log('```javascript');
      console.log('import { createClient } from "@supabase/supabase-js";');
      console.log('');
      console.log('// Initialize with service key');
      console.log('const supabase = createClient(supabaseUrl, serviceRoleKey);');
      console.log('');
      console.log('async function createUsersAndProfiles() {');
      authUsersNotCreated.forEach((user) => {
        console.log(`  // Create user and profile for ${user.email}`);
        console.log(`  try {`);
        console.log(`    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({`);
        console.log(`      email: "${user.email}",`);
        console.log(`      password: "TempPass123!",`);
        console.log(`      email_confirm: true`);
        console.log(`    });`);
        console.log(`    `);
        console.log(`    if (authError) {`);
        console.log(`      console.error("Error creating auth user for ${user.email}:", authError);`);
        console.log(`      return;`);
        console.log(`    }`);
        console.log(`    `);
        console.log(`    if (authUser.user) {`);
        console.log(`      const { data: profile, error: profileError } = await supabase`);
        console.log(`        .from("profiles")`);
        console.log(`        .insert({`);
        console.log(`          id: authUser.user.id,`);
        console.log(`          email: "${user.email}",`);
        console.log(`          full_name: "${user.full_name || ''}",`);
        console.log(`          role: "admin",`);
        console.log(`          is_admin: false,`);
        console.log(`          account_id: "${user.account_id}",`);
        console.log(`          phone: "${user.phone || ''}" || null`);
        console.log(`        })`);
        console.log(`        .select()`);
        console.log(`        .single();`);
        console.log(`      `);
        console.log(`      if (profileError) {`);
        console.log(`        console.error("Error creating profile for ${user.email}:", profileError);`);
        console.log(`        // Cleanup: delete the auth user we just created`);
        console.log(`        await supabase.auth.admin.deleteUser(authUser.user.id);`);
        console.log(`      } else {`);
        console.log(`        console.log("✅ Created user and profile for ${user.email}");`);
        console.log(`      }`);
        console.log(`    }`);
        console.log(`  } catch (error) {`);
        console.log(`    console.error("Error processing ${user.email}:", error);`);
        console.log(`  }`);
        console.log('');
      });
      console.log('}');
      console.log('');
      console.log('// Run the function');
        console.log('createUsersAndProfiles().catch(console.error);');
        console.log('```');
      }
    }

    console.log('\n🎉 Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    process.exit(1);
  }
}

async function runLinksTask(): Promise<void> {
  try {
    console.log('🔗 Starting account-client access management...\n');
    
    console.log(`🎯 Target Database: ${targetDatabase}`);
    console.log(`🔗 Database URL: ${dbConfig.supabaseUrl}`);
    console.log('');

    // Step 1: Get accounts by type (operator, affiliate, expert) sorted in that order
    console.log('📋 Step 1: Fetching accounts...');
    
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, type, contact_email, status')
      .in('type', ['operator', 'affiliate', 'expert'])
      .order('type', { ascending: true }) as { data: Account[] | null; error: any };

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      return;
    }

    if (!accounts || accounts.length === 0) {
      console.log('❌ No operator, affiliate, or expert accounts found in database.');
      return;
    }

    // Sort accounts in the desired order: operator, affiliate, expert
    const typeOrder = ['operator', 'affiliate', 'expert'];
    const sortedAccounts = accounts.sort((a, b) => {
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });

    // Step 2: Display accounts for selection
    console.log('\n📋 Available accounts:');
    sortedAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name} (${account.type}) - ${account.contact_email} - Status: ${account.status}`);
    });

    // Step 3: Get user selection for account
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const selectedAccountIndex = await new Promise<number>((resolve, reject) => {
      rl.question('\nEnter the number of the account to manage: ', (answer) => {
        const num = parseInt(answer.trim());
        if (isNaN(num) || num < 1 || num > sortedAccounts.length) {
          console.error('❌ Invalid selection. Please enter a valid number.');
          rl.close();
          reject(new Error('Invalid account selection'));
          return;
        }
        resolve(num - 1);
      });
    });

    const selectedAccount = sortedAccounts[selectedAccountIndex];
    console.log(`\n✅ Selected account: ${selectedAccount.name} (${selectedAccount.type})`);

    // Step 4: Get clients already linked to this account
    console.log('\n📋 Step 2: Finding clients linked to this account...');
    
    const { data: linkedAccess, error: linkedError } = await supabase
      .from('account_client_access')
      .select(`
        client_id,
        access_level,
        clients (id, full_name, email)
      `)
      .eq('account_id', selectedAccount.id) as { 
        data: Array<{
          client_id: string;
          access_level: string;
          clients: Client;
        }> | null; 
        error: any 
      };

    if (linkedError) {
      console.error('❌ Error fetching linked clients:', linkedError);
      rl.close();
      return;
    }

    const linkedClientIds = linkedAccess?.map(access => access.client_id) || [];
    
    if (linkedAccess && linkedAccess.length > 0) {
      console.log(`\n📋 Clients already linked to ${selectedAccount.name}:`);
      linkedAccess.forEach((access, index) => {
        console.log(`   ${index + 1}. ${access.clients.full_name} (${access.clients.email}) - Access: ${access.access_level}`);
      });
    } else {
      console.log(`\n📋 No clients currently linked to ${selectedAccount.name}`);
    }

    // Step 5: Get all clients NOT linked to this account
    console.log('\n📋 Step 3: Finding unlinked clients...');
    
    let allClientsQuery = supabase
      .from('clients')
      .select('id, full_name, email, phone, account_id');
    
    if (linkedClientIds.length > 0) {
      allClientsQuery = allClientsQuery.not('id', 'in', `(${linkedClientIds.join(',')})`);
    }
    
    const { data: allClients, error: allClientsError } = await allClientsQuery as { data: Client[] | null; error: any };

    if (allClientsError) {
      console.error('❌ Error fetching unlinked clients:', allClientsError);
      rl.close();
      return;
    }

    const unlinkedClients = allClients || [];

    if (unlinkedClients.length === 0) {
      console.log('\n✅ All clients are already linked to this account.');
      rl.close();
      return;
    }

    console.log(`\n📋 Unlinked clients available for linking (${unlinkedClients.length} total):`);
    unlinkedClients.forEach((client, index) => {
      console.log(`   ${index + 1}. ${client.full_name} (${client.email})`);
    });

    // Step 6: Ask user if they want to link all or select specific clients
    const linkChoice = await new Promise<string>((resolve) => {
      rl.question('\nLink all clients (a) or select specific clients (s)? [a/s]: ', (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });

    let clientsToLink: Client[] = [];

    if (linkChoice === 'a' || linkChoice === 'all') {
      clientsToLink = unlinkedClients;
      console.log(`\n✅ Selected all ${unlinkedClients.length} unlinked clients for linking.`);
    } else if (linkChoice === 's' || linkChoice === 'select') {
      // Allow user to select specific clients
      console.log('\nEnter client numbers separated by commas (e.g., 1,3,5):');
      const clientSelection = await new Promise<string>((resolve) => {
        rl.question('Client numbers: ', (answer) => {
          resolve(answer.trim());
        });
      });

      const selectedIndices = clientSelection
        .split(',')
        .map(s => parseInt(s.trim()) - 1)
        .filter(i => !isNaN(i) && i >= 0 && i < unlinkedClients.length);

      if (selectedIndices.length === 0) {
        console.log('❌ No valid client selections made.');
        rl.close();
        return;
      }

      clientsToLink = selectedIndices.map(i => unlinkedClients[i]);
      console.log(`\n✅ Selected ${clientsToLink.length} clients for linking:`);
      clientsToLink.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.full_name} (${client.email})`);
      });
    } else {
      console.log('❌ Invalid choice. Exiting.');
      rl.close();
      return;
    }

    // Step 7: Ask for access level
    const accessLevel = await new Promise<string>((resolve) => {
      rl.question('\nEnter access level [default: admin]: ', (answer) => {
        const level = answer.trim() || 'admin';
        resolve(level);
      });
    });

    // Step 8: Confirmation
    console.log('\n📋 Summary of changes to be made:');
    console.log(`   Account: ${selectedAccount.name} (${selectedAccount.type})`);
    console.log(`   Clients to link: ${clientsToLink.length}`);
    console.log(`   Access level: ${accessLevel}`);
    console.log('\n   Clients:');
    clientsToLink.forEach((client, index) => {
      console.log(`     ${index + 1}. ${client.full_name} (${client.email})`);
    });

    const confirmed = await new Promise<boolean>((resolve) => {
      rl.question('\nProceed with linking these clients? [y/N]: ', (answer) => {
        resolve(answer.trim().toLowerCase() === 'y' || answer.trim().toLowerCase() === 'yes');
      });
    });

    if (!confirmed) {
      console.log('❌ Operation cancelled by user.');
      rl.close();
      return;
    }

    // Step 9: Create the links
    console.log('\n📋 Step 4: Creating account_client_access records...');
    
    const accessRecords = clientsToLink.map(client => ({
      account_id: selectedAccount.id,
      client_id: client.id,
      access_level: accessLevel,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data: createdAccess, error: createError } = await supabase
      .from('account_client_access')
      .insert(accessRecords)
      .select() as { data: AccountClientAccess[] | null; error: any };

    if (createError) {
      console.error('❌ Error creating access records:', createError);
      rl.close();
      return;
    }

    if (!createdAccess) {
      console.error('❌ No access records were created.');
      rl.close();
      return;
    }

    // Step 10: Summary
    console.log('\n📊 Link Creation Summary:');
    console.log(`   ✅ Successfully created ${createdAccess.length} account_client_access records`);
    console.log(`   🏢 Account: ${selectedAccount.name} (${selectedAccount.type})`);
    console.log(`   👥 Clients linked: ${createdAccess.length}`);
    console.log(`   🔐 Access level: ${accessLevel}`);
    
    console.log('\n✅ New client access records:');
    for (let i = 0; i < createdAccess.length; i++) {
      const access = createdAccess[i];
      const client = clientsToLink.find(c => c.id === access.client_id);
      console.log(`   ${i + 1}. ${client?.full_name} (${client?.email}) - ${access.access_level} access`);
    }

    console.log('\n🎉 Account-client linking completed successfully!');
    rl.close();

  } catch (error) {
    console.error('❌ Error during account-client linking:', error);
    process.exit(1);
  }
}

// Help function
function showHelp() {
  console.log(`
🔧 Database Management Script - Multi-Task Support

Usage:
  node scripts/db-tasks.ts [OPTIONS]

Options:
  --task=TASK          Task to perform: client, links
  -task=TASK           Default: client
  -t=TASK
  
  --database=DATABASE  Target database
  -db=DATABASE         Options: local, live, ben
                       Default: local
  
  --service-key=KEY    Supabase service role key (for client task only)
  -key=KEY             If not provided for client task, SQL statements will be generated

  --help, -h          Show this help message

Tasks:

  client: Orphaned Clients & Profile Creation
    Finds clients with missing account_id references, creates accounts,
    and creates corresponding user profiles and auth.users records.

  links: Account-Client Access Management  
    Interactive tool to link clients to operator/affiliate/expert accounts
    with specified access levels in the account_client_access table.

Examples:
  
  # Client task (default)
  node scripts/db-tasks.ts
  node scripts/db-tasks.ts --task=client --database=local
  
  # Client task with automatic auth user creation
  node scripts/db-tasks.ts --task=client --service-key=your-service-key
  
  # Links task
  node scripts/db-tasks.ts --task=links --database=local
  node scripts/db-tasks.ts -task=links -db=ben
  node scripts/db-tasks.ts -t=links -db=local
  
  # Show help
  node scripts/db-tasks.ts --help

Client Task Features:
  1. Finds clients with missing or invalid account_id references
  2. Creates new accounts for orphaned clients
  3. Updates client records with proper account_id references
  4. Creates profiles for clients without associated user profiles
  5. Creates auth.users (automatically with service key, or provides SQL)

Links Task Features:
  1. Lists operator, affiliate, expert accounts for selection
  2. Shows clients already linked to selected account
  3. Shows unlinked clients available for linking
  4. Allows linking all clients or selecting specific ones
  5. Creates account_client_access records with specified access level

🔒 Security: Service key should be the service_role key, not anon key
`);
}

// Check for help flag
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the selected task
async function runSelectedTask() {
  console.log(`🚀 Starting task: ${targetTask}\n`);
  
  switch (targetTask) {
    case 'client':
      await runClientTask();
      break;
    case 'links':
      await runLinksTask();
      break;
    default:
      console.error(`❌ Unknown task: ${targetTask}`);
      process.exit(1);
  }
}

runSelectedTask()
  .then(() => {
    console.log('\n🏁 Script execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });