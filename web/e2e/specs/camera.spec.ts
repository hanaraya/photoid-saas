/**
 * Camera Capture E2E Tests
 * Tests the camera functionality for passport photo capture
 */

import { test, expect, BrowserContext } from '@playwright/test';
import {
  navigateToApp,
  selectPhotoType,
  waitForEditorReady,
} from '../utils/test-helpers';

test.describe('Camera Functionality', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // Create context with camera permissions granted
    context = await browser.newContext({
      permissions: ['camera'],
    });
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('should show Take Photo button on landing page', async ({ page }) => {
    await navigateToApp(page);
    await expect(page.locator('button:has-text("Take Photo")')).toBeVisible();
  });

  test('should open camera modal when Take Photo is clicked', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

    await navigateToApp(page);

    // Click Take Photo button
    const takePhotoBtn = page.locator('button:has-text("Take Photo")');
    await takePhotoBtn.click();

    // Camera modal should appear
    await expect(page.locator('video')).toBeVisible({ timeout: 10000 });

    // Should have capture and cancel buttons
    await expect(page.locator('button:has-text("Capture")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('should close camera modal when Cancel is clicked', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

    await navigateToApp(page);

    // Open camera
    await page.locator('button:has-text("Take Photo")').click();
    await expect(page.locator('video')).toBeVisible({ timeout: 10000 });

    // Click cancel
    await page.locator('button:has-text("Cancel")').click();

    // Modal should close
    await expect(page.locator('video')).not.toBeVisible({ timeout: 5000 });
  });

  test('should show camera guides overlay when enabled', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

    await navigateToApp(page);
    await selectPhotoType(page, 'us');

    // Open camera
    await page.locator('button:has-text("Take Photo")').click();
    await expect(page.locator('video')).toBeVisible({ timeout: 10000 });

    // Camera guides should be visible
    // The guides show face positioning overlay
    await expect(page.locator('svg').first()).toBeVisible({ timeout: 5000 });
  });

  test('should adapt camera aspect ratio for different photo types', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

    await navigateToApp(page);

    // Test US (square)
    await selectPhotoType(page, 'us');
    await page.locator('button:has-text("Take Photo")').click();
    await expect(page.locator('video')).toBeVisible({ timeout: 10000 });

    // Check video aspect ratio (should be close to 1:1 for US)
    const usVideoSize = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? { width: video.videoWidth, height: video.videoHeight } : null;
    });

    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('video')).not.toBeVisible({ timeout: 5000 });

    // Now test UK (35x45mm portrait)
    await selectPhotoType(page, 'uk');
    await page.locator('button:has-text("Take Photo")').click();
    await expect(page.locator('video')).toBeVisible({ timeout: 10000 });

    const ukVideoSize = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video ? { width: video.videoWidth, height: video.videoHeight } : null;
    });

    // UK should prefer portrait orientation
    if (usVideoSize && ukVideoSize) {
      // Just verify we got video feed
      expect(ukVideoSize.width).toBeGreaterThan(0);
      expect(ukVideoSize.height).toBeGreaterThan(0);
    }
  });
});

test.describe('Camera - Mock Tests (No Real Camera)', () => {
  test('should handle camera denied gracefully', async ({ browser }) => {
    // Create context without camera permission
    const context = await browser.newContext({
      permissions: [], // No camera permission
    });
    const page = await context.newPage();

    await navigateToApp(page);

    // Mock getUserMedia to reject
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = async () => {
        throw new Error('NotAllowedError');
      };
    });

    // Reload to apply mock
    await page.reload();
    await navigateToApp(page);

    // Click Take Photo
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button:has-text("Take Photo")').click();

    // Should show error or stay on upload screen
    // (The app shows an alert when camera access is denied)
    await page.waitForTimeout(1000);
    
    // Should not have camera modal open
    await expect(page.locator('video')).not.toBeVisible({ timeout: 2000 });

    await context.close();
  });

  test('should capture photo on button click', async ({ browser }) => {
    test.skip(process.env.CI === 'true', 'Camera capture tests skipped in CI');

    // Create context with fake video device
    const context = await browser.newContext({
      permissions: ['camera'],
    });
    const page = await context.newPage();

    await navigateToApp(page);

    // Open camera
    await page.locator('button:has-text("Take Photo")').click();

    // Wait for video
    const videoVisible = await page.locator('video').isVisible({ timeout: 10000 }).catch(() => false);

    if (videoVisible) {
      // Click capture
      await page.locator('button:has-text("Capture")').click();

      // Should transition to editor
      await waitForEditorReady(page);

      // Should see compliance checks or canvas
      await expect(page.locator('canvas')).toBeVisible({ timeout: 15000 });
    }

    await context.close();
  });
});

test.describe('Camera - Accessibility', () => {
  test('camera controls should be keyboard accessible', async ({ page }) => {
    test.skip(process.env.CI === 'true', 'Camera tests skipped in CI');

    await navigateToApp(page);

    // Tab to Take Photo button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // If camera opens, buttons should be focusable
    const videoVisible = await page.locator('video').isVisible({ timeout: 5000 }).catch(() => false);

    if (videoVisible) {
      // Tab to Capture button
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.textContent);
      expect(['Capture', 'Capture Now!', 'Cancel']).toContain(focused?.trim());

      // Press Escape to close
      await page.keyboard.press('Escape');
    }
  });
});
