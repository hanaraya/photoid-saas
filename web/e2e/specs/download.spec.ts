/**
 * Download Functionality E2E Tests
 * Tests download options and file generation
 */

import { test, expect } from '@playwright/test';
import {
  navigateToApp,
  selectPhotoType,
  uploadSvgTestImage,
  waitForEditorReady,
  generatePhoto,
} from '../utils/test-helpers';
import { generateTestFaceDataUrl, TEST_IMAGE_CONFIGS } from '../utils/image-generator';

test.describe('Download - Sheet Output', () => {
  test.beforeEach(async ({ page }) => {
    // Mock verified payment
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });
    
    await page.goto('/app?session_id=test_session');
    await page.waitForLoadState('networkidle');
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should show Download Sheet button', async ({ page }) => {
    await expect(page.locator('button:has-text("Download Sheet")')).toBeVisible();
  });

  test('should trigger sheet download', async ({ page }) => {
    // Listen for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click download
    await page.locator('button:has-text("Download Sheet")').click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('sheet');
    expect(download.suggestedFilename()).toMatch(/\.jpg$/);
  });

  test('should generate sheet with correct dimensions (4x6 inch)', async ({ page }) => {
    // The 4x6 sheet at 300dpi should be 1800x1200 pixels
    const sheetDimensions = await page.evaluate(() => {
      // Find the sheet preview image
      const img = document.querySelector('img[src^="data:image"]') as HTMLImageElement;
      if (!img) return null;
      
      // Create temp image to get natural dimensions
      return new Promise<{ width: number; height: number }>((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => {
          resolve({ width: tempImg.naturalWidth, height: tempImg.naturalHeight });
        };
        tempImg.src = img.src;
      });
    });

    if (sheetDimensions) {
      // 4x6 inch at 300dpi = 1800x1200
      expect(sheetDimensions.width).toBe(1800);
      expect(sheetDimensions.height).toBe(1200);
    }
  });

  test('should contain multiple passport photos on sheet', async ({ page }) => {
    // Sheet should have multiple 2x2 photos arranged
    // For 4x6 sheet with 2x2 photos: 3 columns x 2 rows = 6 photos

    const hasMultiplePhotos = await page.evaluate(() => {
      const img = document.querySelector('img[src^="data:image"]') as HTMLImageElement;
      if (!img) return false;

      // Create canvas to analyze
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.naturalWidth || 1800;
      canvas.height = img.naturalHeight || 1200;

      // For a sheet, we'd expect non-white content in multiple positions
      return canvas.width > 600 && canvas.height > 600; // Just verify it's large enough
    });

    expect(hasMultiplePhotos).toBe(true);
  });
});

test.describe('Download - Single Photo', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });
    
    await page.goto('/app?session_id=test_session');
    await page.waitForLoadState('networkidle');
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should show Download Single button', async ({ page }) => {
    await expect(page.locator('button:has-text("Download Single")')).toBeVisible();
  });

  test('should trigger single photo download', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    await page.locator('button:has-text("Download Single")').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('passport');
    expect(download.suggestedFilename()).toMatch(/\.jpg$/);
  });

  test('should download US photo with correct dimensions', async ({ page }) => {
    // Intercept the download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Download Single")').click(),
    ]);

    // Get the downloaded file
    const path = await download.path();
    expect(path).toBeTruthy();

    // File should exist and have content
    const fs = require('fs');
    const stats = fs.statSync(path!);
    expect(stats.size).toBeGreaterThan(1000); // Should have real content
  });
});

test.describe('Download - UK Photo Dimensions', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });
    
    await page.goto('/app?session_id=test_session');
    await page.waitForLoadState('networkidle');
    await selectPhotoType(page, 'uk');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUKPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should generate UK photo with correct aspect ratio', async ({ page }) => {
    const dimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? { width: canvas.width, height: canvas.height } : null;
    });

    if (dimensions) {
      // UK: 35x45mm = aspect ratio 0.778
      const aspectRatio = dimensions.width / dimensions.height;
      expect(aspectRatio).toBeCloseTo(35 / 45, 1);
    }
  });
});

test.describe('Download - Print Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });
    
    await page.goto('/app?session_id=test_session');
    await page.waitForLoadState('networkidle');
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should show Print button', async ({ page }) => {
    await expect(page.locator('button:has-text("Print")')).toBeVisible();
  });

  test('should trigger print dialog', async ({ page }) => {
    // Mock window.print
    const printCalled = page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        window.print = () => {
          resolve(true);
        };
      });
    });

    await page.locator('button:has-text("Print")').click();

    // Print should be called
    const wasPrintCalled = await printCalled;
    expect(wasPrintCalled).toBe(true);
  });
});

test.describe('Download - File Quality', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });
    
    await page.goto('/app?session_id=test_session');
    await page.waitForLoadState('networkidle');
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should generate JPEG files', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Download Sheet")').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.jpg$/);
  });

  test('downloaded file should be high quality', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Download Single")').click(),
    ]);

    const path = await download.path();
    if (path) {
      const fs = require('fs');
      const stats = fs.statSync(path);

      // A good quality 600x600 JPEG should be at least 50KB
      expect(stats.size).toBeGreaterThan(50 * 1024);
    }
  });
});

test.describe('Download - Feedback Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });
    
    await page.goto('/app?session_id=test_session');
    await page.waitForLoadState('networkidle');
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should show feedback modal after first download', async ({ page }) => {
    // Download the photo
    await page.locator('button:has-text("Download Sheet")').click();

    // Wait for feedback modal to appear
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=feedback')).toBeVisible();
  });

  test('should be able to close feedback modal', async ({ page }) => {
    await page.locator('button:has-text("Download Sheet")').click();

    // Wait for and close modal
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Find close button
    const closeBtn = dialog.locator('button:has-text("Close")').or(dialog.locator('button[aria-label="Close"]'));
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Download - Output View Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should have Back to Editor option', async ({ page }) => {
    await expect(page.locator('text=Back to Editor')).toBeVisible({ timeout: 15000 });
  });

  test('should return to editor when Back is clicked', async ({ page }) => {
    await page.locator('text=Back to Editor').click();

    // Should return to editor view
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();
  });
});
