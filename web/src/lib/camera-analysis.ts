/**
 * Camera Analysis Utilities
 * Real-time analysis for passport photo capture guidance
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
 * Country-specific head height requirements as percentage of photo height
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
 * ============================================
 * CAMERA OVAL SIZING - COMPLETE DERIVATION
 * ============================================
 * 
 * The oval guides users to position their face for optimal capture.
 * It must account for:
 * 1. Output photo requirements (head size as % of photo)
 * 2. Face-to-head ratio (face bbox vs full head with hair)
 * 3. Capture buffer (extra content for crop flexibility)
 * 4. Camera viewport dimensions (actual rendered size)
 */

/**
 * Face to Head ratio
 * Face bbox (chin to eyebrows) ≈ 71.4% of full head height
 * Full head = face + forehead + hair
 */
const FACE_TO_HEAD_RATIO = 1 / 1.4; // ~0.714

/**
 * Derive camera face thresholds from output requirements
 * 
 * The oval should match OUTPUT proportions directly.
 * Crop flexibility comes from:
 * 1. High resolution capture (1920×1920)
 * 2. Smart crop algorithm with adjustable scale
 * 3. User can adjust in editor
 * 
 * NO buffer applied to oval - it should feel natural to fill.
 * 
 * Example for US (head 50-69%):
 * - Face in output: 35.7-49.3%
 * - Face in camera: SAME (35.7-49.3%)
 * - Target oval: ~42.5% of viewport
 */
function deriveCameraThresholds(headMin: number, headMax: number): HeadHeightRange {
  // Direct mapping from head % to face % for oval sizing
  // The analyzeDistance function handles the actual validation
  return {
    min: headMin * FACE_TO_HEAD_RATIO,
    max: headMax * FACE_TO_HEAD_RATIO,
  };
}

/**
 * CAMERA-SPECIFIC thresholds - mathematically derived from output specs
 */
const CAMERA_FACE_HEIGHT: Record<string, HeadHeightRange> = {
  // US: head 50-69% → face 35.7-49.3%
  us: deriveCameraThresholds(0.50, 0.69),
  us_visa: deriveCameraThresholds(0.50, 0.69),
  us_drivers: deriveCameraThresholds(0.50, 0.69),
  green_card: deriveCameraThresholds(0.50, 0.69),
  
  // UK: head 64-75.5% → face 45.7-53.9%
  uk: deriveCameraThresholds(0.64, 0.755),
  uk_visa: deriveCameraThresholds(0.64, 0.755),
  
  // EU: head 71-80% → face 50.7-57.1%
  eu: deriveCameraThresholds(0.71, 0.80),
  schengen: deriveCameraThresholds(0.71, 0.80),
  schengen_visa: deriveCameraThresholds(0.71, 0.80),
  germany: deriveCameraThresholds(0.71, 0.80),
  france: deriveCameraThresholds(0.71, 0.80),
  
  // Canada: head 44-51% → face 31.4-36.4%
  canada: deriveCameraThresholds(0.44, 0.51),
  
  // India: head 50-69% (same as US)
  india: deriveCameraThresholds(0.50, 0.69),
  india_visa: deriveCameraThresholds(0.50, 0.69),
  
  // Australia: head 71-80% (same as EU)
  australia: deriveCameraThresholds(0.71, 0.80),
  
  // China: head 58-69% → face 41.4-49.3%
  china: deriveCameraThresholds(0.58, 0.69),
  china_visa: deriveCameraThresholds(0.58, 0.69),
  
  // Japan/Korea: head 71-80% (same as EU)
  japan: deriveCameraThresholds(0.71, 0.80),
  south_korea: deriveCameraThresholds(0.71, 0.80),
  
  // Brazil: head 44-51% (same as Canada)
  brazil: deriveCameraThresholds(0.44, 0.51),
  
  // Mexico: head 71-80% (same as EU)
  mexico: deriveCameraThresholds(0.71, 0.80),
};

