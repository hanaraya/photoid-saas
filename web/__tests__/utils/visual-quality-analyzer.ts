/**
 * Visual Quality Analyzer for Passport Photo Testing
 *
 * This utility analyzes processed passport photos to detect:
 * - Manipulation artifacts
 * - Unnatural skin tones
 * - Background removal quality (halos, artifacts)
 * - Proper face positioning
 * - Head size compliance
 * - Eye position verification
 * - Blurry or low-resolution outputs
 * - Proper lighting/exposure
 */

import sharp from 'sharp';

export interface QualityAnalysisResult {
  // Overall quality score (0-100)
  overallScore: number;

  // Individual checks
  checks: {
    manipulationArtifacts: QualityCheck;
    skinToneNatural: QualityCheck;
    backgroundQuality: QualityCheck;
    faceCentering: QualityCheck;
    headSizeRatio: QualityCheck;
    eyePosition: QualityCheck;
    sharpness: QualityCheck;
    lighting: QualityCheck;
    whiteMargins: QualityCheck;
    resolution: QualityCheck;
  };

  // Raw metrics
  metrics: {
    blurScore: number;
    averageBrightness: number;
    contrastRatio: number;
    edgeStrength: number;
    noiseLevel: number;
    colorDistribution: ColorDistribution;
    backgroundWhiteness: number;
    faceRegionStats: RegionStats | null;
  };

  // Should this photo pass?
  shouldPass: boolean;

  // Failure reasons
  failureReasons: string[];
}

export interface QualityCheck {
  passed: boolean;
  score: number;
  message: string;
  severity: 'pass' | 'warn' | 'fail';
}

export interface ColorDistribution {
  redMean: number;
  greenMean: number;
  blueMean: number;
  saturationMean: number;
  hueDistribution: number[];
}

export interface RegionStats {
  brightness: number;
  contrast: number;
  uniformity: number;
}

/**
 * Analyze image quality from a buffer
 */
export async function analyzeImageQuality(
  imageBuffer: Buffer,
  options: {
    countryStandard?: 'us' | 'uk' | 'eu' | 'canada' | 'india';
    expectedWidth?: number;
    expectedHeight?: number;
  } = {}
): Promise<QualityAnalysisResult> {
  const { countryStandard = 'us', expectedWidth, expectedHeight } = options;

  const failureReasons: string[] = [];

  // Get image metadata and raw pixels
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const { data: pixels, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Calculate metrics
  const metrics = await calculateMetrics(pixels, info);

  // Run individual checks
  const checks = {
    manipulationArtifacts: checkManipulationArtifacts(pixels, info, metrics),
    skinToneNatural: checkSkinToneNatural(metrics.colorDistribution),
    backgroundQuality: checkBackgroundQuality(pixels, info, metrics),
    faceCentering: checkFaceCentering(pixels, info),
    headSizeRatio: checkHeadSizeRatio(pixels, info, countryStandard),
    eyePosition: checkEyePosition(pixels, info, countryStandard),
    sharpness: checkSharpness(metrics.blurScore, metrics.edgeStrength),
    lighting: checkLighting(metrics.averageBrightness, metrics.contrastRatio),
    whiteMargins: checkWhiteMargins(pixels, info),
    resolution: checkResolution(
      metadata.width!,
      metadata.height!,
      expectedWidth,
      expectedHeight
    ),
  };

  // Collect failures
  for (const [name, check] of Object.entries(checks)) {
    if (check.severity === 'fail') {
      failureReasons.push(`${name}: ${check.message}`);
    }
  }

  // Calculate overall score
  const scores = Object.values(checks).map((c) => c.score);
  const overallScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  );

  // Determine if should pass
  const criticalFailures = Object.values(checks).filter(
    (c) => c.severity === 'fail'
  ).length;
  const shouldPass = criticalFailures === 0 && overallScore >= 70;

  return {
    overallScore,
    checks,
    metrics,
    shouldPass,
    failureReasons,
  };
}

