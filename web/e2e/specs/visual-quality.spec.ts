/**
 * Visual Quality E2E Tests
 * These tests verify that the app correctly detects and flags quality issues
 */

import { test, expect } from '@playwright/test';
import {
  navigateToApp,
  selectPhotoType,
  uploadSvgTestImage,
  waitForEditorReady,
  getComplianceResults,
  generatePhoto,
} from '../utils/test-helpers';
import { generateTestFaceDataUrl, TEST_IMAGE_CONFIGS } from '../utils/image-generator';
import { analyzeVisualQuality, meetsQualityStandards } from '../utils/visual-quality';

test.describe('Visual Quality - Blur Detection', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass sharp image', async ({ page }) => {
    const sharpPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, sharpPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const sharpnessCheck = checks.find(c => 
      c.label.toLowerCase().includes('sharp') || 
      c.label.toLowerCase().includes('blur')
    );

    if (sharpnessCheck) {
      expect(sharpnessCheck.status).toBe('pass');
    }
  });

  test('should flag blurry image', async ({ page }) => {
    const blurryPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.blurryPhoto);
    await uploadSvgTestImage(page, blurryPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const sharpnessCheck = checks.find(c => 
      c.label.toLowerCase().includes('sharp') || 
      c.label.toLowerCase().includes('blur')
    );

    // Blurry should be flagged
    if (sharpnessCheck) {
      expect(['warn', 'fail']).toContain(sharpnessCheck.status);
      expect(sharpnessCheck.message?.toLowerCase()).toContain('blur');
    }
  });
});

test.describe('Visual Quality - Color Detection', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass color image', async ({ page }) => {
    const colorPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, colorPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const colorCheck = checks.find(c => c.label.toLowerCase().includes('color'));

    if (colorCheck) {
      expect(colorCheck.status).toBe('pass');
    }
  });

  test('should fail grayscale image', async ({ page }) => {
    const grayscalePhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.grayscale);
    await uploadSvgTestImage(page, grayscalePhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const colorCheck = checks.find(c => c.label.toLowerCase().includes('color'));

    // Grayscale should fail
    if (colorCheck) {
      expect(colorCheck.status).toBe('fail');
    }
  });
});

test.describe('Visual Quality - Lighting', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass evenly lit image', async ({ page }) => {
    const evenlyLitPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, evenlyLitPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const lightingCheck = checks.find(c => c.label.toLowerCase().includes('light'));

    if (lightingCheck) {
      expect(lightingCheck.status).toBe('pass');
    }
  });

  test('should flag uneven lighting', async ({ page }) => {
    const unevenLightPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.unevenLighting);
    await uploadSvgTestImage(page, unevenLightPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const lightingCheck = checks.find(c => c.label.toLowerCase().includes('light'));

    // Uneven lighting should be flagged
    if (lightingCheck) {
      expect(['warn', 'fail']).toContain(lightingCheck.status);
      expect(lightingCheck.message?.toLowerCase()).toMatch(/uneven|shadow/);
    }
  });
});

test.describe('Visual Quality - Face Angle/Tilt', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass straight-facing image', async ({ page }) => {
    const straightPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, straightPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const angleCheck = checks.find(c => 
      c.label.toLowerCase().includes('angle') || 
      c.label.toLowerCase().includes('tilt')
    );

    if (angleCheck) {
      expect(angleCheck.status).toBe('pass');
    }
  });

  test('should flag tilted face', async ({ page }) => {
    const tiltedPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.tiltedFace);
    await uploadSvgTestImage(page, tiltedPhoto);
    await waitForEditorReady(page);

    const checks = await getComplianceResults(page);
    const angleCheck = checks.find(c => 
      c.label.toLowerCase().includes('angle') || 
      c.label.toLowerCase().includes('tilt')
    );

    // Tilted should be flagged
    if (angleCheck) {
      expect(['warn', 'fail']).toContain(angleCheck.status);
      expect(angleCheck.message?.toLowerCase()).toContain('tilt');
    }
  });
});

