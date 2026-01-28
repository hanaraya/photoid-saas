/**
 * Camera Analysis Utilities
 * Real-time analysis for passport photo capture guidance
 * 
 * ARCHITECTURE:
 * - All validation uses simulateCrop() for ground truth
 * - Oval dimensions match exactly what produces valid crops
 * - No hardcoded thresholds that can drift from crop algorithm
 */

export interface HeadHeightRange {
  min: number; // As decimal (0.50 = 50%)
  max: number;
}

export interface OvalDimensions {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  minHeight: number;
  maxHeight: number;
}

export interface FacePositionResult {
  isCentered: boolean;
  faceDetected: boolean;
  horizontalOffset: number; // -1 to 1, negative = left, positive = right
  verticalOffset: number; // -1 to 1, negative = up, positive = down
  direction: 'left' | 'right' | 'center';
  verticalDirection: 'up' | 'down' | 'center';
  overlapPercent: number;
}

export interface DistanceResult {
  status: 'too-close' | 'too-far' | 'good';
  isGood: boolean;
  message: string;
  percentFromTarget: number;
}

export interface BrightnessResult {
  status: 'too-dark' | 'too-bright' | 'good';
  isGood: boolean;
  icon: string;
  message: string;
  score: number; // 0-100
}

export interface HeadTiltResult {
  isLevel: boolean;
  eyesDetected: boolean;
  tiltAngle: number; // Degrees, positive = tilted left, negative = tilted right
  direction: 'left' | 'right' | 'level';
}

export interface CameraConditions {
  allGood: boolean;
  readyToCapture: boolean;
  issues: string[];
}

/**
 * Face-to-head ratio constant (derived from HEAD_TO_FACE_RATIO)
 * Face bbox (chin to eyebrows) ≈ 71.4% of full head height
 * Full head = face + forehead + hair
 */
const FACE_TO_HEAD_RATIO = 1 / HEAD_TO_FACE_RATIO;

/**
 * Country-specific head height requirements as percentage of photo height
 * These are the OUTPUT requirements - what the final photo needs
 */
const COUNTRY_HEAD_HEIGHTS: Record<string, HeadHeightRange> = {
  // United States: 1-1.375 inches in 2 inch photo = 50-69%
  us: { min: 0.50, max: 0.69 },
  us_visa: { min: 0.50, max: 0.69 },
  us_drivers: { min: 0.50, max: 0.69 },
  green_card: { min: 0.50, max: 0.69 },
  
  // United Kingdom: 29-34mm in 45mm photo = 64-75.5%
  uk: { min: 0.64, max: 0.755 },
  uk_visa: { min: 0.64, max: 0.755 },
  
  // European Union: 32-36mm in 45mm photo = 71-80%
  eu: { min: 0.71, max: 0.80 },
  schengen_visa: { min: 0.71, max: 0.80 },
  germany: { min: 0.71, max: 0.80 },
  france: { min: 0.71, max: 0.80 },
  
  // Canada: 31-36mm in 70mm photo = 44-51%
  canada: { min: 0.44, max: 0.51 },
  
  // India: Same as US (2x2 inch, 1-1.375 inch head)
  india: { min: 0.50, max: 0.69 },
  india_visa: { min: 0.50, max: 0.69 },
  
  // Australia: 32-36mm in 45mm = 71-80%
  australia: { min: 0.71, max: 0.80 },
  
  // China: 28-33mm in 48mm photo = 58-69%
  china: { min: 0.58, max: 0.69 },
  china_visa: { min: 0.58, max: 0.69 },
  
  // Japan/Korea: Similar to EU
  japan: { min: 0.71, max: 0.80 },
  south_korea: { min: 0.71, max: 0.80 },
  
  // Brazil/Mexico: Similar to Canada
  brazil: { min: 0.44, max: 0.51 },
  mexico: { min: 0.71, max: 0.80 },
};

