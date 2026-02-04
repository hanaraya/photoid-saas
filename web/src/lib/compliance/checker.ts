/**
 * Passport Photo Compliance Checker
 * Independent verification system that validates photos against requirements
 */

import {
  CountryCode,
  CountryRequirements,
  ImageAnalysis,
  ComplianceCheck,
  ComplianceResult,
  ComplianceStatus,
} from './types';
import { getRequirements, DEFAULT_COUNTRY } from './requirements';

/**
 * Main compliance checker class
 */
export class PassportPhotoComplianceChecker {
  private requirements: CountryRequirements;
  private checks: ComplianceCheck[] = [];

  constructor(country: CountryCode = DEFAULT_COUNTRY) {
    this.requirements = getRequirements(country);
  }

  /**
   * Run all compliance checks on an analyzed image
   */
  public verify(analysis: ImageAnalysis): ComplianceResult {
    this.checks = [];

    // Run all checks
    this.checkFaceDetection(analysis);
    this.checkFaceCount(analysis);
    this.checkHeadSize(analysis);
    this.checkEyePosition(analysis);
    this.checkFaceRotation(analysis);
    this.checkBackground(analysis);
    this.checkImageDimensions(analysis);
    this.checkImageQuality(analysis);
    this.checkGlasses(analysis);
    this.checkExpression(analysis);
    this.checkEyesOpen(analysis);
    this.checkMouthClosed(analysis);
    this.checkHeadwear(analysis);

    // Calculate results
    const passedCount = this.checks.filter((c) => c.status === 'pass').length;
    const failedCount = this.checks.filter((c) => c.status === 'fail').length;
    const warningCount = this.checks.filter((c) => c.status === 'warn').length;

    const criticalFailures = this.checks
      .filter((c) => c.status === 'fail' && c.severity === 'critical')
      .map((c) => c.name);

    const isCompliant =
      criticalFailures.length === 0 &&
      this.checks.filter((c) => c.status === 'fail' && c.severity === 'major')
        .length === 0;

    const overallScore = this.calculateScore();
    const recommendations = this.generateRecommendations();

    return {
      isCompliant,
      overallScore,
      country: this.requirements.code,
      checks: this.checks,
      passedCount,
      failedCount,
      warningCount,
      criticalFailures,
      recommendations,
      processedAt: new Date(),
    };
  }

  /**
   * Check 1: Face Detection
   */
  private checkFaceDetection(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'face_detected',
      name: 'Face Detection',
      status: 'fail',
      message: '',
      severity: 'critical',
    };

    if (!analysis.face.detected) {
      check.message = 'No face detected in the photo';
      check.details = 'Ensure your face is clearly visible and well-lit';
    } else if (analysis.face.confidence < 0.8) {
      check.status = 'warn';
      check.message = 'Face detected but with low confidence';
      check.value = `${(analysis.face.confidence * 100).toFixed(1)}%`;
      check.details = 'Try better lighting or a clearer photo';
    } else {
      check.status = 'pass';
      check.message = 'Face clearly detected';
      check.value = `${(analysis.face.confidence * 100).toFixed(1)}%`;
    }