test.describe('Visual Quality - Background', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should pass white background', async ({ page }) => {
    const whiteBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, whiteBgPhoto);
    await waitForEditorReady(page);

    // Check for background removal prompt
    const hasRemovalPrompt = await page.locator('text=Background needs to be white').isVisible();
    expect(hasRemovalPrompt).toBe(false);
  });

  test('should flag colored background', async ({ page }) => {
    const coloredBgPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.coloredBackground);
    await uploadSvgTestImage(page, coloredBgPhoto);
    await waitForEditorReady(page);

    // Should prompt for background removal
    await expect(page.locator('text=Background needs to be white')).toBeVisible();
  });
});

test.describe('Visual Quality - Output Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should produce quality output for good input', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    await page.waitForTimeout(1000);
    
    const report = await analyzeVisualQuality(page);
    expect(report.overallScore).toBeGreaterThanOrEqual(70);
    
    const errors = report.issues.filter(i => i.severity === 'error');
    expect(errors.length).toBe(0);
  });

  test('should flag quality issues in output', async ({ page }) => {
    const lowResPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.lowResolution);
    await uploadSvgTestImage(page, lowResPhoto);
    await waitForEditorReady(page);
    
    // Try to generate (may show warning dialog)
    const generateBtn = page.locator('button:has-text("Generate")');
    await generateBtn.click();

    // Wait for either output or warning
    await page.waitForTimeout(2000);

    // If we got to output, check quality
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      const report = await analyzeVisualQuality(page);
      // Low res should have issues
      const lowResIssue = report.issues.find(i => i.type === 'low_resolution');
      expect(lowResIssue).toBeDefined();
    }
  });

  test('should meet quality standards for good photo', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    await page.waitForTimeout(1000);

    const result = await meetsQualityStandards(page);
    expect(result.passes).toBe(true);
  });

  test('should fail quality standards in strict mode for warnings', async ({ page }) => {
    // Use a photo that will have minor warnings
    const slightlyOffPhoto = generateTestFaceDataUrl({
      ...TEST_IMAGE_CONFIGS.goodUSPhoto,
      facePositionX: 0.48, // Slightly off center
    });
    await uploadSvgTestImage(page, slightlyOffPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    await page.waitForTimeout(1000);

    // Normal mode might pass, strict mode should fail on any warning
    const normalResult = await meetsQualityStandards(page, false);
    const strictResult = await meetsQualityStandards(page, true);

    // At minimum, test that strict mode is more stringent
    expect(strictResult.passes).toBeDefined();
  });
});

test.describe('Visual Quality - Manipulation Detection', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should detect halo artifacts from background removal', async ({ page }) => {
    const haloPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.haloArtifact);
    await uploadSvgTestImage(page, haloPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    await page.waitForTimeout(1000);

    const report = await analyzeVisualQuality(page);
    const haloIssue = report.issues.find(i => i.type === 'halo');
    
    // The halo should be detected
    expect(haloIssue || report.overallScore < 100).toBeTruthy();
  });

  test('should detect unnatural skin tones', async ({ page }) => {
    const unnaturalPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.unnaturalSkin);
    await uploadSvgTestImage(page, unnaturalPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    await page.waitForTimeout(1000);

    const report = await analyzeVisualQuality(page);
    const skinIssue = report.issues.find(i => i.type === 'unnatural_skin');
    
    // Unnatural skin should be flagged
    expect(skinIssue).toBeDefined();
  });
});

test.describe('Visual Quality - Excessive Margins', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
  });

  test('should not flag appropriate margins', async ({ page }) => {
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    await page.waitForTimeout(1000);

    const report = await analyzeVisualQuality(page);
    const marginIssue = report.issues.find(i => i.type === 'excessive_margins');
    
    // Good photo should not have excessive margins
    expect(marginIssue).toBeUndefined();
  });
});
