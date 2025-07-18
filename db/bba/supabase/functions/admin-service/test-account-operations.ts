// Epic 3: Admin Service Account Operations Test Suite
// File: test-account-operations.ts
// Purpose: Comprehensive testing of account CRUD operations and activity logging
// Story: 1.2 - Account CRUD Operations

export interface TestResult {
  test: string;
  passed: boolean;
  error?: string;
  duration?: number;
  response?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  passed: number;
  failed: number;
  totalDuration: number;
}

/**
 * Test runner for account operations
 */
export class AccountOperationsTest {
  private baseUrl: string;
  private authToken: string;
  private testAccountIds: string[] = [];

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestSuite> {
    const testSuite: TestSuite = {
      name: 'Account CRUD Operations',
      results: [],
      passed: 0,
      failed: 0,
      totalDuration: 0
    };

    const startTime = Date.now();

    try {
      // Test account creation
      await this.testCreateAccount(testSuite);
      
      // Test account listing
      await this.testListAccounts(testSuite);
      
      // Test account retrieval
      await this.testGetAccount(testSuite);
      
      // Test account updates
      await this.testUpdateAccount(testSuite);
      
      // Test validation
      await this.testValidation(testSuite);
      
      // Test activity logging
      await this.testActivityLogging(testSuite);
      
      // Test rate limiting
      await this.testRateLimiting(testSuite);
      
      // Test performance
      await this.testPerformance(testSuite);
      
      // Test error handling
      await this.testErrorHandling(testSuite);
      
      // Test account deletion (last, as it removes test data)
      await this.testDeleteAccount(testSuite);
      
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      // Cleanup any remaining test accounts
      await this.cleanup();
    }

    testSuite.totalDuration = Date.now() - startTime;
    testSuite.passed = testSuite.results.filter(r => r.passed).length;
    testSuite.failed = testSuite.results.filter(r => !r.passed).length;

    return testSuite;
  }

