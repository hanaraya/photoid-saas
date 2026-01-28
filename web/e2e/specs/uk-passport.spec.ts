/**
 * E2E Tests for UK Passport Photo Flow
 * Tests the complete upload → edit → generate flow for UK 35x45mm passport photos
 */

import { test, expect } from '@playwright/test';
import {
  navigateToApp,
  selectPhotoType,
  uploadSvgTestImage,
  waitForEditorReady,
  getComplianceResults,
  allCompliancePassed,
  hasComplianceFailure,
  removeBackground,
  generatePhoto,
  goBack,
} from '../utils/test-helpers';
import { generateTestFaceDataUrl, TEST_IMAGE_CONFIGS } from '../utils/image-generator';
import { analyzeVisualQuality, meetsQualityStandards } from '../utils/visual-quality';
import { UK_PASSPORT_SPEC } from '../utils/test-constants';

test.describe('UK Passport Photo - Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'uk');
  });

  test('should show correct UK passport specs on landing page', async ({ page }) => {
    await expect(page.locator('text=35×45 mm')).toBeVisible();
    await expect(page.locator('text=UK Passport')).toBeVisible();
  });

  test('should upload a good UK photo and detect face', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    // Verify face was detected
    await expect(page.locator('text=Face detected')).toBeVisible({ timeout: 30000 });
  });

  test('should show compliance checks after upload', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    expect(checks.length).toBeGreaterThan(0);

    // Should have these check types
    const checkLabels = checks.map(c => c.label.toLowerCase());
    expect(checkLabels.some(l => l.includes('face'))).toBe(true);
    expect(checkLabels.some(l => l.includes('resolution'))).toBe(true);
  });

  test('should NOT show glasses policy for UK photos', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    // UK photos don't have the same strict glasses policy
    // The glasses reminder is US-specific
    const checks = await getComplianceResults(page);
    const glassesCheck = checks.find(c => 
      c.label.toLowerCase().includes('glasses') && 
      c.message?.toLowerCase().includes('2016')
    );

    // Should not have the US-specific glasses reminder
    expect(glassesCheck).toBeUndefined();
  });

  test('should detect colored background and recommend removal', async ({ page }) => {
    const coloredBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.coloredBackground);
    await uploadSvgTestImage(page, coloredBgPhoto);
    await waitForEditorReady(page);

    // Should show background removal prompt
    await expect(page.locator('text=Background needs to be white')).toBeVisible({ timeout: 30000 });
  });

  test('should handle background removal', async ({ page }) => {
    test.slow(); // Background removal can be slow

    const coloredBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.coloredBackground);
    await uploadSvgTestImage(page, coloredBgPhoto);
    await waitForEditorReady(page);

    // Click remove background
    await removeBackground(page);

    // Should show success
    await expect(page.locator('text=Background removed')).toBeVisible({ timeout: 60000 });
  });
});

test.describe('UK Passport Photo - Head Size Validation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'uk');
  });

  test('should pass head size check for correct UK proportions', async ({ page }) => {
    // UK spec: head should be 29-34mm in 45mm frame (64-76%)
    const goodPhoto = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUKPhoto,
      faceSize: 0.70, // 70% - within UK range
    });
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('pass');
  });

  test('should warn when head is too small for UK', async ({ page }) => {
    // UK requires larger head ratio than US
    const smallHeadPhoto = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.headTooSmall,
      faceSize: 0.50, // 50% - too small for UK (needs 64%+)
    });
    await uploadSvgTestImage(page, smallHeadPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('warn');
  });

  test('should warn when head is too large for UK', async ({ page }) => {
    const largeHeadPhoto = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.headTooLarge,
      faceSize: 0.85, // 85% - too large for UK (needs <76%)
    });
    await uploadSvgTestImage(page, largeHeadPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('warn');
  });
});

test.describe('UK Passport Photo - Framing', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'uk');
  });

  test('should pass framing check when full head is visible', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const framingCheck = checks.find(c => c.label.toLowerCase().includes('framing'));

    expect(framingCheck?.status).toBe('pass');
  });

  test('should fail framing check when head is cropped', async ({ page }) => {
    const croppedPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.headCropped);
    await uploadSvgTestImage(page, croppedPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const framingCheck = checks.find(c => c.label.toLowerCase().includes('framing'));

    // Cropped head should fail
    expect(['warn', 'fail']).toContain(framingCheck?.status);
  });
});

test.describe('UK Passport Photo - Output Verification', () => {
  test('should generate photo with correct UK dimensions', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'uk');

    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    // Check canvas dimensions (should be ~413x531 for UK at 300dpi)
    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });

    // UK passport: 35x45mm at 300dpi = 413x531
    expect(dimensions).toBeTruthy();
    expect(dimensions!.width).toBeCloseTo(413, -1); // Allow some rounding
    expect(dimensions!.height).toBeCloseTo(531, -1);
  });

  test('should pass visual quality checks on output', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'uk');

    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    // Wait for output to render
    await page.waitForTimeout(1000);

    const quality = await meetsQualityStandards(page);
    expect(quality.passes).toBe(true);
  });

  test('should have correct aspect ratio for UK output', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'uk');

    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });

    // UK aspect ratio: 35/45 = 0.778
    const aspectRatio = dimensions!.width / dimensions!.height;
    expect(aspectRatio).toBeCloseTo(35 / 45, 1);
  });
});

test.describe('UK vs US Passport Photo - Comparison', () => {
  test('should produce different dimensions for UK vs US', async ({ page }) => {
    await navigateToApp(page);

    // First, get US dimensions
    await selectPhotoType(page, 'us');
    const usPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, usPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    const usDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });

    // Go back and switch to UK
    await goBack(page);
    await selectPhotoType(page, 'uk');
    const ukPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, ukPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    const ukDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });

    // Dimensions should be different
    expect(usDimensions!.width).not.toBe(ukDimensions!.width);
    expect(usDimensions!.height).not.toBe(ukDimensions!.height);

    // US is square, UK is portrait
    expect(usDimensions!.width).toBe(usDimensions!.height); // US is square
    expect(ukDimensions!.width).toBeLessThan(ukDimensions!.height); // UK is portrait
  });

  test('should have different head size requirements for UK vs US', async ({ page }) => {
    await navigateToApp(page);

    // Photo with 55% head size - good for US, small for UK
    const photo55 = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      faceSize: 0.55,
    });

    // Test with US
    await selectPhotoType(page, 'us');
    await uploadSvgTestImage(page, photo55);
    await waitForEditorReady(page);

    let checks = await getComplianceResults(page);
    let headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));
    expect(headCheck?.status).toBe('pass'); // 55% is good for US

    // Go back and test same proportions with UK
    await goBack(page);
    await selectPhotoType(page, 'uk');
    await uploadSvgTestImage(page, photo55);
    await waitForEditorReady(page);

    checks = await getComplianceResults(page);
    headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));
    expect(headCheck?.status).toBe('warn'); // 55% is too small for UK (needs 64%+)
  });
});