// Default to US standard
const DEFAULT_HEAD_HEIGHT: HeadHeightRange = { min: 0.50, max: 0.69 };

/**
 * Get head height range for a country (output spec)
 */
export function getCountryHeadHeightRange(countryCode: string): HeadHeightRange {
  return COUNTRY_HEAD_HEIGHTS[countryCode] || DEFAULT_HEAD_HEIGHT;
}

/**
 * Get CAMERA face height range for a country
 * This converts head requirements to face bbox requirements
 */
export function getCameraFaceHeightRange(countryCode: string): HeadHeightRange {
  const headRange = getCountryHeadHeightRange(countryCode);
  return {
    min: headRange.min * FACE_TO_HEAD_RATIO,
    max: headRange.max * FACE_TO_HEAD_RATIO,
  };
}

/**
 * Calculate the ideal vertical position for face center in camera
 * 
 * This is derived from the crop algorithm's eye positioning logic:
 * - Crop positions eyes at eyeFromBottom from bottom of output
 * - Eyes are at ~35% from TOP of face bbox (60% down from top)
 * - Face center should be positioned so eyes land at correct height
 * 
 * For a camera frame, the ideal face position ensures the crop can:
 * 1. Position eyes at the correct height
 * 2. Have the crown visible with margin
 * 3. Have the chin visible with margin
 * 
 * Calculation:
 * - In output, eyes should be at (1 - eyeFromBottom/h) from top
 * - For US: 1 - 1.25/2 = 1 - 0.625 = 0.375 (37.5% from top)
 * - Eyes are at 35% down from face top, so face top = eyeY - 0.35*faceH
 * - Face center = face top + 0.5*faceH = eyeY - 0.35*faceH + 0.5*faceH = eyeY + 0.15*faceH
 * 
 * In camera frame, we want similar proportions to give the crop room to work.
 * Target face center at ~40% from top works well for most standards.
 */
export function getIdealFaceCenterY(countryCode: string, viewportHeight: number): number {
  // Use a consistent 40% from top for face center
  // This gives room above the head for the crop to work
  // The crop algorithm handles the precise eye positioning
  return viewportHeight * 0.40;
}

/**
 * Calculate oval dimensions for face positioning guide
 * 
 * CRITICAL: This must match what simulateCrop() validates!
 * The oval is a VISUAL GUIDE showing where the face should be for a valid crop.
 */
export function calculateOvalDimensions(
  countryCode: string,
  viewportWidth: number,
  viewportHeight: number
): OvalDimensions {
  // Get face height range (converted from head requirements)
  const faceRange = getCameraFaceHeightRange(countryCode);
  
  // Target: 35% between min and max (matches crop algorithm's target scale)
  // This ensures users aiming for the oval target get ideal results
  const targetFacePercent = faceRange.min + (faceRange.max - faceRange.min) * 0.35;
  
  // Oval shows the TARGET face size
  const ovalHeight = viewportHeight * targetFacePercent;
  const ovalWidth = ovalHeight * 0.75; // Face width ≈ 75% of height
  
  // Center horizontally
  const centerX = viewportWidth / 2;
  
  // Vertical position: consistent 40% from top
  // This is where getIdealFaceCenterY returns
  const centerY = getIdealFaceCenterY(countryCode, viewportHeight);
  
  return {
    centerX,
    centerY,
    width: ovalWidth,
    height: ovalHeight,
    // Min/max guides show the valid FACE height range
    minHeight: viewportHeight * faceRange.min,
    maxHeight: viewportHeight * faceRange.max,
  };
}

/**
 * Analyze face position relative to the ideal camera position
 */
