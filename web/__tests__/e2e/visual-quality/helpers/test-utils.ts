/**
 * Test Utilities for Visual Quality E2E Tests
 */

import { Page, expect, Download } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export interface ComplianceCheck {
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  message?: string;
}

/**
 * Navigate to the app and select a country
 */
export async function navigateToAppAndSelectCountry(
  page: Page,
  country: 'us' | 'uk'
): Promise<void> {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');

  // Find country selector
  const selector = page.locator('button[role="combobox"]').first();

  if (await selector.isVisible({ timeout: 5000 })) {
    await selector.click();

    // Wait for dropdown
    await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

    // Select country - use .first() to handle duplicates across groups
    const countryName = country === 'us' ? 'US Passport' : 'UK Passport';
    await page
      .locator(`[role="option"]:has-text("${countryName}")`)
      .first()
      .click();

    // Wait for selection
    await expect(selector).toContainText(countryName, { timeout: 5000 });
  }
}

/**
 * Upload a photo file
 */
export async function uploadPhoto(page: Page, filePath: string): Promise<void> {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
}

/**
 * Wait for photo processing to complete
 */
export async function waitForProcessing(
  page: Page,
  timeout = 45000
): Promise<void> {
  // Wait for loading states to finish
  await page.waitForFunction(
    () => {
      const text = document.body.textContent || '';
      return (
        !text.includes('Analyzing') &&
        !text.includes('Detecting') &&
        !text.includes('Loading') &&
        !text.includes('Processing')
      );
    },
    { timeout }
  );

  // Wait for either canvas or an error state
  await Promise.race([
    page.waitForSelector('canvas', { timeout: 15000 }),
    page.waitForSelector('[data-testid="compliance-checker"]', {
      timeout: 15000,
    }),
    page.waitForSelector('text=Face detected', { timeout: 15000 }),
    page.waitForSelector('text=No face', { timeout: 15000 }),
  ]).catch(() => {
    // If none appear, that's fine - we'll handle it in tests
  });
}

/**
 * Get compliance check results from the page
 */
export async function getComplianceChecks(
  page: Page
): Promise<ComplianceCheck[]> {
  // First expand the compliance checker if collapsed
  const toggle = page.locator('[data-testid="compliance-summary-toggle"]');
  if (await toggle.isVisible({ timeout: 3000 })) {
    await toggle.click();
    await page.waitForTimeout(300); // Let animation complete
  }

  return page.evaluate(() => {
    const checks: ComplianceCheck[] = [];

    // Primary method: use data-testid attributes
    const checkElements = document.querySelectorAll(
      '[data-testid^="check-"][data-check-status]'
    );

    checkElements.forEach((el) => {
      const testId = el.getAttribute('data-testid') || '';
      const status = el.getAttribute('data-check-status') as
        | 'pass'
        | 'fail'
        | 'warn'
        | 'pending';

      // Extract check id from data-testid (e.g., "check-sharpness" -> "sharpness")
      const checkId = testId.replace('check-', '');

      // Get label and message from child elements
      const labelEl = el.querySelector(
        `[data-testid="check-${checkId}-label"]`
      );
      const messageEl = el.querySelector(
        `[data-testid="check-${checkId}-message"]`
      );

      const label = labelEl?.textContent?.trim() || checkId;
      const message = messageEl?.textContent?.trim() || '';

      checks.push({ label, status: status || 'pending', message });
    });

    if (checks.length > 0) return checks;

    // Fallback: parse from class-based selectors
    const selectors = [
      '[class*="compliance"] [class*="flex items-start"]',
      '.compliance-item',
      '[class*="check-item"]',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      elements.forEach((el, index) => {
        const text = el.textContent || '';
        let status: 'pass' | 'fail' | 'warn' | 'pending' = 'pending';

        // Detect status from icons/colors
        if (
          el.querySelector('.text-emerald-500, [class*="emerald"]') ||
          text.includes('✓')
        ) {
          status = 'pass';
        } else if (
          el.querySelector('.text-red-500, [class*="red"]') ||
          text.includes('✗')
        ) {
          status = 'fail';
        } else if (
          el.querySelector('.text-amber-500, [class*="amber"]') ||
          text.includes('!')
        ) {
          status = 'warn';
        }

        // Parse label and message
        const parts = text.split('—').map((s) => s.trim());
        const label =
          parts[0]?.replace(/[✓✗!○•]/g, '').trim() || `Check ${index}`;
        const message = parts[1] || '';

        if (label) {
          checks.push({ label, status, message });
        }
      });

      if (checks.length > 0) break;
    }

    // Also look for common compliance patterns in text
    const body = document.body.textContent || '';

    // Face detection
    if (body.includes('Face detected')) {
      if (!checks.some((c) => c.label.toLowerCase().includes('face'))) {
        checks.push({
          label: 'Face Detection',
          status: 'pass',
          message: 'Face detected',
        });
      }
    } else if (body.includes('No face')) {
      if (!checks.some((c) => c.label.toLowerCase().includes('face'))) {
        checks.push({
          label: 'Face Detection',
          status: 'fail',
          message: 'No face detected',
        });
      }
    }

    // Resolution check
    if (body.includes('resolution') || body.includes('Resolution')) {
      const hasIssue =
        body.includes('low resolution') || body.includes('too low');
      if (!checks.some((c) => c.label.toLowerCase().includes('resolution'))) {
        checks.push({
          label: 'Resolution',
          status: hasIssue ? 'warn' : 'pass',
          message: hasIssue ? 'Resolution may be too low' : 'Resolution OK',
        });
      }
    }

    return checks;
  });
}

