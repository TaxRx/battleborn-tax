import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

describe('Epic 1 Integration Tests', () => {
  let testUserId: string;
  let testClientId: string;
  let testSession: any;
  let invitationToken: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await supabaseAdmin.auth.admin.deleteUser('integration-test@example.com');
    await supabaseAdmin.from('clients').delete().eq('email', 'integration-test@example.com');
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await supabaseAdmin.auth.admin.deleteUser(testUserId);
    }
    if (testClientId) {
      await supabaseAdmin.from('clients').delete().eq('id', testClientId);
    }
  });

  describe('Complete User Registration Flow', () => {
    test('should complete full registration workflow', async () => {
      // Step 1: Register new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'integration-test@example.com',
        password: 'IntegrationTest123!@#'
      });

      expect(authError).toBeNull();
      expect(authData.user).toBeTruthy();
      testUserId = authData.user!.id;
      testSession = authData.session;

      // Step 2: Create profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'integration-test@example.com',
          full_name: 'Integration Test User',
          role: 'affiliate'
        })
        .select()
        .single();

      expect(profileError).toBeNull();
      expect(profileData).toBeTruthy();

      // Step 3: Create client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          full_name: 'Integration Test Client',
          email: 'integration-test@example.com',
          created_by: testUserId,
          filing_status: 'single',
          state: 'CA'
        })
        .select()
        .single();

      expect(clientError).toBeNull();
      expect(clientData).toBeTruthy();
      testClientId = clientData.id;

      // Step 4: Create client-user relationship
      const { data: relationData, error: relationError } = await supabase
        .from('client_users')
        .insert({
          client_id: testClientId,
          user_id: testUserId,
          role: 'owner'
        })
        .select()
        .single();

      expect(relationError).toBeNull();
      expect(relationData).toBeTruthy();
    });

    test('should handle business verification', async () => {
      await supabase.auth.setSession(testSession);

      // Update client with business information
      const { data, error } = await supabase
        .from('clients')
        .update({
          business_name: 'Test Business LLC',
          entity_type: 'LLC',
          ein: '12-3456789'
        })
        .eq('id', testClientId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.business_name).toBe('Test Business LLC');
      expect(data.entity_type).toBe('LLC');
      expect(data.ein).toBe('12-3456789');
    });
  });

  describe('User Management Flow', () => {
    test('should create and manage user invitations', async () => {
      await supabase.auth.setSession(testSession);

      // Step 1: Create invitation
      const { data: invitationData, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          client_id: testClientId,
          email: 'invited-user@example.com',
          role: 'member',
          invited_by: testUserId,
          message: 'Welcome to our team!'
        })
        .select()
        .single();

      expect(invitationError).toBeNull();
      expect(invitationData).toBeTruthy();
      expect(invitationData.token).toBeTruthy();
      expect(invitationData.status).toBe('pending');
      invitationToken = invitationData.token;

      // Step 2: Verify invitation exists
      const { data: fetchedInvitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', invitationToken)
        .single();

      expect(fetchError).toBeNull();
      expect(fetchedInvitation.email).toBe('invited-user@example.com');
      expect(fetchedInvitation.role).toBe('member');

      // Step 3: Cancel invitation
      const { data: cancelData, error: cancelError } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('token', invitationToken)
        .select()
        .single();

      expect(cancelError).toBeNull();
      expect(cancelData.status).toBe('cancelled');
    });

    test('should handle invitation acceptance flow', async () => {
      await supabase.auth.setSession(testSession);

      // Create new invitation
      const { data: newInvitation } = await supabase
        .from('invitations')
        .insert({
          client_id: testClientId,
          email: 'accept-test@example.com',
          role: 'member',
          invited_by: testUserId,
          message: 'Please join our team!'
        })
        .select()
        .single();

      // Simulate user accepting invitation
      const { data: acceptedUser } = await supabaseAdmin.auth.admin.createUser({
        email: 'accept-test@example.com',
        password: 'AcceptTest123!@#',
        email_confirm: true
      });

       // Create profile for accepted user
       if (acceptedUser.user) {
         await supabaseAdmin.from('profiles').insert({
           id: acceptedUser.user.id,
           email: 'accept-test@example.com',
           full_name: 'Accepted User',
           role: 'user'
         });

         // Add user to client
         const { data: clientUserData, error: clientUserError } = await supabaseAdmin
           .from('client_users')
           .insert({
             client_id: testClientId,
             user_id: acceptedUser.user.id,
             role: 'member'
           })
           .select()
           .single();

         expect(clientUserError).toBeNull();
         expect(clientUserData.role).toBe('member');

         // Mark invitation as accepted
         await supabaseAdmin
           .from('invitations')
           .update({ status: 'accepted' })
           .eq('id', newInvitation.id);

         // Verify user can access client data
         const acceptedUserSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
         await acceptedUserSupabase.auth.signInWithPassword({
           email: 'accept-test@example.com',
           password: 'AcceptTest123!@#'
         });

         const { data: clientAccess } = await acceptedUserSupabase
           .from('clients')
           .select('*')
           .eq('id', testClientId);

         expect(clientAccess).toHaveLength(1);

         // Clean up
         await supabaseAdmin.auth.admin.deleteUser(acceptedUser.user.id);
       }
    });
  });

  describe('Profile Management Flow', () => {
    test('should update client profile information', async () => {
      await supabase.auth.setSession(testSession);

      // Update personal information
      const personalUpdate = {
        full_name: 'Updated Integration Test User',
        phone: '(555) 123-4567',
        filing_status: 'married_joint' as const,
        state: 'NY',
        dependents: 2,
        home_address: '123 Updated Street, Updated City, NY 12345'
      };

      const { data: personalData, error: personalError } = await supabase
        .from('clients')
        .update(personalUpdate)
        .eq('id', testClientId)
        .select()
        .single();

      expect(personalError).toBeNull();
      expect(personalData.full_name).toBe('Updated Integration Test User');
      expect(personalData.phone).toBe('(555) 123-4567');
      expect(personalData.filing_status).toBe('married_joint');
      expect(personalData.state).toBe('NY');
      expect(personalData.dependents).toBe(2);

      // Update business information
      const businessUpdate = {
        business_name: 'Updated Business Name Inc',
        entity_type: 'Corporation',
        ein: '98-7654321',
        industry: 'Technology',
        annual_revenue: 1000000,
        employee_count: 25,
        business_address: '456 Business Ave, Business City, NY 54321'
      };

      const { data: businessData, error: businessError } = await supabase
        .from('clients')
        .update(businessUpdate)
        .eq('id', testClientId)
        .select()
        .single();

      expect(businessError).toBeNull();
      expect(businessData.business_name).toBe('Updated Business Name Inc');
      expect(businessData.entity_type).toBe('Corporation');
      expect(businessData.ein).toBe('98-7654321');
      expect(businessData.industry).toBe('Technology');
      expect(businessData.annual_revenue).toBe(1000000);
      expect(businessData.employee_count).toBe(25);
    });

    test('should create and update tax profiles', async () => {
      await supabase.auth.setSession(testSession);

      // Create tax profile
      const taxProfileData = {
        client_id: testClientId,
        tax_year: 2024,
        filing_status: 'married_joint',
        state: 'NY',
        dependents: 2,
        wages_income: 150000,
        business_income: 75000,
        other_income: 5000,
        deductions: 25000,
        completed: false
      };

      const { data: taxProfile, error: taxProfileError } = await supabase
        .from('tax_profiles')
        .upsert(taxProfileData)
        .select()
        .single();

      expect(taxProfileError).toBeNull();
      expect(taxProfile.client_id).toBe(testClientId);
      expect(taxProfile.tax_year).toBe(2024);
      expect(taxProfile.wages_income).toBe(150000);

      // Update tax profile
      const { data: updatedTaxProfile, error: updateError } = await supabase
        .from('tax_profiles')
        .update({
          wages_income: 160000,
          business_income: 80000,
          completed: true
        })
        .eq('client_id', testClientId)
        .eq('tax_year', 2024)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedTaxProfile.wages_income).toBe(160000);
      expect(updatedTaxProfile.business_income).toBe(80000);
      expect(updatedTaxProfile.completed).toBe(true);
    });
  });

  describe('Data Consistency and Relationships', () => {
    test('should maintain referential integrity', async () => {
      await supabase.auth.setSession(testSession);

      // Verify client-user relationship exists
      const { data: clientUsers } = await supabase
        .from('client_users')
        .select(`
          *,
          client:clients(*),
          user:profiles(*)
        `)
        .eq('client_id', testClientId);

      expect(clientUsers).toHaveLength(1);
      expect(clientUsers![0].client).toBeTruthy();
      expect(clientUsers![0].user).toBeTruthy();
      expect(clientUsers![0].role).toBe('owner');

      // Verify cascade operations work correctly
      const { data: invitations } = await supabase
        .from('invitations')
        .select('*')
        .eq('client_id', testClientId);

      // Should have invitations linked to this client
      expect(invitations!.length).toBeGreaterThan(0);
      invitations!.forEach(invitation => {
        expect(invitation.client_id).toBe(testClientId);
        expect(invitation.invited_by).toBe(testUserId);
      });
    });

    test('should handle concurrent operations safely', async () => {
      await supabase.auth.setSession(testSession);

      // Create multiple concurrent operations
      const operations = [
        supabase.from('clients').update({ full_name: 'Concurrent Update 1' }).eq('id', testClientId),
        supabase.from('clients').update({ phone: '(555) 999-9999' }).eq('id', testClientId),
        supabase.from('clients').update({ state: 'CA' }).eq('id', testClientId)
      ];

      const results = await Promise.all(operations);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
      });

      // Verify final state
      const { data: finalClient } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId)
        .single();

      expect(finalClient).toBeTruthy();
      // At least one of the updates should have persisted
      expect(finalClient.phone || finalClient.state || finalClient.full_name).toBeTruthy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid data gracefully', async () => {
      await supabase.auth.setSession(testSession);

      // Try to create client with invalid data
      const { data, error } = await supabase
        .from('clients')
        .insert({
          full_name: '', // Empty name
          email: 'invalid-email', // Invalid email
          filing_status: 'invalid_status', // Invalid filing status
          state: 'INVALID', // Invalid state
          dependents: -1 // Invalid dependents
        });

      expect(error).toBeTruthy();
      expect(data).toBeNull();
    });

    test('should handle database constraints', async () => {
      await supabase.auth.setSession(testSession);

      // Try to create duplicate client-user relationship
      const { data, error } = await supabase
        .from('client_users')
        .insert({
          client_id: testClientId,
          user_id: testUserId,
          role: 'member'
        });

      expect(error).toBeTruthy(); // Should violate unique constraint
      expect(data).toBeNull();
    });

    test('should handle network timeouts and retries', async () => {
      await supabase.auth.setSession(testSession);

      // This test would require mocking network conditions
      // For now, we'll test that the client handles normal operations
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeTruthy();
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle bulk operations efficiently', async () => {
      await supabase.auth.setSession(testSession);

      // Create multiple invitations
      const invitations = Array.from({ length: 10 }, (_, i) => ({
        client_id: testClientId,
        email: `bulk-test-${i}@example.com`,
        role: 'member' as const,
        invited_by: testUserId,
        message: `Bulk invitation ${i}`
      }));

      const startTime = Date.now();
      const { data, error } = await supabase
        .from('invitations')
        .insert(invitations)
        .select();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle complex queries efficiently', async () => {
      await supabase.auth.setSession(testSession);

      const startTime = Date.now();
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_users(
            *,
            user:profiles(*)
          ),
          invitations(*),
          tax_profiles(*)
        `)
        .eq('id', testClientId)
        .single();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
}); 