/**
 * Calculate image metrics
 */
async function calculateMetrics(
  pixels: Buffer,
  info: { width: number; height: number; channels: number }
): Promise<QualityAnalysisResult['metrics']> {
  const { width, height, channels } = info;
  const pixelCount = width * height;

  // Calculate basic color statistics
  let redSum = 0,
    greenSum = 0,
    blueSum = 0;
  let brightnessSum = 0;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    redSum += r;
    greenSum += g;
    blueSum += b;
    brightnessSum += (r + g + b) / 3;
  }

  const redMean = redSum / pixelCount;
  const greenMean = greenSum / pixelCount;
  const blueMean = blueSum / pixelCount;
  const averageBrightness = brightnessSum / pixelCount;

  // Calculate contrast (standard deviation of brightness)
  let contrastSum = 0;
  for (let i = 0; i < pixels.length; i += channels) {
    const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    contrastSum += Math.pow(brightness - averageBrightness, 2);
  }
  const contrastRatio = Math.sqrt(contrastSum / pixelCount);

  // Calculate blur score (Laplacian variance approximation)
  const blurScore = calculateLaplacianVariance(pixels, width, height, channels);

  // Calculate edge strength (Sobel-like)
  const edgeStrength = calculateEdgeStrength(pixels, width, height, channels);

  // Calculate noise level
  const noiseLevel = calculateNoiseLevel(pixels, width, height, channels);

  // Calculate saturation
  let saturationSum = 0;
  const hueHistogram = new Array(12).fill(0); // 12 hue bins

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    saturationSum += saturation;

    // Calculate hue
    if (max !== min) {
      let hue = 0;
      if (max === r) hue = ((g - b) / (max - min)) % 6;
      else if (max === g) hue = 2 + (b - r) / (max - min);
      else hue = 4 + (r - g) / (max - min);
      hue = Math.round(((hue * 60 + 360) % 360) / 30);
      if (hue >= 0 && hue < 12) hueHistogram[hue]++;
    }
  }

  // Calculate background whiteness (average of corners and edges)
  const backgroundWhiteness = calculateBackgroundWhiteness(
    pixels,
    width,
    height,
    channels
  );

  return {
    blurScore,
    averageBrightness,
    contrastRatio,
    edgeStrength,
    noiseLevel,
    colorDistribution: {
      redMean,
      greenMean,
      blueMean,
      saturationMean: saturationSum / pixelCount,
      hueDistribution: hueHistogram,
    },
    backgroundWhiteness,
    faceRegionStats: null, // Would need face detection to calculate
  };
}

/**
 * Calculate Laplacian variance for blur detection
 */
function calculateLaplacianVariance(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number
): number {
  const laplacian: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * channels;
      const idxUp = ((y - 1) * width + x) * channels;
      const idxDown = ((y + 1) * width + x) * channels;
      const idxLeft = (y * width + (x - 1)) * channels;
      const idxRight = (y * width + (x + 1)) * channels;

      // Grayscale conversion
      const center = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      const up = (pixels[idxUp] + pixels[idxUp + 1] + pixels[idxUp + 2]) / 3;
      const down =
        (pixels[idxDown] + pixels[idxDown + 1] + pixels[idxDown + 2]) / 3;
      const left =
        (pixels[idxLeft] + pixels[idxLeft + 1] + pixels[idxLeft + 2]) / 3;
      const right =
        (pixels[idxRight] + pixels[idxRight + 1] + pixels[idxRight + 2]) / 3;

      const lap = up + down + left + right - 4 * center;
      laplacian.push(lap);
    }
  }

  if (laplacian.length === 0) return 0;

  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const variance =
    laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    laplacian.length;

  return variance;
}

/**
 * Calculate edge strength
 */
