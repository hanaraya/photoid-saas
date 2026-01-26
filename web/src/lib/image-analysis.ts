/**
 * Image analysis utilities for compliance checking
 * - Blur detection (Laplacian variance)
 * - Face angle detection (eye alignment)
 */

export interface ImageAnalysis {
  blurScore: number; // Higher = sharper, < 100 is blurry
  isBlurry: boolean;
  eyeTilt: number; // Degrees of tilt (0 = level)
  isTilted: boolean; // > 5 degrees is considered tilted
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
 * Analyze image for blur and face orientation
 */
export function analyzeImage(
  img: HTMLImageElement,
  faceData: { leftEye: { x: number; y: number } | null; rightEye: { x: number; y: number } | null } | null
): ImageAnalysis {
  const blurScore = detectBlur(img);
  const eyeTilt = faceData ? calculateEyeTilt(faceData.leftEye, faceData.rightEye) : 0;

  return {
    blurScore,
    isBlurry: blurScore < 100, // Threshold for blur detection
    eyeTilt,
    isTilted: Math.abs(eyeTilt) > 8, // More than 8 degrees is tilted
  };
}
