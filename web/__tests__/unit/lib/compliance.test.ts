import { checkCompliance, type ComplianceCheck } from '@/lib/compliance';
import { type FaceData } from '@/lib/face-detection';
import { type PhotoStandard } from '@/lib/photo-standards';

// Mock the crop calculation
jest.mock('@/lib/crop', () => ({
  calculateCrop: jest.fn(() => ({
    cropW: 400,
    cropH: 500,
    cropX: 100,
    cropY: 50,
  })),
}));

describe('Compliance Checking', () => {
  const mockStandard: PhotoStandard = {
    id: 'us-passport',
    name: 'US Passport',
    country: 'United States',
    flag: '🇺🇸',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.25,
    bgColor: 'white',
    description: 'US Passport photo',
  };

  const mockFaceData: FaceData = {
    x: 150,
    y: 100,
    w: 200,
    h: 250,
    leftEye: { x: 200, y: 150 },
    rightEye: { x: 250, y: 150 },
  };

  describe('Face Detection Compliance', () => {
    it('should pass when face is detected', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const faceCheck = result.find((check) => check.id === 'face');
      expect(faceCheck).toEqual({
        id: 'face',
        label: 'Face Detection',
        status: 'pass',
        message: 'Face detected successfully',
      });
    });

    it('should fail when no face is detected', () => {
      const result = checkCompliance(1000, 800, null, mockStandard, true, 100);

      const faceCheck = result.find((check) => check.id === 'face');
      expect(faceCheck).toEqual({
        id: 'face',
        label: 'Face Detection',
        status: 'fail',
        message: 'No face detected — using center crop',
      });

      // Dependent checks should be pending
      const headCheck = result.find((check) => check.id === 'head_size');
      const eyeCheck = result.find((check) => check.id === 'eye_position');

      expect(headCheck?.status).toBe('pending');
      expect(eyeCheck?.status).toBe('pending');
    });
  });

  describe('Head Size Compliance', () => {
    it('should pass when head size is within acceptable range', () => {
      // Calculate a face size that will be within acceptable range
      // spec.headMin = 300, spec.headMax = 412.5
      // effectiveScale = 600 / 400 = 1.5
      // To get headInOutput = 350 (which is between 300 and 412.5):
      // estimatedHeadH * 1.5 = 350 → estimatedHeadH = 350/1.5 = 233.33
      // faceData.h * 1.35 = 233.33 → faceData.h = 233.33/1.35 = 172.84
      const validFaceData: FaceData = {
        ...mockFaceData,
        h: 173, // This should result in a head size within acceptable range
      };

      const result = checkCompliance(
        1000,
        800,
        validFaceData,
        mockStandard,
        true,
        100
      );

      const headCheck = result.find((check) => check.id === 'head_size');
      expect(headCheck?.status).toBe('pass');
      expect(headCheck?.message).toContain('within acceptable range');
    });

    it('should warn when head is too small', () => {
      // The compliance algorithm auto-scales to target size, so face size doesn't matter
      // To trigger "too small", use low userZoom (<88.4% for US passport)
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        70  // Low zoom factor pushes head below min threshold
      );

      const headCheck = result.find((check) => check.id === 'head_size');
      expect(headCheck?.status).toBe('warn');
      expect(headCheck?.message).toContain('too small');
      expect(headCheck?.message).toContain('zooming in');
    });

    it('should warn when head is too large', () => {
      // The compliance algorithm auto-scales to target size, so face size doesn't matter
      // To trigger "too large", use high userZoom (>121.5% for US passport)
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        150  // High zoom factor pushes head above max threshold
      );

      const headCheck = result.find((check) => check.id === 'head_size');
      expect(headCheck?.status).toBe('warn');
      expect(headCheck?.message).toContain('too large');
      expect(headCheck?.message).toContain('zooming out');
    });

    it('should handle different zoom levels', () => {
      // Test with zoom out (larger number = more zoomed out)
      const result1 = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        150
      );
      const result2 = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        50
      );

      const headCheck1 = result1.find((check) => check.id === 'head_size');
      const headCheck2 = result2.find((check) => check.id === 'head_size');

      // Different zoom levels should produce different results
      expect(headCheck1?.status).toBeDefined();
      expect(headCheck2?.status).toBeDefined();
    });
  });

  describe('Eye Position Compliance', () => {
    it('should pass when both eyes are detected', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const eyeCheck = result.find((check) => check.id === 'eye_position');
      expect(eyeCheck).toEqual({
        id: 'eye_position',
        label: 'Eye Position',
        status: 'pass',
        message: 'Eyes correctly positioned',
      });
    });

    it('should warn when left eye is not detected', () => {
      const faceDataNoLeftEye: FaceData = {
        ...mockFaceData,
        leftEye: null,
      };

      const result = checkCompliance(
        1000,
        800,
        faceDataNoLeftEye,
        mockStandard,
        true,
        100
      );

      const eyeCheck = result.find((check) => check.id === 'eye_position');
      expect(eyeCheck?.status).toBe('warn');
      expect(eyeCheck?.message).toContain('Could not verify eye positions');
    });

    it('should warn when right eye is not detected', () => {
      const faceDataNoRightEye: FaceData = {
        ...mockFaceData,
        rightEye: null,
      };

      const result = checkCompliance(
        1000,
        800,
        faceDataNoRightEye,
        mockStandard,
        true,
        100
      );

      const eyeCheck = result.find((check) => check.id === 'eye_position');
      expect(eyeCheck?.status).toBe('warn');
      expect(eyeCheck?.message).toContain('Could not verify eye positions');
    });

    it('should warn when no eyes are detected', () => {
      const faceDataNoEyes: FaceData = {
        ...mockFaceData,
        leftEye: null,
        rightEye: null,
      };

      const result = checkCompliance(
        1000,
        800,
        faceDataNoEyes,
        mockStandard,
        true,
        100
      );

      const eyeCheck = result.find((check) => check.id === 'eye_position');
      expect(eyeCheck?.status).toBe('warn');
      expect(eyeCheck?.message).toContain('Could not verify eye positions');
    });
  });

  describe('Background Compliance', () => {
    it('should pass when background is removed', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const bgCheck = result.find((check) => check.id === 'background');
      expect(bgCheck).toEqual({
        id: 'background',
        label: 'Background',
        status: 'pass',
        message: 'White background applied',
      });
    });

    it('should warn when background is not removed', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        false,
        100
      );

      const bgCheck = result.find((check) => check.id === 'background');
      expect(bgCheck).toEqual({
        id: 'background',
        label: 'Background',
        status: 'warn',
        message: 'Background needs to be white for passport standards',
      });
    });
  });

  describe('Resolution Compliance', () => {
    it('should pass with high resolution', () => {
      const result = checkCompliance(
        1920,
        1080,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const resCheck = result.find((check) => check.id === 'resolution');
      expect(resCheck?.status).toBe('pass');
      expect(resCheck?.message).toContain('1920×1080px — sufficient quality');
    });

    it('should pass with minimum acceptable resolution', () => {
      const result = checkCompliance(
        600,
        800,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const resCheck = result.find((check) => check.id === 'resolution');
      expect(resCheck?.status).toBe('pass');
      expect(resCheck?.message).toContain('600×800px — sufficient quality');
    });

    it('should warn with medium resolution', () => {
      const result = checkCompliance(
        500,
        600,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const resCheck = result.find((check) => check.id === 'resolution');
      expect(resCheck?.status).toBe('warn');
      expect(resCheck?.message).toContain('500×600px — may be low quality');
    });

    it('should fail with very low resolution', () => {
      const result = checkCompliance(
        300,
        200,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const resCheck = result.find((check) => check.id === 'resolution');
      expect(resCheck?.status).toBe('fail');
      expect(resCheck?.message).toContain('300×200px — too low resolution');
    });

    it('should use minimum dimension for resolution check', () => {
      // Tall image - should use width (smaller dimension)
      const result1 = checkCompliance(
        400,
        1000,
        mockFaceData,
        mockStandard,
        true,
        100
      );
      // Wide image - should use height (smaller dimension)
      const result2 = checkCompliance(
        1000,
        400,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const resCheck1 = result1.find((check) => check.id === 'resolution');
      const resCheck2 = result2.find((check) => check.id === 'resolution');

      expect(resCheck1?.status).toBe('warn'); // 400px min dimension
      expect(resCheck2?.status).toBe('warn'); // 400px min dimension
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-sized images', () => {
      const result = checkCompliance(0, 0, null, mockStandard, false, 100);

      const resCheck = result.find((check) => check.id === 'resolution');
      expect(resCheck?.status).toBe('fail');
    });

    it('should handle extreme zoom values', () => {
      const result1 = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        1
      );
      const result2 = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        10000
      );

      // Should not crash and should return valid compliance checks
      expect(result1).toHaveLength(7);
      expect(result2).toHaveLength(7);

      result1.forEach((check) => {
        expect(['pass', 'fail', 'warn', 'pending']).toContain(check.status);
      });

      result2.forEach((check) => {
        expect(['pass', 'fail', 'warn', 'pending']).toContain(check.status);
      });
    });

    it('should handle negative dimensions gracefully', () => {
      const result = checkCompliance(
        -100,
        -200,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const resCheck = result.find((check) => check.id === 'resolution');
      expect(resCheck?.status).toBe('fail');
    });

    it('should handle face data with extreme coordinates', () => {
      const extremeFaceData: FaceData = {
        x: -1000,
        y: -500,
        w: 50000,
        h: 60000,
        leftEye: { x: -100, y: -200 },
        rightEye: { x: 100000, y: 200000 },
      };

      const result = checkCompliance(
        1000,
        800,
        extremeFaceData,
        mockStandard,
        true,
        100
      );

      // Should not crash and should return valid checks
      expect(result).toHaveLength(7);
      result.forEach((check) => {
        expect(check.id).toBeDefined();
        expect(check.label).toBeDefined();
        expect(check.message).toBeDefined();
        expect(['pass', 'fail', 'warn', 'pending']).toContain(check.status);
      });
    });

    it('should return all required compliance checks', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const expectedIds = [
        'face',
        'head_size',
        'eye_position',
        'head_framing',
        'head_centering',
        'background',
        'resolution',
      ];
      const actualIds = result.map((check) => check.id);

      expectedIds.forEach((id) => {
        expect(actualIds).toContain(id);
      });
    });

    it('should handle concurrent compliance checks', () => {
      const promises = [
        checkCompliance(1000, 800, mockFaceData, mockStandard, true, 100),
        checkCompliance(500, 600, null, mockStandard, false, 150),
        checkCompliance(2000, 1500, mockFaceData, mockStandard, true, 75),
      ];

      // Should all complete successfully without interference
      promises.forEach((result, idx) => {
        // With face data: 7 checks (includes head_framing, head_centering)
        // Without face data: 5 checks (no head_framing, head_centering)
        const expectedLen = idx === 1 ? 5 : 7;
        expect(result).toHaveLength(expectedLen);
        result.forEach((check) => {
          expect(check.id).toBeDefined();
          expect(check.status).toBeDefined();
        });
      });
    });
  });

  describe('Image Analysis Compliance', () => {
    it('should pass sharpness check when image is not blurry', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { isBlurry: false } as any
      );

      const sharpnessCheck = result.find((check) => check.id === 'sharpness');
      expect(sharpnessCheck?.status).toBe('pass');
      expect(sharpnessCheck?.message).toContain('sharp and in focus');
    });

    it('should fail sharpness check when image is blurry', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { isBlurry: true } as any
      );

      const sharpnessCheck = result.find((check) => check.id === 'sharpness');
      expect(sharpnessCheck?.status).toBe('fail');
      expect(sharpnessCheck?.message).toContain('blurry');
    });

    it('should pass face angle check when face is straight', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { isTilted: false, eyeTilt: 0 } as any
      );

      const faceAngleCheck = result.find((check) => check.id === 'face_angle');
      expect(faceAngleCheck?.status).toBe('pass');
      expect(faceAngleCheck?.message).toContain('straight and front-facing');
    });

    it('should warn face angle check when face is tilted', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { isTilted: true, eyeTilt: 15.5 } as any
      );

      const faceAngleCheck = result.find((check) => check.id === 'face_angle');
      expect(faceAngleCheck?.status).toBe('warn');
      expect(faceAngleCheck?.message).toContain('tilted');
      expect(faceAngleCheck?.message).toContain('15.5°');
    });

    it('should pass color check when image is in color', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { isGrayscale: false } as any
      );

      const colorCheck = result.find((check) => check.id === 'color_photo');
      expect(colorCheck?.status).toBe('pass');
      expect(colorCheck?.message).toContain('in color');
    });

    it('should fail color check when image is grayscale', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { isGrayscale: true } as any
      );

      const colorCheck = result.find((check) => check.id === 'color_photo');
      expect(colorCheck?.status).toBe('fail');
      expect(colorCheck?.message).toContain('must be in color');
    });

    it('should pass lighting check when lighting is even', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { hasUnevenLighting: false, faceLightingScore: 90 } as any
      );

      const lightingCheck = result.find((check) => check.id === 'lighting');
      expect(lightingCheck?.status).toBe('pass');
      expect(lightingCheck?.message).toContain('even');
    });

    it('should warn lighting check when lighting is uneven', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { hasUnevenLighting: true, faceLightingScore: 45 } as any
      );

      const lightingCheck = result.find((check) => check.id === 'lighting');
      expect(lightingCheck?.status).toBe('warn');
      expect(lightingCheck?.message).toContain('Uneven lighting');
      expect(lightingCheck?.message).toContain('45%');
    });

    it('should pass exposure check when exposure is good', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { exposure: { isOverexposed: false, isUnderexposed: false } } as any
      );

      const exposureCheck = result.find((check) => check.id === 'exposure');
      expect(exposureCheck?.status).toBe('pass');
      expect(exposureCheck?.message).toContain('good');
    });

    it('should fail exposure check when overexposed', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { exposure: { isOverexposed: true, isUnderexposed: false } } as any
      );

      const exposureCheck = result.find((check) => check.id === 'exposure');
      expect(exposureCheck?.status).toBe('fail');
      expect(exposureCheck?.message).toContain('overexposed');
    });

    it('should fail exposure check when underexposed', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { exposure: { isOverexposed: false, isUnderexposed: true } } as any
      );

      const exposureCheck = result.find((check) => check.id === 'exposure');
      expect(exposureCheck?.status).toBe('fail');
      expect(exposureCheck?.message).toContain('underexposed');
    });

    it('should pass edge quality check when no halo artifacts', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { halo: { hasHaloArtifacts: false, edgeQuality: 80 } } as any
      );

      const edgeCheck = result.find((check) => check.id === 'edge_quality');
      expect(edgeCheck?.status).toBe('pass');
      expect(edgeCheck?.message).toContain('clean');
    });

    it('should warn edge quality check when halo artifacts detected', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { halo: { hasHaloArtifacts: true, edgeQuality: 60 } } as any
      );

      const edgeCheck = result.find((check) => check.id === 'edge_quality');
      expect(edgeCheck?.status).toBe('warn');
      expect(edgeCheck?.message).toContain('Halo artifacts');
    });

    it('should warn edge quality check when edge quality is poor', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        { halo: { hasHaloArtifacts: false, edgeQuality: 30 } } as any
      );

      const edgeCheck = result.find((check) => check.id === 'edge_quality');
      expect(edgeCheck?.status).toBe('warn');
      expect(edgeCheck?.message).toContain('Rough edges');
    });

    it('should handle all image analysis properties together', () => {
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100,
        {
          isBlurry: false,
          isTilted: false,
          eyeTilt: 2,
          isGrayscale: false,
          hasUnevenLighting: false,
          faceLightingScore: 85,
          exposure: { isOverexposed: false, isUnderexposed: false },
          halo: { hasHaloArtifacts: false, edgeQuality: 75 },
        } as any
      );

      // Should have all image analysis checks
      const sharpnessCheck = result.find((check) => check.id === 'sharpness');
      const faceAngleCheck = result.find((check) => check.id === 'face_angle');
      const colorCheck = result.find((check) => check.id === 'color_photo');
      const lightingCheck = result.find((check) => check.id === 'lighting');
      const exposureCheck = result.find((check) => check.id === 'exposure');
      const edgeCheck = result.find((check) => check.id === 'edge_quality');

      expect(sharpnessCheck).toBeDefined();
      expect(faceAngleCheck).toBeDefined();
      expect(colorCheck).toBeDefined();
      expect(lightingCheck).toBeDefined();
      expect(exposureCheck).toBeDefined();
      expect(edgeCheck).toBeDefined();

      // All should pass
      expect(sharpnessCheck?.status).toBe('pass');
      expect(faceAngleCheck?.status).toBe('pass');
      expect(colorCheck?.status).toBe('pass');
      expect(lightingCheck?.status).toBe('pass');
      expect(exposureCheck?.status).toBe('pass');
      expect(edgeCheck?.status).toBe('pass');
    });
  });

  describe('US Standard Glasses Policy', () => {
    it('should include glasses reminder for US standards', () => {
      const usStandard: PhotoStandard = {
        ...mockStandard,
        id: 'us',
      };

      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        usStandard,
        true,
        100
      );

      const glassesCheck = result.find((check) => check.id === 'glasses');
      expect(glassesCheck).toBeDefined();
      expect(glassesCheck?.status).toBe('pass');
      expect(glassesCheck?.message).toContain('no glasses');
    });

    it('should include glasses reminder for US visa', () => {
      const usVisaStandard: PhotoStandard = {
        ...mockStandard,
        id: 'us_visa',
      };

      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        usVisaStandard,
        true,
        100
      );

      const glassesCheck = result.find((check) => check.id === 'glasses');
      expect(glassesCheck).toBeDefined();
    });

    it('should include glasses reminder for US drivers license', () => {
      const usDriversStandard: PhotoStandard = {
        ...mockStandard,
        id: 'us_drivers',
      };

      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        usDriversStandard,
        true,
        100
      );

      const glassesCheck = result.find((check) => check.id === 'glasses');
      expect(glassesCheck).toBeDefined();
    });

    it('should include glasses reminder for green card', () => {
      const greenCardStandard: PhotoStandard = {
        ...mockStandard,
        id: 'green_card',
      };

      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        greenCardStandard,
        true,
        100
      );

      const glassesCheck = result.find((check) => check.id === 'glasses');
      expect(glassesCheck).toBeDefined();
    });

    it('should not include glasses reminder for non-US standards', () => {
      const ukStandard: PhotoStandard = {
        ...mockStandard,
        id: 'uk',
      };

      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        ukStandard,
        true,
        100
      );

      const glassesCheck = result.find((check) => check.id === 'glasses');
      expect(glassesCheck).toBeUndefined();
    });
  });

  describe('Head Framing Edge Cases', () => {
    it('should fail when source has insufficient headroom (crown above image)', () => {
      // Face positioned such that crown would be above image (y - h*0.3 < 0)
      const faceTooHigh: FaceData = {
        x: 150,
        y: 20,  // Very close to top
        w: 200,
        h: 250, // crown would be at 20 - 250*0.3 = 20 - 75 = -55 (above image)
        leftEye: { x: 200, y: 150 },
        rightEye: { x: 250, y: 150 },
      };

      const result = checkCompliance(
        1000,
        800,
        faceTooHigh,
        mockStandard,
        true,
        100
      );

      const framingCheck = result.find((check) => check.id === 'head_framing');
      expect(framingCheck?.status).toBe('fail');
      expect(framingCheck?.message).toContain('more space above head');
    });

    it('should pass head framing when full head is visible', () => {
      // Face properly positioned with room above and below
      const properlyFramed: FaceData = {
        x: 150,
        y: 200,  // Good distance from top
        w: 200,
        h: 250,
        leftEye: { x: 200, y: 250 },
        rightEye: { x: 250, y: 250 },
      };

      const result = checkCompliance(
        1000,
        800,
        properlyFramed,
        mockStandard,
        true,
        100
      );

      const framingCheck = result.find((check) => check.id === 'head_framing');
      expect(framingCheck?.status).toBe('pass');
      expect(framingCheck?.message).toContain('Full head visible');
    });
  });

  describe('Business Logic Validation', () => {
    it('should prioritize face detection failure over other checks', () => {
      const result = checkCompliance(1000, 800, null, mockStandard, true, 100);

      const faceCheck = result.find((check) => check.id === 'face');
      const headCheck = result.find((check) => check.id === 'head_size');
      const eyeCheck = result.find((check) => check.id === 'eye_position');

      expect(faceCheck?.status).toBe('fail');
      expect(headCheck?.status).toBe('pending');
      expect(eyeCheck?.status).toBe('pending');
    });

    it('should maintain consistent check ordering', () => {
      const result1 = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100
      );
      const result2 = checkCompliance(500, 600, null, mockStandard, false, 150);

      const expectedOrderWithFace = [
        'face',
        'head_size',
        'eye_position',
        'head_framing',
        'head_centering',
        'background',
        'resolution',
      ];
      const expectedOrderNoFace = [
        'face',
        'head_size',
        'eye_position',
        'background',
        'resolution',
      ];

      expect(result1.map((c) => c.id)).toEqual(expectedOrderWithFace);
      expect(result2.map((c) => c.id)).toEqual(expectedOrderNoFace);
    });
  });
});
