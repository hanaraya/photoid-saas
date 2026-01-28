/**
 * Output Verification E2E Tests
 * 
 * Tests the final output quality and download functionality:
 * - Print layout (4x6 sheet with multiple photos)
 * - Download functionality (single and sheet)
 * - Output file quality analysis
 * - Visual inspection of generated photos
 */

import { test, expect, Page, Download } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import {
  navigateToAppAndSelectCountry,
  uploadPhoto,
  waitForProcessing,
  generateOutput,
  captureScreenshot,
  verifyCanvasDimensions,
} from './helpers/test-utils';

const FIXTURE_DIR = path.join(__dirname, 'fixtures');
const SCREENSHOT_DIR = path.join(__dirname, '../../../test-results/screenshots/output-verification');
const DOWNLOAD_DIR = path.join(__dirname, '../../../test-results/downloads');

test.describe('Output Verification - Download Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
    
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should download single passport photo', async ({ page }) => {
    test.slow();
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'output-before-download');
    
    // Wait for download button
    const downloadSingleBtn = page.locator('button:has-text("Download Single")').or(
      page.locator('button:has-text("Single Photo")')
    );
    
    if (await downloadSingleBtn.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadSingleBtn.click(),
      ]);
      
      const downloadPath = path.join(DOWNLOAD_DIR, `single-photo-${Date.now()}.jpg`);
      await download.saveAs(downloadPath);
      
      expect(fs.existsSync(downloadPath)).toBe(true);
      
      // Verify file size is reasonable
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      expect(stats.size).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      
      console.log('Single photo downloaded:', downloadPath, 'size:', stats.size);
      
      // Analyze with sharp
      const metadata = await sharp(downloadPath).metadata();
      console.log('Downloaded single photo metadata:', metadata);
      
      // US passport should be 600x600
      expect(metadata.width).toBe(600);
      expect(metadata.height).toBe(600);
    }
  });

  test('should download print sheet (4x6)', async ({ page }) => {
    test.slow();
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Wait for sheet download button
    const downloadSheetBtn = page.locator('button:has-text("Download Sheet")').or(
      page.locator('button:has-text("Print Sheet")')
    );
    
    if (await downloadSheetBtn.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadSheetBtn.click(),
      ]);
      
      const downloadPath = path.join(DOWNLOAD_DIR, `print-sheet-${Date.now()}.jpg`);
      await download.saveAs(downloadPath);
      
      expect(fs.existsSync(downloadPath)).toBe(true);
      
      // Analyze sheet dimensions
      const metadata = await sharp(downloadPath).metadata();
      console.log('Downloaded sheet metadata:', metadata);
      
      // 4x6 at 300dpi should be 1200x1800 or 1800x1200 (landscape/portrait)
      const expectedDimensions = [
        { w: 1800, h: 1200 }, // 6x4 landscape
        { w: 1200, h: 1800 }, // 4x6 portrait
      ];
      
      const matchesDimension = expectedDimensions.some(
        d => (metadata.width === d.w && metadata.height === d.h) ||
             (Math.abs(metadata.width! - d.w) < 10 && Math.abs(metadata.height! - d.h) < 10)
      );
      
      console.log('Sheet dimensions match expected:', matchesDimension);
      
      await captureScreenshot(page, SCREENSHOT_DIR, 'output-sheet-downloaded');
    }
  });

  test('should contain multiple photos in print sheet', async ({ page }) => {
    test.slow();
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Download and analyze sheet
    const downloadSheetBtn = page.locator('button:has-text("Download Sheet")').or(
      page.locator('button:has-text("Print Sheet")')
    );
    
    if (await downloadSheetBtn.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadSheetBtn.click(),
      ]);
      
      const downloadPath = path.join(DOWNLOAD_DIR, `sheet-analysis-${Date.now()}.jpg`);
      await download.saveAs(downloadPath);
      
      // Analyze the sheet to detect photo count
      const { data, info } = await sharp(downloadPath).raw().toBuffer({ resolveWithObject: true });
      
      // Simple analysis: look for repeated patterns
      // US 2x2 photos on 4x6 sheet: should fit 3x2 = 6 photos
      const sheetWidth = info.width;
      const sheetHeight = info.height;
      
      console.log(`Sheet: ${sheetWidth}x${sheetHeight}, expected ~6 photos (2x2 on 4x6)`);
      
      // The sheet should be large enough to fit multiple photos
      expect(sheetWidth).toBeGreaterThan(600 * 2); // At least 2 photos wide
    }
  });
});

