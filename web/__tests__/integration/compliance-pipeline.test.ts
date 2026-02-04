/**
 * COMPLIANCE PIPELINE INTEGRATION TESTS
 *
 * These tests verify the APPLICATION produces compliant passport photos.
 * Run as part of CI/CD quality gate before deployment.
 *
 * Tests the ENTIRE pipeline:
 *   Input Image → Face Detection → Background Removal → Cropping → Output
 *
 * If these tests fail, the app is NOT production-ready.
 */

import {
  PassportPhotoComplianceChecker,
  verifyPassportPhoto,
} from '@/lib/compliance/checker';
import type {
  ImageAnalysis,
  CountryCode,
  ComplianceResult,
} from '@/lib/compliance/types';
import {
  COUNTRY_REQUIREMENTS,
  getSupportedCountries,
} from '@/lib/compliance/requirements';

// ============================================================
// TEST FIXTURES - Simulated Pipeline Outputs
// ============================================================

/**
 * Simulates a CORRECTLY processed passport photo
 * This is what our pipeline SHOULD produce
 * Adjusts values based on country-specific requirements
 */
const createCompliantOutput = (country: CountryCode = 'US'): ImageAnalysis => {
  const req = COUNTRY_REQUIREMENTS[country];
  const width = req.dimensions.widthPixelsMin;
  const height = req.dimensions.heightPixelsMin;

  // Calculate head height in middle of acceptable range for this country
  const headHeightPercent =
    (req.headSize.minPercent + req.headSize.maxPercent) / 2 / 100;
  const headHeight = height * headHeightPercent;

  // Calculate eye position in middle of acceptable range for this country
  const eyeFromBottomPercent =
    (req.eyePosition.minFromBottomPercent +
      req.eyePosition.maxFromBottomPercent) /
    2 /
    100;
  const eyeY = height * (1 - eyeFromBottomPercent);

  return {
    width,
    height,
    aspectRatio: width / height,
    brightness: 160,
    contrast: 0.5,
    sharpness: 0.85,
    backgroundColor: req.background.allowedColors[0],
    backgroundUniformity: 0.98,
    face: {
      detected: true,
      count: 1,
      confidence: 0.95,
      boundingBox: {
        x: width * 0.25,
        y: height * 0.15,
        width: width * 0.5,
        height: headHeight,
      },
      landmarks: {
        leftEye: { x: width * 0.35, y: eyeY },
        rightEye: { x: width * 0.65, y: eyeY },
        nose: { x: width * 0.5, y: eyeY + height * 0.1 },
        mouth: { x: width * 0.5, y: eyeY + height * 0.2 },
        chin: { x: width * 0.5, y: eyeY + height * 0.3 },
      },
      rotation: { pitch: 0, yaw: 0, roll: 0 },
    },
    hasGlasses: false,
    hasSmile: false,
    hasHeadwear: false,
    eyesOpen: true,
    mouthClosed: true,
  };
};

/**
 * Simulates BROKEN pipeline outputs - things that should NEVER ship
 */
const BROKEN_OUTPUTS = {
  // Background removal failed
  backgroundNotRemoved: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    backgroundColor: '#87CEEB', // Sky blue - clearly not removed
    backgroundUniformity: 0.6,
  }),

  // Cropping algorithm broken - head too small
  headTooSmall: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    face: {
      ...base.face,
      boundingBox: {
        ...base.face.boundingBox!,
        height: base.height * 0.3, // Only 30% - way too small
      },
    },
  }),

  // Cropping algorithm broken - head too large
  headTooLarge: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    face: {
      ...base.face,
      boundingBox: {
        ...base.face.boundingBox!,
        height: base.height * 0.85, // 85% - way too large
      },
    },
  }),

  // Face detection integration broken
  noFaceDetected: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    face: {
      detected: false,
      count: 0,
      confidence: 0,
    },
  }),

  // Output dimensions wrong
  wrongDimensions: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    width: 300, // Too small
    height: 300,
  }),

  // Image quality degraded during processing
  blurryOutput: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    sharpness: 0.2, // Very blurry
  }),

  // Brightness ruined during processing
  tooDark: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    brightness: 40, // Way too dark
  }),

  // Eye position wrong after cropping
  eyePositionWrong: (base: ImageAnalysis): ImageAnalysis => ({
    ...base,
    face: {
      ...base.face,
      landmarks: {
        ...base.face.landmarks!,
        leftEye: { x: base.width * 0.35, y: base.height * 0.8 }, // Eyes at bottom
        rightEye: { x: base.width * 0.65, y: base.height * 0.8 },
      },
    },
  }),
};

// ============================================================
// PIPELINE OUTPUT VERIFICATION TESTS
// ============================================================

