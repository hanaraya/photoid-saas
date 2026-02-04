/**
 * Visual Quality Analyzer for E2E Tests
 *
 * Analyzes passport photo images for quality issues:
 * - Blur detection
 * - Background quality
 * - Face positioning
 * - Color analysis
 * - Manipulation detection
 */

import sharp from 'sharp';

export const US_PASSPORT_SPECS = {
  width: 600, // 2 inches at 300 DPI
  height: 600,
  headMinRatio: 0.5, // 50% of frame
  headMaxRatio: 0.69, // 69% of frame
  backgroundColor: { r: 255, g: 255, b: 255 },
};

export const UK_PASSPORT_SPECS = {
  width: 413, // 35mm at 300 DPI
  height: 531, // 45mm at 300 DPI
  headMinRatio: 0.64, // 29mm / 45mm
  headMaxRatio: 0.75, // 34mm / 45mm
  backgroundColor: { r: 255, g: 255, b: 255 }, // Also accepts cream/grey
};

export interface ImageQualityResult {
  dimensions: { width: number; height: number };
  isCorrectSize: boolean;
  blurScore: number;
  isBlurry: boolean;
  brightness: number;
  isProperlyExposed: boolean;
  backgroundWhiteness: number;
  hasWhiteBackground: boolean;
  edgeQuality: number;
  hasHaloArtifacts: boolean;
  colorBalance: {
    red: number;
    green: number;
    blue: number;
    isBalanced: boolean;
  };
  overallScore: number;
  issues: string[];
}

/**
 * Analyze image quality from a buffer
 */
