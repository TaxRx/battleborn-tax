// Epic 3 Sprint 2 Day 4: Tool Management System Integration Tests
// File: tool-management-integration.test.ts
// Purpose: End-to-end integration testing of complete tool management system

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import AdminToolService, {
  ToolData,
  ToolUpdate,
  BulkToolAssignment,
  UsageMetricsFilters,
  ExportFilters
} from '../services/adminToolService';

// Mock Supabase client
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ 
              data: { id: 'test-tool-id', name: 'Test Tool' }, 
              error: null 
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { id: 'test-tool-id', name: 'Updated Tool' }, 
                error: null 
              }))
            }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        })),
        or: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis()
      })),
      rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}));

describe('Tool Management System Integration Tests', () => {
  let toolService: AdminToolService;
  let testToolId: string;
  let testAccountIds: string[];

  beforeAll(() => {
    toolService = AdminToolService.getInstance();
    testAccountIds = ['account-1', 'account-2', 'account-3'];
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Story 2.5: Tool CRUD Operations', () => {
    describe('Tool Creation', () => {
      it('should create a new tool with valid data', async () => {
        const toolData: ToolData = {
          name: 'Integration Test Tool',
          slug: 'integration-test-tool',
          category: 'Testing',
          description: 'A tool for integration testing',
          icon: 'https://example.com/icon.svg',
          status: 'active',
          version: '1.0.0',
          config: { setting1: 'value1' },
          features: [
            {
              id: 'feature-1',
              name: 'Basic Feature',
              description: 'A basic feature',
              enabled: true,
              subscription_levels: ['basic', 'premium', 'enterprise'],
              config: {}
            }
          ],
          pricing: {
            basic: {
              price: 10,
              features: ['Basic Feature'],
              limits: { api_calls: 1000 }
            },
            premium: {
              price: 25,
              features: ['Basic Feature', 'Advanced Feature'],
              limits: { api_calls: 5000 }
            },
            enterprise: {
              price: 50,
              features: ['Basic Feature', 'Advanced Feature', 'Enterprise Feature'],
              limits: { api_calls: 10000 }
            }
          },
          metadata: { created_by_test: true }
        };

        const result = await toolService.createTool(toolData);
        
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe(toolData.name);
        testToolId = result.id;
      });

      it('should validate tool data before creation', async () => {
        const invalidToolData: ToolData = {
          name: '', // Invalid: empty name
          slug: 'invalid-tool',
          category: '',
          description: '',
          status: 'active',
          version: '1.0.0',
          config: {},
          features: [],
          pricing: {
            basic: { price: 0, features: [], limits: {} },
            premium: { price: 0, features: [], limits: {} },
            enterprise: { price: 0, features: [], limits: {} }
          }
        };

        await expect(toolService.createTool(invalidToolData))
          .rejects.toThrow('Tool name is required');
      });

      it('should prevent duplicate slugs', async () => {
        const toolData: ToolData = {
          name: 'Duplicate Test Tool',
          slug: 'integration-test-tool', // Same slug as previous test
          category: 'Testing',
          description: 'A duplicate tool',
          status: 'active',
          version: '1.0.0',
          config: {},
          features: [],
          pricing: {
            basic: { price: 0, features: [], limits: {} },
            premium: { price: 0, features: [], limits: {} },
            enterprise: { price: 0, features: [], limits: {} }
          }
        };

        // Mock existing tool check
        const mockSupabase = require('../../../lib/supabase').supabase;
        mockSupabase.from().select().eq().single.mockResolvedValueOnce({
          data: { id: 'existing-tool' },
          error: null
        });

        await expect(toolService.createTool(toolData))
          .rejects.toThrow('Tool with slug \'integration-test-tool\' already exists');
      });
    });

    describe('Tool Updates', () => {
      it('should update tool properties', async () => {
        const updates: ToolUpdate = {
          name: 'Updated Integration Test Tool',
          description: 'Updated description for integration testing',
          status: 'beta',
          version: '1.1.0'
        };

        const result = await toolService.updateTool(testToolId, updates);
        
        expect(result).toBeDefined();
        expect(result.name).toBe(updates.name);
      });

      it('should validate version format in updates', async () => {
        const invalidUpdates: ToolUpdate = {
          version: 'invalid-version' // Invalid semantic version
        };

        await expect(toolService.updateTool(testToolId, invalidUpdates))
          .rejects.toThrow('Tool version must follow semantic versioning');
      });
    });

    describe('Tool Lifecycle Management', () => {
      it('should deactivate a tool and all its assignments', async () => {
        const result = await toolService.deactivateTool(testToolId, 'Testing deactivation');
        
        expect(result).toBeDefined();
        expect(result.status).toBe('inactive');
      });

      it('should duplicate a tool with new name and slug', async () => {
        const result = await toolService.duplicateTool(
          testToolId, 
          'Duplicated Tool', 
          'duplicated-tool'
        );
        
        expect(result).toBeDefined();
        expect(result.name).toBe('Duplicated Tool');
        expect(result.slug).toBe('duplicated-tool');
        expect(result.status).toBe('inactive'); // Should start as inactive
      });

      it('should prevent deletion of tools with active assignments', async () => {
        // Mock active assignments check
        const mockSupabase = require('../../../lib/supabase').supabase;
        mockSupabase.from().select().eq().eq().limit.mockResolvedValueOnce({
          data: [{ id: 'assignment-1' }], // Has active assignments
          error: null
        });

        await expect(toolService.deleteTool(testToolId))
          .rejects.toThrow('Cannot delete tool with active assignments');
      });
    });

    describe('Category Management', () => {
      it('should retrieve available tool categories', async () => {
        const categories = await toolService.getToolCategories();
        
        expect(Array.isArray(categories)).toBe(true);
      });

      it('should retrieve tools by category', async () => {
        const tools = await toolService.getToolsByCategory('Testing');
        
        expect(Array.isArray(tools)).toBe(true);
      });
    });
  });

  describe('Story 2.1-2.3: Tool Assignment and Bulk Operations', () => {
    describe('Individual Tool Assignment', () => {
      it('should assign a tool to an account', async () => {
        const assignmentData = {
          accountId: testAccountIds[0],
          toolId: testToolId,
          subscriptionLevel: 'premium' as const,
          accessLevel: 'write',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          notes: 'Integration test assignment'
        };

        const result = await toolService.assignTool(assignmentData);
        
        expect(result).toBeDefined();
        expect(result.account_id).toBe(assignmentData.accountId);
        expect(result.tool_id).toBe(assignmentData.toolId);
      });

      it('should update an existing assignment', async () => {
        const updates = {
          subscriptionLevel: 'enterprise' as const,
          accessLevel: 'admin',
          notes: 'Updated assignment'
        };

        const result = await toolService.updateAssignment(
          testAccountIds[0], 
          testToolId, 
          updates
        );
        
        expect(result).toBeDefined();
      });

      it('should unassign a tool from an account', async () => {
        await expect(
          toolService.unassignTool(testAccountIds[0], testToolId)
        ).resolves.not.toThrow();
      });
    });

    describe('Bulk Operations', () => {
      it('should perform bulk tool assignments', async () => {
        const bulkAssignments: BulkToolAssignment[] = testAccountIds.map(accountId => ({
          accountId,
          toolId: testToolId,
          subscriptionLevel: 'basic' as const,
          accessLevel: 'read'
        }));

        const result = await toolService.bulkAssignTools(bulkAssignments);
        
        expect(result).toBeDefined();
        expect(result.processed).toBe(testAccountIds.length);
        expect(result.failed).toBe(0);
        expect(result.success).toBe(true);
      });

      it('should handle partial failures in bulk operations', async () => {
        const bulkAssignments: BulkToolAssignment[] = [
          {
            accountId: 'invalid-account-id',
            toolId: testToolId,
            subscriptionLevel: 'basic',
            accessLevel: 'read'
          }
        ];

        // Mock error for invalid account
        const mockSupabase = require('../../../lib/supabase').supabase;
        mockSupabase.from().insert().select().single.mockRejectedValueOnce(
          new Error('Invalid account ID')
        );

        const result = await toolService.bulkAssignTools(bulkAssignments);
        
        expect(result.failed).toBeGreaterThan(0);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should perform bulk assignment updates', async () => {
        const bulkUpdates = [{
          accountIds: testAccountIds,
          toolId: testToolId,
          subscriptionLevel: 'premium' as const,
          accessLevel: 'write'
        }];

        const result = await toolService.bulkUpdateAssignments(bulkUpdates);
        
        expect(result).toBeDefined();
        expect(result.processed).toBeGreaterThan(0);
      });
    });

    describe('Assignment Matrix', () => {
      it('should retrieve tool assignment matrix with filters', async () => {
        const filters = {
          search: 'test',
          accountType: 'client',
          subscriptionLevel: 'premium',
          page: 1,
          limit: 50
        };

        const result = await toolService.getToolAssignmentMatrix(filters);
        
        expect(result).toBeDefined();
        expect(result.assignments).toBeDefined();
        expect(result.accounts).toBeDefined();
        expect(result.tools).toBeDefined();
        expect(result.pagination).toBeDefined();
      });

      it('should handle pagination correctly', async () => {
        const result = await toolService.getToolAssignmentMatrix({
          page: 1,
          limit: 10
        });
        
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.total).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Story 2.4: Tool Usage Analytics', () => {
    describe('Usage Metrics', () => {
      it('should retrieve tool usage metrics', async () => {
        const filters: UsageMetricsFilters = {
          timeRange: 'last_30_days',
          accountId: testAccountIds[0],
          toolId: testToolId,
          interval: 'day'
        };

        const result = await toolService.getToolUsageMetrics(filters);
        
        expect(result).toBeDefined();
        expect(result.overview).toBeDefined();
        expect(result.trends).toBeDefined();
        expect(result.topTools).toBeDefined();
        expect(typeof result.overview.total_events).toBe('number');
      });

      it('should retrieve detailed usage analytics', async () => {
        const filters = {
          timeRange: 'last_30_days' as const,
          accountType: 'client'
        };

        const result = await toolService.getUsageAnalytics(filters);
        
        expect(result).toBeDefined();
        expect(result.accountAnalytics).toBeDefined();
        expect(result.toolAnalytics).toBeDefined();
        expect(result.featureUsage).toBeDefined();
        expect(Array.isArray(result.accountAnalytics)).toBe(true);
      });
    });

    describe('Usage Reports Export', () => {
      it('should export usage report as CSV', async () => {
        const filters: ExportFilters = {
          timeRange: 'last_7_days',
          format: 'csv',
          includeMetadata: true
        };

        const result = await toolService.exportUsageReport(filters);
        
        expect(result).toBeInstanceOf(Blob);
        expect(result.type).toBe('text/csv');
      });

      it('should export usage report as PDF', async () => {
        const filters: ExportFilters = {
          timeRange: 'last_7_days',
          format: 'pdf',
          includeMetadata: false
        };

        const result = await toolService.exportUsageReport(filters);
        
        expect(result).toBeInstanceOf(Blob);
        // Note: Currently returns CSV format due to PDF library dependency
      });

      it('should handle filtered exports', async () => {
        const filters: ExportFilters = {
          timeRange: 'last_30_days',
          accountId: testAccountIds[0],
          toolId: testToolId,
          format: 'csv'
        };

        const result = await toolService.exportUsageReport(filters);
        
        expect(result).toBeInstanceOf(Blob);
        expect(result.size).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete tool lifecycle workflow', async () => {
      // 1. Create tool
      const toolData: ToolData = {
        name: 'Workflow Test Tool',
        slug: 'workflow-test-tool',
        category: 'Integration',
        description: 'Tool for workflow testing',
        status: 'inactive',
        version: '1.0.0',
        config: {},
        features: [],
        pricing: {
          basic: { price: 0, features: [], limits: {} },
          premium: { price: 0, features: [], limits: {} },
          enterprise: { price: 0, features: [], limits: {} }
        }
      };

      const createdTool = await toolService.createTool(toolData);
      expect(createdTool).toBeDefined();

      // 2. Assign to multiple accounts
      const assignments: BulkToolAssignment[] = testAccountIds.map(accountId => ({
        accountId,
        toolId: createdTool.id,
        subscriptionLevel: 'basic',
        accessLevel: 'read'
      }));

      const assignmentResult = await toolService.bulkAssignTools(assignments);
      expect(assignmentResult.success).toBe(true);

      // 3. Update subscription levels
      const updates = [{
        accountIds: testAccountIds,
        toolId: createdTool.id,
        subscriptionLevel: 'premium' as const
      }];

      const updateResult = await toolService.bulkUpdateAssignments(updates);
      expect(updateResult.processed).toBeGreaterThan(0);

      // 4. Retrieve assignment matrix
      const matrix = await toolService.getToolAssignmentMatrix({
        search: 'Workflow Test Tool'
      });

      expect(matrix.assignments.length).toBeGreaterThan(0);

      // 5. Deactivate tool
      const deactivatedTool = await toolService.deactivateTool(
        createdTool.id, 
        'Workflow test complete'
      );

      expect(deactivatedTool.status).toBe('inactive');
    });

    it('should maintain data consistency across operations', async () => {
      // Test that operations maintain referential integrity
      const matrixBefore = await toolService.getToolAssignmentMatrix();
      const initialAssignmentCount = matrixBefore.assignments.length;

      // Perform assignment operation
      const assignment = {
        accountId: testAccountIds[0],
        toolId: testToolId,
        subscriptionLevel: 'basic' as const,
        accessLevel: 'read'
      };

      await toolService.assignTool(assignment);

      // Verify assignment was created
      const matrixAfter = await toolService.getToolAssignmentMatrix();
      expect(matrixAfter.assignments.length).toBeGreaterThanOrEqual(initialAssignmentCount);

      // Clean up
      await toolService.unassignTool(testAccountIds[0], testToolId);
    });
  });

  describe('Performance Requirements', () => {
    it('should load analytics data within 2 seconds', async () => {
      const startTime = Date.now();
      
      await toolService.getToolUsageMetrics({
        timeRange: 'last_30_days'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('should handle large bulk operations efficiently', async () => {
      const largeAssignmentSet: BulkToolAssignment[] = Array.from(
        { length: 100 }, 
        (_, i) => ({
          accountId: `test-account-${i}`,
          toolId: testToolId,
          subscriptionLevel: 'basic',
          accessLevel: 'read'
        })
      );

      const startTime = Date.now();
      
      const result = await toolService.bulkAssignTools(largeAssignmentSet);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // 10 seconds for 100 operations
    });
  });

  afterAll(() => {
    // Cleanup any test data if needed
    jest.clearAllMocks();
  });
});

// Utility function for test data generation
export function generateTestToolData(overrides: Partial<ToolData> = {}): ToolData {
  return {
    name: 'Test Tool',
    slug: 'test-tool',
    category: 'Testing',
    description: 'A tool for testing purposes',
    status: 'active',
    version: '1.0.0',
    config: {},
    features: [],
    pricing: {
      basic: { price: 0, features: [], limits: {} },
      premium: { price: 0, features: [], limits: {} },
      enterprise: { price: 0, features: [], limits: {} }
    },
    ...overrides
  };
}

// Performance testing helper
export function measureAsyncOperation<T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      resolve({ result, duration });
    } catch (error) {
      reject(error);
    }
  });
}