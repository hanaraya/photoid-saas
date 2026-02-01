/**
 * Comprehensive tests for Passport Photo Compliance Checker
 * These tests ensure the compliance system is accurate and reliable
 */

import { PassportPhotoComplianceChecker, verifyPassportPhoto } from '@/lib/compliance/checker';
import { ImageAnalysis, CountryCode, ComplianceResult } from '@/lib/compliance/types';
import { COUNTRY_REQUIREMENTS, getSupportedCountries } from '@/lib/compliance/requirements';

// ============================================================
// TEST FIXTURES
// ============================================================

/**
 * Create a valid compliant photo analysis for testing
 */
const createValidAnalysis = (overrides: Partial<ImageAnalysis> = {}): ImageAnalysis => ({
  width: 600,
  height: 600,
  aspectRatio: 1,
  brightness: 150,
  contrast: 0.5,
  sharpness: 0.85,
  backgroundColor: '#FFFFFF',
  backgroundUniformity: 0.98,
  face: {
    detected: true,
    count: 1,
    confidence: 0.95,
    boundingBox: {
      x: 150,
      y: 100,
      width: 300,
      height: 350,
    },
    landmarks: {
      leftEye: { x: 220, y: 200 },
      rightEye: { x: 380, y: 200 },
      nose: { x: 300, y: 280 },
      mouth: { x: 300, y: 350 },
      chin: { x: 300, y: 420 },
    },
    rotation: {
      pitch: 2,
      yaw: -1,
      roll: 0,
    },
  },
  hasGlasses: false,
  hasSmile: false,
  hasHeadwear: false,
  eyesOpen: true,
  mouthClosed: true,
  ...overrides,
});

// ============================================================
// FACE DETECTION TESTS
// ============================================================

describe('Face Detection', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should pass when face is clearly detected', () => {
    const analysis = createValidAnalysis();
    const result = checker.verify(analysis);
    
    const faceCheck = result.checks.find(c => c.id === 'face_detected');
    expect(faceCheck?.status).toBe('pass');
  });

  test('should fail when no face is detected', () => {
    const analysis = createValidAnalysis({
      face: {
        detected: false,
        count: 0,
        confidence: 0,
      },
    });
    const result = checker.verify(analysis);
    
    const faceCheck = result.checks.find(c => c.id === 'face_detected');
    expect(faceCheck?.status).toBe('fail');
    expect(faceCheck?.severity).toBe('critical');
    expect(result.isCompliant).toBe(false);
  });

  test('should warn when face detection confidence is low', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        confidence: 0.6,
      },
    });
    const result = checker.verify(analysis);
    
    const faceCheck = result.checks.find(c => c.id === 'face_detected');
    expect(faceCheck?.status).toBe('warn');
  });

  test('should fail when multiple faces are detected', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        count: 2,
      },
    });
    const result = checker.verify(analysis);
    
    const countCheck = result.checks.find(c => c.id === 'face_count');
    expect(countCheck?.status).toBe('fail');
    expect(countCheck?.severity).toBe('critical');
  });
});

// ============================================================
// HEAD SIZE TESTS
// ============================================================

describe('Head Size Compliance', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should pass when head size is within range (50-69%)', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        boundingBox: {
          x: 150,
          y: 100,
          width: 300,
          height: 350, // 58% of 600px
        },
      },
    });
    const result = checker.verify(analysis);
    
    const sizeCheck = result.checks.find(c => c.id === 'head_size');
    expect(sizeCheck?.status).toBe('pass');
  });

  test('should fail when head is too small (<50%)', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        boundingBox: {
          x: 200,
          y: 200,
          width: 200,
          height: 250, // 42% of 600px
        },
      },
    });
    const result = checker.verify(analysis);
    
    const sizeCheck = result.checks.find(c => c.id === 'head_size');
    expect(sizeCheck?.status).toBe('fail');
    expect(sizeCheck?.message).toContain('too small');
  });

  test('should fail when head is too large (>69%)', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        boundingBox: {
          x: 50,
          y: 20,
          width: 500,
          height: 450, // 75% of 600px
        },
      },
    });
    const result = checker.verify(analysis);
    
    const sizeCheck = result.checks.find(c => c.id === 'head_size');
    expect(sizeCheck?.status).toBe('fail');
    expect(sizeCheck?.message).toContain('too large');
  });
});

// ============================================================
// EYE POSITION TESTS
// ============================================================

