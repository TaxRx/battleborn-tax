// Script to create test users via user-service edge function
// Usage: node create_test_users.js [local|remote]
// Default: local

// Configuration for different environments
const environments = {
  local: {
    url: 'http://127.0.0.1:54321/functions/v1/user-service/register',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  },
  remote: {
    url: 'https://ufxwqddayrydbgwaysfw.supabase.co/functions/v1/user-service/register',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeHdxZGRheXJ5ZGJnd2F5c2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODE3ODksImV4cCI6MjA2NTc1Nzc4OX0.FRSq5CgQLsaLe4QNBOgvUQFEsXZypZ2Nrg3Mr5Kswpw'
  }
};

// Determine environment from command line argument or default to local
const environment = process.argv[2] || 'local';
const config = environments[environment];

if (!config) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error('Valid environments: local, remote');
  process.exit(1);
}

console.log(`🌍 Using ${environment} environment: ${config.url}\n`);

const users = [
  {
    email: 'admin@example.com',
    password: 'testpass123',
    type: 'admin',
    fullName: 'Admin User',
    personalInfo: {
      firstName: 'Admin',
      lastName: 'User'
    },
    businessInfo: {
      businessName: 'System Administration',
      businessType: 'LLC'
    }
  },
  {
    email: 'operator@example.com', 
    password: 'testpass123',
    type: 'operator',
    fullName: 'Operator User',
    personalInfo: {
      firstName: 'Operator',
      lastName: 'User'
    },
    businessInfo: {
      businessName: 'Platform Operations',
      businessType: 'LLC'
    }
  },
  {
    email: 'client@example.com',
    password: 'testpass123', 
    type: 'client',
    fullName: 'Client User',
    personalInfo: {
      firstName: 'Client',
      lastName: 'User'
    },
    businessInfo: {
      businessName: 'Test Client Business',
      businessType: 'LLC'
    }
  },
  {
    email: 'affiliate@example.com',
    password: 'testpass123',
    type: 'affiliate', 
    fullName: 'Affiliate User',
    personalInfo: {
      firstName: 'Affiliate',
      lastName: 'User'
    },
    businessInfo: {
      businessName: 'Tax Advisory Services',
      businessType: 'LLC'
    }
  },
  {
    email: 'expert@example.com',
    password: 'testpass123',
    type: 'expert',
    fullName: 'Expert User',
    personalInfo: {
      firstName: 'Expert',
      lastName: 'User'
    },
    businessInfo: {
      businessName: 'Tax Expert Consulting',
      businessType: 'LLC'
    }
  }
];

async function createUser(userData) {
  try {
    console.log(`Creating user: ${userData.email}`);
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`
      },
      body: JSON.stringify({
        pathname: '/user-service/register',
        ...userData,
        useCreateUser: true
      })
    });

    const result = await response.json();
    console.log(result);
    if (response.ok && result.success) {
      console.log(`✅ Successfully created user: ${userData.email}`);
      console.log(`   User ID: ${result.data.user.id}`);
    } else {
      console.log(`❌ Failed to create user: ${userData.email}`);
      console.log(`   Error: ${result.error || 'Unknown error'}`);
      console.log(`   Response:`, result);
    }
    
    return result;
  } catch (error) {
    console.log(`❌ Error creating user ${userData.email}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function createAllUsers() {
  console.log('Starting user creation process...\n');
  
  for (const userData of users) {
    await createUser(userData);
    console.log(''); // Add spacing between users
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('User creation process complete!');
}

// Run the script
createAllUsers().catch(console.error);