function calculateEdgeStrength(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number
): number {
  let edgeSum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = (y * width + x) * channels;
      const idxRight = (y * width + (x + 1)) * channels;
      const idxDown = ((y + 1) * width + x) * channels;

      const center = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      const right =
        (pixels[idxRight] + pixels[idxRight + 1] + pixels[idxRight + 2]) / 3;
      const down =
        (pixels[idxDown] + pixels[idxDown + 1] + pixels[idxDown + 2]) / 3;

      const gx = Math.abs(right - center);
      const gy = Math.abs(down - center);
      edgeSum += Math.sqrt(gx * gx + gy * gy);
      count++;
    }
  }

  return count > 0 ? edgeSum / count : 0;
}

/**
 * Calculate noise level
 */
function calculateNoiseLevel(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number
): number {
  let noiseSum = 0;
  let count = 0;

  // Sample random 3x3 regions and calculate local variance
  const sampleSize = Math.min(1000, (width * height) / 9);

  for (let i = 0; i < sampleSize; i++) {
    const x = Math.floor(Math.random() * (width - 3)) + 1;
    const y = Math.floor(Math.random() * (height - 3)) + 1;

    let localSum = 0;
    const localValues: number[] = [];

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const idx = ((y + dy) * width + (x + dx)) * channels;
        const val = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        localValues.push(val);
        localSum += val;
      }
    }

    const localMean = localSum / 9;
    const localVar =
      localValues.reduce((sum, val) => sum + Math.pow(val - localMean, 2), 0) /
      9;
    noiseSum += Math.sqrt(localVar);
    count++;
  }

  return count > 0 ? noiseSum / count : 0;
}

/**
 * Calculate background whiteness
 */
function calculateBackgroundWhiteness(
  pixels: Buffer,
  width: number,
  height: number,
  channels: number
): number {
  const sampleSize = 50;
  let whiteSum = 0;
  let count = 0;

  // Sample corners
  const corners = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
  ];

  for (const corner of corners) {
    for (let dx = 0; dx < sampleSize && corner.x + dx < width; dx++) {
      for (let dy = 0; dy < sampleSize && corner.y + dy < height; dy++) {
        const idx = ((corner.y + dy) * width + (corner.x + dx)) * channels;
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];

        // Calculate whiteness (255 is pure white)
        const whiteness = (r + g + b) / 3 / 255;
        whiteSum += whiteness;
        count++;
      }
    }
  }

  return count > 0 ? whiteSum / count : 0;
}

// Quality check functions
function checkManipulationArtifacts(
  pixels: Buffer,
  info: { width: number; height: number; channels: number },
  metrics: QualityAnalysisResult['metrics']
): QualityCheck {
  // Check for common manipulation artifacts:
  // 1. Unusual noise patterns
  // 2. Edge inconsistencies around subject
  // 3. Color banding

  const { noiseLevel, edgeStrength } = metrics;

  // High noise with low edges often indicates over-processing
  const artifactScore = noiseLevel > 15 && edgeStrength < 10 ? 0.5 : 1;

  // Check for color banding (visible steps in gradients)
  let bandingCount = 0;
  for (let y = 10; y < info.height - 10; y += 5) {
    for (let x = 10; x < info.width - 10; x += 5) {
      const idx = (y * info.width + x) * info.channels;
      const idxNext = (y * info.width + (x + 1)) * info.channels;

      const diff = Math.abs(pixels[idx] - pixels[idxNext]);
      if (diff >= 5 && diff <= 8) bandingCount++;
    }
  }

  const bandingRatio = bandingCount / ((info.width / 5) * (info.height / 5));
  const hasBanding = bandingRatio > 0.3;

  const score = Math.round(
    (artifactScore * 0.5 + (hasBanding ? 0.3 : 1) * 0.5) * 100
  );

  return {
    passed: score >= 70,
    score,
    message:
      score >= 70
        ? 'No obvious manipulation artifacts'
        : 'Possible manipulation artifacts detected',
    severity: score >= 70 ? 'pass' : score >= 50 ? 'warn' : 'fail',
  };
}

