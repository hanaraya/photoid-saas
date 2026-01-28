/**
 * Image analysis utilities for compliance checking
 * - Blur detection (Laplacian variance)
 * - Face angle detection (eye alignment)
 * - Exposure detection (brightness histogram)
 * - Halo/edge artifact detection
 */

export interface ExposureAnalysis {
  brightness: number; // 0-255 mean brightness
  isOverexposed: boolean; // > 200 mean brightness
  isUnderexposed: boolean; // < 60 mean brightness
  isProperlyExposed: boolean; // Within acceptable range
}

export interface HaloAnalysis {
  haloScore: number; // 0-100, higher = more halo artifacts
  hasHaloArtifacts: boolean; // > 30 indicates significant halos
  edgeQuality: number; // 0-100, higher = better edges
}

export interface ImageAnalysis {
  blurScore: number; // Higher = sharper, < 100 is blurry
  isBlurry: boolean;
  eyeTilt: number; // Degrees of tilt (0 = level)
  isTilted: boolean; // > 5 degrees is considered tilted
  isGrayscale: boolean; // True if image lacks color
  faceLightingScore: number; // 0-100, higher = more even lighting
  hasUnevenLighting: boolean; // True if significant shadows detected
  exposure: ExposureAnalysis; // Brightness/exposure analysis
  halo: HaloAnalysis; // Halo/edge artifact analysis
}

/**
 * Detect blur using Laplacian variance
 * Lower values = more blurry
 */
export function detectBlur(img: HTMLImageElement): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 999; // Assume sharp if can't analyze

  // Use smaller size for performance
  const maxSize = 300;
  const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Convert to grayscale
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = new Float32Array(canvas.width * canvas.height);
  
  for (let i = 0; i < gray.length; i++) {
    const r = imageData.data[i * 4];
    const g = imageData.data[i * 4 + 1];
    const b = imageData.data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Apply Laplacian kernel and compute variance
  // Laplacian kernel: [0, 1, 0], [1, -4, 1], [0, 1, 0]
  const width = canvas.width;
  const height = canvas.height;
  const laplacian: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap =
        gray[idx - width] +
        gray[idx - 1] +
        -4 * gray[idx] +
        gray[idx + 1] +
        gray[idx + width];
      laplacian.push(lap);
    }
  }

  // Compute variance
  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const variance =
    laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    laplacian.length;

  return variance;
}

/**
 * Calculate face tilt angle from eye positions
 * Returns angle in degrees (positive = tilted right, negative = tilted left)
 */
export function calculateEyeTilt(
  leftEye: { x: number; y: number } | null,
  rightEye: { x: number; y: number } | null
): number {
  if (!leftEye || !rightEye) return 0;

  const deltaY = rightEye.y - leftEye.y;
  const deltaX = rightEye.x - leftEye.x;

  // Calculate angle in degrees
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = (angleRad * 180) / Math.PI;

  return angleDeg;
}

/**
 * Analyze image exposure using brightness histogram
 * Returns brightness metrics and exposure status
 */
export function analyzeExposure(img: HTMLImageElement): ExposureAnalysis {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      brightness: 128,
      isOverexposed: false,
      isUnderexposed: false,
      isProperlyExposed: true,
    };
  }

  // Use smaller size for performance
  const maxSize = 200;
  const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  let brightnessSum = 0;
  const pixelCount = canvas.width * canvas.height;
  
  // Build brightness histogram
  const histogram = new Array(256).fill(0);
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    // Use luminance formula for perceived brightness
    const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    brightnessSum += brightness;
    histogram[brightness]++;
  }
  
  const meanBrightness = brightnessSum / pixelCount;
  
  // Check for overexposure: significant pixels at max brightness
  const overexposedPixels = histogram.slice(245).reduce((a, b) => a + b, 0);
  const overexposedRatio = overexposedPixels / pixelCount;
  
  // Check for underexposure: significant pixels at min brightness
  const underexposedPixels = histogram.slice(0, 30).reduce((a, b) => a + b, 0);
  const underexposedRatio = underexposedPixels / pixelCount;
  
  // Thresholds
  const isOverexposed = meanBrightness > 200 || overexposedRatio > 0.3;
  const isUnderexposed = meanBrightness < 60 || underexposedRatio > 0.4;
  const isProperlyExposed = !isOverexposed && !isUnderexposed;
  
  return {
    brightness: meanBrightness,
    isOverexposed,
    isUnderexposed,
    isProperlyExposed,
  };
}