describe('Eye Position Compliance', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should pass when eyes are correctly positioned (56-69% from bottom)', () => {
    // Eye at y=200 in 600px image = 400/600 = 66.7% from bottom
    const analysis = createValidAnalysis();
    const result = checker.verify(analysis);
    
    const eyeCheck = result.checks.find(c => c.id === 'eye_position');
    expect(eyeCheck?.status).toBe('pass');
  });

  test('should fail when eyes are too low', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        landmarks: {
          leftEye: { x: 220, y: 400 }, // 33% from bottom
          rightEye: { x: 380, y: 400 },
          nose: { x: 300, y: 450 },
          mouth: { x: 300, y: 500 },
          chin: { x: 300, y: 550 },
        },
      },
    });
    const result = checker.verify(analysis);
    
    const eyeCheck = result.checks.find(c => c.id === 'eye_position');
    expect(eyeCheck?.status).toBe('fail');
    expect(eyeCheck?.message).toContain('too low');
  });

  test('should fail when eyes are too high', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        landmarks: {
          leftEye: { x: 220, y: 100 }, // 83% from bottom
          rightEye: { x: 380, y: 100 },
          nose: { x: 300, y: 180 },
          mouth: { x: 300, y: 250 },
          chin: { x: 300, y: 320 },
        },
      },
    });
    const result = checker.verify(analysis);
    
    const eyeCheck = result.checks.find(c => c.id === 'eye_position');
    expect(eyeCheck?.status).toBe('fail');
    expect(eyeCheck?.message).toContain('too high');
  });
});

// ============================================================
// FACE ROTATION TESTS
// ============================================================

describe('Face Rotation Compliance', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should pass when face is facing forward', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        rotation: { pitch: 0, yaw: 0, roll: 0 },
      },
    });
    const result = checker.verify(analysis);
    
    const rotationCheck = result.checks.find(c => c.id === 'face_rotation');
    expect(rotationCheck?.status).toBe('pass');
  });

  test('should fail when face is turned left', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        rotation: { pitch: 0, yaw: -25, roll: 0 },
      },
    });
    const result = checker.verify(analysis);
    
    const rotationCheck = result.checks.find(c => c.id === 'face_rotation');
    expect(rotationCheck?.status).toBe('fail');
    expect(rotationCheck?.message).toContain('turned left');
  });

  test('should fail when face is tilted', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        rotation: { pitch: 0, yaw: 0, roll: 20 },
      },
    });
    const result = checker.verify(analysis);
    
    const rotationCheck = result.checks.find(c => c.id === 'face_rotation');
    expect(rotationCheck?.status).toBe('fail');
    expect(rotationCheck?.message).toContain('tilted');
  });

  test('should allow small rotation within tolerance (±15°)', () => {
    const analysis = createValidAnalysis({
      face: {
        ...createValidAnalysis().face,
        rotation: { pitch: 10, yaw: -8, roll: 5 },
      },
    });
    const result = checker.verify(analysis);
    
    const rotationCheck = result.checks.find(c => c.id === 'face_rotation');
    expect(rotationCheck?.status).toBe('pass');
  });
});

// ============================================================
// BACKGROUND TESTS
// ============================================================

describe('Background Compliance', () => {
  test('should pass with white background for US', () => {
    const checker = new PassportPhotoComplianceChecker('US');
    const analysis = createValidAnalysis({ backgroundColor: '#FFFFFF' });
    const result = checker.verify(analysis);
    
    const bgCheck = result.checks.find(c => c.id === 'background');
    expect(bgCheck?.status).toBe('pass');
  });

  test('should pass with off-white background for US', () => {
    const checker = new PassportPhotoComplianceChecker('US');
    const analysis = createValidAnalysis({ backgroundColor: '#F5F5F5' });
    const result = checker.verify(analysis);
    
    const bgCheck = result.checks.find(c => c.id === 'background');
    expect(bgCheck?.status).toBe('pass');
  });

  test('should fail with colored background', () => {
    const checker = new PassportPhotoComplianceChecker('US');
    const analysis = createValidAnalysis({ backgroundColor: '#87CEEB' }); // Sky blue
    const result = checker.verify(analysis);
    
    const bgCheck = result.checks.find(c => c.id === 'background');
    expect(bgCheck?.status).toBe('fail');
    expect(bgCheck?.severity).toBe('critical');
  });

  test('should warn when background is not uniform', () => {
    const checker = new PassportPhotoComplianceChecker('US');
    const analysis = createValidAnalysis({
      backgroundColor: '#FFFFFF',
      backgroundUniformity: 0.7,
    });
    const result = checker.verify(analysis);
    
    const bgCheck = result.checks.find(c => c.id === 'background');
    expect(bgCheck?.status).toBe('warn');
    expect(bgCheck?.message).toContain('not uniform');
  });

  test('should pass with light grey background for UK', () => {
    const checker = new PassportPhotoComplianceChecker('UK');
    const analysis = createValidAnalysis({ backgroundColor: '#D3D3D3' });
    const result = checker.verify(analysis);
    
    const bgCheck = result.checks.find(c => c.id === 'background');
    expect(bgCheck?.status).toBe('pass');
  });
});

