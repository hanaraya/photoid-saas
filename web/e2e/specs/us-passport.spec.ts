/**
 * E2E Tests for US Passport Photo Flow
 * Tests the complete upload → edit → generate flow for US 2x2 inch passport photos
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
import { US_PASSPORT_SPEC } from '../utils/test-constants';

test.describe('US Passport Photo - Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should show correct US passport specs on landing page', async ({ page }) => {
    await expect(page.locator('text=2×2 inches')).toBeVisible();
    await expect(page.locator('text=white background')).toBeVisible();
  });

  test('should upload a good photo and detect face', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    // Verify face was detected
    await expect(page.locator('text=Face detected')).toBeVisible({ timeout: 30000 });
  });

  test('should show compliance checks after upload', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    expect(checks.length).toBeGreaterThan(0);

    // Should have these check types
    const checkLabels = checks.map(c => c.label.toLowerCase());
    expect(checkLabels.some(l => l.includes('face'))).toBe(true);
    expect(checkLabels.some(l => l.includes('resolution'))).toBe(true);
  });

  test('should show glasses policy reminder for US photos', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    // US photos should show glasses policy reminder
    await expect(page.locator('text=Glasses Policy')).toBeVisible();
    await expect(page.locator('text=no glasses')).toBeVisible();
  });

  test('should detect colored background and recommend removal', async ({ page }) => {
    const coloredBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.coloredBackground);
    await uploadSvgTestImage(page, coloredBgPhoto);
    await waitForEditorReady(page);

    // Should show background removal prompt
    await expect(page.locator('text=Background needs to be white')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('button:has-text("Remove Background")')).toBeVisible();
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

  test('should allow generating photo after all checks pass', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    // Generate the photo
    await generatePhoto(page);

    // Should show output options
    await expect(page.locator('text=Download')).toBeVisible({ timeout: 15000 });
  });

  test('should go back to upload screen', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    await goBack(page);

    // Should be back on upload screen
    await expect(page.locator('text=Drop your photo here')).toBeVisible();
  });
});

test.describe('US Passport Photo - Face Detection', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should handle photo with no face', async ({ page }) => {
    const noFacePhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.noFace);
    await uploadSvgTestImage(page, noFacePhoto);
    await waitForEditorReady(page);

    // Should show no face detected warning
    await expect(page.locator('text=No face detected')).toBeVisible({ timeout: 30000 });

    // Should still have fallback crop
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('should detect tilted face and show warning', async ({ page }) => {
    const tiltedPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.tiltedFace);
    await uploadSvgTestImage(page, tiltedPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const tiltCheck = checks.find(c => 
      c.label.toLowerCase().includes('angle') || 
      c.label.toLowerCase().includes('tilt')
    );

    // Should have warning about tilt
    expect(tiltCheck?.status).toBe('warn');
  });
});

test.describe('US Passport Photo - Head Size Validation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass head size check for correct proportions', async ({ page }) => {
    // US spec: head should be 50-69% of frame height (1" to 1 3/8" in 2" frame)
    const goodPhoto = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      faceSize: 0.55, // 55% - within range
    });
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('pass');
  });

  test('should warn when head is too small', async ({ page }) => {
    const smallHeadPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.headTooSmall);
    await uploadSvgTestImage(page, smallHeadPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('warn');
    expect(headCheck?.message?.toLowerCase()).toContain('small');
  });

  test('should warn when head is too large', async ({ page }) => {
    const largeHeadPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.headTooLarge);
    await uploadSvgTestImage(page, largeHeadPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('warn');
    expect(headCheck?.message?.toLowerCase()).toContain('large');
  });
});

test.describe('US Passport Photo - Centering', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass centering check for centered face', async ({ page }) => {
    const centeredPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, centeredPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const centerCheck = checks.find(c => c.label.toLowerCase().includes('center'));

    expect(centerCheck?.status).toBe('pass');
  });

  test('should fail centering check for off-center face', async ({ page }) => {
    const offCenterPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.offCenter);
    await uploadSvgTestImage(page, offCenterPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const centerCheck = checks.find(c => c.label.toLowerCase().includes('center'));

    // Off-center should be warn or fail
    expect(['warn', 'fail']).toContain(centerCheck?.status);
  });
});

test.describe('US Passport Photo - Resolution', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass resolution check for high-res image', async ({ page }) => {
    const hiResPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, hiResPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const resCheck = checks.find(c => c.label.toLowerCase().includes('resolution'));

    expect(resCheck?.status).toBe('pass');
  });

  test('should fail resolution check for low-res image', async ({ page }) => {
    const lowResPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.lowResolution);
    await uploadSvgTestImage(page, lowResPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const resCheck = checks.find(c => c.label.toLowerCase().includes('resolution'));

    // Low res should be warn or fail
    expect(['warn', 'fail']).toContain(resCheck?.status);
  });
});

test.describe('US Passport Photo - Image Quality', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should detect blurry images', async ({ page }) => {
    const blurryPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.blurryPhoto);
    await uploadSvgTestImage(page, blurryPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const sharpnessCheck = checks.find(c => c.label.toLowerCase().includes('sharp'));

    // Blurry should be flagged
    expect(['warn', 'fail']).toContain(sharpnessCheck?.status);
  });

  test('should detect grayscale images', async ({ page }) => {
    const grayscalePhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.grayscale);
    await uploadSvgTestImage(page, grayscalePhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const colorCheck = checks.find(c => c.label.toLowerCase().includes('color'));

    // Grayscale should fail
    expect(colorCheck?.status).toBe('fail');
  });

  test('should detect uneven lighting', async ({ page }) => {
    const unevenLightPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.unevenLighting);
    await uploadSvgTestImage(page, unevenLightPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const lightCheck = checks.find(c => c.label.toLowerCase().includes('light'));

    // Uneven lighting should be warned
    expect(['warn', 'fail']).toContain(lightCheck?.status);
  });
});

test.describe('US Passport Photo - Output Verification', () => {
  test('should generate photo with correct dimensions', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');

    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    // Check canvas dimensions (should be 600x600 for US at 300dpi)
    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });

    // US passport: 2x2 inches at 300dpi = 600x600
    expect(dimensions).toBeTruthy();
    expect(dimensions!.width).toBe(600);
    expect(dimensions!.height).toBe(600);
  });

  test('should pass visual quality checks on output', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');

    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    // Wait for output to render
    await page.waitForTimeout(1000);

    const quality = await meetsQualityStandards(page);
    expect(quality.passes).toBe(true);
  });
});