export function analyzeFacePosition(
  faceBox: { x: number; y: number; w: number; h: number } | null,
  viewportWidth: number,
  viewportHeight: number,
  idealCenterY?: number
): FacePositionResult {
  if (!faceBox) {
    return {
      isCentered: false,
      faceDetected: false,
      horizontalOffset: 0,
      verticalOffset: 0,
      direction: 'center',
      verticalDirection: 'center',
      overlapPercent: 0,
    };
  }
  
  // Calculate face center
  const faceCenterX = faceBox.x + faceBox.w / 2;
  const faceCenterY = faceBox.y + faceBox.h / 2;
  
  // Target centers
  const viewportCenterX = viewportWidth / 2;
  const viewportCenterY = viewportHeight / 2;
  
  // Use provided ideal center Y, or default to 40% from top
  // This should match calculateOvalDimensions' centerY
  const targetCenterY = idealCenterY ?? (viewportHeight * 0.40);
  
  // Calculate offset as percentage (-1 to 1)
  const horizontalOffset = (faceCenterX - viewportCenterX) / viewportCenterX;
  const verticalOffset = (faceCenterY - targetCenterY) / viewportCenterY;
  
  // Tolerance for "centered" (15% horizontal, 20% vertical for flexibility)
  const hTolerance = 0.15;
  const vTolerance = 0.20;
  
  const isHorizontallyCentered = Math.abs(horizontalOffset) <= hTolerance;
  const isVerticallyCentered = Math.abs(verticalOffset) <= vTolerance;
  
  // Determine direction
  let direction: 'left' | 'right' | 'center' = 'center';
  if (horizontalOffset < -hTolerance) direction = 'left';
  else if (horizontalOffset > hTolerance) direction = 'right';
  
  let verticalDirection: 'up' | 'down' | 'center' = 'center';
  if (verticalOffset < -vTolerance) verticalDirection = 'up';
  else if (verticalOffset > vTolerance) verticalDirection = 'down';
  
  // Calculate overlap with ideal position (simplified)
  const idealWidth = viewportWidth * 0.3;
  const idealHeight = viewportHeight * 0.5;
  const idealX = viewportCenterX - idealWidth / 2;
  const idealY = targetCenterY - idealHeight / 2;
  
  const overlapX = Math.max(0, Math.min(faceBox.x + faceBox.w, idealX + idealWidth) - Math.max(faceBox.x, idealX));
  const overlapY = Math.max(0, Math.min(faceBox.y + faceBox.h, idealY + idealHeight) - Math.max(faceBox.y, idealY));
  const overlapArea = overlapX * overlapY;
  const faceArea = faceBox.w * faceBox.h;
  const overlapPercent = faceArea > 0 ? (overlapArea / faceArea) * 100 : 0;
  
  return {
    isCentered: isHorizontallyCentered && isVerticallyCentered,
    faceDetected: true,
    horizontalOffset,
    verticalOffset,
    direction,
    verticalDirection,
    overlapPercent: Math.min(100, overlapPercent),
  };
}

/**
 * Analyze distance based on face size relative to viewport
 * 
 * DEPRECATED: Use analyzeDistanceWithCropSimulation instead.
 * Kept for backward compatibility with test-camera page.
 */
export function analyzeDistance(
  faceHeight: number,
  viewportHeight: number,
  countryCode: string
): DistanceResult {
  if (faceHeight === 0 || viewportHeight === 0) {
    return {
      status: 'too-far',
      isGood: false,
      message: 'Move closer to the camera',
      percentFromTarget: -100,
    };
  }
  
  // Get face range and calculate target
  const faceRange = getCameraFaceHeightRange(countryCode);
  const targetFacePercent = faceRange.min + (faceRange.max - faceRange.min) * 0.35;
  const actualFacePercent = faceHeight / viewportHeight;
  const percentFromTarget = ((actualFacePercent - targetFacePercent) / targetFacePercent) * 100;
  
  // Allow ±20% from target for green status
  // This matches the crop algorithm's flexibility
  const maxGoodFace = faceRange.max * 1.05; // Small buffer above max
  const minGoodFace = faceRange.min * 0.95; // Small buffer below min
  
  if (actualFacePercent > maxGoodFace) {
    return {
      status: 'too-close',
      isGood: false,
      message: 'Move back slightly',
      percentFromTarget,
    };
  }
  
  if (actualFacePercent < minGoodFace) {
    return {
      status: 'too-far',
      isGood: false,
      message: 'Move closer',
      percentFromTarget,
    };
  }
  
  return {
    status: 'good',
    isGood: true,
    message: 'Perfect!',
    percentFromTarget,
  };
}

