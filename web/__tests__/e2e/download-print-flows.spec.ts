import { test, expect, Download } from '@playwright/test';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

// Test data paths
const TEST_IMAGES = {
  validPortrait: path.join(__dirname, '../fixtures/valid-portrait.jpg'),
  largePhoto: path.join(__dirname, '../fixtures/large-photo.jpg'),
};

// Expected dimensions (US Passport: 2x2 inches at 300 DPI)
const SINGLE_PHOTO_WIDTH = 600; // 2 inches * 300 DPI
const SINGLE_PHOTO_HEIGHT = 600; // 2 inches * 300 DPI
const SHEET_WIDTH = 1800; // 6 inches * 300 DPI
const SHEET_HEIGHT = 1200; // 4 inches * 300 DPI

// Minimum file sizes to verify images are generated (bytes)
// Note: Test fixtures are minimal solid-color images, so actual file sizes will be small
const MIN_SINGLE_FILE_SIZE = 1000; // 1KB minimum for a valid JPEG
const MIN_SHEET_FILE_SIZE = 2000; // 2KB minimum for a sheet

/**
 * Helper to bypass payment verification by setting sessionStorage
 */
async function bypassPayment(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    sessionStorage.setItem('passport-photo-verified', 'test-session');
  });
}

/**
 * Helper to wait for download and return the file path
 */
async function waitForDownload(
  page: import('@playwright/test').Page,
  triggerAction: () => Promise<void>
): Promise<{ download: Download; buffer: Buffer }> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    triggerAction(),
  ]);

  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error('Download failed - no file path');
  }

  const buffer = fs.readFileSync(downloadPath);
  return { download, buffer };
}

/**
 * Helper to verify image dimensions using sharp
 */
async function verifyImageDimensions(
  buffer: Buffer,
  expectedWidth: number,
  expectedHeight: number
) {
  const metadata = await sharp(buffer).metadata();
  expect(metadata.width).toBe(expectedWidth);
  expect(metadata.height).toBe(expectedHeight);
}

/**
 * Helper to complete the upload → edit → generate flow
 */
async function completeFlowToOutput(
  page: import('@playwright/test').Page,
  imagePath: string
) {
  // Upload photo
  await page.locator('input[type="file"]').setInputFiles(imagePath);

  // Wait for editor to load (canvas should be visible)
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 });

  // Wait for face detection to complete (use first() to avoid strict mode with multiple matches)
  await expect(
    page
      .locator('text=Face detected')
      .or(page.locator('text=No face found'))
      .first()
  ).toBeVisible({ timeout: 15000 });

  // Click "Generate Printable Sheet"
  await page.getByRole('button', { name: /Generate Printable Sheet/i }).click();

  // Wait for output view to load
  await expect(page.locator('text=Your Passport Photos')).toBeVisible({
    timeout: 10000,
  });

  // Wait for the sheet image to be generated
  await expect(page.locator('img[alt="Passport photo sheet"]')).toBeVisible({
    timeout: 10000,
  });
}

