/**
 * Compliance Verification E2E Tests
 * Tests that compliance checks correctly enforce passport photo standards
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
  generatePhoto,
  removeBackground,
} from '../utils/test-helpers';
import { generateTestFaceDataUrl, TEST_IMAGE_CONFIGS } from '../utils/image-generator';
import { US_PASSPORT_SPEC, UK_PASSPORT_SPEC } from '../utils/test-constants';

test.describe('Compliance - Face Detection', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass when face is detected', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const faceCheck = checks.find(c => c.label.toLowerCase().includes('face detection'));

    expect(faceCheck?.status).toBe('pass');
    expect(faceCheck?.message?.toLowerCase()).toContain('detected');
  });

  test('should fail when no face is detected', async ({ page }) => {
    const noFacePhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.noFace);
    await uploadSvgTestImage(page, noFacePhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const faceCheck = checks.find(c => c.label.toLowerCase().includes('face'));

    expect(faceCheck?.status).toBe('fail');
    expect(faceCheck?.message?.toLowerCase()).toContain('no face');
  });
});

test.describe('Compliance - Head Size (US)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass head size at 50% (minimum US)', async ({ page }) => {
    const photo = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      faceSize: 0.50, // 50% is minimum for US
    });
    await uploadSvgTestImage(page, photo);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('pass');
  });

  test('should pass head size at 69% (maximum US)', async ({ page }) => {
    const photo = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      faceSize: 0.69, // 69% is maximum for US
    });
    await uploadSvgTestImage(page, photo);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('pass');
  });

  test('should warn head size at 45% (too small for US)', async ({ page }) => {
    const photo = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      faceSize: 0.45, // Too small
    });
    await uploadSvgTestImage(page, photo);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('warn');
    expect(headCheck?.message?.toLowerCase()).toContain('small');
  });

  test('should warn head size at 75% (too large for US)', async ({ page }) => {
    const photo = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      faceSize: 0.75, // Too large
    });
    await uploadSvgTestImage(page, photo);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('warn');
    expect(headCheck?.message?.toLowerCase()).toContain('large');
  });
});

test.describe('Compliance - Head Size (UK)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'uk');
  });

  test('should pass head size at 70% (within UK range)', async ({ page }) => {
    const photo = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUKPhoto,
      faceSize: 0.70, // 70% is good for UK (64-76%)
    });
    await uploadSvgTestImage(page, photo);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('pass');
  });

  test('should warn head size at 55% (too small for UK)', async ({ page }) => {
    const photo = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUKPhoto,
      faceSize: 0.55, // Too small for UK (needs 64%+)
    });
    await uploadSvgTestImage(page, photo);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const headCheck = checks.find(c => c.label.toLowerCase().includes('head size'));

    expect(headCheck?.status).toBe('warn');
  });
});

test.describe('Compliance - Eye Position', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass when eyes are correctly positioned', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const eyeCheck = checks.find(c => c.label.toLowerCase().includes('eye'));

    if (eyeCheck) {
      expect(eyeCheck.status).toBe('pass');
    }
  });

  test('should warn when eyes cannot be verified', async ({ page }) => {
    // Photo with closed eyes - harder to detect eye position
    const closedEyesPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.eyesClosed);
    await uploadSvgTestImage(page, closedEyesPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const eyeCheck = checks.find(c => c.label.toLowerCase().includes('eye'));

    if (eyeCheck) {
      // Should either pass or warn, not fail outright
      expect(['pass', 'warn']).toContain(eyeCheck.status);
    }
  });
});

test.describe('Compliance - Head Centering', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass centered head', async ({ page }) => {
    const centeredPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, centeredPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const centerCheck = checks.find(c => c.label.toLowerCase().includes('center'));

    expect(centerCheck?.status).toBe('pass');
  });

  test('should warn slightly off-center head', async ({ page }) => {
    const slightlyOffPhoto = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      facePositionX: 0.43, // ~7% off center
    });
    await uploadSvgTestImage(page, slightlyOffPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const centerCheck = checks.find(c => c.label.toLowerCase().includes('center'));

    expect(['warn', 'fail']).toContain(centerCheck?.status);
  });

  test('should fail significantly off-center head', async ({ page }) => {
    const offCenterPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.offCenter);
    await uploadSvgTestImage(page, offCenterPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const centerCheck = checks.find(c => c.label.toLowerCase().includes('center'));

    expect(['warn', 'fail']).toContain(centerCheck?.status);
  });
});

test.describe('Compliance - Head Framing', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass full head visible', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const framingCheck = checks.find(c => c.label.toLowerCase().includes('framing'));

    expect(framingCheck?.status).toBe('pass');
    expect(framingCheck?.message?.toLowerCase()).toContain('visible');
  });

  test('should fail when crown is cropped', async ({ page }) => {
    const croppedPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.headCropped);
    await uploadSvgTestImage(page, croppedPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const framingCheck = checks.find(c => c.label.toLowerCase().includes('framing'));

    expect(['warn', 'fail']).toContain(framingCheck?.status);
  });
});

test.describe('Compliance - Background', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass white background', async ({ page }) => {
    const whiteBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, whiteBgPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const bgCheck = checks.find(c => c.label.toLowerCase().includes('background'));

    // With white background, should pass
    expect(bgCheck?.status).toBe('pass');
  });

  test('should warn non-white background', async ({ page }) => {
    const coloredBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.coloredBackground);
    await uploadSvgTestImage(page, coloredBgPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const bgCheck = checks.find(c => c.label.toLowerCase().includes('background'));

    // Non-white background should warn
    expect(bgCheck?.status).toBe('warn');
  });

  test('should pass after background removal', async ({ page }) => {
    test.slow();

    const coloredBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.coloredBackground);
    await uploadSvgTestImage(page, coloredBgPhoto);
    await waitForEditorReady(page);

    // Remove background
    await removeBackground(page);

    const checks = await getComplianceResults(page);
    const bgCheck = checks.find(c => c.label.toLowerCase().includes('background'));

    // After removal, should pass
    expect(bgCheck?.status).toBe('pass');
  });
});

test.describe('Compliance - Resolution', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass high resolution image', async ({ page }) => {
    const hiResPhoto = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      width: 1200,
      height: 1200,
    });
    await uploadSvgTestImage(page, hiResPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const resCheck = checks.find(c => c.label.toLowerCase().includes('resolution'));

    expect(resCheck?.status).toBe('pass');
  });

  test('should warn low resolution image', async ({ page }) => {
    const lowResPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.lowResolution);
    await uploadSvgTestImage(page, lowResPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const resCheck = checks.find(c => c.label.toLowerCase().includes('resolution'));

    expect(['warn', 'fail']).toContain(resCheck?.status);
    expect(resCheck?.message?.toLowerCase()).toMatch(/low|quality/);
  });
});

test.describe('Compliance - Overall Workflow', () => {
  test('should block generation when critical checks fail', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');

    // Use photo with multiple issues
    const badPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.noFace);
    await uploadSvgTestImage(page, badPhoto);
    await waitForEditorReady(page);

    // Try to generate
    const generateBtn = page.locator('button:has-text("Generate")');
    await generateBtn.click();

    // Should show warning dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Please fix these issues')).toBeVisible();
  });

  test('should allow generation when all checks pass', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');

    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);

    // Verify all checks pass
    const allPass = await allCompliancePassed(page);
    expect(allPass).toBe(true);

    // Generate should work
    await generatePhoto(page);

    // Should see download options
    await expect(page.locator('text=Download')).toBeVisible({ timeout: 15000 });
  });

  test('should allow generation with warnings after confirmation', async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');

    // Photo with minor warnings (e.g., tilted slightly)
    const warnPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.tiltedFace);
    await uploadSvgTestImage(page, warnPhoto);
    await waitForEditorReady(page);

    // Try to generate
    const generateBtn = page.locator('button:has-text("Generate")');
    await generateBtn.click();

    // May show warning dialog
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible({ timeout: 3000 })) {
      // Click "Continue anyway"
      const continueBtn = page.locator('button:has-text("Continue anyway")');
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
      }
    }

    // Should eventually see output
    await expect(page.locator('text=Download')).toBeVisible({ timeout: 15000 });
  });
});