export async function analyzeImageQuality(
  imageBuffer: Buffer,
  specs: typeof US_PASSPORT_SPECS | typeof UK_PASSPORT_SPECS = US_PASSPORT_SPECS
): Promise<ImageQualityResult> {
  const issues: string[] = [];

  // Get metadata and raw pixels
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const { data: pixels, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  // Check dimensions
  const isCorrectSize =
    Math.abs(width - specs.width) < 10 && Math.abs(height - specs.height) < 10;

  if (!isCorrectSize) {
    issues.push(
      `Incorrect dimensions: ${width}x${height}, expected ${specs.width}x${specs.height}`
    );
  }

  // Calculate blur score using Laplacian variance
  let laplacianSum = 0;
  let laplacianCount = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * channels;
      const gray =
        channels >= 3
          ? (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
          : pixels[idx];

      const grayUp =
        channels >= 3
          ? (pixels[((y - 1) * width + x) * channels] +
              pixels[((y - 1) * width + x) * channels + 1] +
              pixels[((y - 1) * width + x) * channels + 2]) /
            3
          : pixels[((y - 1) * width + x) * channels];

      const grayDown =
        channels >= 3
          ? (pixels[((y + 1) * width + x) * channels] +
              pixels[((y + 1) * width + x) * channels + 1] +
              pixels[((y + 1) * width + x) * channels + 2]) /
            3
          : pixels[((y + 1) * width + x) * channels];

      const grayLeft =
        channels >= 3
          ? (pixels[(y * width + x - 1) * channels] +
              pixels[(y * width + x - 1) * channels + 1] +
              pixels[(y * width + x - 1) * channels + 2]) /
            3
          : pixels[(y * width + x - 1) * channels];

      const grayRight =
        channels >= 3
          ? (pixels[(y * width + x + 1) * channels] +
              pixels[(y * width + x + 1) * channels + 1] +
              pixels[(y * width + x + 1) * channels + 2]) /
            3
          : pixels[(y * width + x + 1) * channels];

      const laplacian = grayUp + grayDown + grayLeft + grayRight - 4 * gray;
      laplacianSum += laplacian * laplacian;
      laplacianCount++;
    }
  }

  const blurScore = laplacianSum / laplacianCount;
  const isBlurry = blurScore < 50;

  if (isBlurry) {
    issues.push(`Image appears blurry (score: ${blurScore.toFixed(1)})`);
  }

  // Calculate brightness
  let brightnessSum = 0;
  for (let i = 0; i < pixels.length; i += channels) {
    const brightness =
      channels >= 3
        ? (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
        : pixels[i];
    brightnessSum += brightness;
  }
  const brightness = brightnessSum / (width * height);
  const isProperlyExposed = brightness > 80 && brightness < 200;

  if (!isProperlyExposed) {
    if (brightness <= 80) {
      issues.push(
        `Image is underexposed (brightness: ${brightness.toFixed(1)})`
      );
    } else {
      issues.push(
        `Image is overexposed (brightness: ${brightness.toFixed(1)})`
      );
    }
  }

  // Check background whiteness (sample corners)
  const cornerSamples: number[][] = [];
  const margin = 5;

  for (const [x, y] of [
    [margin, margin],
    [width - margin, margin],
    [margin, height - margin],
    [width - margin, height - margin],
  ]) {
    const idx = (y * width + x) * channels;
    if (channels >= 3) {
      cornerSamples.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
    } else {
      cornerSamples.push([pixels[idx], pixels[idx], pixels[idx]]);
    }
  }

  const avgBgR =
    cornerSamples.reduce((a, s) => a + s[0], 0) / cornerSamples.length;
  const avgBgG =
    cornerSamples.reduce((a, s) => a + s[1], 0) / cornerSamples.length;
  const avgBgB =
    cornerSamples.reduce((a, s) => a + s[2], 0) / cornerSamples.length;

  const backgroundWhiteness = (avgBgR + avgBgG + avgBgB) / (3 * 255);
  const hasWhiteBackground = avgBgR > 240 && avgBgG > 240 && avgBgB > 240;

  if (!hasWhiteBackground) {
    issues.push(
      `Background is not white (RGB: ${avgBgR.toFixed(0)}, ${avgBgG.toFixed(0)}, ${avgBgB.toFixed(0)})`
    );
  }

  // Check for halo artifacts (bright ring around subject)
  let haloScore = 0;
  const centerX = width / 2;
  const centerY = height * 0.4;
  const scanRadius = Math.min(width, height) * 0.35;

  for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
    for (let r = scanRadius * 0.85; r < scanRadius * 1.15; r += 5) {
      const x = Math.floor(centerX + Math.cos(angle) * r);
      const y = Math.floor(centerY + Math.sin(angle) * r);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * channels;
        const brightness =
          channels >= 3
            ? (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3
            : pixels[idx];

        // Mid-brightness pixels suggest halo (not face, not pure white)
        if (brightness > 210 && brightness < 248) {
          haloScore++;
        }
      }
    }
  }

  const hasHaloArtifacts = haloScore > 40;
  const edgeQuality = 100 - haloScore / 2;

  if (hasHaloArtifacts) {
    issues.push('Possible halo artifacts from background removal');
  }

  // Color balance analysis
  let totalR = 0,
    totalG = 0,
    totalB = 0,
    pixelCount = 0;

  for (let y = Math.floor(height * 0.2); y < height * 0.7; y += 3) {
    for (let x = Math.floor(width * 0.25); x < width * 0.75; x += 3) {
      const idx = (y * width + x) * channels;

      if (channels >= 3) {
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // Skip white pixels
        if (r > 245 && g > 245 && b > 245) continue;

        totalR += r;
        totalG += g;
        totalB += b;
        pixelCount++;
      }
    }
  }

  const avgR = pixelCount > 0 ? totalR / pixelCount : 128;
  const avgG = pixelCount > 0 ? totalG / pixelCount : 128;
  const avgB = pixelCount > 0 ? totalB / pixelCount : 128;

  // Check for unnatural color casts
  const colorBalance = {
    red: avgR,
    green: avgG,
    blue: avgB,
    isBalanced: Math.abs(avgR - avgG) < 50 && Math.abs(avgG - avgB) < 50,
  };

  // Calculate overall score
  let overallScore = 100;

  if (!isCorrectSize) overallScore -= 20;
  if (isBlurry) overallScore -= 25;
  if (!isProperlyExposed) overallScore -= 15;
  if (!hasWhiteBackground) overallScore -= 20;
  if (hasHaloArtifacts) overallScore -= 10;
  if (!colorBalance.isBalanced) overallScore -= 10;

  overallScore = Math.max(0, overallScore);

  return {
    dimensions: { width, height },
    isCorrectSize,
    blurScore,
    isBlurry,
    brightness,
    isProperlyExposed,
    backgroundWhiteness,
    hasWhiteBackground,
    edgeQuality,
    hasHaloArtifacts,
    colorBalance,
    overallScore,
    issues,
  };
}