// Default: same as US (head 50-69%)
const DEFAULT_CAMERA_FACE_HEIGHT: HeadHeightRange = deriveCameraThresholds(0.50, 0.69);

/**
 * Get head height range for a country (output spec)
 */
export function getCountryHeadHeightRange(countryCode: string): HeadHeightRange {
  return COUNTRY_HEAD_HEIGHTS[countryCode] || DEFAULT_HEAD_HEIGHT;
}

/**
 * Get CAMERA face height range for a country
 * This is for the face bounding box relative to camera frame
 */
export function getCameraFaceHeightRange(countryCode: string): HeadHeightRange {
  return CAMERA_FACE_HEIGHT[countryCode] || DEFAULT_CAMERA_FACE_HEIGHT;
}

/**
 * Calculate oval dimensions for face positioning guide
 */
/**
 * Calculate oval dimensions for camera viewport
 * 
 * The oval is a VISUAL GUIDE - it should be large and comfortable to fill.
 * Size and position are COUNTRY-SPECIFIC based on:
 * - Head size requirements (varies by country)
 * - Eye position requirements (varies by country)
 */
export function calculateOvalDimensions(
  countryCode: string,
  viewportWidth: number,
  viewportHeight: number
): OvalDimensions {
  // Get country-specific thresholds
  const range = getCameraFaceHeightRange(countryCode);
  const headRange = getCountryHeadHeightRange(countryCode);
  
  // VISUAL OVAL: Use the MAX of detection range + 10% padding
  // This makes oval comfortable to fill while ensuring face is large enough
  // No global cap - let it scale with country requirements
  const visualOvalPercent = range.max * 1.10;
  
  // Calculate oval dimensions in viewport pixels
  const ovalHeight = viewportHeight * visualOvalPercent;
  const ovalWidth = ovalHeight * 0.75; // Face width ≈ 75% of height
  
  // Center horizontally
  const centerX = viewportWidth / 2;
  
  /**
   * Vertical position varies by country based on eye line requirements
   * 
   * Eye position in output photo (from bottom):
   * - US: ~62.5% from bottom (37.5% from top)
   * - UK: ~66.7% from bottom (33.3% from top)
   * - EU: ~66.7% from bottom (33.3% from top)
   * 
   * Eyes are at ~60% from TOP of face bbox
   * So face center should be positioned so eyes land at correct height
   * 
   * For UK/EU (eyes higher in photo): face center at ~38% from top
   * For US (eyes lower in photo): face center at ~42% from top
   */
  const eyePositionFromTop = 1 - (headRange.min + headRange.max) / 2 * 0.5;
  const centerY = viewportHeight * Math.max(0.35, Math.min(0.45, eyePositionFromTop));
  
  return {
    centerX,
    centerY,
    width: ovalWidth,
    height: ovalHeight,
    // Detection thresholds (for "distance OK" validation)
    minHeight: viewportHeight * range.min,
    maxHeight: viewportHeight * range.max,
  };
}

/**
 * Analyze face position relative to viewport
 */
