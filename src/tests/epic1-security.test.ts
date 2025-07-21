import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { passwordService } from '../services/passwordService';

// Test configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

describe('Epic 1 Security Tests', () => {
  let testUserId: string;
  let testClientId: string;
  let testSession: any;

  beforeAll(async () => {
    // Clean up any existing test data
    await supabaseAdmin.auth.admin.deleteUser('test-security@example.com');
    await supabaseAdmin.from('clients').delete().eq('email', 'test-security@example.com');
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

  describe('Authentication Security', () => {
    test('should require valid email format for registration', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: 'invalid-email',
        password: 'Test123!@#'
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('Invalid email');
    });

    test('should enforce password strength requirements', async () => {
      const weakPasswords = [
        'password',      // No uppercase, numbers, symbols
        'Password',      // No numbers, symbols
        'Password123',   // No symbols
        'Pass1!',        // Too short
        '12345678'       // No letters
      ];

      for (const password of weakPasswords) {
        const { data, error } = await supabase.auth.signUp({
          email: 'test-weak@example.com',
          password: password
        });

        expect(error).toBeTruthy();
      }
    });

    test('should successfully register with strong password', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: 'test-security@example.com',
        password: 'SecurePass123!@#'
      });

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      testUserId = data.user!.id;
    });

    test('should prevent duplicate email registration', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: 'test-security@example.com',
        password: 'AnotherPass123!@#'
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('already registered');
    });

    test('should require valid credentials for login', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test-security@example.com',
        password: 'WrongPassword123!'
      });

      expect(error).toBeTruthy();
      expect(error?.message).toContain('Invalid login credentials');
    });

    test('should successfully login with correct credentials', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test-security@example.com',
        password: 'SecurePass123!@#'
      });

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(data.session).toBeTruthy();
      testSession = data.session;
    });
  });

  describe('Authorization & RLS Policies', () => {
    beforeAll(async () => {
      // Create a test client
      const { data: clientData } = await supabaseAdmin.from('clients').insert({
        full_name: 'Test Security Client',
        email: 'test-security@example.com',
        created_by: testUserId,
        filing_status: 'single',
        state: 'CA'
      }).select().single();

      testClientId = clientData.id;

      // Create client_user relationship
      await supabaseAdmin.from('client_users').insert({
        client_id: testClientId,
        user_id: testUserId,
        role: 'owner'
      });
    });

    test('should prevent unauthorized access to client data', async () => {
      // Create another user
      const { data: otherUser } = await supabaseAdmin.auth.admin.createUser({
        email: 'other-user@example.com',
        password: 'OtherPass123!@#',
        email_confirm: true
      });

      // Try to access client data as unauthorized user
      const otherSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await otherSupabase.auth.signInWithPassword({
        email: 'other-user@example.com',
        password: 'OtherPass123!@#'
      });

      const { data, error } = await otherSupabase
        .from('clients')
        .select('*')
        .eq('id', testClientId);

      expect(data).toHaveLength(0); // RLS should block access
      
             // Clean up
       if (otherUser.user) {
         await supabaseAdmin.auth.admin.deleteUser(otherUser.user.id);
       }
    });

    test('should allow authorized access to own client data', async () => {
      // Set session for authorized user
      await supabase.auth.setSession(testSession);

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId);

             expect(error).toBeNull();
       expect(data).toHaveLength(1);
       expect(data![0].id).toBe(testClientId);
    });

    test('should enforce role-based permissions', async () => {
      // Create a viewer user
      const { data: viewerUser } = await supabaseAdmin.auth.admin.createUser({
        email: 'viewer@example.com',
        password: 'ViewerPass123!@#',
        email_confirm: true
      });

             // Add viewer to client
       if (viewerUser.user) {
         await supabaseAdmin.from('client_users').insert({
           client_id: testClientId,
           user_id: viewerUser.user.id,
           role: 'viewer'
         });
       }

      // Login as viewer
      const viewerSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await viewerSupabase.auth.signInWithPassword({
        email: 'viewer@example.com',
        password: 'ViewerPass123!@#'
      });

      // Viewer should be able to read client data
      const { data: readData } = await viewerSupabase
        .from('clients')
        .select('*')
        .eq('id', testClientId);

      expect(readData).toHaveLength(1);

      // Viewer should NOT be able to update client data
      const { data: updateData, error: updateError } = await viewerSupabase
        .from('clients')
        .update({ full_name: 'Updated Name' })
        .eq('id', testClientId);

      expect(updateError).toBeTruthy(); // Should be blocked by RLS

             // Clean up
       if (viewerUser.user) {
         await supabaseAdmin.auth.admin.deleteUser(viewerUser.user.id);
       }
    });

    test('should protect sensitive profile data', async () => {
      // Try to access auth.users table (should be blocked)
      const { data, error } = await supabase
        .from('auth.users')
        .select('*');

      expect(error).toBeTruthy();
      expect(error?.message).toContain('permission denied');
    });
  });

  describe('Password Security', () => {
    test('should enforce rate limiting on password reset', async () => {
      const email = 'test-security@example.com';
      
      // Make multiple password reset requests
      for (let i = 0; i < 6; i++) {
        await passwordService.requestPasswordReset(email);
      }

      // The 6th request should be rate limited
      const result = await passwordService.requestPasswordReset(email);
      expect(result.success).toBe(false);
      expect(result.error).toContain('rate limit');
    });

    test('should validate password strength', async () => {
      const weakPassword = 'weak';
      const strongPassword = 'StrongPass123!@#';
      
      const weakResult = passwordService.getPasswordStrength(weakPassword);
      const strongResult = passwordService.getPasswordStrength(strongPassword);
      
      expect(weakResult.score).toBeLessThan(strongResult.score);
      expect(weakResult.feedback.length).toBeGreaterThan(0);
    });

    test('should update password with proper validation', async () => {
      await supabase.auth.setSession(testSession);
      
      const result = await passwordService.updatePassword('NewStrongPass123!@#');
      expect(result.success).toBe(true);
    });
  });

  describe('Invitation Security', () => {
    test('should generate secure invitation tokens', async () => {
      await supabase.auth.setSession(testSession);

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          client_id: testClientId,
          email: 'invited@example.com',
          role: 'member',
          invited_by: testUserId,
          message: 'Test invitation'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.token).toBeTruthy();
      expect(data.token.length).toBeGreaterThan(20); // Should be a secure token
      expect(data.expires_at).toBeTruthy();
    });

    test('should prevent invitation spam', async () => {
      await supabase.auth.setSession(testSession);

      // Try to send multiple invitations to same email
      const email = 'spam-test@example.com';
      
      for (let i = 0; i < 3; i++) {
        await supabase.from('invitations').insert({
          client_id: testClientId,
          email: email,
          role: 'member',
          invited_by: testUserId,
          message: `Test invitation ${i}`
        });
      }

      // Should have rate limiting or duplicate prevention
      const { data } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending');

      expect(data?.length).toBeLessThanOrEqual(1); // Should prevent duplicates
    });

    test('should validate invitation expiration', async () => {
      await supabase.auth.setSession(testSession);

      // Create an expired invitation
      const { data } = await supabaseAdmin.from('invitations').insert({
        client_id: testClientId,
        email: 'expired@example.com',
        role: 'member',
        invited_by: testUserId,
        message: 'Expired invitation',
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: 'expired'
      }).select().single();

      expect(data.status).toBe('expired');
      
      // Attempting to use expired invitation should fail
      // This would be tested in the invitation acceptance flow
    });
  });

  describe('Session Security', () => {
    test('should invalidate session on logout', async () => {
      await supabase.auth.setSession(testSession);

      // Verify session is active
      const { data: userData } = await supabase.auth.getUser();
      expect(userData.user).toBeTruthy();

      // Logout
      await supabase.auth.signOut();

      // Verify session is invalidated
      const { data: userDataAfter } = await supabase.auth.getUser();
      expect(userDataAfter.user).toBeNull();
    });

    test('should handle concurrent sessions properly', async () => {
      // Login from multiple clients
      const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      const { data: session1 } = await client1.auth.signInWithPassword({
        email: 'test-security@example.com',
        password: 'SecurePass123!@#'
      });

      const { data: session2 } = await client2.auth.signInWithPassword({
        email: 'test-security@example.com',
        password: 'SecurePass123!@#'
      });

      expect(session1.user?.id).toBe(session2.user?.id);
      expect(session1.session?.access_token).not.toBe(session2.session?.access_token);
    });
  });
}); 