/**
 * Analyze frame brightness from ImageData
 */
export function analyzeBrightness(imageData: ImageData): BrightnessResult {
  const data = imageData.data;
  
  if (data.length === 0) {
    return {
      status: 'too-dark',
      isGood: false,
      icon: '🌑',
      message: 'No image data',
      score: 0,
    };
  }
  
  // Calculate average brightness (using luminance formula)
  let totalBrightness = 0;
  const pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance formula
    totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b;
  }
  
  const avgBrightness = totalBrightness / pixelCount;
  
  // Convert to 0-100 score
  const score = Math.round((avgBrightness / 255) * 100);
  
  // Thresholds
  const TOO_DARK_THRESHOLD = 25;
  const TOO_BRIGHT_THRESHOLD = 85;
  
  if (score < TOO_DARK_THRESHOLD) {
    return {
      status: 'too-dark',
      isGood: false,
      icon: '🌑',
      message: 'Too dark - increase lighting',
      score,
    };
  }
  
  if (score > TOO_BRIGHT_THRESHOLD) {
    return {
      status: 'too-bright',
      isGood: false,
      icon: '💡',
      message: 'Too bright - reduce lighting',
      score,
    };
  }
  
  return {
    status: 'good',
    isGood: true,
    icon: '☀️',
    message: 'Good lighting',
    score,
  };
}

/**
 * Analyze head tilt from eye positions
 */
export function analyzeHeadTilt(
  leftEye: { x: number; y: number } | null,
  rightEye: { x: number; y: number } | null
): HeadTiltResult {
  if (!leftEye || !rightEye) {
    return {
      isLevel: false,
      eyesDetected: false,
      tiltAngle: 0,
      direction: 'level',
    };
  }
  
  // Calculate angle between eyes
  const deltaY = rightEye.y - leftEye.y;
  const deltaX = rightEye.x - leftEye.x;
  
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = (angleRad * 180) / Math.PI;
  
  // Tolerance for "level" (5 degrees)
  const LEVEL_TOLERANCE = 5;
  
  const isLevel = Math.abs(angleDeg) <= LEVEL_TOLERANCE;
  
  let direction: 'left' | 'right' | 'level' = 'level';
  if (angleDeg > LEVEL_TOLERANCE) {
    direction = 'left';
  } else if (angleDeg < -LEVEL_TOLERANCE) {
    direction = 'right';
  }
  
  return {
    isLevel,
    eyesDetected: true,
    tiltAngle: angleDeg,
    direction,
  };
}

/**
 * Check all conditions and determine if ready to capture
 */
export function checkAllConditions(
  position: FacePositionResult,
  distance: DistanceResult,
  brightness: BrightnessResult,
  tilt: HeadTiltResult
): CameraConditions {
  const issues: string[] = [];
  
  if (!position.faceDetected) {
    issues.push('no-face');
  }
  
  if (!position.isCentered && position.faceDetected) {
    issues.push('position');
  }
  
  if (!distance.isGood) {
    issues.push('distance');
  }
  
  if (!brightness.isGood) {
    issues.push('lighting');
  }
  
  if (!tilt.isLevel && tilt.eyesDetected) {
    issues.push('tilt');
  }
  
  const allGood = issues.length === 0;
  
  return {
    allGood,
    readyToCapture: allGood,
    issues,
  };
}

/**
 * Extract a region of ImageData for analysis
 */
export function extractRegionBrightness(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): ImageData {
  const safeX = Math.max(0, Math.round(x));
  const safeY = Math.max(0, Math.round(y));
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  
  return ctx.getImageData(safeX, safeY, safeWidth, safeHeight);
}