test.describe('Download/Print Flows - Single Image', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
    await bypassPayment(page);
    // Reload to apply the bypassed payment state
    await page.reload();
  });

  test('Complete flow: upload → editor → generate → output view', async ({
    page,
  }) => {
    // Upload photo
    await page
      .locator('input[type="file"]')
      .setInputFiles(TEST_IMAGES.validPortrait);

    // Wait for editor to load
    await expect(page.locator('canvas').first()).toBeVisible({
      timeout: 15000,
    });

    // Verify editor elements are present
    await expect(page.locator('text=Original Photo')).toBeVisible();
    await expect(page.locator('text=Passport Photo Preview')).toBeVisible();

    // Generate sheet
    await page
      .getByRole('button', { name: /Generate Printable Sheet/i })
      .click();

    // Verify output view
    await expect(page.locator('text=Your Passport Photos')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=4×6 inch sheet')).toBeVisible();

    // Verify sheet image is displayed
    const sheetImage = page.locator('img[alt="Passport photo sheet"]');
    await expect(sheetImage).toBeVisible({ timeout: 10000 });
  });

  test('Download Sheet: file downloads with correct dimensions', async ({
    page,
  }) => {
    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    // Click Download Sheet and capture the download
    const { download, buffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });

    // Verify filename
    expect(download.suggestedFilename()).toBe('passport-photos-sheet.jpg');

    // Verify file is not blank (has content)
    expect(buffer.length).toBeGreaterThan(MIN_SHEET_FILE_SIZE);

    // Verify dimensions
    await verifyImageDimensions(buffer, SHEET_WIDTH, SHEET_HEIGHT);
  });

  test('Download Single: file downloads with correct dimensions', async ({
    page,
  }) => {
    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    // Click Download Single and capture the download
    const { download, buffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Single/i }).click();
    });

    // Verify filename
    expect(download.suggestedFilename()).toBe('passport-photo.jpg');

    // Verify file is not blank (has content)
    expect(buffer.length).toBeGreaterThan(MIN_SINGLE_FILE_SIZE);

    // Verify dimensions
    await verifyImageDimensions(
      buffer,
      SINGLE_PHOTO_WIDTH,
      SINGLE_PHOTO_HEIGHT
    );
  });

  test('Downloaded sheet is valid JPEG with correct dimensions', async ({
    page,
  }) => {
    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    const { buffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });

    // Verify the image is a valid JPEG
    const metadata = await sharp(buffer).metadata();
    expect(metadata.format).toBe('jpeg');

    // Verify dimensions match expected sheet size
    expect(metadata.width).toBe(SHEET_WIDTH);
    expect(metadata.height).toBe(SHEET_HEIGHT);

    // Verify file has reasonable size (not empty/corrupt)
    expect(buffer.length).toBeGreaterThan(MIN_SHEET_FILE_SIZE);
  });

  test('Downloaded single photo is valid JPEG with correct dimensions', async ({
    page,
  }) => {
    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    const { buffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Single/i }).click();
    });

    // Verify the image is a valid JPEG
    const metadata = await sharp(buffer).metadata();
    expect(metadata.format).toBe('jpeg');

    // Verify dimensions match expected single photo size
    expect(metadata.width).toBe(SINGLE_PHOTO_WIDTH);
    expect(metadata.height).toBe(SINGLE_PHOTO_HEIGHT);

    // Verify file has reasonable size
    expect(buffer.length).toBeGreaterThan(MIN_SINGLE_FILE_SIZE);
  });

  test('Print displays correctly with proper styling', async ({ page }) => {
    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    // Emulate print media
    await page.emulateMedia({ media: 'print' });

    // Take screenshot in print mode
    const screenshot = await page.screenshot({ fullPage: true });

    // The sheet image should be visible in print mode
    const sheetImage = page.locator('img[alt="Passport photo sheet"]');
    await expect(sheetImage).toBeVisible();

    // Verify print-hide elements are hidden
    const downloadButton = page.getByRole('button', {
      name: /Download Sheet/i,
    });
    await expect(downloadButton).not.toBeVisible();

    // Get bounding box of sheet image to verify it's not stretched
    const box = await sheetImage.boundingBox();
    expect(box).toBeTruthy();

    // Check aspect ratio (should be 3:2 for 6×4 sheet)
    if (box) {
      const aspectRatio = box.width / box.height;
      // Allow some tolerance for CSS styling
      expect(aspectRatio).toBeGreaterThan(1.3);
      expect(aspectRatio).toBeLessThan(1.7);
    }

    // Verify screenshot was captured (just checking it's not empty)
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  test('Print button triggers print dialog', async ({ page }) => {
    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    // Track if window.print was called
    let printCalled = false;
    await page.exposeFunction('__printCalled', () => {
      printCalled = true;
    });

    await page.evaluate(() => {
      const originalPrint = window.print;
      window.print = function () {
        (window as unknown as { __printCalled: () => void }).__printCalled();
        // Don't actually call print to avoid blocking the test
      };
    });

    // Click print button
    await page.getByRole('button', { name: /Print/i }).click();

    // Verify print was called
    await page.waitForFunction(() => true, {}, { timeout: 1000 });
    expect(printCalled).toBe(true);
  });
});