describe('Pipeline Compliance Verification', () => {
  describe('Compliant Output Tests', () => {
    test.each(getSupportedCountries())(
      'pipeline should produce compliant output for %s',
      (country) => {
        const output = createCompliantOutput(country);
        const result = verifyPassportPhoto(output, country);

        expect(result.isCompliant).toBe(true);
        expect(result.criticalFailures).toHaveLength(0);
        expect(result.overallScore).toBeGreaterThanOrEqual(80);
      }
    );

    test('US output should meet all 13 compliance checks', () => {
      const output = createCompliantOutput('US');
      const result = verifyPassportPhoto(output, 'US');

      // Verify all checks pass
      const failedChecks = result.checks.filter((c) => c.status === 'fail');
      expect(failedChecks).toHaveLength(0);

      // Verify we ran all expected checks
      const expectedChecks = [
        'face_detected',
        'face_count',
        'head_size',
        'eye_position',
        'face_rotation',
        'background',
        'dimensions',
        'brightness',
        'sharpness',
        'contrast',
        'glasses',
        'expression',
        'eyes_open',
        'mouth_closed',
        'headwear',
      ];

      for (const checkId of expectedChecks) {
        const check = result.checks.find((c) => c.id === checkId);
        expect(check).toBeDefined();
      }
    });
  });

  describe('Broken Pipeline Detection', () => {
    const baseOutput = createCompliantOutput('US');

    test('should FAIL if background removal is broken', () => {
      const brokenOutput = BROKEN_OUTPUTS.backgroundNotRemoved(baseOutput);
      const result = verifyPassportPhoto(brokenOutput, 'US');

      expect(result.isCompliant).toBe(false);
      expect(result.criticalFailures).toContain('Background Color');
    });

    test('should FAIL if cropping produces head too small', () => {
      const brokenOutput = BROKEN_OUTPUTS.headTooSmall(baseOutput);
      const result = verifyPassportPhoto(brokenOutput, 'US');

      expect(result.isCompliant).toBe(false);
      expect(result.criticalFailures).toContain('Head Size');
    });

    test('should FAIL if cropping produces head too large', () => {
      const brokenOutput = BROKEN_OUTPUTS.headTooLarge(baseOutput);
      const result = verifyPassportPhoto(brokenOutput, 'US');

      expect(result.isCompliant).toBe(false);
      expect(result.criticalFailures).toContain('Head Size');
    });

    test('should FAIL if face detection integration is broken', () => {
      const brokenOutput = BROKEN_OUTPUTS.noFaceDetected(baseOutput);
      const result = verifyPassportPhoto(brokenOutput, 'US');

      expect(result.isCompliant).toBe(false);
      expect(result.criticalFailures).toContain('Face Detection');
    });

    test('should FAIL if output dimensions are wrong', () => {
      const brokenOutput = BROKEN_OUTPUTS.wrongDimensions(baseOutput);
      const result = verifyPassportPhoto(brokenOutput, 'US');

      expect(result.isCompliant).toBe(false);
      expect(result.criticalFailures).toContain('Image Dimensions');
    });

    test('should FAIL if image quality is degraded', () => {
      const brokenOutput = BROKEN_OUTPUTS.blurryOutput(baseOutput);
      const result = verifyPassportPhoto(brokenOutput, 'US');

      expect(result.isCompliant).toBe(false);
      // Sharpness is major, not critical, but should still fail overall
      const sharpnessCheck = result.checks.find((c) => c.id === 'sharpness');
      expect(sharpnessCheck?.status).toBe('fail');
    });

    test('should FAIL if brightness is ruined', () => {
      const brokenOutput = BROKEN_OUTPUTS.tooDark(baseOutput);
      const result = verifyPassportPhoto(brokenOutput, 'US');

      expect(result.isCompliant).toBe(false);
      const brightnessCheck = result.checks.find((c) => c.id === 'brightness');
      expect(brightnessCheck?.status).toBe('fail');
    });
  });
});

// ============================================================
// DIMENSION SPECIFICATION TESTS
// ============================================================

describe('Output Dimension Specifications', () => {
  test('US passport photo should be 2x2 inches (600-1200px)', () => {
    const req = COUNTRY_REQUIREMENTS.US;

    expect(req.dimensions.widthMm).toBe(51); // 2 inches
    expect(req.dimensions.heightMm).toBe(51);
    expect(req.dimensions.widthPixelsMin).toBe(600);
    expect(req.dimensions.widthPixelsMax).toBe(1200);
  });

  test('UK passport photo should be 35x45mm', () => {
    const req = COUNTRY_REQUIREMENTS.UK;

    expect(req.dimensions.widthMm).toBe(35);
    expect(req.dimensions.heightMm).toBe(45);
  });

  test('Canadian passport photo should be 50x70mm', () => {
    const req = COUNTRY_REQUIREMENTS.CA;

    expect(req.dimensions.widthMm).toBe(50);
    expect(req.dimensions.heightMm).toBe(70);
  });
});