// ============================================================
// IMAGE QUALITY TESTS
// ============================================================

describe('Image Quality Checks', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should pass with good lighting', () => {
    const analysis = createValidAnalysis({ brightness: 150 });
    const result = checker.verify(analysis);
    
    const lightCheck = result.checks.find(c => c.id === 'brightness');
    expect(lightCheck?.status).toBe('pass');
  });

  test('should fail when too dark', () => {
    const analysis = createValidAnalysis({ brightness: 50 });
    const result = checker.verify(analysis);
    
    const lightCheck = result.checks.find(c => c.id === 'brightness');
    expect(lightCheck?.status).toBe('fail');
    expect(lightCheck?.message).toContain('too dark');
  });

  test('should fail when overexposed', () => {
    const analysis = createValidAnalysis({ brightness: 240 });
    const result = checker.verify(analysis);
    
    const lightCheck = result.checks.find(c => c.id === 'brightness');
    expect(lightCheck?.status).toBe('fail');
    expect(lightCheck?.message).toContain('overexposed');
  });

  test('should pass with sharp image', () => {
    const analysis = createValidAnalysis({ sharpness: 0.9 });
    const result = checker.verify(analysis);
    
    const sharpCheck = result.checks.find(c => c.id === 'sharpness');
    expect(sharpCheck?.status).toBe('pass');
  });

  test('should fail with blurry image', () => {
    const analysis = createValidAnalysis({ sharpness: 0.3 });
    const result = checker.verify(analysis);
    
    const sharpCheck = result.checks.find(c => c.id === 'sharpness');
    expect(sharpCheck?.status).toBe('fail');
    expect(sharpCheck?.message).toContain('blurry');
  });
});

// ============================================================
// IMAGE DIMENSIONS TESTS
// ============================================================

describe('Image Dimensions', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should pass with correct dimensions (600x600)', () => {
    const analysis = createValidAnalysis({ width: 600, height: 600 });
    const result = checker.verify(analysis);
    
    const dimCheck = result.checks.find(c => c.id === 'dimensions');
    expect(dimCheck?.status).toBe('pass');
  });

  test('should fail with low resolution', () => {
    const analysis = createValidAnalysis({ width: 300, height: 300 });
    const result = checker.verify(analysis);
    
    const dimCheck = result.checks.find(c => c.id === 'dimensions');
    expect(dimCheck?.status).toBe('fail');
    expect(dimCheck?.message).toContain('too low');
  });

  test('should warn with very high resolution', () => {
    const analysis = createValidAnalysis({ width: 2000, height: 2000 });
    const result = checker.verify(analysis);
    
    const dimCheck = result.checks.find(c => c.id === 'dimensions');
    expect(dimCheck?.status).toBe('warn');
  });
});

// ============================================================
// GLASSES DETECTION TESTS
// ============================================================

describe('Glasses Detection', () => {
  test('should pass without glasses for US', () => {
    const checker = new PassportPhotoComplianceChecker('US');
    const analysis = createValidAnalysis({ hasGlasses: false });
    const result = checker.verify(analysis);
    
    const glassesCheck = result.checks.find(c => c.id === 'glasses');
    expect(glassesCheck?.status).toBe('pass');
  });

  test('should fail with glasses for US (not allowed since 2016)', () => {
    const checker = new PassportPhotoComplianceChecker('US');
    const analysis = createValidAnalysis({ hasGlasses: true });
    const result = checker.verify(analysis);
    
    const glassesCheck = result.checks.find(c => c.id === 'glasses');
    expect(glassesCheck?.status).toBe('fail');
    expect(glassesCheck?.severity).toBe('critical');
  });
});

// ============================================================
// EXPRESSION TESTS
// ============================================================

describe('Expression Detection', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should pass with neutral expression', () => {
    const analysis = createValidAnalysis({ hasSmile: false });
    const result = checker.verify(analysis);
    
    const expressionCheck = result.checks.find(c => c.id === 'expression');
    expect(expressionCheck?.status).toBe('pass');
  });

  test('should fail with smile', () => {
    const analysis = createValidAnalysis({ hasSmile: true });
    const result = checker.verify(analysis);
    
    const expressionCheck = result.checks.find(c => c.id === 'expression');
    expect(expressionCheck?.status).toBe('fail');
    expect(expressionCheck?.message).toContain('Smile detected');
  });

  test('should pass with eyes open', () => {
    const analysis = createValidAnalysis({ eyesOpen: true });
    const result = checker.verify(analysis);
    
    const eyesCheck = result.checks.find(c => c.id === 'eyes_open');
    expect(eyesCheck?.status).toBe('pass');
  });

  test('should fail with eyes closed', () => {
    const analysis = createValidAnalysis({ eyesOpen: false });
    const result = checker.verify(analysis);
    
    const eyesCheck = result.checks.find(c => c.id === 'eyes_open');
    expect(eyesCheck?.status).toBe('fail');
    expect(eyesCheck?.severity).toBe('critical');
  });
});

