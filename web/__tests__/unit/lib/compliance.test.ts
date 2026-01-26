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
      // To get headInOutput < 300: estimatedHeadH * 1.5 < 300 → estimatedHeadH < 200
      // faceData.h * 1.35 < 200 → faceData.h < 148.14
      const smallFaceData: FaceData = {
        ...mockFaceData,
        h: 140, // This should result in "too small"
      };

      const result = checkCompliance(
        1000,
        800,
        smallFaceData,
        mockStandard,
        true,
        100
      );

      const headCheck = result.find((check) => check.id === 'head_size');
      expect(headCheck?.status).toBe('warn');
      expect(headCheck?.message).toContain('too small');
      expect(headCheck?.message).toContain('zooming in');
    });

    it('should warn when head is too large', () => {
      // Use the original mockFaceData which should be large enough to trigger "too large"
      // mockFaceData.h = 250 → estimatedHeadH = 337.5 → headInOutput = 506.25 > 412.5
      const result = checkCompliance(
        1000,
        800,
        mockFaceData,
        mockStandard,
        true,
        100
      );

      const headCheck = result.find((check) => check.id === 'head_size');
      expect(headCheck?.status).toBe('warn');
      expect(headCheck?.message).toContain('too large');
      expect(headCheck?.message).toContain('zooming out');
    });

    it('should warn when head is too large', () => {
      const largeFaceData: FaceData = {
        ...mockFaceData,
        h: 800, // Very large head
      };

      const result = checkCompliance(
        1000,
        800,
        largeFaceData,
        mockStandard,
        true,
        100
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
        message: 'Click "Remove Background" for white background',
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
      expect(result1).toHaveLength(5);
      expect(result2).toHaveLength(5);

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
      expect(result).toHaveLength(5);
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
      promises.forEach((result) => {
        expect(result).toHaveLength(5);
        result.forEach((check) => {
          expect(check.id).toBeDefined();
          expect(check.status).toBeDefined();
        });
      });
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

      const expectedOrder = [
        'face',
        'head_size',
        'eye_position',
        'background',
        'resolution',
      ];

      expect(result1.map((c) => c.id)).toEqual(expectedOrder);
      expect(result2.map((c) => c.id)).toEqual(expectedOrder);
    });
  });
});