/**
 * Detect potential image manipulation
 */
export async function detectManipulation(imageBuffer: Buffer): Promise<{
  isLikelyManipulated: boolean;
  confidence: number;
  reasons: string[];
}> {
  const reasons: string[] = [];
  let manipulationScore = 0;

  const image = sharp(imageBuffer);
  const { data: pixels, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  // Check for unnatural skin tones
  let unnaturalSkinCount = 0;
  let skinSampleCount = 0;

  const faceRegion = {
    x: Math.floor(width * 0.3),
    y: Math.floor(height * 0.2),
    w: Math.floor(width * 0.4),
    h: Math.floor(height * 0.4),
  };

  for (let y = faceRegion.y; y < faceRegion.y + faceRegion.h; y += 5) {
    for (let x = faceRegion.x; x < faceRegion.x + faceRegion.w; x += 5) {
      const idx = (y * width + x) * channels;

      if (channels >= 3) {
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // Skip white/black pixels
        if ((r > 240 && g > 240 && b > 240) || (r < 20 && g < 20 && b < 20)) {
          continue;
        }

        skinSampleCount++;

        // Check for unnatural colors
        const isNatural = r > g * 0.85 && r < g * 1.8 && r > b * 1.1;
        const isPink = r > 180 && b > g && b > 130;
        const isGreen = g > r && g > b && g > 150;
        const isMagenta = r > 150 && b > 150 && g < Math.min(r, b) * 0.8;

        if (isPink || isGreen || isMagenta || (!isNatural && r > 100)) {
          unnaturalSkinCount++;
        }
      }
    }
  }

  if (skinSampleCount > 0) {
    const unnaturalPercent = (unnaturalSkinCount / skinSampleCount) * 100;
    if (unnaturalPercent > 30) {
      manipulationScore += 30;
      reasons.push(
        `Unnatural skin tones detected (${unnaturalPercent.toFixed(1)}%)`
      );
    }
  }

  // Check for abnormal noise patterns (AI-generated images often have uniform noise)
  let noiseVariance = 0;
  let noiseCount = 0;

  for (let y = 1; y < height - 1; y += 4) {
    for (let x = 1; x < width - 1; x += 4) {
      const idx = (y * width + x) * channels;
      const idxRight = (y * width + x + 1) * channels;
      const idxDown = ((y + 1) * width + x) * channels;

      if (channels >= 3) {
        const grayCenter =
          (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        const grayRight =
          (pixels[idxRight] + pixels[idxRight + 1] + pixels[idxRight + 2]) / 3;
        const grayDown =
          (pixels[idxDown] + pixels[idxDown + 1] + pixels[idxDown + 2]) / 3;

        noiseVariance +=
          Math.abs(grayCenter - grayRight) + Math.abs(grayCenter - grayDown);
        noiseCount++;
      }
    }
  }

  const avgNoiseVariance = noiseCount > 0 ? noiseVariance / noiseCount : 0;

  // Very low variance might indicate AI smoothing
  if (avgNoiseVariance < 3) {
    manipulationScore += 20;
    reasons.push('Suspiciously smooth image (possible AI generation)');
  }

  // Check for repeating patterns (clone stamp detection)
  // This is a simplified check - real detection would be more sophisticated

  const confidence = Math.min(manipulationScore, 100);

  return {
    isLikelyManipulated: manipulationScore > 40,
    confidence,
    reasons,
  };
}

/**
 * Check if photo meets passport standards
 */
export async function meetsPassportStandards(
  imageBuffer: Buffer,
  specs: typeof US_PASSPORT_SPECS | typeof UK_PASSPORT_SPECS
): Promise<{
  passes: boolean;
  score: number;
  issues: string[];
}> {
  const analysis = await analyzeImageQuality(imageBuffer, specs);
  const manipulation = await detectManipulation(imageBuffer);

  const allIssues = [...analysis.issues, ...manipulation.reasons];

  let passes = true;

  // Critical failures
  if (!analysis.isCorrectSize) passes = false;
  if (analysis.isBlurry) passes = false;
  if (!analysis.hasWhiteBackground && specs === US_PASSPORT_SPECS)
    passes = false;
  if (manipulation.isLikelyManipulated) passes = false;

  return {
    passes,
    score: analysis.overallScore - manipulation.confidence * 0.3,
    issues: allIssues,
  };
}