/**
 * Calculate blur score using Laplacian variance on raw image data
 * Works with ImageData from canvas (for server-side or worker use)
 */
export function calculateBlurScore(imageData: ImageData): number {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;
  
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // Apply Laplacian kernel and compute variance
  const laplacian: number[] = [];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap =
        gray[idx - width] +
        gray[idx - 1] +
        -4 * gray[idx] +
        gray[idx + 1] +
        gray[idx + width];
      laplacian.push(lap);
    }
  }

  if (laplacian.length === 0) return 0;

  // Compute variance
  const mean = laplacian.reduce((a, b) => a + b, 0) / laplacian.length;
  const variance =
    laplacian.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    laplacian.length;

  return variance;
}

/**
 * Detect halo artifacts around the subject (common after background removal)
 * Analyzes edge regions for suspicious brightness patterns
 */
export function detectHaloArtifacts(
  img: HTMLImageElement,
  faceData: { x: number; y: number; w: number; h: number } | null
): HaloAnalysis {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return { haloScore: 0, hasHaloArtifacts: false, edgeQuality: 100 };
  }

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;
  const data = imageData.data;
  
  // Define scan region around expected face/head area
  const centerX = faceData ? faceData.x + faceData.w / 2 : width / 2;
  const centerY = faceData ? faceData.y + faceData.h * 0.3 : height * 0.35;
  const scanRadius = faceData ? Math.max(faceData.w, faceData.h) * 0.8 : Math.min(width, height) * 0.35;
  
  let haloPixelCount = 0;
  let edgePixelCount = 0;
  let transitionScore = 0;
  
  // Scan in a ring around the subject area
  for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
    for (let r = scanRadius * 0.7; r < scanRadius * 1.3; r += 3) {
      const x = Math.floor(centerX + Math.cos(angle) * r);
      const y = Math.floor(centerY + Math.sin(angle) * r);
      
      if (x >= 1 && x < width - 1 && y >= 1 && y < height - 1) {
        edgePixelCount++;
        const idx = (y * width + x) * 4;
        
        const r_val = data[idx];
        const g_val = data[idx + 1];
        const b_val = data[idx + 2];
        const brightness = (r_val + g_val + b_val) / 3;
        
        // Detect bright halo pixels (not quite white, but bright)
        // These indicate poor edge quality from background removal
        if (brightness > 220 && brightness < 252) {
          // Check if neighboring pixel is darker (edge transition)
          const innerIdx = ((y - Math.sign(Math.sin(angle))) * width + (x - Math.sign(Math.cos(angle)))) * 4;
          const innerBrightness = (data[innerIdx] + data[innerIdx + 1] + data[innerIdx + 2]) / 3;
          
          if (innerBrightness < brightness - 30) {
            haloPixelCount++;
          }
        }
        
        // Check for rough edges (high local variance)
        const neighbors = [
          ((y - 1) * width + x) * 4,
          ((y + 1) * width + x) * 4,
          (y * width + x - 1) * 4,
          (y * width + x + 1) * 4,
        ];
        
        let variance = 0;
        for (const nIdx of neighbors) {
          const nBrightness = (data[nIdx] + data[nIdx + 1] + data[nIdx + 2]) / 3;
          variance += Math.abs(brightness - nBrightness);
        }
        variance /= 4;
        
        // High variance at edges suggests rough cutout
        if (variance > 50) {
          transitionScore++;
        }
      }
    }
  }
  
  // Calculate halo score (0-100)
  const haloRatio = edgePixelCount > 0 ? haloPixelCount / edgePixelCount : 0;
  const haloScore = Math.min(100, haloRatio * 200);
  
  // Calculate edge quality (100 = smooth, 0 = rough)
  const roughnessRatio = edgePixelCount > 0 ? transitionScore / edgePixelCount : 0;
  const edgeQuality = Math.max(0, 100 - roughnessRatio * 150);
  
  // Has halo if score > 30 (15% of edge pixels show halo pattern)
  const hasHaloArtifacts = haloScore > 30;
  
  return {
    haloScore,
    hasHaloArtifacts,
    edgeQuality,
  };
}

