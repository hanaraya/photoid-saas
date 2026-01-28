/**
 * Visual quality analysis utilities for E2E tests
 * These check for quality issues that the app should detect
 */

import { Page } from '@playwright/test';

export interface VisualQualityReport {
  overallScore: number; // 0-100
  issues: QualityIssue[];
  passes: string[];
}

export interface QualityIssue {
  type: QualityIssueType;
  severity: 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
}

export type QualityIssueType =
  | 'blur'
  | 'halo'
  | 'unnatural_skin'
  | 'uneven_lighting'
  | 'wrong_dimensions'
  | 'low_resolution'
  | 'head_too_small'
  | 'head_too_large'
  | 'off_center'
  | 'cropped_head'
  | 'colored_background'
  | 'grayscale'
  | 'excessive_margins'
  | 'artifacts'
  | 'tilt';

/**
 * Analyze canvas for comprehensive visual quality
 */
export async function analyzeVisualQuality(page: Page): Promise<VisualQualityReport> {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      return {
        overallScore: 0,
        issues: [{ type: 'artifacts' as const, severity: 'error' as const, message: 'No canvas found' }],
        passes: [],
      };
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        overallScore: 0,
        issues: [{ type: 'artifacts' as const, severity: 'error' as const, message: 'Cannot get canvas context' }],
        passes: [],
      };
    }
    
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    const issues: Array<{
      type: string;
      severity: 'error' | 'warning';
      message: string;
      details?: Record<string, unknown>;
    }> = [];
    const passes: string[] = [];
    
    // 1. Check dimensions (US: 600x600, UK: 413x531 at 300dpi)
    const isUSSize = Math.abs(width - 600) < 30 && Math.abs(height - 600) < 30;
    const isUKSize = Math.abs(width - 413) < 30 && Math.abs(height - 531) < 30;
    
    if (!isUSSize && !isUKSize) {
      issues.push({
        type: 'wrong_dimensions',
        severity: 'warning',
        message: `Unusual dimensions: ${width}x${height}`,
        details: { width, height, expectedUS: '600x600', expectedUK: '413x531' },
      });
    } else {
      passes.push('Dimensions are correct');
    }
    
    // 2. Check resolution
    if (width < 400 || height < 400) {
      issues.push({
        type: 'low_resolution',
        severity: 'error',
        message: 'Image resolution too low',
        details: { width, height, minimum: 400 },
      });
    } else {
      passes.push('Resolution is adequate');
    }
    
    // 3. Analyze background color (sample corners and edges)
    const bgSamples: number[][] = [];
    const margin = 5;
    
    // Sample corners
    for (const x of [margin, width - margin]) {
      for (const y of [margin, height - margin]) {
        const idx = (y * width + x) * 4;
        bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
    
    // Sample edge midpoints
    for (const x of [width / 2]) {
      for (const y of [margin, height - margin]) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        bgSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
      }
    }
    
    const avgBgR = bgSamples.reduce((a, s) => a + s[0], 0) / bgSamples.length;
    const avgBgG = bgSamples.reduce((a, s) => a + s[1], 0) / bgSamples.length;
    const avgBgB = bgSamples.reduce((a, s) => a + s[2], 0) / bgSamples.length;
    
    const isWhiteBackground = avgBgR > 240 && avgBgG > 240 && avgBgB > 240;
    const isGrayBackground = 
      Math.abs(avgBgR - avgBgG) < 10 && 
      Math.abs(avgBgG - avgBgB) < 10 && 
      avgBgR > 180;
    
    if (!isWhiteBackground && !isGrayBackground) {
      issues.push({
        type: 'colored_background',
        severity: 'error',
        message: 'Background is not white',
        details: { avgBgR: Math.round(avgBgR), avgBgG: Math.round(avgBgG), avgBgB: Math.round(avgBgB) },
      });
    } else {
      passes.push('Background is white/light');
    }
    
    // 4. Check for grayscale (lack of color)
    let colorVariance = 0;
    const sampleStep = 20;
    let samples = 0;
    
    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const avg = (r + g + b) / 3;
        colorVariance += Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
        samples++;
      }
    }
    
    const avgColorVariance = colorVariance / samples;
    if (avgColorVariance < 8) {
      issues.push({
        type: 'grayscale',
        severity: 'error',
        message: 'Image appears to be grayscale',
        details: { colorVariance: avgColorVariance.toFixed(2) },
      });
    } else {
      passes.push('Image is in color');
    }
    
    // 5. Check for blur using Laplacian variance
    let laplacianSum = 0;
    let laplacianCount = 0;
    
    for (let y = 1; y < height - 1; y += 3) {
      for (let x = 1; x < width - 1; x += 3) {
        const idx = (y * width + x) * 4;
        const idxUp = ((y - 1) * width + x) * 4;
        const idxDown = ((y + 1) * width + x) * 4;
        const idxLeft = (y * width + (x - 1)) * 4;
        const idxRight = (y * width + (x + 1)) * 4;
        
        // Convert to grayscale
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const grayUp = (data[idxUp] + data[idxUp + 1] + data[idxUp + 2]) / 3;
        const grayDown = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;
        const grayLeft = (data[idxLeft] + data[idxLeft + 1] + data[idxLeft + 2]) / 3;
        const grayRight = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
        
        // Laplacian
        const lap = grayUp + grayDown + grayLeft + grayRight - 4 * gray;
        laplacianSum += lap * lap;
        laplacianCount++;
      }
    }
    
    const blurScore = laplacianSum / laplacianCount;
    if (blurScore < 80) {
      issues.push({
        type: 'blur',
        severity: 'warning',
        message: 'Image appears blurry',
        details: { blurScore: blurScore.toFixed(2), threshold: 80 },
      });
    } else {
      passes.push('Image is sharp');
    }
    
    // 6. Check for halo artifacts (bright pixels around edges that aren't background)
    let haloScore = 0;
    const centerX = width / 2;
    const centerY = height * 0.4; // Face typically in upper portion
    const scanRadius = Math.min(width, height) * 0.35;
    
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      for (let r = scanRadius * 0.8; r < scanRadius * 1.2; r += 5) {
        const x = Math.floor(centerX + Math.cos(angle) * r);
        const y = Math.floor(centerY + Math.sin(angle) * r);
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          
          // Check for mid-brightness (halo is neither face color nor pure white)
          if (brightness > 200 && brightness < 250) {
            haloScore++;
          }
        }
      }
    }
    
    if (haloScore > 50) {
      issues.push({
        type: 'halo',
        severity: 'warning',
        message: 'Possible halo artifact from background removal',
        details: { haloScore },
      });
    } else {
      passes.push('No halo artifacts detected');
    }
    
    // 7. Check for uneven lighting
    let leftBrightness = 0, rightBrightness = 0;
    let leftCount = 0, rightCount = 0;
    
    for (let y = Math.floor(height * 0.2); y < height * 0.6; y += 5) {
      for (let x = Math.floor(width * 0.2); x < width * 0.5; x += 5) {
        const idx = (y * width + x) * 4;
        leftBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        leftCount++;
      }
      for (let x = Math.floor(width * 0.5); x < width * 0.8; x += 5) {
        const idx = (y * width + x) * 4;
        rightBrightness += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        rightCount++;
      }
    }
    
    const leftAvg = leftBrightness / leftCount;
    const rightAvg = rightBrightness / rightCount;
    const asymmetry = Math.abs(leftAvg - rightAvg);
    
    if (asymmetry > 30) {
      issues.push({
        type: 'uneven_lighting',
        severity: 'warning',
        message: 'Uneven lighting detected on face',
        details: { leftAvg: leftAvg.toFixed(1), rightAvg: rightAvg.toFixed(1), asymmetry: asymmetry.toFixed(1) },
      });
    } else {
      passes.push('Lighting is even');
    }
    
    // 8. Check for excessive white margins
    let topMargin = 0, bottomMargin = 0;
    
    for (let y = 0; y < height * 0.15; y++) {
      let rowWhite = true;
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
          rowWhite = false;
          break;
        }
      }
      if (rowWhite) topMargin++;
      else break;
    }
    
    for (let y = height - 1; y > height * 0.85; y--) {
      let rowWhite = true;
      for (let x = 0; x < width; x += 10) {
        const idx = (y * width + x) * 4;
        if (data[idx] < 250 || data[idx + 1] < 250 || data[idx + 2] < 250) {
          rowWhite = false;
          break;
        }
      }
      if (rowWhite) bottomMargin++;
      else break;
    }
    
    const marginPercent = ((topMargin + bottomMargin) / height) * 100;
    if (marginPercent > 20) {
      issues.push({
        type: 'excessive_margins',
        severity: 'warning',
        message: 'Excessive white margins detected',
        details: { marginPercent: marginPercent.toFixed(1) + '%' },
      });
    } else {
      passes.push('Margins are appropriate');
    }
    
    // 9. Check for unnatural skin tones
    // Sample pixels from the likely face area
    const faceRegion = { x: width * 0.3, y: height * 0.2, w: width * 0.4, h: height * 0.4 };
    const skinSamples: number[][] = [];
    
    for (let y = faceRegion.y; y < faceRegion.y + faceRegion.h; y += 8) {
      for (let x = faceRegion.x; x < faceRegion.x + faceRegion.w; x += 8) {
        const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        
        // Skip if near white (background)
        if (r > 240 && g > 240 && b > 240) continue;
        // Skip if very dark
        if (r < 50 && g < 50 && b < 50) continue;
        
        skinSamples.push([r, g, b]);
      }
    }
    
    if (skinSamples.length > 0) {
      // Check for unnatural colors
      let unnaturalCount = 0;
      for (const [r, g, b] of skinSamples) {
        // Natural skin: red > green > blue typically, with specific hue ranges
        const isNatural = r > g * 0.85 && r < g * 1.8 && r > b * 1.1;
        // Pink/magenta tones are unnatural
        const isPink = r > 150 && b > g && b > 100;
        // Green tints are unnatural
        const isGreenish = g > r && g > b && g > 150;
        
        if (isPink || isGreenish || (!isNatural && r > 100)) {
          unnaturalCount++;
        }
      }
      
      const unnaturalPercent = (unnaturalCount / skinSamples.length) * 100;
      if (unnaturalPercent > 30) {
        issues.push({
          type: 'unnatural_skin',
          severity: 'warning',
          message: 'Unnatural skin tones detected',
          details: { unnaturalPercent: unnaturalPercent.toFixed(1) + '%' },
        });
      } else {
        passes.push('Skin tones appear natural');
      }
    }
    
    // Calculate overall score
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const overallScore = Math.max(0, 100 - (errorCount * 25) - (warningCount * 10));
    
    return {
      overallScore,
      issues: issues as Array<{
        type: QualityIssueType;
        severity: 'error' | 'warning';
        message: string;
        details?: Record<string, unknown>;
      }>,
      passes,
    };
  }) as Promise<VisualQualityReport>;
}

/**
 * Check if the processed image meets passport quality standards
 */
export async function meetsQualityStandards(
  page: Page, 
  strictMode = false
): Promise<{ passes: boolean; reason: string }> {
  const report = await analyzeVisualQuality(page);
  
  if (strictMode) {
    if (report.issues.length > 0) {
      return { 
        passes: false, 
        reason: `Found ${report.issues.length} issues: ${report.issues.map(i => i.type).join(', ')}` 
      };
    }
    return { passes: true, reason: 'All quality checks passed' };
  }
  
  // Normal mode: only fail on errors
  const errors = report.issues.filter(i => i.severity === 'error');
  if (errors.length > 0) {
    return { 
      passes: false, 
      reason: `Found ${errors.length} errors: ${errors.map(i => i.type).join(', ')}` 
    };
  }
  
  return { 
    passes: true, 
    reason: report.issues.length > 0 
      ? `Passed with ${report.issues.length} warnings` 
      : 'All quality checks passed' 
  };
}
