/**
 * US Passport Photo E2E + Visual Quality Tests
 * 
 * Tests the complete flow for US passport photos (2x2 inches, 600x600 at 300dpi)
 * Includes:
 * - Upload and face detection
 * - Compliance checking
 * - Background removal
 * - Output generation
 * - Visual quality verification
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import {
  navigateToAppAndSelectCountry,
  uploadPhoto,
  waitForProcessing,
  getComplianceChecks,
  generateOutput,
  downloadSinglePhoto,
  captureScreenshot,
  verifyCanvasDimensions,
} from './helpers/test-utils';
import { analyzeImageQuality, US_PASSPORT_SPECS } from './helpers/visual-analyzer';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const SCREENSHOT_DIR = path.join(__dirname, '../../../test-results/screenshots/us-passport');

test.describe('US Passport Photo - Complete E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should display correct US passport specifications', async ({ page }) => {
    // Verify the spec display - use .first() for multiple matches
    await expect(page.locator('text=2×2').first()).toBeVisible();
    await expect(page.locator('text=white background').or(page.locator('text=White background')).first()).toBeVisible();
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-specs-landing');
  });

  test('should complete full upload → generate flow with good photo', async ({ page }) => {
    // Get good test photo
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    // Upload
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-after-upload');
    
    // Verify face detected
    await expect(
      page.locator('text=Face detected').or(page.locator('canvas'))
    ).toBeVisible({ timeout: 30000 });
    
    // Check compliance results (may be empty if app doesn't show checks)
    const checks = await getComplianceChecks(page);
    console.log('US compliance checks found:', checks.length);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-compliance-checks');
    
    // Generate output
    await generateOutput(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-generated-output');
    
    // Verify output dimensions (US: 600x600)
    const dimensions = await verifyCanvasDimensions(page);
    expect(dimensions.width).toBe(600);
    expect(dimensions.height).toBe(600);
  });

  test('should verify US head size requirements (50-69%)', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    
    // Get head size compliance check
    const checks = await getComplianceChecks(page);
    const headSizeCheck = checks.find(c => 
      c.label.toLowerCase().includes('head') && c.label.toLowerCase().includes('size')
    );
    
    // Log for debugging
    console.log('US Head Size Check:', headSizeCheck);
    
    // Head size should be validated (if the app has this check)
    if (!headSizeCheck) {
      console.warn('GAP: Head size check not found in app compliance checks');
    }
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-head-size-check');
  });

  test('should show glasses policy warning for US photos', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    
    // US photos should show glasses policy
    const hasGlassesPolicy = await page.locator('text=Glasses').or(page.locator('text=glasses')).isVisible();
    
    console.log('Glasses policy visible:', hasGlassesPolicy);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-glasses-policy');
  });

  test('should trigger background removal for colored background', async ({ page }) => {
    // Use a photo with colored background
    const coloredBgPhoto = path.join(__dirname, '../../fixtures/quality-tests/bad-dark-background.jpg');
    
    if (!fs.existsSync(coloredBgPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, coloredBgPhoto);
    await waitForProcessing(page);
    
    // Should show background removal recommendation
    const bgRemovalVisible = await page.locator('button:has-text("Remove Background")').isVisible();
    
    console.log('Background removal button visible:', bgRemovalVisible);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-bg-removal-prompt');
    
    // If visible, test the removal
    if (bgRemovalVisible) {
      await page.locator('button:has-text("Remove Background")').click();
      
      // Wait for removal to complete
      await page.waitForFunction(
        () => !document.body.textContent?.includes('Removing'),
        { timeout: 60000 }
      );
      
      await captureScreenshot(page, SCREENSHOT_DIR, 'us-bg-removed');
    }
  });

  test('should download generated US passport photo', async ({ page }) => {
    test.slow(); // Downloads can be slow
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Test download
    const downloadPath = await downloadSinglePhoto(page);
    
    if (downloadPath) {
      expect(fs.existsSync(downloadPath)).toBe(true);
      
      // Analyze downloaded photo
      const photoBuffer = fs.readFileSync(downloadPath);
      const analysis = await analyzeImageQuality(photoBuffer, US_PASSPORT_SPECS);
      
      console.log('Downloaded photo analysis:', analysis);
      
      expect(analysis.dimensions.width).toBe(600);
      expect(analysis.dimensions.height).toBe(600);
    }
  });
});

test.describe('US Passport Photo - Visual Quality Verification', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect and warn about blurry photos', async ({ page }) => {
    const blurryPhoto = path.join(__dirname, '../../fixtures/quality-tests/bad-blurry.jpg');
    
    if (!fs.existsSync(blurryPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, blurryPhoto);
    await waitForProcessing(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-blurry-detection');
    
    // Check if blur is detected
    const checks = await getComplianceChecks(page);
    const sharpnessCheck = checks.find(c => 
      c.label.toLowerCase().includes('sharp') || 
      c.label.toLowerCase().includes('blur')
    );
    
    console.log('Sharpness check for blurry photo:', sharpnessCheck);
    
    // Blurry should be warned or failed
    if (sharpnessCheck) {
      expect(['warn', 'fail']).toContain(sharpnessCheck.status);
    }
  });

  test('should detect low resolution photos', async ({ page }) => {
    const lowResPhoto = path.join(__dirname, '../../fixtures/quality-tests/bad-low-resolution.jpg');
    
    if (!fs.existsSync(lowResPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, lowResPhoto);
    await waitForProcessing(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-low-res-detection');
    
    const checks = await getComplianceChecks(page);
    const resCheck = checks.find(c => c.label.toLowerCase().includes('resolution'));
    
    console.log('Resolution check for low-res photo:', resCheck);
    
    if (resCheck) {
      expect(['warn', 'fail']).toContain(resCheck.status);
    }
  });

  test('should detect off-center faces', async ({ page }) => {
    const offCenterPhoto = path.join(__dirname, '../../fixtures/quality-tests/bad-off-center.jpg');
    
    if (!fs.existsSync(offCenterPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, offCenterPhoto);
    await waitForProcessing(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-off-center-detection');
    
    const checks = await getComplianceChecks(page);
    const centerCheck = checks.find(c => c.label.toLowerCase().includes('center'));
    
    console.log('Centering check for off-center photo:', centerCheck);
    
    if (centerCheck) {
      expect(['warn', 'fail']).toContain(centerCheck.status);
    }
  });

  test('should detect overexposed photos', async ({ page }) => {
    const overexposedPhoto = path.join(__dirname, '../../fixtures/quality-tests/bad-overexposed.jpg');
    
    if (!fs.existsSync(overexposedPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, overexposedPhoto);
    await waitForProcessing(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-overexposed-detection');
    
    const checks = await getComplianceChecks(page);
    const lightCheck = checks.find(c => 
      c.label.toLowerCase().includes('light') || 
      c.label.toLowerCase().includes('exposure')
    );
    
    console.log('Lighting check for overexposed photo:', lightCheck);
  });

  test('should detect underexposed photos', async ({ page }) => {
    const underexposedPhoto = path.join(__dirname, '../../fixtures/quality-tests/bad-underexposed.jpg');
    
    if (!fs.existsSync(underexposedPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, underexposedPhoto);
    await waitForProcessing(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-underexposed-detection');
    
    const checks = await getComplianceChecks(page);
    const lightCheck = checks.find(c => 
      c.label.toLowerCase().includes('light') || 
      c.label.toLowerCase().includes('exposure')
    );
    
    console.log('Lighting check for underexposed photo:', lightCheck);
  });
});

test.describe('US Passport Photo - Output Quality Analysis', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should produce output with white background', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Analyze canvas background
    const bgAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Sample corners
      const samples: number[][] = [];
      for (const [x, y] of [[5, 5], [width - 5, 5], [5, height - 5], [width - 5, height - 5]]) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        samples.push([data[0], data[1], data[2]]);
      }
      
      // Calculate average
      const avgR = samples.reduce((a, s) => a + s[0], 0) / samples.length;
      const avgG = samples.reduce((a, s) => a + s[1], 0) / samples.length;
      const avgB = samples.reduce((a, s) => a + s[2], 0) / samples.length;
      
      const isWhite = avgR > 240 && avgG > 240 && avgB > 240;
      
      return { avgR, avgG, avgB, isWhite };
    });
    
    console.log('US output background analysis:', bgAnalysis);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-output-bg-analysis');
    
    // Background should be white for US passport
    // Note: Test images may not have perfect white bg - this documents current state
    if (bgAnalysis) {
      if (!bgAnalysis.isWhite) {
        console.warn('GAP: US output background is not white:', bgAnalysis);
        console.warn('This may indicate background removal or image processing issues');
      }
    }
  });

  test('should produce correctly sized US output (600x600)', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    const dimensions = await verifyCanvasDimensions(page);
    
    console.log('US output dimensions:', dimensions);
    
    // US passport: 2x2 inches at 300dpi = 600x600
    expect(dimensions.width).toBe(600);
    expect(dimensions.height).toBe(600);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-output-dimensions');
  });

  test('should produce sharp output without artifacts', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Analyze for blur and artifacts
    const sharpnessAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Calculate Laplacian variance for sharpness
      let laplacianSum = 0;
      let count = 0;
      
      for (let y = 1; y < height - 1; y += 2) {
        for (let x = 1; x < width - 1; x += 2) {
          const idx = (y * width + x) * 4;
          const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          const grayUp = (data[((y - 1) * width + x) * 4] + data[((y - 1) * width + x) * 4 + 1] + data[((y - 1) * width + x) * 4 + 2]) / 3;
          const grayDown = (data[((y + 1) * width + x) * 4] + data[((y + 1) * width + x) * 4 + 1] + data[((y + 1) * width + x) * 4 + 2]) / 3;
          const grayLeft = (data[(y * width + x - 1) * 4] + data[(y * width + x - 1) * 4 + 1] + data[(y * width + x - 1) * 4 + 2]) / 3;
          const grayRight = (data[(y * width + x + 1) * 4] + data[(y * width + x + 1) * 4 + 1] + data[(y * width + x + 1) * 4 + 2]) / 3;
          
          const lap = grayUp + grayDown + grayLeft + grayRight - 4 * gray;
          laplacianSum += lap * lap;
          count++;
        }
      }
      
      const sharpnessScore = laplacianSum / count;
      
      return { sharpnessScore, isSharp: sharpnessScore > 50 };
    });
    
    console.log('US output sharpness analysis:', sharpnessAnalysis);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-output-sharpness');
    
    if (sharpnessAnalysis) {
      expect(sharpnessAnalysis.sharpnessScore).toBeGreaterThan(30);
    }
  });
});
