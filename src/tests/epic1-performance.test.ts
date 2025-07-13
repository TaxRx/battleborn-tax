import { jest, describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

describe('Epic 1 Performance Tests', () => {
  let testUserId: string;
  let testClientId: string;
  let testSession: any;

  beforeAll(async () => {
    // Clean up any existing test data
    await supabaseAdmin.auth.admin.deleteUser('perf-test@example.com');
    await supabaseAdmin.from('clients').delete().eq('email', 'perf-test@example.com');

    // Create test user and client
    const { data: authData } = await supabase.auth.signUp({
      email: 'perf-test@example.com',
      password: 'PerfTest123!@#'
    });

    testUserId = authData.user!.id;
    testSession = authData.session;

    // Create profile
    await supabase.from('profiles').insert({
      id: testUserId,
      email: 'perf-test@example.com',
      full_name: 'Performance Test User',
      role: 'affiliate'
    });

    // Create client
    const { data: clientData } = await supabase.from('clients').insert({
      full_name: 'Performance Test Client',
      email: 'perf-test@example.com',
      created_by: testUserId,
      filing_status: 'single',
      state: 'CA'
    }).select().single();

    testClientId = clientData.id;

    // Create client-user relationship
    await supabase.from('client_users').insert({
      client_id: testClientId,
      user_id: testUserId,
      role: 'owner'
    });
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

  describe('Authentication Performance', () => {
    test('should handle login within acceptable time limits', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'perf-test@example.com',
        password: 'PerfTest123!@#'
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data.user).toBeTruthy();
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle concurrent logins efficiently', async () => {
      const concurrentLogins = 5;
      const loginPromises = Array.from({ length: concurrentLogins }, () =>
        supabase.auth.signInWithPassword({
          email: 'perf-test@example.com',
          password: 'PerfTest123!@#'
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(loginPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All logins should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
        expect(result.data.user).toBeTruthy();
      });

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 5 concurrent logins
    });
  });

  describe('Database Query Performance', () => {
    beforeAll(async () => {
      await supabase.auth.setSession(testSession);
    });

    test('should fetch client data efficiently', async () => {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', testClientId)
        .single();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    test('should handle complex joins efficiently', async () => {
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
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle pagination efficiently', async () => {
      // Create test data for pagination
      const testInvitations = Array.from({ length: 50 }, (_, i) => ({
        client_id: testClientId,
        email: `pagination-test-${i}@example.com`,
        role: 'member' as const,
        invited_by: testUserId,
        message: `Pagination test ${i}`
      }));

      await supabase.from('invitations').insert(testInvitations);

      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('client_id', testClientId)
        .range(0, 9) // First 10 records
        .order('created_at', { ascending: false });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toHaveLength(10);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });

  describe('Bulk Operations Performance', () => {
    beforeAll(async () => {
      await supabase.auth.setSession(testSession);
    });

    test('should handle bulk invitation creation efficiently', async () => {
      const bulkInvitations = Array.from({ length: 100 }, (_, i) => ({
        client_id: testClientId,
        email: `bulk-invite-${i}@example.com`,
        role: 'member' as const,
        invited_by: testUserId,
        message: `Bulk invitation ${i}`
      }));

      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('invitations')
        .insert(bulkInvitations)
        .select();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(data).toHaveLength(100);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });

    test('should handle bulk updates efficiently', async () => {
      // Get invitation IDs for bulk update
      const { data: invitations } = await supabase
        .from('invitations')
        .select('id')
        .eq('client_id', testClientId)
        .limit(50);

      const startTime = Date.now();
      
      // Update invitations in batches
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < invitations!.length; i += batchSize) {
        const batch = invitations!.slice(i, i + batchSize);
        const batchPromise = supabase
          .from('invitations')
          .update({ message: 'Updated message' })
          .in('id', batch.map(inv => inv.id));
        batches.push(batchPromise);
      }

      const results = await Promise.all(batches);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All batches should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
      });

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle bulk deletion efficiently', async () => {
      // Get invitation IDs for bulk deletion
      const { data: invitations } = await supabase
        .from('invitations')
        .select('id')
        .eq('client_id', testClientId)
        .eq('status', 'pending');

      const startTime = Date.now();
      
      const { error } = await supabase
        .from('invitations')
        .delete()
        .in('id', invitations!.map(inv => inv.id));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(error).toBeNull();
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should handle large result sets without memory issues', async () => {
      await supabase.auth.setSession(testSession);

      // Create a large number of test records
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        client_id: testClientId,
        email: `large-dataset-${i}@example.com`,
        role: 'member' as const,
        invited_by: testUserId,
        message: `Large dataset test ${i}`
      }));

      await supabase.from('invitations').insert(largeDataSet);

      const startTime = Date.now();
      const initialMemory = process.memoryUsage();
      
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('client_id', testClientId);

      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      const duration = endTime - startTime;
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
    });

    test('should handle concurrent operations without resource exhaustion', async () => {
      await supabase.auth.setSession(testSession);

      const concurrentOperations = 20;
      const operations = Array.from({ length: concurrentOperations }, (_, i) => {
        switch (i % 4) {
          case 0:
            return supabase.from('clients').select('*').eq('id', testClientId);
          case 1:
            return supabase.from('invitations').select('*').eq('client_id', testClientId).limit(10);
          case 2:
            return supabase.from('client_users').select('*').eq('client_id', testClientId);
          default:
            return supabase.from('tax_profiles').select('*').eq('client_id', testClientId);
        }
      });

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
      });

      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Network and Latency Performance', () => {
    test('should handle network latency gracefully', async () => {
      await supabase.auth.setSession(testSession);

      // Simulate multiple sequential operations
      const operations = [
        () => supabase.from('clients').select('*').eq('id', testClientId),
        () => supabase.from('client_users').select('*').eq('client_id', testClientId),
        () => supabase.from('invitations').select('*').eq('client_id', testClientId).limit(5),
        () => supabase.from('tax_profiles').select('*').eq('client_id', testClientId)
      ];

      const startTime = Date.now();
      
      for (const operation of operations) {
        const { error } = await operation();
        expect(error).toBeNull();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should optimize parallel operations', async () => {
      await supabase.auth.setSession(testSession);

      const parallelOperations = [
        supabase.from('clients').select('*').eq('id', testClientId),
        supabase.from('client_users').select('*').eq('client_id', testClientId),
        supabase.from('invitations').select('*').eq('client_id', testClientId).limit(5),
        supabase.from('tax_profiles').select('*').eq('client_id', testClientId)
      ];

      const startTime = Date.now();
      const results = await Promise.all(parallelOperations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.error).toBeNull();
      });

      // Parallel should be faster than sequential
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
}); 