function checkSkinToneNatural(colorDist: ColorDistribution): QualityCheck {
  // Natural skin tones have certain RGB relationships
  // Red should be highest, then green, then blue
  // Saturation should be moderate (not too vivid or too grey)

  const { redMean, greenMean, blueMean, saturationMean } = colorDist;

  // Check if colors are in natural order (for faces)
  const colorBalance =
    redMean >= greenMean * 0.9 && greenMean >= blueMean * 0.9;

  // Check saturation is reasonable (0.1-0.5 for natural skin)
  const saturationOk = saturationMean >= 0.05 && saturationMean <= 0.6;

  // Check for over-saturated or under-saturated images
  const isOverSaturated = saturationMean > 0.7;
  const isUnderSaturated = saturationMean < 0.03;

  let score = 100;
  let message = 'Skin tones appear natural';

  if (!colorBalance) {
    score -= 30;
    message = 'Unusual color balance detected';
  }

  if (!saturationOk) {
    score -= 20;
    message = isOverSaturated
      ? 'Colors appear over-saturated'
      : 'Colors appear washed out';
  }

  return {
    passed: score >= 70,
    score: Math.max(0, score),
    message,
    severity: score >= 70 ? 'pass' : score >= 50 ? 'warn' : 'fail',
  };
}

function checkBackgroundQuality(
  pixels: Buffer,
  info: { width: number; height: number; channels: number },
  metrics: QualityAnalysisResult['metrics']
): QualityCheck {
  const { backgroundWhiteness } = metrics;

  // Background should be very white (> 0.95 for passport photos)
  const isWhite = backgroundWhiteness >= 0.9;

  // Check for halos (bright rings around subject edges)
  // This is detected by looking for high contrast edges in the corners
  let haloScore = 100;

  // Sample edge transitions
  const edgeWidth = Math.floor(info.width * 0.15);
  for (let y = info.height * 0.3; y < info.height * 0.7; y += 10) {
    // Check left edge
    const leftIdx = (Math.floor(y) * info.width + edgeWidth) * info.channels;
    const leftVal =
      (pixels[leftIdx] + pixels[leftIdx + 1] + pixels[leftIdx + 2]) / 3;

    // Check right edge
    const rightIdx =
      (Math.floor(y) * info.width + (info.width - edgeWidth)) * info.channels;
    const rightVal =
      (pixels[rightIdx] + pixels[rightIdx + 1] + pixels[rightIdx + 2]) / 3;

    // If edge is brighter than expected (halo), reduce score
    if (leftVal > 250 || rightVal > 250) {
      // Check nearby pixel
      const nearLeftIdx =
        (Math.floor(y) * info.width + edgeWidth + 5) * info.channels;
      const nearLeftVal =
        (pixels[nearLeftIdx] +
          pixels[nearLeftIdx + 1] +
          pixels[nearLeftIdx + 2]) /
        3;

      if (Math.abs(leftVal - nearLeftVal) > 30) {
        haloScore -= 5;
      }
    }
  }

  const finalScore = Math.round(
    (isWhite ? 100 : backgroundWhiteness * 100) * 0.7 + haloScore * 0.3
  );

  return {
    passed: finalScore >= 70,
    score: Math.max(0, finalScore),
    message: !isWhite
      ? `Background not sufficiently white (${Math.round(backgroundWhiteness * 100)}%)`
      : haloScore < 70
        ? 'Background has halo artifacts around subject'
        : 'Background quality is good',
    severity: finalScore >= 80 ? 'pass' : finalScore >= 60 ? 'warn' : 'fail',
  };
}