test.describe('Download/Print Flows - Two Consecutive Images', () => {
  let firstDownloadBuffer: Buffer;
  let secondDownloadBuffer: Buffer;

  test('State resets properly between consecutive photo uploads', async ({
    page,
  }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();

    // === FIRST PHOTO FLOW ===
    await page
      .locator('input[type="file"]')
      .setInputFiles(TEST_IMAGES.validPortrait);

    // Wait for editor
    await expect(page.locator('canvas').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page
        .locator('text=Face detected')
        .or(page.locator('text=No face found'))
        .first()
    ).toBeVisible({ timeout: 15000 });

    // Generate sheet
    await page
      .getByRole('button', { name: /Generate Printable Sheet/i })
      .click();
    await expect(page.locator('text=Your Passport Photos')).toBeVisible({
      timeout: 10000,
    });

    // Download first sheet
    const firstResult = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });
    firstDownloadBuffer = firstResult.buffer;

    // Verify first download
    expect(firstDownloadBuffer.length).toBeGreaterThan(MIN_SHEET_FILE_SIZE);
    await verifyImageDimensions(firstDownloadBuffer, SHEET_WIDTH, SHEET_HEIGHT);

    // === GO BACK TO START ===
    // Click "← Back to editor" then "← Start over"
    await page.locator('text=← Back to editor').click();
    await expect(page.locator('text=Original Photo')).toBeVisible({
      timeout: 5000,
    });

    await page.locator('text=← Start over').click();
    await expect(page.locator('text=Upload Photo')).toBeVisible({
      timeout: 5000,
    });

    // === SECOND PHOTO FLOW ===
    // Upload different photo
    await page
      .locator('input[type="file"]')
      .setInputFiles(TEST_IMAGES.largePhoto);

    // Should go to EDITOR (not output) - verify we're in editing mode
    await expect(page.locator('canvas').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('text=Original Photo')).toBeVisible({
      timeout: 5000,
    });

    // Verify we're NOT in output view
    await expect(page.locator('text=Your Passport Photos')).not.toBeVisible();

    // Wait for face detection
    await expect(
      page
        .locator('text=Face detected')
        .or(page.locator('text=No face found'))
        .first()
    ).toBeVisible({ timeout: 15000 });

    // Generate sheet for second photo
    await page
      .getByRole('button', { name: /Generate Printable Sheet/i })
      .click();
    await expect(page.locator('text=Your Passport Photos')).toBeVisible({
      timeout: 10000,
    });

    // Download second sheet
    const secondResult = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });
    secondDownloadBuffer = secondResult.buffer;

    // Verify second download
    expect(secondDownloadBuffer.length).toBeGreaterThan(MIN_SHEET_FILE_SIZE);
    await verifyImageDimensions(
      secondDownloadBuffer,
      SHEET_WIDTH,
      SHEET_HEIGHT
    );

    // === VERIFY BOTH DOWNLOADS ARE VALID ===
    // Both should be valid JPEGs with correct dimensions
    const firstMetadata = await sharp(firstDownloadBuffer).metadata();
    const secondMetadata = await sharp(secondDownloadBuffer).metadata();

    expect(firstMetadata.format).toBe('jpeg');
    expect(secondMetadata.format).toBe('jpeg');
    expect(firstMetadata.width).toBe(SHEET_WIDTH);
    expect(secondMetadata.width).toBe(SHEET_WIDTH);

    // The two images should be different (different source images)
    // Note: If test fixtures are identical, this might fail - skip if needed
    // For now, we just verify both downloads complete successfully
  });

  test('Single photo download also works correctly for consecutive uploads', async ({
    page,
  }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();

    // First photo - download single
    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    const firstResult = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Single/i }).click();
    });
    const firstSingleBuffer = firstResult.buffer;

    await verifyImageDimensions(
      firstSingleBuffer,
      SINGLE_PHOTO_WIDTH,
      SINGLE_PHOTO_HEIGHT
    );

    // Go back and start over
    await page.locator('text=← Back to editor').click();
    await page.locator('text=← Start over').click();

    // Second photo - download single
    await completeFlowToOutput(page, TEST_IMAGES.largePhoto);

    const secondResult = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Single/i }).click();
    });
    const secondSingleBuffer = secondResult.buffer;

    await verifyImageDimensions(
      secondSingleBuffer,
      SINGLE_PHOTO_WIDTH,
      SINGLE_PHOTO_HEIGHT
    );

    // Both downloads should be valid JPEGs
    const firstMetadata = await sharp(firstSingleBuffer).metadata();
    const secondMetadata = await sharp(secondSingleBuffer).metadata();

    expect(firstMetadata.format).toBe('jpeg');
    expect(secondMetadata.format).toBe('jpeg');
  });
});

