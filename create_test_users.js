// Script to create test users via user-service edge function
// Usage: node create_test_users.js

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
    
    const response = await fetch('http://127.0.0.1:54321/functions/v1/user-service/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        pathname: '/user-service/register',
        ...userData
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Successfully created user: ${userData.email}`);
      console.log(`   User ID: ${result.userId}`);
      console.log(`   Profile ID: ${result.profileId}`);
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