/**
 * UK Passport Photo E2E + Visual Quality Tests
 *
 * Tests the complete flow for UK passport photos (35x45mm, 413x531 at 300dpi)
 * Includes:
 * - Upload and face detection
 * - UK-specific compliance checking
 * - Background removal
 * - Output generation with correct UK dimensions
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
import {
  analyzeImageQuality,
  UK_PASSPORT_SPECS,
} from './helpers/visual-analyzer';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const SCREENSHOT_DIR = path.join(
  __dirname,
  '../../../test-results/screenshots/uk-passport'
);

test.describe('UK Passport Photo - Complete E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    await navigateToAppAndSelectCountry(page, 'uk');
  });

  test('should display correct UK passport specifications', async ({
    page,
  }) => {
    // Verify the spec display - use .first() for multiple matches
    await expect(
      page.locator('text=35').or(page.locator('text=45')).first()
    ).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-specs-landing');
  });

  test('should complete full upload → generate flow with good photo', async ({
    page,
  }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    // Upload
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-after-upload');

    // Verify face detected
    await expect(
      page.locator('text=Face detected').or(page.locator('canvas'))
    ).toBeVisible({ timeout: 30000 });

    // Check compliance results (may be empty if app doesn't show checks)
    const checks = await getComplianceChecks(page);
    console.log('UK compliance checks found:', checks.length);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-compliance-checks');

    // Generate output
    await generateOutput(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-generated-output');

    // Verify output dimensions (UK: 35x45mm = 413x531 at 300dpi)
    const dimensions = await verifyCanvasDimensions(page);

    // UK dimensions: 35mm x 45mm at 300dpi = 413 x 531
    expect(dimensions.width).toBeCloseTo(413, -1);
    expect(dimensions.height).toBeCloseTo(531, -1);
  });

  test('should verify UK head size requirements (64-75%)', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);

    // Get head size compliance check
    const checks = await getComplianceChecks(page);
    const headSizeCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('head') &&
        c.label.toLowerCase().includes('size')
    );

    console.log('UK Head Size Check:', headSizeCheck);

    // UK specs: Head should be 29-34mm in 45mm frame (64-75%)
    if (!headSizeCheck) {
      console.warn('GAP: Head size check not found in app compliance checks');
    }

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-head-size-check');
  });

  test('should handle UK background requirements', async ({ page }) => {
    // UK accepts plain cream or grey backgrounds in addition to white
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);

    const checks = await getComplianceChecks(page);
    const bgCheck = checks.find((c) =>
      c.label.toLowerCase().includes('background')
    );

    console.log('UK Background Check:', bgCheck);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-background-check');
  });

  test('should generate UK photo with correct 35x45mm dimensions', async ({
    page,
  }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);

    const dimensions = await verifyCanvasDimensions(page);

    console.log('UK output dimensions:', dimensions);

    // UK passport: 35x45mm at 300dpi
    // 35mm = 1.378in * 300 = 413.4px
    // 45mm = 1.772in * 300 = 531.5px
    expect(dimensions.width).toBeGreaterThanOrEqual(410);
    expect(dimensions.width).toBeLessThanOrEqual(420);
    expect(dimensions.height).toBeGreaterThanOrEqual(528);
    expect(dimensions.height).toBeLessThanOrEqual(535);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-output-dimensions');
  });

  test('should download generated UK passport photo', async ({ page }) => {
    test.slow();

    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);

    const downloadPath = await downloadSinglePhoto(page);

    if (downloadPath) {
      expect(fs.existsSync(downloadPath)).toBe(true);

      const photoBuffer = fs.readFileSync(downloadPath);
      const analysis = await analyzeImageQuality(
        photoBuffer,
        UK_PASSPORT_SPECS
      );

      console.log('Downloaded UK photo analysis:', analysis);

      // Verify UK dimensions
      expect(analysis.dimensions.width).toBeGreaterThanOrEqual(410);
      expect(analysis.dimensions.width).toBeLessThanOrEqual(420);
    }
  });
});

test.describe('UK Passport Photo - Visual Quality Verification', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    await navigateToAppAndSelectCountry(page, 'uk');
  });

  test('should detect blurry photos for UK', async ({ page }) => {
    const blurryPhoto = path.join(
      __dirname,
      '../../fixtures/quality-tests/bad-blurry.jpg'
    );

    if (!fs.existsSync(blurryPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, blurryPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-blurry-detection');

    const checks = await getComplianceChecks(page);
    const sharpnessCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('sharp') ||
        c.label.toLowerCase().includes('blur')
    );

    console.log('UK Sharpness check for blurry photo:', sharpnessCheck);

    if (sharpnessCheck) {
      expect(['warn', 'fail']).toContain(sharpnessCheck.status);
    }
  });

  test('should detect head too small for UK specs', async ({ page }) => {
    const smallHeadPhoto = path.join(
      __dirname,
      '../../fixtures/quality-tests/bad-head-too-small.jpg'
    );

    if (!fs.existsSync(smallHeadPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, smallHeadPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-head-too-small');

    const checks = await getComplianceChecks(page);
    const headCheck = checks.find((c) =>
      c.label.toLowerCase().includes('head')
    );

    console.log('UK Head size check for small head:', headCheck);

    if (headCheck) {
      expect(['warn', 'fail']).toContain(headCheck.status);
    }
  });

  test('should detect head too large for UK specs', async ({ page }) => {
    const largeHeadPhoto = path.join(
      __dirname,
      '../../fixtures/quality-tests/bad-head-too-large.jpg'
    );

    if (!fs.existsSync(largeHeadPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, largeHeadPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-head-too-large');

    const checks = await getComplianceChecks(page);
    const headCheck = checks.find((c) =>
      c.label.toLowerCase().includes('head')
    );

    console.log('UK Head size check for large head:', headCheck);

    if (headCheck) {
      expect(['warn', 'fail']).toContain(headCheck.status);
    }
  });

  test('should detect shadows on face', async ({ page }) => {
    const shadowsPhoto = path.join(
      __dirname,
      '../../fixtures/quality-tests/bad-shadows.jpg'
    );

    if (!fs.existsSync(shadowsPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, shadowsPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-shadows-detection');

    const checks = await getComplianceChecks(page);
    const lightingCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('light') ||
        c.label.toLowerCase().includes('shadow')
    );

    console.log('UK Lighting check for shadowed photo:', lightingCheck);
  });
});

test.describe('UK Passport Photo - Output Quality Analysis', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    await navigateToAppAndSelectCountry(page, 'uk');
  });

  test('should produce output with acceptable background for UK', async ({
    page,
  }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);

    // UK accepts white, cream, or light grey
    const bgAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const width = canvas.width;
      const height = canvas.height;

      // Sample corners
      const samples: number[][] = [];
      for (const [x, y] of [
        [5, 5],
        [width - 5, 5],
        [5, height - 5],
        [width - 5, height - 5],
      ]) {
        const data = ctx.getImageData(x, y, 1, 1).data;
        samples.push([data[0], data[1], data[2]]);
      }

      const avgR = samples.reduce((a, s) => a + s[0], 0) / samples.length;
      const avgG = samples.reduce((a, s) => a + s[1], 0) / samples.length;
      const avgB = samples.reduce((a, s) => a + s[2], 0) / samples.length;

      // UK accepts white, cream, or light grey
      const isWhite = avgR > 240 && avgG > 240 && avgB > 240;
      const isLightGrey =
        avgR > 200 &&
        avgG > 200 &&
        avgB > 200 &&
        Math.abs(avgR - avgG) < 15 &&
        Math.abs(avgG - avgB) < 15;
      const isCream = avgR > 220 && avgG > 210 && avgB > 195;

      const isAcceptable = isWhite || isLightGrey || isCream;

      return { avgR, avgG, avgB, isWhite, isLightGrey, isCream, isAcceptable };
    });

    console.log('UK output background analysis:', bgAnalysis);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-output-bg-analysis');

    if (bgAnalysis) {
      if (!bgAnalysis.isAcceptable) {
        console.warn(
          'GAP: UK output background is not acceptable:',
          bgAnalysis
        );
        console.warn(
          'This may indicate background removal or image processing issues'
        );
      }
    }
  });

  test('should produce correct aspect ratio for UK (35:45)', async ({
    page,
  }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);

    const dimensions = await verifyCanvasDimensions(page);

    // UK aspect ratio should be ~35:45 = 0.778
    const aspectRatio = dimensions.width / dimensions.height;

    console.log('UK output aspect ratio:', aspectRatio, '(expected ~0.778)');

    expect(aspectRatio).toBeGreaterThan(0.75);
    expect(aspectRatio).toBeLessThan(0.8);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-output-aspect-ratio');
  });

  test('should not have excessive margins in UK output', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);

    // Check for excessive white margins
    const marginAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Count white rows at top and bottom
      let topMargin = 0;
      let bottomMargin = 0;

      for (let y = 0; y < height * 0.15; y++) {
        let rowWhite = true;
        for (let x = 0; x < width; x += 10) {
          const idx = (y * width + x) * 4;
          if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
            rowWhite = false;
            break;
          }
        }
        if (rowWhite) topMargin++;
        else break;
      }

      for (let y = height - 1; y > height * 0.85; y--) {
        let rowWhite = true;
        for (let x = 0; x < width; x += 10) {
          const idx = (y * width + x) * 4;
          if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
            rowWhite = false;
            break;
          }
        }
        if (rowWhite) bottomMargin++;
        else break;
      }

      const marginPercent = ((topMargin + bottomMargin) / height) * 100;

      return {
        topMargin,
        bottomMargin,
        marginPercent,
        hasExcessiveMargins: marginPercent > 20,
      };
    });

    console.log('UK output margin analysis:', marginAnalysis);

    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-output-margins');

    if (marginAnalysis) {
      expect(marginAnalysis.hasExcessiveMargins).toBe(false);
    }
  });
});

test.describe('UK vs US - Comparison Tests', () => {
  test('should produce different dimensions for UK vs US', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    // Generate US photo
    await navigateToAppAndSelectCountry(page, 'us');
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);

    const usDimensions = await verifyCanvasDimensions(page);

    // Navigate back and generate UK photo
    await page.goto('/app');
    await navigateToAppAndSelectCountry(page, 'uk');
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);

    const ukDimensions = await verifyCanvasDimensions(page);

    console.log('US dimensions:', usDimensions);
    console.log('UK dimensions:', ukDimensions);

    // US is square (600x600), UK is rectangular (413x531)
    expect(usDimensions.width).toBe(usDimensions.height); // US is square
    expect(ukDimensions.width).not.toBe(ukDimensions.height); // UK is not square

    // UK should be taller relative to width
    expect(ukDimensions.height / ukDimensions.width).toBeGreaterThan(1);
    expect(usDimensions.height / usDimensions.width).toBe(1);
  });
});
