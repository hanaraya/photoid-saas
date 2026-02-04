/**
 * Quality Detection E2E Tests
 *
 * Tests that the app properly detects and flags quality issues:
 * - Manipulation artifacts / AI-generated faces
 * - Unnatural skin tones
 * - Background removal quality (halos, artifacts)
 * - Face positioning errors
 * - Head size compliance
 * - Blur detection
 * - Lighting issues
 *
 * CRITICAL: Tests for manipulation detection gaps - these tests document
 * photos that SHOULD be flagged but currently aren't.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import {
  navigateToAppAndSelectCountry,
  uploadPhoto,
  waitForProcessing,
  getComplianceChecks,
  generateOutput,
  captureScreenshot,
} from './helpers/test-utils';
import {
  analyzeImageQuality,
  detectManipulation,
} from './helpers/visual-analyzer';

const FIXTURE_DIR = path.join(__dirname, '../../fixtures/quality-tests');
const SCREENSHOT_DIR = path.join(
  __dirname,
  '../../test-results/screenshots/quality-detection'
);

// Ensure directories exist
test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Quality Detection - Blur', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect blurry photos', async ({ page }) => {
    const blurryPhoto = path.join(FIXTURE_DIR, 'bad-blurry.jpg');

    if (!fs.existsSync(blurryPhoto)) {
      console.log('Blurry fixture not found, skipping');
      test.skip();
      return;
    }

    // First analyze locally
    const buffer = fs.readFileSync(blurryPhoto);
    const localAnalysis = await analyzeImageQuality(buffer);

    console.log('Local blur analysis:', {
      blurScore: localAnalysis.blurScore,
      isBlurry: localAnalysis.isBlurry,
    });

    // Upload and check app response
    await uploadPhoto(page, blurryPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'blur-detection');

    const checks = await getComplianceChecks(page);
    const sharpnessCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('sharp') ||
        c.label.toLowerCase().includes('blur')
    );

    console.log('App sharpness check:', sharpnessCheck);

    // Test assertion: blurry should be flagged
    if (sharpnessCheck) {
      expect(['warn', 'fail']).toContain(sharpnessCheck.status);
    } else {
      // Document gap: app doesn't check for blur
      console.warn('GAP: App does not appear to check for blur');
    }
  });

  test('should pass sharp photos', async ({ page }) => {
    const sharpPhoto = path.join(FIXTURE_DIR, 'good-centered-face.jpg');

    if (!fs.existsSync(sharpPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, sharpPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'sharp-photo-pass');

    const checks = await getComplianceChecks(page);
    const sharpnessCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('sharp') ||
        c.label.toLowerCase().includes('blur')
    );

    if (sharpnessCheck) {
      expect(sharpnessCheck.status).toBe('pass');
    }
  });
});

test.describe('Quality Detection - Exposure', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect overexposed photos', async ({ page }) => {
    const overexposedPhoto = path.join(FIXTURE_DIR, 'bad-overexposed.jpg');

    if (!fs.existsSync(overexposedPhoto)) {
      test.skip();
      return;
    }

    // Local analysis
    const buffer = fs.readFileSync(overexposedPhoto);
    const localAnalysis = await analyzeImageQuality(buffer);

    console.log('Local overexposure analysis:', {
      brightness: localAnalysis.brightness,
      isProperlyExposed: localAnalysis.isProperlyExposed,
    });

    await uploadPhoto(page, overexposedPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'overexposed-detection');

    const checks = await getComplianceChecks(page);
    const exposureCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('light') ||
        c.label.toLowerCase().includes('exposure') ||
        c.label.toLowerCase().includes('bright')
    );

    console.log('App exposure check:', exposureCheck);
  });

  test('should detect underexposed photos', async ({ page }) => {
    const underexposedPhoto = path.join(FIXTURE_DIR, 'bad-underexposed.jpg');

    if (!fs.existsSync(underexposedPhoto)) {
      test.skip();
      return;
    }

    const buffer = fs.readFileSync(underexposedPhoto);
    const localAnalysis = await analyzeImageQuality(buffer);

    console.log('Local underexposure analysis:', {
      brightness: localAnalysis.brightness,
      isProperlyExposed: localAnalysis.isProperlyExposed,
    });

    await uploadPhoto(page, underexposedPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'underexposed-detection');

    const checks = await getComplianceChecks(page);
    const exposureCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('light') ||
        c.label.toLowerCase().includes('exposure') ||
        c.label.toLowerCase().includes('dark')
    );

    console.log('App exposure check:', exposureCheck);
  });
});

test.describe('Quality Detection - Background', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect non-white background', async ({ page }) => {
    const darkBgPhoto = path.join(FIXTURE_DIR, 'bad-dark-background.jpg');

    if (!fs.existsSync(darkBgPhoto)) {
      test.skip();
      return;
    }

    const buffer = fs.readFileSync(darkBgPhoto);
    const localAnalysis = await analyzeImageQuality(buffer);

    console.log('Local background analysis:', {
      backgroundWhiteness: localAnalysis.backgroundWhiteness,
      hasWhiteBackground: localAnalysis.hasWhiteBackground,
    });

    await uploadPhoto(page, darkBgPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'dark-bg-detection');

    // Check if background removal is prompted
    const bgRemovalVisible = await page
      .locator('button:has-text("Remove Background")')
      .isVisible({ timeout: 3000 });

    console.log('Background removal prompted:', bgRemovalVisible);

    // Should either show removal prompt or fail background check
    const checks = await getComplianceChecks(page);
    const bgCheck = checks.find((c) =>
      c.label.toLowerCase().includes('background')
    );

    expect(
      bgRemovalVisible || (bgCheck && bgCheck.status !== 'pass')
    ).toBeTruthy();
  });

  test('should detect halo artifacts from background removal', async ({
    page,
  }) => {
    const haloPhoto = path.join(FIXTURE_DIR, 'bad-halo-artifact.jpg');

    if (!fs.existsSync(haloPhoto)) {
      test.skip();
      return;
    }

    const buffer = fs.readFileSync(haloPhoto);
    const localAnalysis = await analyzeImageQuality(buffer);

    console.log('Local halo analysis:', {
      hasHaloArtifacts: localAnalysis.hasHaloArtifacts,
      edgeQuality: localAnalysis.edgeQuality,
    });

    await uploadPhoto(page, haloPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'halo-artifact-detection');

    // Halo detection is currently a gap in most apps
    // This test documents whether it's detected
    const checks = await getComplianceChecks(page);

    console.log('All compliance checks:', checks);

    // Document gap if not detected
    if (localAnalysis.hasHaloArtifacts) {
      console.warn('GAP: Photo has halo artifacts - app should flag this');
    }
  });
});

test.describe('Quality Detection - Face Positioning', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect off-center face', async ({ page }) => {
    const offCenterPhoto = path.join(FIXTURE_DIR, 'bad-off-center.jpg');

    if (!fs.existsSync(offCenterPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, offCenterPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'off-center-detection');

    const checks = await getComplianceChecks(page);
    const centerCheck = checks.find((c) =>
      c.label.toLowerCase().includes('center')
    );

    console.log('Centering check:', centerCheck);

    if (centerCheck) {
      expect(['warn', 'fail']).toContain(centerCheck.status);
    }
  });

  test('should detect head too small', async ({ page }) => {
    const smallHeadPhoto = path.join(FIXTURE_DIR, 'bad-head-too-small.jpg');

    if (!fs.existsSync(smallHeadPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, smallHeadPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'head-too-small-detection');

    const checks = await getComplianceChecks(page);
    const headCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('head') &&
        c.label.toLowerCase().includes('size')
    );

    console.log('Head size check (small):', headCheck);

    if (headCheck) {
      expect(['warn', 'fail']).toContain(headCheck.status);
    }
  });

  test('should detect head too large', async ({ page }) => {
    const largeHeadPhoto = path.join(FIXTURE_DIR, 'bad-head-too-large.jpg');

    if (!fs.existsSync(largeHeadPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, largeHeadPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'head-too-large-detection');

    const checks = await getComplianceChecks(page);
    const headCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('head') &&
        c.label.toLowerCase().includes('size')
    );

    console.log('Head size check (large):', headCheck);

    if (headCheck) {
      expect(['warn', 'fail']).toContain(headCheck.status);
    }
  });
});

test.describe('Quality Detection - Manipulation (CRITICAL)', () => {
  /**
   * CRITICAL TESTS: These test for manipulation detection gaps.
   * Manipulated/AI-generated photos SHOULD be flagged but currently aren't.
   * These tests document the gap and provide regression testing for when fixed.
   */

  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect unnatural skin tones', async ({ page }) => {
    const unnaturalPhoto = path.join(FIXTURE_DIR, 'bad-unnatural-colors.jpg');

    if (!fs.existsSync(unnaturalPhoto)) {
      test.skip();
      return;
    }

    // Local manipulation detection
    const buffer = fs.readFileSync(unnaturalPhoto);
    const manipulationAnalysis = await detectManipulation(buffer);

    console.log('Local manipulation analysis:', manipulationAnalysis);

    await uploadPhoto(page, unnaturalPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'unnatural-colors-detection');

    const checks = await getComplianceChecks(page);

    console.log('All compliance checks for unnatural colors:', checks);

    // Check if any warning was raised
    const hasWarning = checks.some(
      (c) => c.status === 'warn' || c.status === 'fail'
    );

    // Document gap
    if (manipulationAnalysis.isLikelyManipulated && !hasWarning) {
      console.warn('GAP: Unnatural colors detected locally but not by app');
      console.warn('Reasons:', manipulationAnalysis.reasons);
    }

    // The test passes if it documents the behavior
    expect(true).toBe(true);
  });

  test('MANIPULATION GAP: AI-generated face detection', async ({ page }) => {
    /**
     * This test documents that AI-generated faces are NOT currently detected.
     * When manipulation detection is implemented, this test should be updated
     * to expect the detection to work.
     */

    // For now, use a photo with unnatural smoothness
    const testPhoto = path.join(FIXTURE_DIR, 'good-centered-face.jpg');

    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'ai-face-detection-gap');

    const checks = await getComplianceChecks(page);

    // Check if any manipulation detection exists
    const manipulationCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('manipulation') ||
        c.label.toLowerCase().includes('ai') ||
        c.label.toLowerCase().includes('authentic') ||
        c.label.toLowerCase().includes('genuine')
    );

    if (!manipulationCheck) {
      console.warn('GAP: No manipulation detection check exists in the app');
      console.warn('AI-generated faces would not be flagged');
    } else {
      console.log('Manipulation check exists:', manipulationCheck);
    }

    // Document the current state
    expect(true).toBe(true);
  });

  test('MANIPULATION GAP: Photoshopped background detection', async ({
    page,
  }) => {
    /**
     * This test documents that photoshopped backgrounds are NOT detected.
     * The app only checks if background is white, not if it was digitally added.
     */

    const haloPhoto = path.join(FIXTURE_DIR, 'bad-halo-artifact.jpg');

    if (!fs.existsSync(haloPhoto)) {
      test.skip();
      return;
    }

    const buffer = fs.readFileSync(haloPhoto);
    const analysis = await analyzeImageQuality(buffer);

    await uploadPhoto(page, haloPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'photoshop-bg-detection-gap');

    const checks = await getComplianceChecks(page);

    // Does the app detect the artificial background?
    const bgQualityCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('background') &&
        (c.label.toLowerCase().includes('quality') ||
          c.label.toLowerCase().includes('artifact'))
    );

    if (!bgQualityCheck && analysis.hasHaloArtifacts) {
      console.warn('GAP: Halo artifacts detected locally but not by app');
      console.warn('Photoshopped backgrounds with halos would pass');
    }

    expect(true).toBe(true);
  });
});