export function analyzeFacePosition(
  faceBox: { x: number; y: number; w: number; h: number } | null,
  viewportWidth: number,
  viewportHeight: number
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
  
  // Calculate viewport center
  const viewportCenterX = viewportWidth / 2;
  const viewportCenterY = viewportHeight / 2;
  
  // Calculate offset as percentage (-1 to 1)
  const horizontalOffset = (faceCenterX - viewportCenterX) / viewportCenterX;
  const verticalOffset = (faceCenterY - viewportCenterY) / viewportCenterY;
  
  // Tolerance for "centered" (10% of viewport)
  const tolerance = 0.10;
  
  const isHorizontallyCentered = Math.abs(horizontalOffset) <= tolerance;
  const isVerticallyCentered = Math.abs(verticalOffset) <= tolerance * 1.5; // Slightly more tolerance vertically
  
  // Determine direction
  let direction: 'left' | 'right' | 'center' = 'center';
  if (horizontalOffset < -tolerance) direction = 'left';
  else if (horizontalOffset > tolerance) direction = 'right';
  
  let verticalDirection: 'up' | 'down' | 'center' = 'center';
  if (verticalOffset < -tolerance) verticalDirection = 'up';
  else if (verticalOffset > tolerance) verticalDirection = 'down';
  
  // Calculate overlap with ideal position (simplified)
  const idealWidth = viewportWidth * 0.3;
  const idealHeight = viewportHeight * 0.5;
  const idealX = viewportCenterX - idealWidth / 2;
  const idealY = viewportCenterY * 0.7 - idealHeight / 2;
  
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
 * INTELLIGENT VALIDATION: Simulates crop algorithm to ensure good output
 * 
 * Math: For a good crop without padding:
 * - Output needs head at X% of photo height
 * - Head = Face × 1.4 (HEAD_TO_FACE_RATIO)
 * - If face in camera > face target for output → crop needs to zoom out → padding
 * - If face in camera <= face target for output → crop can zoom in → good
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
  
  // Get country-specific head height requirements (for OUTPUT)
  const headRange = getCountryHeadHeightRange(countryCode);
  const HEAD_TO_FACE = 1.4;
  
  // Calculate what face % in camera would give ideal head % in output
  // Target: middle of acceptable range
  const targetHeadPercent = (headRange.min + headRange.max) / 2;
  const targetFacePercent = targetHeadPercent / HEAD_TO_FACE;
  
  // What face % in camera would give minimum/maximum acceptable head
  const maxFacePercent = headRange.max / HEAD_TO_FACE;  // Face larger = head larger
  const minFacePercent = headRange.min / HEAD_TO_FACE;  // Face smaller = head smaller
  
  // Actual face size in camera
  const actualFacePercent = faceHeight / viewportHeight;
  
  // Calculate how far from target
  const percentFromTarget = ((actualFacePercent - targetFacePercent) / targetFacePercent) * 100;
  
  // INTELLIGENT VALIDATION:
  // Too close: face > maxFacePercent means head would be > headRange.max → too large
  // This ALSO means crop would need to zoom out, potentially needing padding
  // 15% safety margin ensures plenty of content to spare for cropping flexibility
  const safeMaxFace = maxFacePercent * 0.85;  // 15% safety margin - more content to spare
  const isTooClose = actualFacePercent > safeMaxFace;
  
  // Too far: face < minFacePercent means head would be < headRange.min → too small
  // Allow 15% buffer - face can be a bit smaller since we can always zoom in
  const safeMinFace = minFacePercent * 0.85;  // 15% buffer
  const isTooFar = actualFacePercent < safeMinFace;
  
  if (isTooClose) {
    return {
      status: 'too-close',
      isGood: false,
      message: 'Move back slightly',
      percentFromTarget,
    };
  }
  
  if (isTooFar) {
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
  const TOO_DARK_THRESHOLD = 25; // Below 25% is too dark
  const TOO_BRIGHT_THRESHOLD = 85; // Above 85% is overexposed
  
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
  
  // atan2 gives angle in radians
  const angleRad = Math.atan2(deltaY, deltaX);
  const angleDeg = (angleRad * 180) / Math.PI;
  
  // Tolerance for "level" (5 degrees)
  const LEVEL_TOLERANCE = 5;
  
  const isLevel = Math.abs(angleDeg) <= LEVEL_TOLERANCE;
  
  // Determine direction
  let direction: 'left' | 'right' | 'level' = 'level';
  if (angleDeg > LEVEL_TOLERANCE) {
    direction = 'left'; // Head tilted left (right eye lower)
  } else if (angleDeg < -LEVEL_TOLERANCE) {
    direction = 'right'; // Head tilted right (left eye lower)
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