// ============================================================
// OVERALL COMPLIANCE TESTS
// ============================================================

describe('Overall Compliance Result', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should be compliant when all critical checks pass', () => {
    const analysis = createValidAnalysis();
    const result = checker.verify(analysis);
    
    expect(result.isCompliant).toBe(true);
    expect(result.criticalFailures).toHaveLength(0);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  test('should not be compliant when any critical check fails', () => {
    const analysis = createValidAnalysis({
      face: { detected: false, count: 0, confidence: 0 },
    });
    const result = checker.verify(analysis);
    
    expect(result.isCompliant).toBe(false);
    expect(result.criticalFailures.length).toBeGreaterThan(0);
  });

  test('should include recommendations for failures', () => {
    const analysis = createValidAnalysis({ brightness: 50 });
    const result = checker.verify(analysis);
    
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  test('should calculate correct pass/fail/warning counts', () => {
    const analysis = createValidAnalysis();
    const result = checker.verify(analysis);
    
    expect(result.passedCount + result.failedCount + result.warningCount)
      .toBe(result.checks.length);
  });
});

// ============================================================
// MULTI-COUNTRY TESTS
// ============================================================

describe('Multi-Country Support', () => {
  const countries = getSupportedCountries();

  test.each(countries)('should have requirements for %s', (country) => {
    const requirements = COUNTRY_REQUIREMENTS[country];
    expect(requirements).toBeDefined();
    expect(requirements.code).toBe(country);
    expect(requirements.dimensions).toBeDefined();
    expect(requirements.headSize).toBeDefined();
    expect(requirements.background).toBeDefined();
  });

  test('should use correct background for each country', () => {
    // US requires white
    const usChecker = new PassportPhotoComplianceChecker('US');
    const usResult = usChecker.verify(createValidAnalysis({ backgroundColor: '#FFFFFF' }));
    expect(usResult.checks.find(c => c.id === 'background')?.status).toBe('pass');

    // UK requires light grey
    const ukChecker = new PassportPhotoComplianceChecker('UK');
    const ukResult = ukChecker.verify(createValidAnalysis({ backgroundColor: '#D3D3D3' }));
    expect(ukResult.checks.find(c => c.id === 'background')?.status).toBe('pass');
  });
});

// ============================================================
// CONVENIENCE FUNCTION TESTS
// ============================================================

describe('verifyPassportPhoto convenience function', () => {
  test('should work with default country (US)', () => {
    const analysis = createValidAnalysis();
    const result = verifyPassportPhoto(analysis);
    
    expect(result.country).toBe('US');
    expect(result.isCompliant).toBe(true);
  });

  test('should work with specified country', () => {
    const analysis = createValidAnalysis({ backgroundColor: '#D3D3D3' });
    const result = verifyPassportPhoto(analysis, 'UK');
    
    expect(result.country).toBe('UK');
  });
});

// ============================================================
// EDGE CASES
// ============================================================

describe('Edge Cases', () => {
  const checker = new PassportPhotoComplianceChecker('US');

  test('should handle missing face landmarks gracefully', () => {
    const analysis = createValidAnalysis({
      face: {
        detected: true,
        count: 1,
        confidence: 0.9,
        boundingBox: { x: 150, y: 100, width: 300, height: 350 },
        // No landmarks
      },
    });
    const result = checker.verify(analysis);
    
    // Should not crash, should have warning for eye position
    expect(result).toBeDefined();
  });

  test('should handle missing face rotation gracefully', () => {
    const analysis = createValidAnalysis({
      face: {
        detected: true,
        count: 1,
        confidence: 0.9,
        boundingBox: { x: 150, y: 100, width: 300, height: 350 },
        landmarks: createValidAnalysis().face.landmarks,
        // No rotation
      },
    });
    const result = checker.verify(analysis);
    
    expect(result).toBeDefined();
    const rotationCheck = result.checks.find(c => c.id === 'face_rotation');
    expect(rotationCheck?.status).toBe('warn');
  });

  test('should handle missing bounding box gracefully', () => {
    const analysis = createValidAnalysis({
      face: {
        detected: true,
        count: 1,
        confidence: 0.9,
        // No bounding box
      },
    });
    const result = checker.verify(analysis);
    
    expect(result).toBeDefined();
  });
});
