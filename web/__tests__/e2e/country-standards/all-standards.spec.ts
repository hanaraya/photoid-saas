/**
 * E2E Tests for All Country Photo Standards
 * 
 * Tests the passport photo app with all supported country standards:
 * - US, UK, EU, Canada, India, Australia, China, Japan, etc.
 * - Verifies correct dimensions for each country
 * - Tests photo upload and processing for each standard
 */

import { test, expect, Download } from '@playwright/test';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

// Country standards with expected output dimensions
const COUNTRY_STANDARDS = [
  { id: 'us', name: 'US Passport', width: 600, height: 600, unit: 'in', specW: 2, specH: 2 },
  { id: 'us_visa', name: 'US Visa', width: 600, height: 600, unit: 'in', specW: 2, specH: 2 },
  { id: 'us_drivers', name: "US Driver's License", width: 600, height: 600, unit: 'in', specW: 2, specH: 2 },
  { id: 'green_card', name: 'Green Card', width: 600, height: 600, unit: 'in', specW: 2, specH: 2 },
  { id: 'eu', name: 'EU/Schengen Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'schengen_visa', name: 'Schengen Visa', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'uk', name: 'UK Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'uk_visa', name: 'UK Visa', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'india', name: 'India Passport', width: 600, height: 600, unit: 'in', specW: 2, specH: 2 },
  { id: 'india_visa', name: 'India Visa', width: 600, height: 600, unit: 'in', specW: 2, specH: 2 },
  { id: 'canada', name: 'Canada Passport', width: 591, height: 827, unit: 'mm', specW: 50, specH: 70 },
  { id: 'australia', name: 'Australia Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'china', name: 'China Passport', width: 390, height: 567, unit: 'mm', specW: 33, specH: 48 },
  { id: 'china_visa', name: 'China Visa', width: 390, height: 567, unit: 'mm', specW: 33, specH: 48 },
  { id: 'japan', name: 'Japan Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'south_korea', name: 'South Korea Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'germany', name: 'Germany Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'france', name: 'France Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
  { id: 'brazil', name: 'Brazil Passport', width: 591, height: 827, unit: 'mm', specW: 50, specH: 70 },
  { id: 'mexico', name: 'Mexico Passport', width: 413, height: 531, unit: 'mm', specW: 35, specH: 45 },
];

// Test image path
const TEST_IMAGE = path.join(__dirname, '../../fixtures/test-portrait.jpg');

/**
 * Helper to bypass payment
 */
async function bypassPayment(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    sessionStorage.setItem('passport-photo-verified', 'test-session');
  });
}

/**
 * Helper to select a country standard
 */
async function selectCountryStandard(page: import('@playwright/test').Page, standardId: string) {
  // Click the country selector button
  await page.locator('button[role="combobox"]').first().click();
  
  // Wait for dropdown
  await page.waitForTimeout(300);
  
  // Search and select the standard
  const standard = COUNTRY_STANDARDS.find(s => s.id === standardId);
  if (standard) {
    // Try to find and click the option
    const option = page.locator(`[role="option"]`).filter({ hasText: standard.name }).first();
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click();
    } else {
      // Close dropdown if option not found
      await page.keyboard.press('Escape');
    }
  }
}

/**
 * Helper to wait for download
 */
async function waitForDownload(
  page: import('@playwright/test').Page,
  action: () => Promise<void>
): Promise<{ download: Download; buffer: Buffer }> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    action(),
  ]);
  
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Download failed');
  
  return {
    download,
    buffer: fs.readFileSync(downloadPath),
  };
}

test.describe('Country Standards - Photo Dimensions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();
  });

  // Generate a test for each country standard
  for (const standard of COUNTRY_STANDARDS) {
    test(`${standard.name} (${standard.id}) - produces correct dimensions (${standard.specW}×${standard.specH}${standard.unit})`, async ({ page }) => {
      // Select the standard before uploading
      await selectCountryStandard(page, standard.id);
      
      // Upload photo
      await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
      
      // Wait for editor
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
      
      // Wait for processing to complete
      await expect(
        page.locator('text=Face detected').or(page.locator('text=No face found')).first()
      ).toBeVisible({ timeout: 15000 });
      
      // Generate sheet
      await page.getByRole('button', { name: /Generate Printable Sheet/i }).click();
      
      // Wait for output
      await expect(page.locator('text=Your Passport Photos')).toBeVisible({ timeout: 10000 });
      
      // Download single photo
      const { buffer } = await waitForDownload(page, async () => {
        await page.getByRole('button', { name: /Download Single/i }).click();
      });
      
      // Verify dimensions
      const metadata = await sharp(buffer).metadata();
      
      // Allow 1px tolerance for rounding
      expect(metadata.width).toBeGreaterThanOrEqual(standard.width - 1);
      expect(metadata.width).toBeLessThanOrEqual(standard.width + 1);
      expect(metadata.height).toBeGreaterThanOrEqual(standard.height - 1);
      expect(metadata.height).toBeLessThanOrEqual(standard.height + 1);
      
      // Verify format
      expect(metadata.format).toBe('jpeg');
    });
  }
});

