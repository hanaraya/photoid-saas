/**
 * Passport Photo Compliance Types
 * Independent verification system for passport photo requirements
 */

// Supported countries and their requirements
export type CountryCode = 'US' | 'UK' | 'CA' | 'IN' | 'EU' | 'AU';

export interface PhotoDimensions {
  widthMm: number;
  heightMm: number;
  widthPixelsMin: number;
  widthPixelsMax: number;
  heightPixelsMin: number;
  heightPixelsMax: number;
}

export interface HeadSizeRequirements {
  minMm: number;
  maxMm: number;
  minPercent: number; // of photo height
  maxPercent: number;
}

export interface EyePositionRequirements {
  minFromBottomMm: number;
  maxFromBottomMm: number;
  minFromBottomPercent: number;
  maxFromBottomPercent: number;
}

export interface BackgroundRequirements {
  allowedColors: string[]; // hex colors
  colorTolerance: number; // 0-255
  uniformityThreshold: number; // 0-1
}

export interface CountryRequirements {
  code: CountryCode;
  name: string;
  dimensions: PhotoDimensions;
  headSize: HeadSizeRequirements;
  eyePosition: EyePositionRequirements;
  background: BackgroundRequirements;
  allowGlasses: boolean;
  allowSmile: boolean;
  allowHeadwear: boolean; // religious only
}

// Face detection results
export interface FaceDetection {
  detected: boolean;
  count: number;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: {
    leftEye: { x: number; y: number };
    rightEye: { x: number; y: number };
    nose: { x: number; y: number };
    mouth: { x: number; y: number };
    chin: { x: number; y: number };
  };
  rotation?: {
    pitch: number; // up/down tilt
    yaw: number; // left/right turn
    roll: number; // head tilt
  };
}

// Individual compliance check result
export type ComplianceStatus = 'pass' | 'fail' | 'warn';

export interface ComplianceCheck {
  id: string;
  name: string;
  status: ComplianceStatus;
  message: string;
  details?: string;
  value?: number | string;
  expected?: string;
  severity: 'critical' | 'major' | 'minor';
}

// Overall compliance result
export interface ComplianceResult {
  isCompliant: boolean;
  overallScore: number; // 0-100
  country: CountryCode;
  checks: ComplianceCheck[];
  passedCount: number;
  failedCount: number;
  warningCount: number;
  criticalFailures: string[];
  recommendations: string[];
  processedAt: Date;
}

// Image analysis input
export interface ImageAnalysis {
  width: number;
  height: number;
  aspectRatio: number;
  brightness: number; // 0-255 average
  contrast: number; // 0-1
  sharpness: number; // 0-1
  backgroundColor: string; // hex
  backgroundUniformity: number; // 0-1
  face: FaceDetection;
  hasGlasses: boolean;
  hasSmile: boolean;
  hasHeadwear: boolean;
  eyesOpen: boolean;
  mouthClosed: boolean;
}