function checkFaceCentering(
  pixels: Buffer,
  info: { width: number; height: number; channels: number }
): QualityCheck {
  // Approximate face centering by finding the center of mass of darker pixels
  // (face is typically darker than white background)

  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;

      // Weight darker pixels more heavily (face region)
      const weight = Math.max(0, 255 - brightness);
      weightedX += x * weight;
      weightedY += y * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return {
      passed: true,
      score: 50,
      message: 'Could not determine face position (image may be too uniform)',
      severity: 'warn',
    };
  }

  const centerX = weightedX / totalWeight;
  const centerY = weightedY / totalWeight;

  // Expected center
  const expectedX = info.width / 2;
  const expectedY = info.height * 0.45; // Face should be slightly above center

  // Calculate offset
  const offsetX = Math.abs(centerX - expectedX) / info.width;
  const offsetY = Math.abs(centerY - expectedY) / info.height;

  const score = Math.round(100 - (offsetX * 100 + offsetY * 50));

  return {
    passed: score >= 70,
    score: Math.max(0, score),
    message:
      score >= 70
        ? 'Face is properly centered'
        : `Face is off-center (X: ${Math.round(offsetX * 100)}%, Y: ${Math.round(offsetY * 100)}%)`,
    severity: score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail',
  };
}

function checkHeadSizeRatio(
  pixels: Buffer,
  info: { width: number; height: number; channels: number },
  countryStandard: string
): QualityCheck {
  // Head size requirements:
  // US: 50-69% of frame height (1" to 1-3/8" in 2" frame)
  // UK: 29-34mm in 45mm frame = 64-76%
  // EU: 32-36mm in 45mm frame = 71-80%

  const requirements: Record<string, { min: number; max: number }> = {
    us: { min: 0.5, max: 0.69 },
    uk: { min: 0.64, max: 0.76 },
    eu: { min: 0.71, max: 0.8 },
    canada: { min: 0.44, max: 0.51 }, // 31-36mm in 70mm
    india: { min: 0.5, max: 0.69 }, // Same as US
  };

  const req = requirements[countryStandard] || requirements.us;

  // Find approximate head height by finding vertical extent of non-white pixels
  let topY = info.height;
  let bottomY = 0;

  const threshold = 240; // Pixels darker than this are considered face

  for (let y = 0; y < info.height; y++) {
    for (let x = info.width * 0.25; x < info.width * 0.75; x++) {
      const idx = (y * Math.floor(info.width) + Math.floor(x)) * info.channels;
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;

      if (brightness < threshold) {
        topY = Math.min(topY, y);
        bottomY = Math.max(bottomY, y);
      }
    }
  }

  if (topY >= bottomY) {
    return {
      passed: false,
      score: 0,
      message: 'Could not detect head boundaries',
      severity: 'fail',
    };
  }

  const headHeight = bottomY - topY;
  const headRatio = headHeight / info.height;

  const isWithinRange = headRatio >= req.min && headRatio <= req.max;
  const score = isWithinRange
    ? 100
    : Math.max(0, 100 - Math.abs(headRatio - (req.min + req.max) / 2) * 200);

  return {
    passed: isWithinRange,
    score: Math.round(score),
    message: isWithinRange
      ? `Head size ratio is correct (${Math.round(headRatio * 100)}%)`
      : `Head size ratio ${Math.round(headRatio * 100)}% is outside ${Math.round(req.min * 100)}-${Math.round(req.max * 100)}% requirement`,
    severity: isWithinRange ? 'pass' : 'fail',
  };
}

