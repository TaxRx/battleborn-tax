// Epic 3 Sprint 2 Day 2: Tool Assignment Performance Test
// File: tool-assignment-performance.test.ts
// Purpose: Performance tests for tool assignment matrix operations

import { performance } from 'perf_hooks';
import AdminToolService, { ToolAssignmentFilters } from '../services/adminToolService';

// Mock the supabase client for testing
const createMockQueryBuilder = () => {
  const queryBuilder = {
    select: jest.fn(() => queryBuilder),
    eq: jest.fn(() => queryBuilder),
    or: jest.fn(() => queryBuilder),
    gte: jest.fn(() => queryBuilder),
    lte: jest.fn(() => queryBuilder),
    not: jest.fn(() => queryBuilder),
    order: jest.fn(() => queryBuilder),
    range: jest.fn(() => Promise.resolve({
      data: generateMockAssignments(1000, 6),
      error: null,
      count: 6000
    })),
    single: jest.fn(() => Promise.resolve({
      data: { id: 'test-id', account_id: 'acc-1', tool_id: 'tool-1' },
      error: null
    })),
    in: jest.fn(() => queryBuilder),
    limit: jest.fn(() => queryBuilder)
  };
  return queryBuilder;
};

jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => createMockQueryBuilder()),
    rpc: jest.fn(() => Promise.resolve({ data: 'activity-id', error: null }))
  }
}));

// Generate mock assignment data for performance testing
function generateMockAssignments(accountCount: number, toolCount: number) {
  const assignments = [];
  const tools = Array.from({ length: toolCount }, (_, i) => ({
    id: `tool-${i + 1}`,
    name: `Tool ${i + 1}`,
    slug: `tool-${i + 1}`,
    category: `Category ${Math.floor(i / 2) + 1}`,
    description: `Description for tool ${i + 1}`,
    status: 'active'
  }));

  const accounts = Array.from({ length: accountCount }, (_, i) => ({
    id: `account-${i + 1}`,
    name: `Account ${i + 1}`,
    email: `account${i + 1}@example.com`,
    type: ['client', 'partner', 'admin'][i % 3],
    status: 'active',
    created_at: new Date().toISOString()
  }));

  // Create assignments (about 60% coverage)
  for (let i = 0; i < accountCount; i++) {
    for (let j = 0; j < toolCount; j++) {
      if (Math.random() < 0.6) { // 60% assignment coverage
        assignments.push({
          account_id: accounts[i].id,
          tool_id: tools[j].id,
          account_name: accounts[i].name,
          account_type: accounts[i].type,
          tool_name: tools[j].name,
          tool_slug: tools[j].slug,
          access_level: ['read', 'write', 'admin'][Math.floor(Math.random() * 3)],
          subscription_level: ['basic', 'premium', 'enterprise'][Math.floor(Math.random() * 3)],
          status: 'active',
          expires_at: Math.random() < 0.3 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          granted_at: new Date().toISOString(),
          last_accessed_at: Math.random() < 0.8 ? new Date().toISOString() : null,
          created_by_name: 'Admin User',
          updated_by_name: null,
          notes: null,
          features_enabled: {},
          usage_limits: {},
          is_expired: false,
          expires_soon: false
        });
      }
    }
  }

  return assignments;
}