/**
 * Crop-based distance analysis
 * Uses the actual crop simulation to determine if position is good
 * 
 * This is the SOURCE OF TRUTH for camera validation.
 * If simulateCrop says it's good, the crop will be good.
 */
import { simulateCrop, type CropSimulationResult } from './crop';
import { STANDARDS, HEAD_TO_FACE_RATIO } from './photo-standards';

export interface CropBasedAnalysis {
  distance: DistanceResult;
  simulation: CropSimulationResult | null;
}

export function analyzeDistanceWithCropSimulation(
  faceData: { x: number; y: number; w: number; h: number; leftEye?: { x: number; y: number } | null; rightEye?: { x: number; y: number } | null } | null,
  sourceWidth: number,
  sourceHeight: number,
  countryCode: string
): CropBasedAnalysis {
  const standard = STANDARDS[countryCode] || STANDARDS['us'];
  
  if (!faceData) {
    return {
      distance: {
        status: 'too-far',
        isGood: false,
        message: 'Position your face in the oval',
        percentFromTarget: -100,
      },
      simulation: null,
    };
  }
  
  // Convert face data to FaceData format expected by simulateCrop
  const faceDataForCrop = {
    x: faceData.x,
    y: faceData.y,
    w: faceData.w,
    h: faceData.h,
    leftEye: faceData.leftEye || null,
    rightEye: faceData.rightEye || null,
  };
  
  // Run the actual crop simulation - THIS IS THE TRUTH
  const simulation = simulateCrop(sourceWidth, sourceHeight, faceDataForCrop, standard);
  
  // Determine status based on simulation results
  let status: DistanceResult['status'];
  let message: string;
  let isGood: boolean;
  
  // Check for padding issues - these mean source image doesn't have enough room
  // User CANNOT fix this by adjusting position within frame - they need to step back
  const hasPaddingIssues = simulation.issues.some(issue => 
    issue.startsWith('needs-padding')
  );
  
  if (simulation.isValid) {
    // Simulation says it's good - trust it!
    status = 'good';
    message = 'Perfect!';
    isGood = true;
  } else if (hasPaddingIssues) {
    // CRITICAL: Padding issues mean crop exceeds source bounds
    // User must step back or reposition to get more in frame
    // Do NOT allow capture - this will cause white space!
    status = 'too-close'; // Tell them to step back
    message = 'Step back for more room';
    isGood = false;
  } else {
    // No padding issues - provide specific guidance
    switch (simulation.guidance) {
      case 'move-closer':
        status = 'too-far';
        message = 'Move closer';
        isGood = false;
        break;
      case 'move-back':
        status = 'too-close';
        message = 'Move back slightly';
        isGood = false;
        break;
      case 'center-face':
        // Pure centering issue (no padding) - position check handles this
        status = 'good';
        message = 'Center your face';
        isGood = true;
        break;
      case 'move-up':
      case 'move-down':
        // Vertical position issue without padding - user can adjust
        status = 'good';
        message = simulation.guidance === 'move-up' ? 'Move up slightly' : 'Move down slightly';
        isGood = true;
        break;
      default:
        // Fallback - check head size issues
        if (simulation.issues.includes('head-too-small')) {
          status = 'too-far';
          message = 'Move closer';
          isGood = false;
        } else if (simulation.issues.includes('head-too-large')) {
          status = 'too-close';
          message = 'Move back slightly';
          isGood = false;
        } else {
          status = 'good';
          message = 'Adjust position';
          isGood = false;
        }
    }
  }
  
  // Calculate percent from ideal
  const targetHeadPercent = (standard.headMin + standard.headMax) / 2 * 100;
  const percentFromTarget = ((simulation.headHeightPercent - targetHeadPercent) / targetHeadPercent) * 100;
  
  return {
    distance: {
      status,
      isGood,
      message,
      percentFromTarget,
    },
    simulation,
  };
}