function checkEyePosition(
  pixels: Buffer,
  info: { width: number; height: number; channels: number },
  countryStandard: string
): QualityCheck {
  // Eye position requirements from bottom of photo:
  // US: 1-1/8" to 1-3/8" from bottom in 2" frame = 56-69% from bottom
  // UK: ~30mm from bottom in 45mm frame = 67% from bottom
  // EU: ~30mm from bottom in 45mm frame = 67% from bottom

  const requirements: Record<string, { min: number; max: number }> = {
    us: { min: 0.56, max: 0.69 },
    uk: { min: 0.64, max: 0.7 },
    eu: { min: 0.64, max: 0.7 },
    canada: { min: 0.57, max: 0.63 }, // 42mm from bottom in 70mm
    india: { min: 0.56, max: 0.69 }, // Same as US
  };

  const req = requirements[countryStandard] || requirements.us;

  // Approximate eye position by finding the darkest horizontal band
  // (eyes are typically the darkest part of the face)
  const bandHeight = Math.floor(info.height * 0.05);
  let darkestY = 0;
  let darkestBrightness = 255;

  for (let y = info.height * 0.2; y < info.height * 0.6; y++) {
    let bandBrightness = 0;
    let count = 0;

    for (let dy = 0; dy < bandHeight && y + dy < info.height; dy++) {
      for (let x = info.width * 0.25; x < info.width * 0.75; x++) {
        const idx =
          ((Math.floor(y) + dy) * info.width + Math.floor(x)) * info.channels;
        bandBrightness += (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        count++;
      }
    }

    bandBrightness /= count;

    if (bandBrightness < darkestBrightness) {
      darkestBrightness = bandBrightness;
      darkestY = y;
    }
  }

  const eyePositionFromBottom = 1 - darkestY / info.height;
  const isWithinRange =
    eyePositionFromBottom >= req.min && eyePositionFromBottom <= req.max;

  const score = isWithinRange
    ? 100
    : Math.max(
        0,
        100 - Math.abs(eyePositionFromBottom - (req.min + req.max) / 2) * 200
      );

  return {
    passed: isWithinRange,
    score: Math.round(score),
    message: isWithinRange
      ? `Eye position is correct (${Math.round(eyePositionFromBottom * 100)}% from bottom)`
      : `Eye position ${Math.round(eyePositionFromBottom * 100)}% from bottom is outside ${Math.round(req.min * 100)}-${Math.round(req.max * 100)}% requirement`,
    severity: isWithinRange ? 'pass' : score >= 60 ? 'warn' : 'fail',
  };
}

function checkSharpness(blurScore: number, edgeStrength: number): QualityCheck {
  // Blur score < 100 indicates blurry image
  // Edge strength < 5 indicates very soft/blurry image

  const isSharp = blurScore >= 100 && edgeStrength >= 5;
  const isAcceptable = blurScore >= 50 && edgeStrength >= 3;

  const score = Math.min(100, Math.round(blurScore / 2 + edgeStrength * 5));

  return {
    passed: isAcceptable,
    score: Math.max(0, score),
    message: isSharp
      ? 'Image is sharp and in focus'
      : isAcceptable
        ? 'Image sharpness is acceptable'
        : `Image appears blurry (blur score: ${Math.round(blurScore)}, edge: ${Math.round(edgeStrength)})`,
    severity: isSharp ? 'pass' : isAcceptable ? 'warn' : 'fail',
  };
}

function checkLighting(
  averageBrightness: number,
  contrastRatio: number
): QualityCheck {
  // Good lighting: brightness 100-200, contrast 30-80
  const brightOk = averageBrightness >= 100 && averageBrightness <= 220;
  const contrastOk = contrastRatio >= 20 && contrastRatio <= 100;

  let score = 100;
  const messages: string[] = [];

  if (averageBrightness < 100) {
    score -= 30;
    messages.push('Image is too dark');
  } else if (averageBrightness > 220) {
    score -= 20;
    messages.push('Image is overexposed');
  }

  if (contrastRatio < 20) {
    score -= 20;
    messages.push('Image lacks contrast');
  } else if (contrastRatio > 100) {
    score -= 10;
    messages.push('Image has excessive contrast');
  }

  return {
    passed: score >= 70,
    score: Math.max(0, score),
    message:
      messages.length === 0
        ? 'Lighting is even and appropriate'
        : messages.join('; '),
    severity: score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail',
  };
}

function checkWhiteMargins(
  pixels: Buffer,
  info: { width: number; height: number; channels: number }
): QualityCheck {
  // Check for unnecessary white margins (face not filling frame properly)
  const marginSize = Math.floor(Math.min(info.width, info.height) * 0.1);

  let topMarginWhite = 0;
  let bottomMarginWhite = 0;
  let leftMarginWhite = 0;
  let rightMarginWhite = 0;
  let total = 0;

  const whiteThreshold = 245;

  // Check top margin
  for (let y = 0; y < marginSize; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      if (brightness > whiteThreshold) topMarginWhite++;
      total++;
    }
  }

  // Check bottom margin
  for (let y = info.height - marginSize; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      if (brightness > whiteThreshold) bottomMarginWhite++;
    }
  }

  // Check left margin
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < marginSize; x++) {
      const idx = (y * info.width + x) * info.channels;
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      if (brightness > whiteThreshold) leftMarginWhite++;
    }
  }

  // Check right margin
  for (let y = 0; y < info.height; y++) {
    for (let x = info.width - marginSize; x < info.width; x++) {
      const idx = (y * info.width + x) * info.channels;
      const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      if (brightness > whiteThreshold) rightMarginWhite++;
    }
  }

  const marginTotal =
    marginSize * info.width * 2 + marginSize * info.height * 2;
  const totalWhite =
    topMarginWhite + bottomMarginWhite + leftMarginWhite + rightMarginWhite;
  const whiteRatio = totalWhite / marginTotal;

  // Some white is expected (background), but too much indicates excessive margins
  const hasExcessiveMargins =
    whiteRatio > 0.95 &&
    (topMarginWhite / (marginSize * info.width) > 0.98 ||
      bottomMarginWhite / (marginSize * info.width) > 0.98);

  const score = hasExcessiveMargins ? 60 : 100;

  return {
    passed: !hasExcessiveMargins,
    score,
    message: hasExcessiveMargins
      ? 'Image has excessive white margins - face may be too small'
      : 'Image framing is appropriate',
    severity: hasExcessiveMargins ? 'warn' : 'pass',
  };
}