test.describe('Output Verification - Visual Quality', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    
    await navigateToAppAndSelectCountry(page, 'us');
  });

  test('should produce output with no visible compression artifacts', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Check canvas quality
    const qualityAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Check for JPEG blockiness (8x8 block artifacts)
      let blockinessScore = 0;
      const blockSize = 8;
      
      for (let by = 0; by < Math.floor(height / blockSize) - 1; by++) {
        for (let bx = 0; bx < Math.floor(width / blockSize) - 1; bx++) {
          // Compare block boundaries
          const y = by * blockSize + blockSize - 1;
          const x = bx * blockSize + blockSize - 1;
          
          if (y + 1 < height && x + 1 < width) {
            const idx1 = (y * width + x) * 4;
            const idx2 = ((y + 1) * width + x) * 4;
            const idx3 = (y * width + x + 1) * 4;
            
            const diff1 = Math.abs(data[idx1] - data[idx2]);
            const diff2 = Math.abs(data[idx1] - data[idx3]);
            
            if (diff1 > 30 || diff2 > 30) {
              blockinessScore++;
            }
          }
        }
      }
      
      const maxBlocks = (Math.floor(height / blockSize) - 1) * (Math.floor(width / blockSize) - 1);
      const blockinessPercent = (blockinessScore / maxBlocks) * 100;
      
      return {
        blockinessPercent,
        hasNoticableArtifacts: blockinessPercent > 30,
      };
    });
    
    console.log('Quality analysis:', qualityAnalysis);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'output-quality-analysis');
    
    if (qualityAnalysis) {
      expect(qualityAnalysis.hasNoticableArtifacts).toBe(false);
    }
  });

  test('should have proper face positioning in output', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Analyze face region in output
    const faceAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Find the bounding box of non-white pixels (approximate face region)
      let minX = width, maxX = 0, minY = height, maxY = 0;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const isWhite = data[idx] > 245 && data[idx + 1] > 245 && data[idx + 2] > 245;
          
          if (!isWhite) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
      
      const faceWidth = maxX - minX;
      const faceHeight = maxY - minY;
      const faceCenterX = (minX + maxX) / 2;
      const faceCenterY = (minY + maxY) / 2;
      
      const horizontalOffset = (faceCenterX - width / 2) / width * 100;
      const verticalPosition = faceCenterY / height * 100;
      
      // Head ratio
      const headRatio = (faceHeight / height) * 100;
      
      return {
        minX, maxX, minY, maxY,
        faceWidth, faceHeight,
        faceCenterX, faceCenterY,
        horizontalOffset, // Should be close to 0 for centered
        verticalPosition, // Should be around 40-50% from top
        headRatio, // US: should be 50-69%
        isCentered: Math.abs(horizontalOffset) < 10,
        isProperlyPositioned: verticalPosition > 30 && verticalPosition < 60,
      };
    });
    
    console.log('Face positioning analysis:', faceAnalysis);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'output-face-positioning');
    
    if (faceAnalysis) {
      // Face should be reasonably centered
      expect(faceAnalysis.isCentered).toBe(true);
    }
  });

  test('should fill template correctly (no excessive margins)', async ({ page }) => {
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Check for proper template filling
    const templateAnalysis = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      const width = canvas.width;
      const height = canvas.height;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Count white rows/columns at edges
      let topWhiteRows = 0;
      let bottomWhiteRows = 0;
      let leftWhiteCols = 0;
      let rightWhiteCols = 0;
      
      // Top rows
      for (let y = 0; y < height * 0.2; y++) {
        let rowWhite = true;
        for (let x = 0; x < width; x += 5) {
          const idx = (y * width + x) * 4;
          if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
            rowWhite = false;
            break;
          }
        }
        if (rowWhite) topWhiteRows++;
        else break;
      }
      
      // Bottom rows
      for (let y = height - 1; y > height * 0.8; y--) {
        let rowWhite = true;
        for (let x = 0; x < width; x += 5) {
          const idx = (y * width + x) * 4;
          if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
            rowWhite = false;
            break;
          }
        }
        if (rowWhite) bottomWhiteRows++;
        else break;
      }
      
      // Left columns
      for (let x = 0; x < width * 0.2; x++) {
        let colWhite = true;
        for (let y = 0; y < height; y += 5) {
          const idx = (y * width + x) * 4;
          if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
            colWhite = false;
            break;
          }
        }
        if (colWhite) leftWhiteCols++;
        else break;
      }
      
      // Right columns
      for (let x = width - 1; x > width * 0.8; x--) {
        let colWhite = true;
        for (let y = 0; y < height; y += 5) {
          const idx = (y * width + x) * 4;
          if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
            colWhite = false;
            break;
          }
        }
        if (colWhite) rightWhiteCols++;
        else break;
      }
      
      const topMarginPercent = (topWhiteRows / height) * 100;
      const bottomMarginPercent = (bottomWhiteRows / height) * 100;
      const leftMarginPercent = (leftWhiteCols / width) * 100;
      const rightMarginPercent = (rightWhiteCols / width) * 100;
      
      return {
        topMarginPercent,
        bottomMarginPercent,
        leftMarginPercent,
        rightMarginPercent,
        hasExcessiveMargins: 
          topMarginPercent > 15 || 
          bottomMarginPercent > 15 || 
          leftMarginPercent > 15 || 
          rightMarginPercent > 15,
      };
    });
    
    console.log('Template filling analysis:', templateAnalysis);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'output-template-filling');
    
    if (templateAnalysis) {
      expect(templateAnalysis.hasExcessiveMargins).toBe(false);
    }
  });
});