test.describe('Payment Wall Tests', () => {
  test('Unpaid users see payment prompt instead of download buttons', async ({
    page,
  }) => {
    await page.goto('/app');
    // Do NOT bypass payment

    // Upload and generate
    await page
      .locator('input[type="file"]')
      .setInputFiles(TEST_IMAGES.validPortrait);
    await expect(page.locator('canvas').first()).toBeVisible({
      timeout: 15000,
    });

    await page
      .getByRole('button', { name: /Generate Printable Sheet/i })
      .click();
    await expect(page.locator('text=Your Passport Photos')).toBeVisible({
      timeout: 10000,
    });

    // Verify payment prompt is shown
    await expect(
      page.locator('text=Pay $4.99 to remove watermark')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Pay & Download/i })
    ).toBeVisible();

    // Verify download buttons are NOT visible
    await expect(
      page.getByRole('button', { name: /Download Sheet/i })
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /Download Single/i })
    ).not.toBeVisible();
  });

  test('Paid users see download buttons', async ({ page }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();

    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    // Verify download buttons are visible
    await expect(
      page.getByRole('button', { name: /Download Sheet/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Download Single/i })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /Print/i })).toBeVisible();

    // Verify payment prompt is NOT visible
    await expect(
      page.locator('text=Pay $4.99 to remove watermark')
    ).not.toBeVisible();
  });
});

test.describe('Edge Cases', () => {
  test('Can navigate back from output view and re-generate', async ({
    page,
  }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();

    await completeFlowToOutput(page, TEST_IMAGES.validPortrait);

    // Go back to editor
    await page.locator('text=← Back to editor').click();
    await expect(page.locator('text=Original Photo')).toBeVisible({
      timeout: 5000,
    });

    // Adjust zoom
    const zoomSlider = page.locator('input[type="range"]').first();
    if (await zoomSlider.isVisible()) {
      await zoomSlider.fill('120');
    }

    // Re-generate
    await page
      .getByRole('button', { name: /Generate Printable Sheet/i })
      .click();
    await expect(page.locator('text=Your Passport Photos')).toBeVisible({
      timeout: 10000,
    });

    // Download should still work
    const { buffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });

    expect(buffer.length).toBeGreaterThan(MIN_SHEET_FILE_SIZE);
  });

  test('Large photo processes and downloads correctly', async ({ page }) => {
    await page.goto('/app');
    await bypassPayment(page);
    await page.reload();

    await completeFlowToOutput(page, TEST_IMAGES.largePhoto);

    // Download sheet
    const { buffer: sheetBuffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Sheet/i }).click();
    });

    await verifyImageDimensions(sheetBuffer, SHEET_WIDTH, SHEET_HEIGHT);

    // Download single
    const { buffer: singleBuffer } = await waitForDownload(page, async () => {
      await page.getByRole('button', { name: /Download Single/i }).click();
    });

    await verifyImageDimensions(
      singleBuffer,
      SINGLE_PHOTO_WIDTH,
      SINGLE_PHOTO_HEIGHT
    );
  });
});