  /**
   * Test account creation
   */
  private async testCreateAccount(suite: TestSuite): Promise<void> {
    // Test valid account creation
    await this.runTest(suite, 'Create valid platform account', async () => {
      const response = await this.makeRequest('/admin-service/accounts', 'POST', {
        name: 'Test Platform Account',
        type: 'operator',
        address: '123 Test Street',
        website_url: 'https://test.example.com',
        logo_url: 'https://test.example.com/logo.png'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      if (data.account?.id) {
        this.testAccountIds.push(data.account.id);
      }

      return data;
    });

    // Test different account types
    const accountTypes = ['client', 'affiliate', 'expert'];
    for (const type of accountTypes) {
      await this.runTest(suite, `Create ${type} account`, async () => {
        const response = await this.makeRequest('/admin-service/accounts', 'POST', {
          name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)} Account`,
          type
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        if (data.account?.id) {
          this.testAccountIds.push(data.account.id);
        }

        return data;
      });
    }
  }

  /**
   * Test account listing with filters and pagination
   */
  private async testListAccounts(suite: TestSuite): Promise<void> {
    // Test basic listing
    await this.runTest(suite, 'List all accounts', async () => {
      const response = await this.makeRequest('/admin-service/accounts', 'GET');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (!data.accounts || !Array.isArray(data.accounts)) {
        throw new Error('Response should contain accounts array');
      }

      if (!data.pagination) {
        throw new Error('Response should contain pagination info');
      }

      return data;
    });

    // Test pagination
    await this.runTest(suite, 'List accounts with pagination', async () => {
      const response = await this.makeRequest('/admin-service/accounts?page=1&limit=5', 'GET');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.pagination.limit !== 5) {
        throw new Error('Pagination limit should be 5');
      }

      return data;
    });

    // Test filtering by type
    await this.runTest(suite, 'Filter accounts by type', async () => {
      const response = await this.makeRequest('/admin-service/accounts?type=platform', 'GET');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Check that all returned accounts are platform type
      for (const account of data.accounts) {
        if (account.type !== 'operator') {
          throw new Error('Filter by type not working correctly');
        }
      }

      return data;
    });

    // Test search functionality
    await this.runTest(suite, 'Search accounts by name', async () => {
      const response = await this.makeRequest('/admin-service/accounts?search=Test', 'GET');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      // Check that returned accounts contain "Test" in name
      for (const account of data.accounts) {
        if (!account.name.toLowerCase().includes('test')) {
          throw new Error('Search functionality not working correctly');
        }
      }

      return data;
    });
  }

  /**
   * Test retrieving individual accounts
   */
  private async testGetAccount(suite: TestSuite): Promise<void> {
    if (this.testAccountIds.length === 0) {
      return;
    }

    const accountId = this.testAccountIds[0];

    await this.runTest(suite, 'Get account by ID', async () => {
      const response = await this.makeRequest(`/admin-service/accounts/${accountId}`, 'GET');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (!data.account || data.account.id !== accountId) {
        throw new Error('Should return correct account');
      }

      return data;
    });
  }

  /**
   * Test account updates
   */
  private async testUpdateAccount(suite: TestSuite): Promise<void> {
    if (this.testAccountIds.length === 0) {
      return;
    }

    const accountId = this.testAccountIds[0];

    await this.runTest(suite, 'Update account name', async () => {
      const response = await this.makeRequest(`/admin-service/accounts/${accountId}`, 'PUT', {
        name: 'Updated Test Account Name'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.account.name !== 'Updated Test Account Name') {
        throw new Error('Account name should be updated');
      }

      return data;
    });

    await this.runTest(suite, 'Update account type', async () => {
      const response = await this.makeRequest(`/admin-service/accounts/${accountId}`, 'PUT', {
        type: 'client'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (data.account.type !== 'client') {
        throw new Error('Account type should be updated');
      }

      return data;
    });
  }

  /**
   * Test validation
   */
  private async testValidation(suite: TestSuite): Promise<void> {
    // Test invalid account creation
    await this.runTest(suite, 'Reject invalid account type', async () => {
      const response = await this.makeRequest('/admin-service/accounts', 'POST', {
        name: 'Invalid Account',
        type: 'invalid_type'
      });

      if (response.ok) {
        throw new Error('Should reject invalid account type');
      }

      const data = await response.json();
      
      if (!data.error) {
        throw new Error('Should return error message');
      }

      return data;
    });

    // Test missing required fields
    await this.runTest(suite, 'Reject missing required fields', async () => {
      const response = await this.makeRequest('/admin-service/accounts', 'POST', {
        type: 'client'
        // Missing name
      });

      if (response.ok) {
        throw new Error('Should reject missing required fields');
      }

      return await response.json();
    });

    // Test invalid URL formats
    await this.runTest(suite, 'Reject invalid URLs', async () => {
      const response = await this.makeRequest('/admin-service/accounts', 'POST', {
        name: 'Test Account',
        type: 'client',
        website_url: 'not-a-valid-url'
      });

      if (response.ok) {
        throw new Error('Should reject invalid URLs');
      }

      return await response.json();
    });
  }

  /**
   * Test activity logging
   */
  private async testActivityLogging(suite: TestSuite): Promise<void> {
    if (this.testAccountIds.length === 0) {
      return;
    }

    const accountId = this.testAccountIds[0];

    await this.runTest(suite, 'Verify activity logging for account operations', async () => {
      // Get activities for the test account
      const response = await this.makeRequest(`/admin-service/accounts/${accountId}/activities`, 'GET');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      
      if (!data.activities || !Array.isArray(data.activities)) {
        throw new Error('Should return activities array');
      }

      // Check for creation activity
      const hasCreationActivity = data.activities.some((activity: any) => 
        activity.activity_type === 'account_created'
      );

      if (!hasCreationActivity) {
        throw new Error('Should log account creation activity');
      }

      return data;
    });

    // Test manual activity logging
    await this.runTest(suite, 'Log manual activity', async () => {
      const response = await this.makeRequest(`/admin-service/accounts/${accountId}/activities`, 'POST', {
        accountId,
        activityType: 'admin_action',
        targetType: 'account',
        targetId: accountId,
        description: 'Manual test activity',
        metadata: { test: true }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    });
  }

  /**
   * Test rate limiting
   */
  private async testRateLimiting(suite: TestSuite): Promise<void> {
    await this.runTest(suite, 'Rate limiting protection', async () => {
      // Make multiple rapid requests
      const promises = Array(15).fill(null).map(() => 
        this.makeRequest('/admin-service/accounts?limit=1', 'GET')
      );

      const responses = await Promise.all(promises);
      
      // Check if any requests were rate limited
      const rateLimited = responses.some(response => response.status === 429);
      
      if (!rateLimited) {
        throw new Error('Rate limiting should be triggered with many rapid requests');
      }

      return { rateLimited: true };
    });
  }

  /**
   * Test performance benchmarks
   */
  private async testPerformance(suite: TestSuite): Promise<void> {
    await this.runTest(suite, 'Account listing performance < 2 seconds', async () => {
      const startTime = Date.now();
      
      const response = await this.makeRequest('/admin-service/accounts?limit=50', 'GET');
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      if (duration > 2000) {
        throw new Error(`Request took ${duration}ms, should be under 2000ms`);
      }

      return { duration };
    });

    await this.runTest(suite, 'Single account retrieval performance < 500ms', async () => {
      if (this.testAccountIds.length === 0) {
        throw new Error('No test accounts available');
      }

      const startTime = Date.now();
      
      const response = await this.makeRequest(`/admin-service/accounts/${this.testAccountIds[0]}`, 'GET');
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      if (duration > 500) {
        throw new Error(`Request took ${duration}ms, should be under 500ms`);
      }

      return { duration };
    });
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(suite: TestSuite): Promise<void> {
    // Test 404 for non-existent account
    await this.runTest(suite, 'Handle non-existent account gracefully', async () => {
      const response = await this.makeRequest('/admin-service/accounts/00000000-0000-0000-0000-000000000000', 'GET');
      
      if (response.status !== 404) {
        throw new Error('Should return 404 for non-existent account');
      }

      const data = await response.json();
      
      if (!data.error) {
        throw new Error('Should return error message');
      }

      return data;
    });

    // Test invalid UUID format
    await this.runTest(suite, 'Handle invalid UUID format', async () => {
      const response = await this.makeRequest('/admin-service/accounts/invalid-uuid', 'GET');
      
      if (response.status !== 400) {
        throw new Error('Should return 400 for invalid UUID');
      }

      return await response.json();
    });
  }

  /**
   * Test account deletion
   */
  private async testDeleteAccount(suite: TestSuite): Promise<void> {
    if (this.testAccountIds.length === 0) {
      return;
    }

    // Test deletion
    for (const accountId of this.testAccountIds) {
      await this.runTest(suite, `Delete account ${accountId}`, async () => {
        const response = await this.makeRequest(`/admin-service/accounts/${accountId}`, 'DELETE');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        if (!data.message || !data.deleted_account) {
          throw new Error('Should return deletion confirmation');
        }

        return data;
      });
    }

    this.testAccountIds = []; // Clear the list as accounts are deleted
  }

  /**
   * Cleanup any remaining test data
   */
  private async cleanup(): Promise<void> {
    for (const accountId of this.testAccountIds) {
      try {
        await this.makeRequest(`/admin-service/accounts/${accountId}`, 'DELETE');
      } catch (error) {
        console.warn(`Failed to cleanup test account ${accountId}:`, error);
      }
    }
    this.testAccountIds = [];
  }

  /**
   * Make HTTP request to admin service
   */
  private async makeRequest(path: string, method: string, body?: any): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      }
    };

    if (body) {
      if (method === 'GET') {
        // For GET requests, add body as pathname to match the admin service pattern
        options.body = JSON.stringify({ pathname: path });
      } else {
        options.body = JSON.stringify(body);
      }
    } else if (method === 'GET') {
      options.body = JSON.stringify({ pathname: path });
    }

    return fetch(url, options);
  }

  /**
   * Run individual test with error handling and timing
   */
  private async runTest(suite: TestSuite, testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      suite.results.push({
        test: testName,
        passed: true,
        duration,
        response: result
      });
      
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      suite.results.push({
        test: testName,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      
      console.log(`❌ ${testName} (${duration}ms): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Utility function to run tests from command line or other contexts
 */
export async function runAccountOperationsTests(
  baseUrl: string = 'http://localhost:54321/functions/v1',
  authToken: string
): Promise<TestSuite> {
  const tester = new AccountOperationsTest(baseUrl, authToken);
  return await tester.runAllTests();
}

// Export for use in other test files
export { AccountOperationsTest };