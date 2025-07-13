#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Epic 1 Comprehensive Testing Suite');
console.log('='.repeat(60));

// Test configuration
const testConfig = {
  testTimeout: 30000,
  setupTimeout: 60000,
  teardownTimeout: 30000,
  maxWorkers: 4,
  verbose: true
};

// Test suites to run
const testSuites = [
  {
    name: 'Security Tests',
    file: 'src/tests/epic1-security.test.ts',
    description: 'Authentication, authorization, RLS policies, and security workflows'
  },
  {
    name: 'Integration Tests',
    file: 'src/tests/epic1-integration.test.ts',
    description: 'End-to-end user flows, database operations, and API endpoints'
  },
  {
    name: 'Performance Tests',
    file: 'src/tests/epic1-performance.test.ts',
    description: 'Load testing, query performance, and scalability'
  },
  {
    name: 'Existing Unit Tests',
    file: 'src/tests/auth.test.ts',
    description: 'Authentication unit tests'
  },
  {
    name: 'Tax Calculation Tests',
    file: 'src/tests/taxCalculations.test.ts',
    description: 'Tax calculation logic tests'
  }
];

// Helper functions
function runCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function createTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    totalSuites: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results
  };

  const reportPath = path.join(__dirname, '..', 'test-results', 'epic1-test-report.json');
  
  // Ensure directory exists
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  return report;
}

function printSummary(report) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Epic 1 Testing Summary');
  console.log('='.repeat(60));
  console.log(`Total Test Suites: ${report.totalSuites}`);
  console.log(`✅ Passed: ${report.passed}`);
  console.log(`❌ Failed: ${report.failed}`);
  console.log(`Success Rate: ${((report.passed / report.totalSuites) * 100).toFixed(1)}%`);
  
  if (report.failed > 0) {
    console.log('\n🔍 Failed Test Suites:');
    report.results.filter(r => !r.success).forEach(result => {
      console.log(`  ❌ ${result.name}: ${result.error}`);
    });
  }

  console.log(`\n📄 Full report saved to: test-results/epic1-test-report.json`);
}

// Pre-test setup
async function setupTests() {
  console.log('🔧 Setting up test environment...');
  
  // Check if Supabase is running
  const supabaseCheck = runCommand('supabase status', { stdio: 'pipe' });
  if (!supabaseCheck.success) {
    console.log('🚀 Starting Supabase...');
    const supabaseStart = runCommand('cd db/bba && supabase start');
    if (!supabaseStart.success) {
      throw new Error('Failed to start Supabase');
    }
  }

  // Install dependencies if needed
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    runCommand('npm install');
  }

  console.log('✅ Test environment ready');
}

// Main test execution
async function runTests() {
  const results = [];

  for (const suite of testSuites) {
    console.log(`\n🧪 Running ${suite.name}...`);
    console.log(`📝 ${suite.description}`);
    console.log('-'.repeat(40));

    const startTime = Date.now();
    
    // Check if test file exists
    if (!fs.existsSync(suite.file)) {
      console.log(`⚠️  Test file not found: ${suite.file}`);
      results.push({
        name: suite.name,
        success: false,
        error: 'Test file not found',
        duration: 0
      });
      continue;
    }

    // Run the test suite
    const testCommand = `npx jest ${suite.file} --testTimeout=${testConfig.testTimeout} --verbose`;
    const result = runCommand(testCommand, { stdio: 'pipe' });
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    if (result.success) {
      console.log(`✅ ${suite.name} passed (${duration}ms)`);
    } else {
      console.log(`❌ ${suite.name} failed (${duration}ms)`);
      console.log(`Error: ${result.error}`);
    }

    results.push({
      name: suite.name,
      success: result.success,
      error: result.success ? null : result.error,
      duration: duration
    });
  }

  return results;
}

// Post-test cleanup
async function cleanupTests() {
  console.log('\n🧹 Cleaning up test environment...');
  
  // Clean up test data
  const cleanupCommand = `
    cd db/bba && psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
    DELETE FROM invitations WHERE email LIKE '%test%' OR email LIKE '%example.com';
    DELETE FROM client_users WHERE client_id IN (SELECT id FROM clients WHERE email LIKE '%test%' OR email LIKE '%example.com');
    DELETE FROM clients WHERE email LIKE '%test%' OR email LIKE '%example.com';
    DELETE FROM profiles WHERE email LIKE '%test%' OR email LIKE '%example.com';
    "
  `;
  
  runCommand(cleanupCommand, { stdio: 'pipe' });
  console.log('✅ Test cleanup complete');
}

// Main execution
async function main() {
  try {
    await setupTests();
    const results = await runTests();
    const report = createTestReport(results);
    printSummary(report);
    await cleanupTests();

    // Exit with appropriate code
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Test execution interrupted');
  await cleanupTests();
  process.exit(1);
});

// Run the tests
main(); 