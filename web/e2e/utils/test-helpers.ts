/**
 * E2E Test helpers for passport photo app
 */

import { Page, expect, Locator } from '@playwright/test';
import { SELECTORS, US_PASSPORT_SPEC, UK_PASSPORT_SPEC } from './test-constants';

export interface UploadResult {
  faceDetected: boolean;
  complianceChecks: ComplianceCheckResult[];
}

export interface ComplianceCheckResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  message: string;
}

/**
 * Navigate to the app page and wait for it to load
 */
export async function navigateToApp(page: Page): Promise<void> {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1')).toContainText('Passport Photo');
}

/**
 * Select a photo type (US or UK)
 */
export async function selectPhotoType(page: Page, type: 'us' | 'uk'): Promise<void> {
  // Find and click the country selector
  const selector = page.locator('button[role="combobox"]').first();
  await selector.click();
  
  // Wait for dropdown
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  
  // Select the appropriate option
  const optionText = type === 'us' ? 'US Passport' : 'UK Passport';
  await page.locator(`[role="option"]:has-text("${optionText}")`).click();
  
  // Wait for selection to take effect
  await expect(selector).toContainText(optionText);
}

/**
 * Upload an image file
 */
export async function uploadImage(page: Page, imageData: string): Promise<void> {
  // Get the file input
  const fileInput = page.locator('input[type="file"]');
  
  // Create a buffer from the data URL or base64
  const buffer = Buffer.from(
    imageData.replace(/^data:image\/\w+;base64,/, ''),
    'base64'
  );
  
  // Upload the file
  await fileInput.setInputFiles({
    name: 'test-photo.jpg',
    mimeType: 'image/jpeg',
    buffer,
  });
}

/**
 * Upload an SVG test image (converted to PNG in browser)
 */
export async function uploadSvgTestImage(page: Page, svgDataUrl: string): Promise<void> {
  // For SVG test images, we need to convert to PNG first
  // We'll use the browser's canvas to do this
  const pngDataUrl = await page.evaluate(async (svg) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 800;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = () => {
        // If SVG fails, create a blank image
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 800);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.src = svg;
    });
  }, svgDataUrl);
  
  await uploadImage(page, pngDataUrl);
}

/**
 * Wait for face detection to complete
 */
export async function waitForFaceDetection(page: Page, timeout = 30000): Promise<boolean> {
  try {
    // Wait for loading to disappear
    await page.waitForFunction(
      () => !document.body.textContent?.includes('Detecting face'),
      { timeout }
    );
    
    // Check if face was detected
    const faceFound = await page.evaluate(() => {
      return !document.body.textContent?.includes('No face detected');
    });
    
    return faceFound;
  } catch {
    return false;
  }
}

/**
 * Wait for the editor to be ready (face detection + analysis complete)
 */
export async function waitForEditorReady(page: Page, timeout = 45000): Promise<void> {
  // Wait for loading states to complete
  await page.waitForFunction(
    () => {
      const body = document.body.textContent || '';
      return !body.includes('Analyzing your photo') && 
             !body.includes('Detecting face') &&
             !body.includes('Loading');
    },
    { timeout }
  );
  
  // Wait for either the editor or an error state
  await Promise.race([
    page.waitForSelector('canvas', { timeout: 10000 }),
    page.waitForSelector('[data-testid="compliance-checker"]', { timeout: 10000 }),
    page.waitForSelector('text=Start over', { timeout: 10000 }),
  ]);
}

/**
 * Get current compliance check results
 */
export async function getComplianceResults(page: Page): Promise<ComplianceCheckResult[]> {
  return page.evaluate(() => {
    const checks: Array<{
      id: string;
      label: string;
      status: 'pass' | 'fail' | 'warn' | 'pending';
      message: string;
    }> = [];
    
    // Find all compliance check items
    const checkElements = document.querySelectorAll('[class*="compliance"] [class*="flex items-start"]');
    
    checkElements.forEach((el, index) => {
      const text = el.textContent || '';
      let status: 'pass' | 'fail' | 'warn' | 'pending' = 'pending';
      
      if (el.querySelector('.text-green-500')) status = 'pass';
      else if (el.querySelector('.text-red-500')) status = 'fail';
      else if (el.querySelector('.text-yellow-500')) status = 'warn';
      
      // Parse label and message
      const parts = text.split('—').map(s => s.trim());
      checks.push({
        id: `check-${index}`,
        label: parts[0]?.replace(/[✓✗!○]/g, '').trim() || 'Unknown',
        status,
        message: parts[1] || '',
      });
    });
    
    return checks;
  });
}

/**
 * Check if all compliance checks pass
 */
export async function allCompliancePassed(page: Page): Promise<boolean> {
  const checks = await getComplianceResults(page);
  return checks.length > 0 && checks.every(c => c.status === 'pass');
}

/**
 * Check if any compliance check failed
 */
export async function hasComplianceFailure(page: Page): Promise<boolean> {
  const checks = await getComplianceResults(page);
  return checks.some(c => c.status === 'fail');
}

/**
 * Click the remove background button and wait for completion
 */
export async function removeBackground(page: Page, timeout = 60000): Promise<void> {
  const removeBtn = page.locator('button:has-text("Remove Background")');
  
  if (await removeBtn.isVisible()) {
    await removeBtn.click();
    
    // Wait for background removal to complete
    await page.waitForFunction(
      () => {
        const text = document.body.textContent || '';
        return text.includes('Background removed') || 
               !text.includes('Removing');
      },
      { timeout }
    );
  }
}

/**
 * Click generate and handle the output
 */