    this.checks.push(check);
  }

  /**
   * Check 2: Single Face Only
   */
  private checkFaceCount(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'face_count',
      name: 'Single Face',
      status: 'fail',
      message: '',
      severity: 'critical',
    };

    if (analysis.face.count === 0) {
      check.message = 'No face found';
    } else if (analysis.face.count === 1) {
      check.status = 'pass';
      check.message = 'Single face detected';
    } else {
      check.message = `Multiple faces detected (${analysis.face.count})`;
      check.details = 'Only one person should be in the photo';
    }

    this.checks.push(check);
  }

  /**
   * Check 3: Head Size
   */
  private checkHeadSize(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'head_size',
      name: 'Head Size',
      status: 'fail',
      message: '',
      severity: 'critical',
    };

    if (!analysis.face.boundingBox) {
      check.message = 'Cannot determine head size';
      this.checks.push(check);
      return;
    }

    const headHeightPercent =
      (analysis.face.boundingBox.height / analysis.height) * 100;
    const { minPercent, maxPercent } = this.requirements.headSize;

    check.value = `${headHeightPercent.toFixed(1)}%`;
    check.expected = `${minPercent}% - ${maxPercent}%`;

    if (headHeightPercent < minPercent) {
      check.message = 'Head is too small';
      check.details = 'Move closer to the camera';
    } else if (headHeightPercent > maxPercent) {
      check.message = 'Head is too large';
      check.details = 'Move further from the camera';
    } else {
      check.status = 'pass';
      check.message = 'Head size is correct';
    }

    this.checks.push(check);
  }

  /**
   * Check 4: Eye Position
   */
  private checkEyePosition(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'eye_position',
      name: 'Eye Position',
      status: 'fail',
      message: '',
      severity: 'major',
    };

    if (!analysis.face.landmarks) {
      check.message = 'Cannot determine eye position';
      check.severity = 'minor';
      this.checks.push(check);
      return;
    }

    // Calculate eye center position from bottom
    const eyeY =
      (analysis.face.landmarks.leftEye.y + analysis.face.landmarks.rightEye.y) /
      2;
    const eyeFromBottomPercent =
      ((analysis.height - eyeY) / analysis.height) * 100;

    const { minFromBottomPercent, maxFromBottomPercent } =
      this.requirements.eyePosition;

    check.value = `${eyeFromBottomPercent.toFixed(1)}%`;
    check.expected = `${minFromBottomPercent}% - ${maxFromBottomPercent}%`;

    if (eyeFromBottomPercent < minFromBottomPercent) {
      check.message = 'Eyes are too low in the frame';
      check.details = 'Adjust camera angle or move up';
    } else if (eyeFromBottomPercent > maxFromBottomPercent) {
      check.message = 'Eyes are too high in the frame';
      check.details = 'Adjust camera angle or move down';
    } else {
      check.status = 'pass';
      check.message = 'Eye position is correct';
    }

    this.checks.push(check);
  }

  /**
   * Check 5: Face Rotation
   */
  private checkFaceRotation(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'face_rotation',
      name: 'Face Facing Forward',
      status: 'fail',
      message: '',
      severity: 'major',
    };

    if (!analysis.face.rotation) {
      check.status = 'warn';
      check.message = 'Cannot determine face rotation';
      check.severity = 'minor';
      this.checks.push(check);
      return;
    }

    const { pitch, yaw, roll } = analysis.face.rotation;
    const tolerance = 15; // degrees

    const issues: string[] = [];

    if (Math.abs(pitch) > tolerance) {
      issues.push(pitch > 0 ? 'looking up' : 'looking down');
    }
    if (Math.abs(yaw) > tolerance) {
      issues.push(yaw > 0 ? 'turned right' : 'turned left');
    }
    if (Math.abs(roll) > tolerance) {
      issues.push(roll > 0 ? 'tilted right' : 'tilted left');
    }

    if (issues.length === 0) {
      check.status = 'pass';
      check.message = 'Face is facing forward';
    } else {
      check.message = `Face is ${issues.join(', ')}`;
      check.details = 'Look directly at the camera with head level';
    }

    this.checks.push(check);
  }

  /**
   * Check 6: Background
   */
  private checkBackground(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'background',
      name: 'Background Color',
      status: 'fail',
      message: '',
      severity: 'critical',
    };

    const { allowedColors, colorTolerance, uniformityThreshold } =
      this.requirements.background;

    // Check background color
    const bgColor = analysis.backgroundColor.toUpperCase();
    const isColorAllowed = this.isColorWithinTolerance(
      bgColor,
      allowedColors,
      colorTolerance
    );

    check.value = analysis.backgroundColor;
    check.expected = allowedColors.join(', ');

    if (!isColorAllowed) {
      check.message = 'Background color is not compliant';
      check.details = `Required: ${this.requirements.code === 'US' ? 'white or off-white' : 'light grey'}`;
    } else if (analysis.backgroundUniformity < uniformityThreshold) {
      check.status = 'warn';
      check.message = 'Background is not uniform';
      check.details = 'Avoid shadows or patterns on the background';
    } else {
      check.status = 'pass';
      check.message = 'Background is compliant';
    }

    this.checks.push(check);
  }

  /**
   * Check 7: Image Dimensions
   */
  private checkImageDimensions(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'dimensions',
      name: 'Image Dimensions',
      status: 'fail',
      message: '',
      severity: 'critical',
    };

    const { widthPixelsMin, widthPixelsMax, heightPixelsMin, heightPixelsMax } =
      this.requirements.dimensions;

    check.value = `${analysis.width}x${analysis.height}`;
    check.expected = `${widthPixelsMin}-${widthPixelsMax} x ${heightPixelsMin}-${heightPixelsMax}`;

    if (analysis.width < widthPixelsMin || analysis.height < heightPixelsMin) {
      check.message = 'Image resolution is too low';
      check.details = 'Use a higher resolution camera or photo';
    } else if (
      analysis.width > widthPixelsMax ||
      analysis.height > heightPixelsMax
    ) {
      check.status = 'warn';
      check.message = 'Image resolution is higher than needed';
      check.details = 'Photo will be resized';
    } else {
      check.status = 'pass';
      check.message = 'Image dimensions are correct';
    }

    // Check aspect ratio
    const expectedRatio =
      this.requirements.dimensions.widthMm /
      this.requirements.dimensions.heightMm;
    const actualRatio = analysis.aspectRatio;
    const ratioDiff = Math.abs(actualRatio - expectedRatio);

    if (ratioDiff > 0.05) {
      check.status = check.status === 'pass' ? 'warn' : check.status;
      check.details =
        (check.details || '') + ' Aspect ratio may need adjustment.';
    }

    this.checks.push(check);
  }

  /**
   * Check 8: Image Quality
   */
  private checkImageQuality(analysis: ImageAnalysis): void {
    // Brightness check
    const brightnessCheck: ComplianceCheck = {
      id: 'brightness',
      name: 'Lighting',
      status: 'fail',
      message: '',
      severity: 'major',
    };

    if (analysis.brightness < 100) {
      brightnessCheck.message = 'Photo is too dark';
      brightnessCheck.details = 'Improve lighting conditions';
    } else if (analysis.brightness > 220) {
      brightnessCheck.message = 'Photo is overexposed';
      brightnessCheck.details = 'Reduce lighting or flash';
    } else {
      brightnessCheck.status = 'pass';
      brightnessCheck.message = 'Lighting is good';
    }
    brightnessCheck.value = analysis.brightness.toString();
    this.checks.push(brightnessCheck);

    // Sharpness check
    const sharpnessCheck: ComplianceCheck = {
      id: 'sharpness',
      name: 'Image Sharpness',
      status: 'fail',
      message: '',
      severity: 'major',
    };

    if (analysis.sharpness < 0.5) {
      sharpnessCheck.message = 'Photo is blurry';
      sharpnessCheck.details = 'Keep camera steady and ensure focus';
    } else if (analysis.sharpness < 0.7) {
      sharpnessCheck.status = 'warn';
      sharpnessCheck.message = 'Photo could be sharper';
    } else {
      sharpnessCheck.status = 'pass';
      sharpnessCheck.message = 'Photo is sharp and clear';
    }
    sharpnessCheck.value = `${(analysis.sharpness * 100).toFixed(0)}%`;
    this.checks.push(sharpnessCheck);

    // Contrast check
    const contrastCheck: ComplianceCheck = {
      id: 'contrast',
      name: 'Contrast',
      status: 'fail',
      message: '',
      severity: 'minor',
    };

    if (analysis.contrast < 0.3) {
      contrastCheck.status = 'warn';
      contrastCheck.message = 'Low contrast';
    } else if (analysis.contrast > 0.9) {
      contrastCheck.status = 'warn';
      contrastCheck.message = 'High contrast';
    } else {
      contrastCheck.status = 'pass';
      contrastCheck.message = 'Good contrast';
    }
    this.checks.push(contrastCheck);
  }

  /**
   * Check 9: Glasses
   */
  private checkGlasses(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'glasses',
      name: 'No Glasses',
      status: 'fail',
      message: '',
      severity: this.requirements.allowGlasses ? 'minor' : 'critical',
    };

    if (analysis.hasGlasses && !this.requirements.allowGlasses) {
      check.message = 'Glasses detected';
      check.details =
        'Remove glasses for the photo (required since 2016 for US passports)';
    } else {
      check.status = 'pass';
      check.message = this.requirements.allowGlasses
        ? 'Glasses allowed'
        : 'No glasses detected';
    }

    this.checks.push(check);
  }

  /**
   * Check 10: Expression
   */
  private checkExpression(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'expression',
      name: 'Neutral Expression',
      status: 'fail',
      message: '',
      severity: 'major',
    };

    if (analysis.hasSmile && !this.requirements.allowSmile) {
      check.message = 'Smile detected';
      check.details = 'Maintain a neutral expression';
    } else {
      check.status = 'pass';
      check.message = 'Expression is neutral';
    }

    this.checks.push(check);
  }

  /**
   * Check 11: Eyes Open
   */
  private checkEyesOpen(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'eyes_open',
      name: 'Eyes Open',
      status: 'fail',
      message: '',
      severity: 'critical',
    };

    if (!analysis.eyesOpen) {
      check.message = 'Eyes appear closed';
      check.details = 'Keep eyes open and looking at the camera';
    } else {
      check.status = 'pass';
      check.message = 'Eyes are open';
    }

    this.checks.push(check);
  }

  /**
   * Check 12: Mouth Closed
   */
  private checkMouthClosed(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'mouth_closed',
      name: 'Mouth Closed',
      status: 'fail',
      message: '',
      severity: 'minor',
    };

    if (!analysis.mouthClosed) {
      check.status = 'warn';
      check.message = 'Mouth appears open';
      check.details = 'Keep mouth closed with a neutral expression';
    } else {
      check.status = 'pass';
      check.message = 'Mouth is closed';
    }

    this.checks.push(check);
  }

  /**
   * Check 13: Headwear
   */
  private checkHeadwear(analysis: ImageAnalysis): void {
    const check: ComplianceCheck = {
      id: 'headwear',
      name: 'No Headwear',
      status: 'fail',
      message: '',
      severity: 'major',
    };

    if (analysis.hasHeadwear && !this.requirements.allowHeadwear) {
      check.status = 'warn';
      check.message = 'Headwear detected';
      check.details = 'Remove headwear unless worn for religious purposes';
    } else {
      check.status = 'pass';
      check.message = 'No prohibited headwear';
    }

    this.checks.push(check);
  }

  /**
   * Calculate overall compliance score
   */
  private calculateScore(): number {
    if (this.checks.length === 0) return 0;

    let score = 0;
    let maxScore = 0;

    for (const check of this.checks) {
      const weight =
        check.severity === 'critical' ? 3 : check.severity === 'major' ? 2 : 1;
      maxScore += weight;

      if (check.status === 'pass') {
        score += weight;
      } else if (check.status === 'warn') {
        score += weight * 0.5;
      }
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Generate recommendations based on failures
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    for (const check of this.checks) {
      if (check.status === 'fail' && check.details) {
        recommendations.push(check.details);
      }
    }

    // Add general recommendations if few failures
    if (
      recommendations.length === 0 &&
      this.checks.some((c) => c.status === 'warn')
    ) {
      recommendations.push('Minor adjustments recommended for best results');
    }

    return recommendations;
  }

  /**
   * Check if a color is within tolerance of allowed colors
   */
  private isColorWithinTolerance(
    color: string,
    allowedColors: string[],
    tolerance: number
  ): boolean {
    const rgb = this.hexToRgb(color);
    if (!rgb) return false;

    for (const allowed of allowedColors) {
      const allowedRgb = this.hexToRgb(allowed);
      if (!allowedRgb) continue;

      const diff = Math.sqrt(
        Math.pow(rgb.r - allowedRgb.r, 2) +
          Math.pow(rgb.g - allowedRgb.g, 2) +
          Math.pow(rgb.b - allowedRgb.b, 2)
      );

      if (diff <= tolerance * Math.sqrt(3)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
}

/**
 * Convenience function to verify a photo
 */
export const verifyPassportPhoto = (
  analysis: ImageAnalysis,
  country: CountryCode = DEFAULT_COUNTRY
): ComplianceResult => {
  const checker = new PassportPhotoComplianceChecker(country);
  return checker.verify(analysis);
};