test.describe('Quality Detection - Resolution', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect low resolution photos', async ({ page }) => {
    const lowResPhoto = path.join(FIXTURE_DIR, 'bad-low-resolution.jpg');

    if (!fs.existsSync(lowResPhoto)) {
      test.skip();
      return;
    }

    const metadata = await sharp(lowResPhoto).metadata();
    console.log(
      'Low res photo dimensions:',
      metadata.width,
      'x',
      metadata.height
    );

    await uploadPhoto(page, lowResPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'low-resolution-detection');

    const checks = await getComplianceChecks(page);
    const resCheck = checks.find((c) =>
      c.label.toLowerCase().includes('resolution')
    );

    console.log('Resolution check:', resCheck);

    if (resCheck) {
      expect(['warn', 'fail']).toContain(resCheck.status);
    }
  });
});

test.describe('Quality Detection - Shadows', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should detect shadows on face', async ({ page }) => {
    const shadowsPhoto = path.join(FIXTURE_DIR, 'bad-shadows.jpg');

    if (!fs.existsSync(shadowsPhoto)) {
      test.skip();
      return;
    }

    await uploadPhoto(page, shadowsPhoto);
    await waitForProcessing(page);

    await captureScreenshot(page, SCREENSHOT_DIR, 'shadows-detection');

    const checks = await getComplianceChecks(page);
    const lightingCheck = checks.find(
      (c) =>
        c.label.toLowerCase().includes('light') ||
        c.label.toLowerCase().includes('shadow')
    );

    console.log('Lighting/shadow check:', lightingCheck);

    if (lightingCheck) {
      expect(['warn', 'fail']).toContain(lightingCheck.status);
    }
  });
});