/**
 * Get a specific compliance check by ID
 */
export async function getCheckById(
  page: Page,
  checkId: string
): Promise<ComplianceCheck | null> {
  // First expand the compliance checker if collapsed
  const toggle = page.locator('[data-testid="compliance-summary-toggle"]');
  if (await toggle.isVisible({ timeout: 3000 })) {
    await toggle.click();
    await page.waitForTimeout(300);
  }

  // Also expand passed checks if looking for a pass status
  const passedDetails = page.locator(
    'details:has([data-testid="passed-checks"])'
  );
  if (await passedDetails.isVisible({ timeout: 1000 })) {
    const isOpen = await passedDetails.getAttribute('open');
    if (isOpen === null) {
      await passedDetails.locator('summary').click();
      await page.waitForTimeout(200);
    }
  }

  const check = page.locator(`[data-testid="check-${checkId}"]`);

  if (await check.isVisible({ timeout: 2000 })) {
    const status = (await check.getAttribute('data-check-status')) as
      | 'pass'
      | 'fail'
      | 'warn'
      | 'pending';
    const label =
      (await check
        .locator(`[data-testid="check-${checkId}-label"]`)
        .textContent()) || checkId;
    const messageEl = check.locator(`[data-testid="check-${checkId}-message"]`);
    const message = (await messageEl.isVisible())
      ? (await messageEl.textContent()) || ''
      : '';

    return {
      label: label.trim(),
      status: status || 'pending',
      message: message.trim(),
    };
  }

  return null;
}

/**
 * Click generate button and wait for output
 */
export async function generateOutput(page: Page): Promise<void> {
  // Find generate button
  const generateBtn = page.locator('button:has-text("Generate")').first();

  if (await generateBtn.isVisible({ timeout: 5000 })) {
    await generateBtn.click();

    // Wait for output screen
    await Promise.race([
      page.waitForSelector('text=Download', { timeout: 15000 }),
      page.waitForSelector('text=Your Passport', { timeout: 15000 }),
      page.waitForSelector('[role="dialog"]', { timeout: 15000 }),
    ]).catch(() => {});

    // Give it a moment to render
    await page.waitForTimeout(500);
  }
}

/**
 * Download single photo and return path
 */
export async function downloadSinglePhoto(page: Page): Promise<string | null> {
  const downloadBtn = page
    .locator('button:has-text("Download Single")')
    .or(page.locator('button:has-text("Single Photo")'));

  if (await downloadBtn.isVisible({ timeout: 5000 })) {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadBtn.click(),
    ]);

    const downloadPath = await download.path();
    return downloadPath || null;
  }

  return null;
}

/**
 * Capture and save a screenshot
 */
export async function captureScreenshot(
  page: Page,
  dir: string,
  name: string
): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: true,
  });
}

/**
 * Verify canvas dimensions
 */
export async function verifyCanvasDimensions(
  page: Page
): Promise<{ width: number; height: number }> {
  const dimensions = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { width: 0, height: 0 };
    return { width: canvas.width, height: canvas.height };
  });

  return dimensions;
}

/**
 * Remove background if prompt is shown
 */
export async function removeBackgroundIfNeeded(page: Page): Promise<boolean> {
  const removeBtn = page.locator('button:has-text("Remove Background")');

  if (await removeBtn.isVisible({ timeout: 3000 })) {
    await removeBtn.click();

    // Wait for removal
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Removing'),
      { timeout: 60000 }
    );

    return true;
  }

  return false;
}

/**
 * Go back to upload screen
 */
export async function goBack(page: Page): Promise<void> {
  const backBtn = page
    .locator('button:has-text("Start over")')
    .or(page.locator('button:has-text("Back")'));

  if (await backBtn.isVisible({ timeout: 3000 })) {
    await backBtn.click();
    await page.waitForSelector('input[type="file"]', { timeout: 5000 });
  }
}

/**
 * Bypass payment for testing
 */
export async function bypassPayment(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.setItem('passport-photo-verified', 'test-session');
    localStorage.setItem('passport-photo-verified', 'test-session');
  });
}
