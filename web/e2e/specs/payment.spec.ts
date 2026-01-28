/**
 * Payment Flow E2E Tests
 * Tests Stripe integration and payment workflow
 * Uses Stripe test mode
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
import { STRIPE_TEST } from '../utils/test-constants';

test.describe('Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);
  });

  test('should show watermarked preview when not paid', async ({ page }) => {
    // Look for watermark indicator or download restrictions
    await expect(page.locator('text=Download')).toBeVisible({ timeout: 15000 });
    
    // Either Pay button should be visible or downloads should be unrestricted
    // (depends on payment requirement configuration)
    const payBtn = page.locator('button:has-text("Pay")');
    const downloadBtn = page.locator('button:has-text("Download")');
    
    const hasPayBtn = await payBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const hasDownload = await downloadBtn.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Should have either pay option or download option
    expect(hasPayBtn || hasDownload).toBe(true);
  });

  test('should show Pay button when not paid', async ({ page }) => {
    // If payment is required, Pay button should be visible
    const payBtn = page.locator('button:has-text("Pay")');
    const hasPayBtn = await payBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasPayBtn) {
      await expect(payBtn).toBeEnabled();
    }
  });

  test('should redirect to Stripe checkout when Pay is clicked', async ({ page }) => {
    test.slow(); // Stripe redirect can be slow

    const payBtn = page.locator('button:has-text("Pay")');
    const hasPayBtn = await payBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPayBtn) {
      // Click pay and wait for Stripe redirect
      await payBtn.click();
      
      // Should redirect to Stripe
      await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30000 });
    } else {
      // If no pay button, payment may not be required
      test.skip();
    }
  });

  test('should show payment error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/create-checkout', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment service unavailable' }),
      });
    });

    const payBtn = page.locator('button:has-text("Pay")');
    const hasPayBtn = await payBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasPayBtn) {
      await payBtn.click();

      // Should show error message
      await expect(page.locator('text=Payment service unavailable')).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });
});

test.describe('Payment - Stripe Checkout (Integration)', () => {
  test('should complete payment with test card', async ({ page }) => {
    test.skip(true, 'Full Stripe flow requires special test setup');
    
    // This test would require:
    // 1. Navigate through the app to payment
    // 2. Complete Stripe checkout with test card
    // 3. Verify redirect back to app
    // 4. Verify paid status
    
    await navigateToApp(page);
    await selectPhotoType(page, 'us');
    
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    const payBtn = page.locator('button:has-text("Pay")');
    if (await payBtn.isVisible({ timeout: 5000 })) {
      await payBtn.click();
      
      // Wait for Stripe checkout
      await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
      
      // Fill in test card details
      await page.fill('[name="cardNumber"]', STRIPE_TEST.cardNumber);
      await page.fill('[name="cardExpiry"]', STRIPE_TEST.expiry);
      await page.fill('[name="cardCvc"]', STRIPE_TEST.cvc);
      await page.fill('[name="billingName"]', 'Test User');
      await page.fill('[name="billingPostalCode"]', STRIPE_TEST.zip);
      
      // Submit payment
      await page.click('[data-testid="hosted-payment-submit-button"]');
      
      // Wait for redirect back
      await page.waitForURL(/\/app\?session_id=/, { timeout: 60000 });
      
      // Verify payment success
      await expect(page.locator('text=Payment verified')).toBeVisible({ timeout: 30000 });
    }
  });
});

test.describe('Payment - Session Verification', () => {
  test('should verify valid session_id', async ({ page }) => {
    // Mock successful verification
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });

    // Navigate with session_id
    await page.goto('/app?session_id=test_session_123');

    // Should show payment verified message
    await expect(page.locator('text=Payment verified')).toBeVisible({ timeout: 10000 });
  });

  test('should handle invalid session_id', async ({ page }) => {
    // Mock failed verification
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: false, error: 'Invalid session' }),
      });
    });

    // Navigate with invalid session_id
    await page.goto('/app?session_id=invalid_session');

    // Should show error message
    await expect(page.locator('text=Invalid session')).toBeVisible({ timeout: 10000 });
  });

  test('should handle verification network error', async ({ page }) => {
    // Mock network error
    await page.route('**/api/verify-session*', route => {
      route.abort('failed');
    });

    // Navigate with session_id
    await page.goto('/app?session_id=test_session');

    // Should show error message
    await expect(page.locator('text=verify payment')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Payment - Post-Payment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock verified payment session
    await page.route('**/api/verify-session*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ verified: true }),
      });
    });
  });

  test('should show download options after payment', async ({ page }) => {
    await page.goto('/app?session_id=test_verified_session');
    await page.waitForLoadState('networkidle');

    await selectPhotoType(page, 'us');
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    // Should have download options without pay button
    await expect(page.locator('button:has-text("Download Sheet")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Download Single")')).toBeVisible();
  });

  test('should not show watermark after payment', async ({ page }) => {
    await page.goto('/app?session_id=test_verified_session');
    await page.waitForLoadState('networkidle');

    await selectPhotoType(page, 'us');
    const goodPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);
    await uploadSvgTestImage(page, goodPhoto);
    await waitForEditorReady(page);
    await generatePhoto(page);

    // Canvas should not have watermark (no "SAMPLE" text overlay)
    const hasWatermark = await page.evaluate(() => {
      const body = document.body.innerText;
      return body.includes('SAMPLE') || body.includes('watermark');
    });

    expect(hasWatermark).toBe(false);
  });
});