describe('Tool Assignment Performance Tests', () => {
  let adminToolService: AdminToolService;

  beforeEach(() => {
    adminToolService = AdminToolService.getInstance();
    jest.clearAllMocks();
  });

  describe('Matrix Load Performance', () => {
    test('should load 1000+ accounts × 6 tools matrix in under 3 seconds', async () => {
      const startTime = performance.now();
      
      const filters: ToolAssignmentFilters = {
        page: 1,
        limit: 100,
        sortBy: 'account_name',
        sortOrder: 'asc'
      };

      const result = await adminToolService.getToolAssignmentMatrix(filters);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      console.log(`Matrix load time: ${loadTime.toFixed(2)}ms`);

      // Should complete in under 3 seconds (3000ms)
      expect(loadTime).toBeLessThan(3000);
      expect(result.assignments).toBeDefined();
      expect(result.accounts).toBeDefined();
      expect(result.tools).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    test('should handle large datasets with pagination efficiently', async () => {
      const filters: ToolAssignmentFilters = {
        page: 10, // Later page to test pagination performance
        limit: 50,
        sortBy: 'account_name',
        sortOrder: 'asc'
      };

      const startTime = performance.now();
      const result = await adminToolService.getToolAssignmentMatrix(filters);
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      console.log(`Paginated load time: ${loadTime.toFixed(2)}ms`);

      // Pagination should be even faster
      expect(loadTime).toBeLessThan(1000);
      expect(result.pagination.page).toBe(10);
      expect(result.pagination.limit).toBe(50);
    });

    test('should handle filtering efficiently', async () => {
      const filters: ToolAssignmentFilters = {
        search: 'Account 1',
        accountType: 'client',
        subscriptionLevel: 'premium',
        status: 'active',
        page: 1,
        limit: 100
      };

      const startTime = performance.now();
      const result = await adminToolService.getToolAssignmentMatrix(filters);
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      console.log(`Filtered load time: ${loadTime.toFixed(2)}ms`);

      // Filtered queries should still be fast
      expect(loadTime).toBeLessThan(2000);
    });
  });

  describe('Assignment Operations Performance', () => {
    test('should complete individual assignment in under 500ms', async () => {
      const assignmentData = {
        accountId: 'account-1',
        toolId: 'tool-1',
        subscriptionLevel: 'premium' as const,
        accessLevel: 'write'
      };

      const startTime = performance.now();
      await adminToolService.assignTool(assignmentData);
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      console.log(`Individual assignment time: ${operationTime.toFixed(2)}ms`);

      expect(operationTime).toBeLessThan(500);
    });

    test('should complete bulk assignment of 50 assignments in under 10 seconds', async () => {
      const bulkAssignments = Array.from({ length: 50 }, (_, i) => ({
        accountId: `account-${i + 1}`,
        toolId: 'tool-1',
        subscriptionLevel: 'basic' as const,
        accessLevel: 'read'
      }));

      const startTime = performance.now();
      const result = await adminToolService.bulkAssignTools(bulkAssignments);
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      console.log(`Bulk assignment time (50 items): ${operationTime.toFixed(2)}ms`);

      expect(operationTime).toBeLessThan(10000); // 10 seconds
      expect(result.processed).toBe(50);
      expect(result.failed).toBe(0);
    });

    test('should handle unassignment efficiently', async () => {
      const startTime = performance.now();
      await adminToolService.unassignTool('account-1', 'tool-1');
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      console.log(`Unassignment time: ${operationTime.toFixed(2)}ms`);

      expect(operationTime).toBeLessThan(300);
    });

    test('should handle assignment updates efficiently', async () => {
      const updateData = {
        subscriptionLevel: 'enterprise' as const,
        accessLevel: 'admin',
        notes: 'Updated for enterprise features'
      };

      const startTime = performance.now();
      await adminToolService.updateAssignment('account-1', 'tool-1', updateData);
      const endTime = performance.now();
      
      const operationTime = endTime - startTime;
      console.log(`Update assignment time: ${operationTime.toFixed(2)}ms`);

      expect(operationTime).toBeLessThan(400);
    });
  });

  describe('Concurrent Operations Performance', () => {
    test('should handle multiple concurrent matrix loads', async () => {
      const startTime = performance.now();
      
      // Simulate multiple concurrent requests
      const promises = Array.from({ length: 5 }, () => 
        adminToolService.getToolAssignmentMatrix({
          page: 1,
          limit: 50,
          sortBy: 'account_name',
          sortOrder: 'asc'
        })
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      console.log(`Concurrent matrix loads time (5 requests): ${totalTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.assignments).toBeDefined();
      });
    });

    test('should handle mixed concurrent operations', async () => {
      const startTime = performance.now();
      
      const promises = [
        // Matrix load
        adminToolService.getToolAssignmentMatrix({ page: 1, limit: 50 }),
        // Individual assignment
        adminToolService.assignTool({
          accountId: 'account-100',
          toolId: 'tool-2',
          subscriptionLevel: 'premium',
          accessLevel: 'write'
        }),
        // Update assignment
        adminToolService.updateAssignment('account-1', 'tool-1', {
          subscriptionLevel: 'enterprise'
        }),
        // Get tools
        adminToolService.getAllTools(),
        // Get accounts
        adminToolService.getAccountsForMatrix()
      ];

      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      console.log(`Mixed concurrent operations time: ${totalTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(3000);
      expect(results).toHaveLength(5);
    });
  });

  describe('Memory and Resource Efficiency', () => {
    test('should not cause memory leaks with repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform 100 matrix loads to test for memory leaks
      for (let i = 0; i < 100; i++) {
        await adminToolService.getToolAssignmentMatrix({
          page: (i % 10) + 1,
          limit: 20
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase after 100 operations: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should handle large result sets efficiently', async () => {
      const filters: ToolAssignmentFilters = {
        page: 1,
        limit: 1000, // Large limit
        sortBy: 'account_name',
        sortOrder: 'asc'
      };

      const startTime = performance.now();
      const result = await adminToolService.getToolAssignmentMatrix(filters);
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      console.log(`Large result set load time (limit 1000): ${loadTime.toFixed(2)}ms`);

      expect(loadTime).toBeLessThan(5000); // Should handle large sets within 5 seconds
      expect(result.assignments.length).toBeGreaterThan(0);
    });
  });
});

describe('Component Performance Integration', () => {
  test('should simulate realistic user interaction performance', async () => {
    const adminToolService = AdminToolService.getInstance();
    
    // Simulate typical user workflow
    const startTime = performance.now();
    
    // 1. Load initial matrix
    const matrixData = await adminToolService.getToolAssignmentMatrix({
      page: 1,
      limit: 100
    });
    
    // 2. Apply filter
    const filteredData = await adminToolService.getToolAssignmentMatrix({
      accountType: 'client',
      page: 1,
      limit: 100
    });
    
    // 3. Assign a tool
    await adminToolService.assignTool({
      accountId: 'account-1',
      toolId: 'tool-1',
      subscriptionLevel: 'premium',
      accessLevel: 'write'
    });
    
    // 4. Update assignment
    await adminToolService.updateAssignment('account-1', 'tool-1', {
      subscriptionLevel: 'enterprise'
    });
    
    // 5. Reload matrix
    await adminToolService.getToolAssignmentMatrix({
      page: 1,
      limit: 100
    });
    
    const endTime = performance.now();
    const totalWorkflowTime = endTime - startTime;
    
    console.log(`Complete user workflow time: ${totalWorkflowTime.toFixed(2)}ms`);
    
    // Complete realistic workflow should be under 5 seconds
    expect(totalWorkflowTime).toBeLessThan(5000);
    expect(matrixData.assignments).toBeDefined();
    expect(filteredData.assignments).toBeDefined();
  });
});

// Performance benchmarking utility
export class PerformanceBenchmark {
  private static measurements: { [key: string]: number[] } = {};

  static async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (!this.measurements[operation]) {
      this.measurements[operation] = [];
    }
    this.measurements[operation].push(duration);

    return result;
  }

  static getStats(operation: string) {
    const measurements = this.measurements[operation] || [];
    if (measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  static report() {
    console.log('\n=== Performance Benchmark Report ===');
    Object.keys(this.measurements).forEach(operation => {
      const stats = this.getStats(operation);
      if (stats) {
        console.log(`\n${operation}:`);
        console.log(`  Count: ${stats.count}`);
        console.log(`  Average: ${stats.average.toFixed(2)}ms`);
        console.log(`  Median: ${stats.median.toFixed(2)}ms`);
        console.log(`  Min: ${stats.min.toFixed(2)}ms`);
        console.log(`  Max: ${stats.max.toFixed(2)}ms`);
        console.log(`  95th Percentile: ${stats.p95.toFixed(2)}ms`);
      }
    });
    console.log('\n=====================================\n');
  }
}