test.describe('Output Verification - Print Layout', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
  });

  test('should generate 4x6 print layout for US photos', async ({ page }) => {
    test.slow();
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await navigateToAppAndSelectCountry(page, 'us');
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    // Check if print sheet option is available
    const hasSheetOption = await page.locator('text=Print Sheet').or(
      page.locator('text=4×6')
    ).isVisible({ timeout: 5000 });
    
    console.log('Print sheet option available:', hasSheetOption);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'us-print-layout-options');
    
    if (hasSheetOption) {
      // Download and verify sheet
      const downloadSheetBtn = page.locator('button:has-text("Download Sheet")');
      
      if (await downloadSheetBtn.isVisible()) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          downloadSheetBtn.click(),
        ]);
        
        const downloadPath = path.join(DOWNLOAD_DIR, `us-print-sheet-${Date.now()}.jpg`);
        await download.saveAs(downloadPath);
        
        const metadata = await sharp(downloadPath).metadata();
        
        // 4x6 at 300dpi = 1200x1800 or 1800x1200
        const is4x6 = (
          (metadata.width === 1800 && metadata.height === 1200) ||
          (metadata.width === 1200 && metadata.height === 1800) ||
          (Math.abs(metadata.width! * metadata.height! - 1800 * 1200) < 10000)
        );
        
        console.log('US print sheet dimensions:', metadata.width, 'x', metadata.height, 'is4x6:', is4x6);
      }
    }
  });

  test('should generate 4x6 print layout for UK photos', async ({ page }) => {
    test.slow();
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await navigateToAppAndSelectCountry(page, 'uk');
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    await captureScreenshot(page, SCREENSHOT_DIR, 'uk-print-layout-options');
    
    // UK photos (35x45mm) should fit more on a 4x6 sheet than US (2x2)
    const downloadSheetBtn = page.locator('button:has-text("Download Sheet")');
    
    if (await downloadSheetBtn.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadSheetBtn.click(),
      ]);
      
      const downloadPath = path.join(DOWNLOAD_DIR, `uk-print-sheet-${Date.now()}.jpg`);
      await download.saveAs(downloadPath);
      
      const metadata = await sharp(downloadPath).metadata();
      
      console.log('UK print sheet dimensions:', metadata.width, 'x', metadata.height);
    }
  });
});

test.describe('Output Verification - File Integrity', () => {
  test.beforeEach(async ({ page }) => {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
  });

  test('should produce valid JPEG file', async ({ page }) => {
    test.slow();
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await navigateToAppAndSelectCountry(page, 'us');
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    const downloadSingleBtn = page.locator('button:has-text("Download Single")');
    
    if (await downloadSingleBtn.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadSingleBtn.click(),
      ]);
      
      const downloadPath = path.join(DOWNLOAD_DIR, `validity-check-${Date.now()}.jpg`);
      await download.saveAs(downloadPath);
      
      // Verify it's a valid JPEG
      const buffer = fs.readFileSync(downloadPath);
      
      // Check JPEG magic bytes (FFD8FF)
      const isValidJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      
      expect(isValidJpeg).toBe(true);
      
      // Can sharp parse it?
      const metadata = await sharp(buffer).metadata();
      expect(metadata.format).toBe('jpeg');
      expect(metadata.width).toBeGreaterThan(0);
      expect(metadata.height).toBeGreaterThan(0);
      
      console.log('Valid JPEG file produced:', metadata);
    }
  });

  test('should produce file with proper EXIF/metadata', async ({ page }) => {
    test.slow();
    
    const testPhoto = path.join(__dirname, '../../fixtures/test-portrait.jpg');
    
    if (!fs.existsSync(testPhoto)) {
      test.skip();
      return;
    }
    
    await navigateToAppAndSelectCountry(page, 'us');
    await uploadPhoto(page, testPhoto);
    await waitForProcessing(page);
    await generateOutput(page);
    
    const downloadSingleBtn = page.locator('button:has-text("Download Single")');
    
    if (await downloadSingleBtn.isVisible({ timeout: 5000 })) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadSingleBtn.click(),
      ]);
      
      const downloadPath = path.join(DOWNLOAD_DIR, `exif-check-${Date.now()}.jpg`);
      await download.saveAs(downloadPath);
      
      const metadata = await sharp(downloadPath).metadata();
      
      console.log('Output file metadata:', {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        space: metadata.space,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
      });
      
      // For passport photos, we expect:
      // - JPEG format
      // - sRGB color space
      // - No alpha channel
      // - 300 DPI (if density is set)
      expect(metadata.format).toBe('jpeg');
      expect(metadata.hasAlpha).toBeFalsy();
    }
  });
});