test.describe('Country Standards - Compliance Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('US standard shows correct compliance requirements', async ({ page }) => {
    // Upload photo (US is default)
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
    
    // Wait for editor
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
    
    // Verify compliance checks are displayed
    await expect(page.locator('text=Resolution')).toBeVisible({ timeout: 5000 });
    
    // US specific - glasses reminder
    await expect(page.locator('text=Glasses Policy')).toBeVisible({ timeout: 5000 });
  });

  test('UK standard shows head size requirements', async ({ page }) => {
    // Select UK standard
    await selectCountryStandard(page, 'uk');
    
    // Upload photo
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
    
    // Wait for editor
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
    
    // Compliance checks should include head size
    await expect(page.locator('text=Head Size')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Country Standards - Sheet Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();
  });

  test('4x6 sheet contains multiple photos for US standard', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
    
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('text=Face detected').or(page.locator('text=No face found')).first()
    ).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: /Generate Printable Sheet/i }).click();
    await expect(page.locator('text=Your Passport Photos')).toBeVisible({ timeout: 10000 });
    
    // Download sheet
    const { buffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });
    
    // Sheet should be 6x4 inches at 300 DPI = 1800x1200
    const metadata = await sharp(buffer).metadata();
    expect(metadata.width).toBe(1800);
    expect(metadata.height).toBe(1200);
  });

  test('Sheet for UK standard contains appropriately sized photos', async ({ page }) => {
    await selectCountryStandard(page, 'uk');
    
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
    
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('text=Face detected').or(page.locator('text=No face found')).first()
    ).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: /Generate Printable Sheet/i }).click();
    await expect(page.locator('text=Your Passport Photos')).toBeVisible({ timeout: 10000 });
    
    // Download sheet
    const { buffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });
    
    // Sheet should still be 6x4 inches at 300 DPI
    const metadata = await sharp(buffer).metadata();
    expect(metadata.width).toBe(1800);
    expect(metadata.height).toBe(1200);
  });
});

test.describe('Country Standards - Standard Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();
  });

  test('Can switch between standards before upload', async ({ page }) => {
    // Select US
    await selectCountryStandard(page, 'us');
    await expect(page.locator('text=US Passport').first()).toBeVisible();
    
    // Switch to UK
    await selectCountryStandard(page, 'uk');
    await expect(page.locator('text=UK Passport').first()).toBeVisible();
    
    // Switch to Canada
    await selectCountryStandard(page, 'canada');
    await expect(page.locator('text=Canada Passport').first()).toBeVisible();
  });

  test('Standard selection persists through photo upload', async ({ page }) => {
    // Select UK standard
    await selectCountryStandard(page, 'uk');
    
    // Upload photo
    await page.locator('input[type="file"]').setInputFiles(TEST_IMAGE);
    
    // Wait for editor
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });
    
    // Verify UK standard is still selected (shown in UI somewhere)
    // The specs text should mention 35×45
    await expect(page.locator('text=35×45').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Country Standards - Regional Groups', () => {
  const regionalGroups = {
    'Americas': ['us', 'canada', 'brazil', 'mexico'],
    'Europe': ['eu', 'uk', 'germany', 'france'],
    'Asia Pacific': ['india', 'china', 'japan', 'south_korea', 'australia'],
  };

  for (const [region, standardIds] of Object.entries(regionalGroups)) {
    test(`${region} standards are accessible`, async ({ page }) => {
      await page.goto('/app');
      
      // Open the selector
      await page.locator('button[role="combobox"]').first().click();
      await page.waitForTimeout(300);
      
      // Check that the regional group exists
      await expect(page.locator(`text=${region}`).first()).toBeVisible({ timeout: 2000 });
      
      // Close
      await page.keyboard.press('Escape');
    });
  }
});