function checkResolution(
  width: number,
  height: number,
  expectedWidth?: number,
  expectedHeight?: number
): QualityCheck {
  // Minimum resolution for print quality: 600x600 at 300 DPI
  const minDimension = Math.min(width, height);
  const hasGoodResolution = minDimension >= 600;

  let dimensionMatch = true;
  if (expectedWidth && expectedHeight) {
    dimensionMatch = width === expectedWidth && height === expectedHeight;
  }

  const score =
    hasGoodResolution && dimensionMatch
      ? 100
      : hasGoodResolution
        ? 80
        : minDimension >= 400
          ? 60
          : 30;

  return {
    passed: hasGoodResolution,
    score,
    message: !hasGoodResolution
      ? `Resolution too low (${width}×${height}, min 600×600)`
      : !dimensionMatch && expectedWidth
        ? `Dimensions mismatch (got ${width}×${height}, expected ${expectedWidth}×${expectedHeight})`
        : `Resolution is good (${width}×${height})`,
    severity: score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail',
  };
}

/**
 * Compare two images for visual regression
 */
export async function compareImages(
  image1: Buffer,
  image2: Buffer,
  threshold: number = 0.1
): Promise<{ match: boolean; diffPercentage: number }> {
  const img1 = await sharp(image1).raw().toBuffer({ resolveWithObject: true });
  const img2 = await sharp(image2).raw().toBuffer({ resolveWithObject: true });

  if (
    img1.info.width !== img2.info.width ||
    img1.info.height !== img2.info.height
  ) {
    return { match: false, diffPercentage: 100 };
  }

  let diffCount = 0;
  const totalPixels = img1.info.width * img1.info.height;

  for (let i = 0; i < img1.data.length; i += img1.info.channels) {
    const diff =
      Math.abs(img1.data[i] - img2.data[i]) +
      Math.abs(img1.data[i + 1] - img2.data[i + 1]) +
      Math.abs(img1.data[i + 2] - img2.data[i + 2]);

    if (diff > 30) diffCount++;
  }

  const diffPercentage = (diffCount / totalPixels) * 100;

  return {
    match: diffPercentage <= threshold * 100,
    diffPercentage,
  };
}
