/**
 * Test Fixtures Setup Script
 * 
 * Run this before E2E tests to generate all test fixtures.
 * 
 * Usage: npx ts-node __tests__/setup-fixtures.ts
 */

import { generateAllFixtures } from './utils/test-fixture-generator';
import path from 'path';
import fs from 'fs';

async function setup() {
  console.log('🔧 Setting up test fixtures for SafePassportPic E2E tests...\n');
  
  // Ensure fixture directories exist
  const fixtureDir = path.join(__dirname, 'fixtures');
  const qualityTestsDir = path.join(fixtureDir, 'quality-tests');
  
  if (!fs.existsSync(qualityTestsDir)) {
    fs.mkdirSync(qualityTestsDir, { recursive: true });
    console.log(`📁 Created directory: ${qualityTestsDir}`);
  }
  
  // Generate quality test fixtures
  console.log('\n📸 Generating visual quality test fixtures...');
  await generateAllFixtures();
  
  console.log('\n✅ Fixture setup complete!\n');
  console.log('You can now run the E2E tests with: npm run test:e2e');
}

setup().catch(console.error);