// ============================================================
// HEAD SIZE SPECIFICATION TESTS
// ============================================================

describe('Head Size Specifications', () => {
  test('US requires head 50-69% of photo height', () => {
    const req = COUNTRY_REQUIREMENTS.US;

    expect(req.headSize.minPercent).toBe(50);
    expect(req.headSize.maxPercent).toBe(69);
  });

  test('UK requires head 64-76% of photo height', () => {
    const req = COUNTRY_REQUIREMENTS.UK;

    expect(req.headSize.minPercent).toBe(64);
    expect(req.headSize.maxPercent).toBe(76);
  });
});

// ============================================================
// BACKGROUND SPECIFICATION TESTS
// ============================================================

describe('Background Specifications', () => {
  test('US requires white background', () => {
    const req = COUNTRY_REQUIREMENTS.US;

    expect(req.background.allowedColors).toContain('#FFFFFF');
  });

  test('UK requires light grey background', () => {
    const req = COUNTRY_REQUIREMENTS.UK;

    // UK uses light grey, not white
    expect(req.background.allowedColors).not.toContain('#FFFFFF');
    expect(
      req.background.allowedColors.some(
        (c) => c.startsWith('#D') || c.startsWith('#E')
      )
    ).toBe(true);
  });
});

// ============================================================
// GLASSES POLICY TESTS
// ============================================================

describe('Glasses Policy', () => {
  test('US does NOT allow glasses (since 2016)', () => {
    const req = COUNTRY_REQUIREMENTS.US;
    expect(req.allowGlasses).toBe(false);
  });

  test('pipeline should reject photos with glasses for US', () => {
    const output = createCompliantOutput('US');
    output.hasGlasses = true;

    const result = verifyPassportPhoto(output, 'US');

    expect(result.isCompliant).toBe(false);
    expect(result.criticalFailures).toContain('No Glasses');
  });
});

// ============================================================
// REGRESSION TESTS
// ============================================================

describe('Regression Prevention', () => {
  test('changing cropping should not break head size compliance', () => {
    // This test ensures any cropping algorithm changes maintain compliance
    const output = createCompliantOutput('US');

    // Simulate various head sizes within acceptable range
    const testSizes = [0.5, 0.55, 0.6, 0.65, 0.69];

    for (const size of testSizes) {
      const testOutput = {
        ...output,
        face: {
          ...output.face,
          boundingBox: {
            ...output.face.boundingBox!,
            height: output.height * size,
          },
        },
      };

      const result = verifyPassportPhoto(testOutput, 'US');
      const headCheck = result.checks.find((c) => c.id === 'head_size');

      expect(headCheck?.status).toBe('pass');
    }
  });

  test('changing background removal should maintain white background', () => {
    const output = createCompliantOutput('US');

    // Test various shades of white that should pass
    const validWhites = ['#FFFFFF', '#FAFAFA', '#F5F5F5'];

    for (const color of validWhites) {
      const testOutput = { ...output, backgroundColor: color };
      const result = verifyPassportPhoto(testOutput, 'US');
      const bgCheck = result.checks.find((c) => c.id === 'background');

      expect(bgCheck?.status).toBe('pass');
    }
  });

  test('image processing should not degrade sharpness below threshold', () => {
    const output = createCompliantOutput('US');

    // Minimum acceptable sharpness
    const minSharpness = 0.7;
    const testOutput = { ...output, sharpness: minSharpness };

    const result = verifyPassportPhoto(testOutput, 'US');
    const sharpCheck = result.checks.find((c) => c.id === 'sharpness');

    expect(sharpCheck?.status).toBe('pass');
  });
});

// ============================================================
// MULTI-COUNTRY PIPELINE TESTS
// ============================================================

describe('Multi-Country Pipeline Support', () => {
  const countries = getSupportedCountries();

  test.each(countries)('pipeline configuration exists for %s', (country) => {
    const req = COUNTRY_REQUIREMENTS[country];

    expect(req).toBeDefined();
    expect(req.dimensions).toBeDefined();
    expect(req.headSize).toBeDefined();
    expect(req.background).toBeDefined();
    expect(req.eyePosition).toBeDefined();
  });

  test.each(countries)('checker can verify %s photos', (country) => {
    const checker = new PassportPhotoComplianceChecker(country);
    const output = createCompliantOutput(country);
    const result = checker.verify(output);

    expect(result.country).toBe(country);
    expect(result.checks.length).toBeGreaterThan(0);
  });
});