/**
 * Detect if image is grayscale (lacks color)
 * Returns true if the image appears to be black & white
 */
export function detectGrayscale(img: HTMLImageElement): boolean {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Sample at smaller size for performance
  const maxSize = 100;
  const scale = Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight, 1);
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let colorDiffSum = 0;
  const pixelCount = canvas.width * canvas.height;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    
    // Calculate color difference (how far from grayscale)
    const avg = (r + g + b) / 3;
    colorDiffSum += Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg);
  }

  // Average color difference per pixel
  const avgColorDiff = colorDiffSum / pixelCount;
  
  // If average color difference is very low, image is grayscale
  // Threshold ~10 allows for slight color casts in B&W photos
  return avgColorDiff < 10;
}

/**
 * Analyze lighting evenness in the face region
 * Returns a score 0-100 (higher = more even lighting)
 */
export function analyzeFaceLighting(
  img: HTMLImageElement,
  faceData: { x: number; y: number; w: number; h: number } | null
): number {
  if (!faceData) return 100; // Can't analyze without face

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 100;

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  // Get face region (expand slightly for context)
  const padding = faceData.w * 0.1;
  const x = Math.max(0, Math.round(faceData.x - padding));
  const y = Math.max(0, Math.round(faceData.y - padding));
  const w = Math.min(canvas.width - x, Math.round(faceData.w + padding * 2));
  const h = Math.min(canvas.height - y, Math.round(faceData.h + padding * 2));

  const imageData = ctx.getImageData(x, y, w, h);

  // Split face into left and right halves, compare brightness
  const leftBrightness: number[] = [];
  const rightBrightness: number[] = [];

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const idx = (py * w + px) * 4;
      const brightness = 
        0.299 * imageData.data[idx] +
        0.587 * imageData.data[idx + 1] +
        0.114 * imageData.data[idx + 2];

      if (px < w / 2) {
        leftBrightness.push(brightness);
      } else {
        rightBrightness.push(brightness);
      }
    }
  }

  const leftAvg = leftBrightness.reduce((a, b) => a + b, 0) / leftBrightness.length;
  const rightAvg = rightBrightness.reduce((a, b) => a + b, 0) / rightBrightness.length;

  // Calculate asymmetry as percentage difference
  const avgBrightness = (leftAvg + rightAvg) / 2;
  const asymmetry = Math.abs(leftAvg - rightAvg) / Math.max(avgBrightness, 1) * 100;

  // Convert to score (0 asymmetry = 100 score, >30% asymmetry = 0 score)
  const score = Math.max(0, 100 - asymmetry * 3.33);
  
  return Math.round(score);
}

/**
 * Analyze image for blur and face orientation
 */
export function analyzeImage(
  img: HTMLImageElement,
  faceData: { x: number; y: number; w: number; h: number; leftEye: { x: number; y: number } | null; rightEye: { x: number; y: number } | null } | null
): ImageAnalysis {
  const blurScore = detectBlur(img);
  const eyeTilt = faceData ? calculateEyeTilt(faceData.leftEye, faceData.rightEye) : 0;
  const isGrayscale = detectGrayscale(img);
  const faceLightingScore = analyzeFaceLighting(img, faceData);
  const exposure = analyzeExposure(img);
  const halo = detectHaloArtifacts(img, faceData);

  return {
    blurScore,
    isBlurry: blurScore < 100, // Threshold for blur detection
    eyeTilt,
    isTilted: Math.abs(eyeTilt) > 8, // More than 8 degrees is tilted
    isGrayscale,
    faceLightingScore,
    hasUnevenLighting: faceLightingScore < 60, // Less than 60 = significant shadow
    exposure,
    halo,
  };
}