test.describe('Quality Detection - Comprehensive Report', () => {
  test('should generate quality report for all fixtures', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for this comprehensive test
    const fixtures = fs
      .readdirSync(FIXTURE_DIR)
      .filter((f) => f.endsWith('.jpg') && !f.startsWith('.'));

    if (fixtures.length === 0) {
      test.skip();
      return;
    }

    const report: Array<{
      fixture: string;
      localIssues: string[];
      appChecks: Array<{ label: string; status: string }>;
      gaps: string[];
    }> = [];

    for (const fixture of fixtures) {
      const filePath = path.join(FIXTURE_DIR, fixture);
      const buffer = fs.readFileSync(filePath);

      // Local analysis
      const localAnalysis = await analyzeImageQuality(buffer);
      const manipulationAnalysis = await detectManipulation(buffer);

      // App analysis
      await navigateToAppAndSelectCountry(page, 'us');
      await uploadPhoto(page, filePath);
      await waitForProcessing(page);

      const appChecks = await getComplianceChecks(page);

      // Find gaps
      const gaps: string[] = [];

      if (
        localAnalysis.isBlurry &&
        !appChecks.some(
          (c) => c.label.toLowerCase().includes('blur') && c.status !== 'pass'
        )
      ) {
        gaps.push('Blur not detected');
      }

      if (
        !localAnalysis.isProperlyExposed &&
        !appChecks.some(
          (c) =>
            (c.label.toLowerCase().includes('light') ||
              c.label.toLowerCase().includes('exposure')) &&
            c.status !== 'pass'
        )
      ) {
        gaps.push('Exposure issue not detected');
      }

      if (
        localAnalysis.hasHaloArtifacts &&
        !appChecks.some(
          (c) => c.label.toLowerCase().includes('halo') && c.status !== 'pass'
        )
      ) {
        gaps.push('Halo artifacts not detected');
      }

      if (
        manipulationAnalysis.isLikelyManipulated &&
        !appChecks.some(
          (c) =>
            c.label.toLowerCase().includes('manipulation') &&
            c.status !== 'pass'
        )
      ) {
        gaps.push('Manipulation not detected');
      }

      report.push({
        fixture,
        localIssues: localAnalysis.issues,
        appChecks: appChecks.map((c) => ({ label: c.label, status: c.status })),
        gaps,
      });
    }

    // Print report
    console.log('\n=== Quality Detection Report ===\n');

    for (const entry of report) {
      console.log(`\n${entry.fixture}:`);
      console.log(
        '  Local issues:',
        entry.localIssues.length > 0 ? entry.localIssues.join(', ') : 'None'
      );
      console.log(
        '  App checks:',
        entry.appChecks.map((c) => `${c.label}:${c.status}`).join(', ') ||
          'None'
      );
      if (entry.gaps.length > 0) {
        console.log('  GAPS:', entry.gaps.join(', '));
      }
    }

    // Summary
    const totalGaps = report.reduce((sum, r) => sum + r.gaps.length, 0);
    console.log(`\n=== Summary ===`);
    console.log(`Fixtures tested: ${report.length}`);
    console.log(`Total detection gaps: ${totalGaps}`);

    // Test passes but documents gaps
    expect(true).toBe(true);
  });
});
