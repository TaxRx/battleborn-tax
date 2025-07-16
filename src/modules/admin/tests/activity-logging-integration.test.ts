// Epic 3: Activity Logging Integration Tests
// File: activity-logging-integration.test.ts
// Purpose: Integration tests for Story 1.3 - Account Activity Logging System

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { supabase } from '../../../lib/supabase';
import AdminAccountService from '../services/adminAccountService';

describe('Activity Logging Integration Tests', () => {
  let testAccountId: string;
  let testProfileId: string;
  let adminService: AdminAccountService;

  beforeAll(async () => {
    adminService = AdminAccountService.getInstance();
    
    // Create a test account for our tests
    const { data: testAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name: 'Test Account for Activity Logging',
        email: 'test-activity@example.com',
        type: 'client',
        status: 'active'
      })
      .select()
      .single();

    if (accountError) {
      throw new Error(`Failed to create test account: ${accountError.message}`);
    }

    testAccountId = testAccount.id;

    // Create a test profile
    const { data: testProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        account_id: testAccountId,
        email: 'test-profile@example.com',
        full_name: 'Test Profile',
        role: 'user'
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create test profile: ${profileError.message}`);
    }

    testProfileId = testProfile.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testAccountId) {
      await supabase.from('account_activities').delete().eq('account_id', testAccountId);
      await supabase.from('profiles').delete().eq('account_id', testAccountId);
      await supabase.from('accounts').delete().eq('id', testAccountId);
    }
  });

  beforeEach(async () => {
    // Clear any existing activities for this test account
    await supabase.from('account_activities').delete().eq('account_id', testAccountId);
  });

  describe('Activity Logging Service', () => {
    test('should log account activities successfully', async () => {
      const activityData = {
        accountId: testAccountId,
        activityType: 'account_updated',
        targetType: 'account',
        targetId: testAccountId,
        description: 'Test activity logging',
        metadata: { test: true, source: 'integration-test' }
      };

      const result = await adminService.logActivity(activityData);
      
      expect(result.success).toBe(true);
      expect(result.activityId).toBeDefined();

      // Verify the activity was logged
      const { data: activities } = await supabase
        .from('account_activities')
        .select('*')
        .eq('account_id', testAccountId);

      expect(activities).toHaveLength(1);
      expect(activities![0].activity_type).toBe('account_updated');
      expect(activities![0].description).toBe('Test activity logging');
      expect(activities![0].metadata.test).toBe(true);
    });

    test('should retrieve account activities with filters', async () => {
      // Create multiple test activities
      const activities = [
        {
          accountId: testAccountId,
          activityType: 'account_created',
          targetType: 'account',
          targetId: testAccountId,
          description: 'Account created'
        },
        {
          accountId: testAccountId,
          activityType: 'profile_added',
          targetType: 'profile',
          targetId: testProfileId,
          description: 'Profile added'
        },
        {
          accountId: testAccountId,
          activityType: 'account_updated',
          targetType: 'account',
          targetId: testAccountId,
          description: 'Account updated'
        }
      ];

      // Log all activities
      for (const activity of activities) {
        await adminService.logActivity(activity);
      }

      // Test basic retrieval
      const allActivities = await adminService.getAccountActivities(testAccountId);
      expect(allActivities.activities).toHaveLength(3);
      expect(allActivities.pagination.total).toBe(3);

      // Test filtering by activity type
      const filteredActivities = await adminService.getAccountActivities(testAccountId, {
        activityType: 'account_updated'
      });
      expect(filteredActivities.activities).toHaveLength(1);
      expect(filteredActivities.activities[0].activity_type).toBe('account_updated');

      // Test pagination
      const paginatedActivities = await adminService.getAccountActivities(testAccountId, {
        page: 1,
        limit: 2
      });
      expect(paginatedActivities.activities).toHaveLength(2);
      expect(paginatedActivities.pagination.pages).toBe(2);
    });

    test('should handle date range filtering', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Log an activity
      await adminService.logActivity({
        accountId: testAccountId,
        activityType: 'account_updated',
        targetType: 'account',
        targetId: testAccountId,
        description: 'Test date filtering'
      });

      // Test date range filtering
      const activitiesInRange = await adminService.getAccountActivities(testAccountId, {
        dateFrom: yesterday,
        dateTo: tomorrow
      });
      expect(activitiesInRange.activities).toHaveLength(1);

      // Test outside date range
      const activitiesOutsideRange = await adminService.getAccountActivities(testAccountId, {
        dateFrom: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        dateTo: yesterday
      });
      expect(activitiesOutsideRange.activities).toHaveLength(0);
    });
  });

  describe('Activity Metrics', () => {
    test('should calculate activity metrics correctly', async () => {
      // Create some test activities
      const activities = [
        { activityType: 'account_created', description: 'Account created' },
        { activityType: 'account_updated', description: 'Account updated' },
        { activityType: 'account_updated', description: 'Account updated again' },
        { activityType: 'profile_added', description: 'Profile added' }
      ];

      for (const activity of activities) {
        await adminService.logActivity({
          accountId: testAccountId,
          targetType: 'account',
          targetId: testAccountId,
          ...activity
        });
      }

      const metrics = await adminService.getActivityMetrics(testAccountId);
      
      expect(metrics.totalActivities).toBeGreaterThanOrEqual(4);
      expect(metrics.recentActivities).toBeGreaterThanOrEqual(4);
      expect(metrics.topActivityTypes).toContainEqual(
        expect.objectContaining({ type: 'account_updated', count: 2 })
      );
      expect(metrics.activityTrends).toHaveLength(30); // 30 days of trends
    });
  });

  describe('Performance Optimization', () => {
    test('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Create a moderate number of activities to test performance
      const activities = Array.from({ length: 50 }, (_, i) => ({
        accountId: testAccountId,
        activityType: i % 2 === 0 ? 'account_updated' : 'profile_updated',
        targetType: 'account',
        targetId: testAccountId,
        description: `Bulk activity ${i + 1}`
      }));

      // Log activities in batches to avoid overwhelming the system
      for (let i = 0; i < activities.length; i += 10) {
        const batch = activities.slice(i, i + 10);
        await Promise.all(batch.map(activity => adminService.logActivity(activity)));
      }

      const logTime = Date.now() - startTime;

      // Test retrieval performance
      const retrievalStart = Date.now();
      const result = await adminService.getAccountActivities(testAccountId, {
        page: 1,
        limit: 25
      });
      const retrievalTime = Date.now() - retrievalStart;

      // Performance assertions
      expect(logTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(retrievalTime).toBeLessThan(1000); // Should retrieve within 1 second
      expect(result.activities).toHaveLength(25);
      expect(result.pagination.total).toBeGreaterThanOrEqual(50);
    });

    test('should support efficient sorting and filtering', async () => {
      // Create activities with different timestamps
      const activities = [
        { activityType: 'account_created', description: 'First activity' },
        { activityType: 'account_updated', description: 'Second activity' },
        { activityType: 'profile_added', description: 'Third activity' }
      ];

      for (const activity of activities) {
        await adminService.logActivity({
          accountId: testAccountId,
          targetType: 'account',
          targetId: testAccountId,
          ...activity
        });
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Test sorting by creation date (newest first)
      const newestFirst = await adminService.getAccountActivities(testAccountId, {
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      expect(newestFirst.activities[0].description).toBe('Third activity');

      // Test sorting by creation date (oldest first)
      const oldestFirst = await adminService.getAccountActivities(testAccountId, {
        sortBy: 'created_at',
        sortOrder: 'asc'
      });
      expect(oldestFirst.activities[0].description).toBe('First activity');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid activity types gracefully', async () => {
      try {
        await adminService.logActivity({
          accountId: testAccountId,
          activityType: 'invalid_activity_type',
          targetType: 'account',
          targetId: testAccountId,
          description: 'This should fail'
        });
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Expected to throw an error
        expect(error).toBeDefined();
      }
    });

    test('should handle missing required fields', async () => {
      try {
        await adminService.logActivity({
          accountId: '',
          activityType: 'account_updated',
          targetType: 'account',
          targetId: testAccountId,
          description: 'Missing account ID'
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle non-existent account IDs', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      const result = await adminService.getAccountActivities(nonExistentId);
      expect(result.activities).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('Integration with Account Operations', () => {
    test('should automatically log account updates', async () => {
      // Update the test account
      const { error } = await supabase
        .from('accounts')
        .update({ name: 'Updated Test Account Name' })
        .eq('id', testAccountId);

      expect(error).toBeNull();

      // Wait a moment for the trigger to fire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check that an activity was automatically logged
      const activities = await adminService.getAccountActivities(testAccountId);
      const updateActivity = activities.activities.find(
        activity => activity.activity_type === 'account_updated'
      );

      expect(updateActivity).toBeDefined();
      expect(updateActivity?.description).toContain('Updated Test Account Name');
    });

    test('should automatically log profile changes', async () => {
      // Update the test profile
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: 'Updated Profile Name' })
        .eq('id', testProfileId);

      expect(error).toBeNull();

      // Wait a moment for the trigger to fire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check that an activity was automatically logged
      const activities = await adminService.getAccountActivities(testAccountId);
      const profileActivity = activities.activities.find(
        activity => activity.activity_type === 'profile_updated'
      );

      expect(profileActivity).toBeDefined();
      expect(profileActivity?.description).toContain('Updated Profile Name');
    });
  });

  describe('Export Functionality', () => {
    test('should export activities in CSV format', async () => {
      // Create some test activities
      await adminService.logActivity({
        accountId: testAccountId,
        activityType: 'account_updated',
        targetType: 'account',
        targetId: testAccountId,
        description: 'Test export activity'
      });

      // Test CSV export
      const result = await adminService.exportActivities(testAccountId, {
        format: 'csv'
      });

      expect(result.success).toBe(true);
      // Note: In a real test, you might want to verify the actual file content
    });
  });
});

// Helper function for testing performance
const measureExecutionTime = async (fn: () => Promise<any>): Promise<{ result: any; time: number }> => {
  const start = Date.now();
  const result = await fn();
  const time = Date.now() - start;
  return { result, time };
};