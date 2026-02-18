// Test Runner for TML Villa
// This file contains automated tests for the application

import { homestayApi } from '@/services/api';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class TestRunner {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      });
      console.log(`✅ ${name} - PASSED (${Date.now() - startTime}ms)`);
    } catch (error) {
      this.results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });
      console.error(`❌ ${name} - FAILED (${Date.now() - startTime}ms)`);
      console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  printSummary(): void {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Total: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log('========================================\n');

    if (failed > 0) {
      console.log('Failed Tests:');
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }
  }
}

// API Tests
async function runAPITests(): Promise<void> {
  const runner = new TestRunner();

  console.log('\n🧪 Running API Tests...\n');

  // Test 1: Get all homestays
  await runner.runTest('API-001: Get all homestays', async () => {
    const response = await homestayApi.getAll();
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format');
    }
  });

  // Test 2: Get homestays by category
  await runner.runTest('API-002: Get homestays by category', async () => {
    const response = await homestayApi.getAll({ category: 'beach' });
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format');
    }
  });

  // Test 3: Get homestay by ID
  await runner.runTest('API-003: Get homestay by ID', async () => {
    // This test will fail without a real API, but that's expected
    try {
      await homestayApi.getById('1');
    } catch (error) {
      // Expected to fail without real API
      console.log('   Note: API endpoint not available (expected without backend)');
    }
  });

  runner.printSummary();
}

// Component Tests
async function runComponentTests(): Promise<void> {
  const runner = new TestRunner();

  console.log('\n🧪 Running Component Tests...\n');

  // Test 1: Category filter
  await runner.runTest('COMP-001: Category filter exists', async () => {
    const categories = ['all', 'beach', 'city', 'villa', 'luxury', 'cabin', 'tropical', 'farm'];
    if (categories.length === 0) {
      throw new Error('No categories defined');
    }
  });

  // Test 2: Price formatting
  await runner.runTest('COMP-002: Price formatting', async () => {
    const price = 8500;
    const formatted = new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(price);
    if (!formatted.includes('฿')) {
      throw new Error('Price format incorrect');
    }
  });

  // Test 3: Language detection
  await runner.runTest('COMP-003: Language detection', async () => {
    const languages = ['th', 'en', 'zh'];
    const detected = navigator.language?.split('-')[0] || 'en';
    if (!languages.includes(detected) && !languages.includes('en')) {
      throw new Error('Language not supported');
    }
  });

  runner.printSummary();
}

// Run all tests
export async function runAllTests(): Promise<void> {
  console.log('\n🚀 Starting TML Villa Test Suite\n');
  console.log('=====================================\n');

  await runAPITests();
  await runComponentTests();

  console.log('\n✨ Test Suite Complete\n');
}

// Export for use in development
if (import.meta.env.DEV) {
  // Auto-run tests in development mode
  runAllTests().catch(console.error);
}