export async function generatePhoto(page: Page): Promise<void> {
  // Find and click generate button
  const generateBtn = page.locator('button:has-text("Generate")');
  await expect(generateBtn).toBeVisible();
  await generateBtn.click();
  
  // Wait for either output view or compliance warning
  await Promise.race([
    page.waitForSelector('text=Download Sheet', { timeout: 15000 }),
    page.waitForSelector('[role="dialog"]', { timeout: 15000 }),
  ]);
}

/**
 * Handle payment flow with test card
 */
export async function handlePaymentFlow(page: Page): Promise<void> {
  // Click pay button
  const payBtn = page.locator('button:has-text("Pay")');
  if (await payBtn.isVisible()) {
    await payBtn.click();
    
    // Wait for Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    
    // Fill in test card details
    await page.fill('[name="cardNumber"]', '4242424242424242');
    await page.fill('[name="cardExpiry"]', '12/28');
    await page.fill('[name="cardCvc"]', '123');
    await page.fill('[name="billingName"]', 'Test User');
    await page.fill('[name="billingPostalCode"]', '10001');
    
    // Submit payment
    await page.click('button[type="submit"]');
    
    // Wait for redirect back to app
    await page.waitForURL(/\/app/, { timeout: 30000 });
  }
}

/**
 * Verify photo dimensions in output
 */
export async function verifyOutputDimensions(
  page: Page,
  expectedSpec: typeof US_PASSPORT_SPEC | typeof UK_PASSPORT_SPEC
): Promise<boolean> {
  const dimensions = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    return { width: canvas.width, height: canvas.height };
  });
  
  if (!dimensions) return false;
  
  // Allow 5% tolerance
  const widthMatch = Math.abs(dimensions.width - expectedSpec.pixelWidth) < expectedSpec.pixelWidth * 0.05;
  const heightMatch = Math.abs(dimensions.height - expectedSpec.pixelHeight) < expectedSpec.pixelHeight * 0.05;
  
  return widthMatch && heightMatch;
}

/**
 * Analyze canvas for visual quality issues
 */
export async function analyzeCanvasQuality(page: Page): Promise<{
  hasHalo: boolean;
  isBlurry: boolean;
  hasWhiteMargins: boolean;
  backgroundColor: string;
}> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      return { hasHalo: false, isBlurry: false, hasWhiteMargins: false, backgroundColor: 'unknown' };
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { hasHalo: false, isBlurry: false, hasWhiteMargins: false, backgroundColor: 'unknown' };
    }
    
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Check corners for background color
    const cornerSamples = [
      { x: 5, y: 5 },
      { x: width - 5, y: 5 },
      { x: 5, y: height - 5 },
      { x: width - 5, y: height - 5 },
    ];
    
    let bgR = 0, bgG = 0, bgB = 0;
    cornerSamples.forEach(({ x, y }) => {
      const idx = (y * width + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
    });
    bgR /= 4; bgG /= 4; bgB /= 4;
    
    const backgroundColor = `rgb(${Math.round(bgR)},${Math.round(bgG)},${Math.round(bgB)})`;
    const isWhiteBg = bgR > 240 && bgG > 240 && bgB > 240;
    
    // Check for halo artifacts (unusual color transitions near edges)
    let haloPixels = 0;
    const edgeWidth = Math.floor(width * 0.1);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < edgeWidth; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        // Check for unusual colors that might indicate halo
        if (!isWhiteBg && (r > 200 || g > 200 || b > 200) && (r < 240 || g < 240 || b < 240)) {
          haloPixels++;
        }
      }
    }
    const hasHalo = haloPixels > (height * edgeWidth * 0.1);
    
    // Simple blur detection using edge variance
    let edgeVariance = 0;
    const sampleSize = Math.min(100, Math.floor(width * height / 100));
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.floor(Math.random() * (width - 2)) + 1;
      const y = Math.floor(Math.random() * (height - 2)) + 1;
      const idx = (y * width + x) * 4;
      const idxRight = (y * width + x + 1) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      
      const grayCenter = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      const grayRight = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
      const grayDown = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;
      
      edgeVariance += Math.abs(grayCenter - grayRight) + Math.abs(grayCenter - grayDown);
    }
    const isBlurry = edgeVariance / sampleSize < 10; // Low edge variance = blurry
    
    // Check for excessive white margins
    let whiteRowsTop = 0, whiteRowsBottom = 0;
    for (let y = 0; y < Math.min(height * 0.2, 50); y++) {
      let rowWhite = true;
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
          rowWhite = false;
          break;
        }
      }
      if (rowWhite) whiteRowsTop++;
      else break;
    }
    
    const hasWhiteMargins = whiteRowsTop > height * 0.1;
    
    return { hasHalo, isBlurry, hasWhiteMargins, backgroundColor };
  });
}

/**
 * Take a screenshot of the preview canvas for visual comparison
 */
export async function capturePreviewScreenshot(page: Page): Promise<Buffer> {
  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  return canvas.screenshot();
}

/**
 * Adjust zoom level
 */
export async function adjustZoom(page: Page, zoomLevel: number): Promise<void> {
  const slider = page.locator('[data-testid="zoom-slider"]');
  if (await slider.isVisible()) {
    await slider.fill(zoomLevel.toString());
  }
}

/**
 * Go back to upload screen
 */
export async function goBack(page: Page): Promise<void> {
  const backBtn = page.locator('button:has-text("Start over")');
  if (await backBtn.isVisible()) {
    await backBtn.click();
    await page.waitForSelector('text=Drop your photo here');
  }
}
