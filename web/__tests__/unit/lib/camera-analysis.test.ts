/**
 * @jest-environment jsdom
 */
import {
  calculateOvalDimensions,
  analyzeFacePosition,
  analyzeDistance,
  analyzeBrightness,
  analyzeHeadTilt,
  checkAllConditions,
  getCountryHeadHeightRange,
  FacePositionResult,
  DistanceResult,
  BrightnessResult,
  HeadTiltResult,
  OvalDimensions,
  CameraConditions,
} from '@/lib/camera-analysis';

describe('Camera Analysis Utilities', () => {
  describe('getCountryHeadHeightRange', () => {
    it('should return correct range for US (50-69%)', () => {
      const range = getCountryHeadHeightRange('us');
      expect(range).toEqual({ min: 0.50, max: 0.69 });
    });

    it('should return correct range for UK (64-75.5%)', () => {
      const range = getCountryHeadHeightRange('uk');
      expect(range).toEqual({ min: 0.64, max: 0.755 });
    });

    it('should return correct range for EU (71-80%)', () => {
      const range = getCountryHeadHeightRange('eu');
      expect(range).toEqual({ min: 0.71, max: 0.80 });
    });

    it('should return correct range for Canada (44-51%)', () => {
      const range = getCountryHeadHeightRange('canada');
      expect(range).toEqual({ min: 0.44, max: 0.51 });
    });

    it('should return correct range for India (50-69%)', () => {
      const range = getCountryHeadHeightRange('india');
      expect(range).toEqual({ min: 0.50, max: 0.69 });
    });

    it('should return default range for unknown country', () => {
      const range = getCountryHeadHeightRange('unknown');
      expect(range).toEqual({ min: 0.50, max: 0.69 }); // US default
    });

    it('should handle US visa (same as US)', () => {
      const range = getCountryHeadHeightRange('us_visa');
      expect(range).toEqual({ min: 0.50, max: 0.69 });
    });

    it('should handle UK visa (same as UK)', () => {
      const range = getCountryHeadHeightRange('uk_visa');
      expect(range).toEqual({ min: 0.64, max: 0.755 });
    });

    it('should handle schengen visa (same as EU)', () => {
      const range = getCountryHeadHeightRange('schengen_visa');
      expect(range).toEqual({ min: 0.71, max: 0.80 });
    });
  });

  describe('calculateOvalDimensions', () => {
    const viewportWidth = 640;
    const viewportHeight = 480;

    it('should calculate correct oval for US standard', () => {
      const oval = calculateOvalDimensions('us', viewportWidth, viewportHeight);
      
      // US: 50-69% of photo height, target is midpoint: 59.5%
      // Oval should be centered
      expect(oval.centerX).toBe(320); // Center of 640
      expect(oval.centerY).toBeGreaterThan(200); // Upper third-ish
      expect(oval.centerY).toBeLessThan(280);
      
      // Height should be around 59.5% of viewport for target
      const targetHeightPercent = (0.50 + 0.69) / 2; // 0.595
      expect(oval.height).toBeCloseTo(viewportHeight * targetHeightPercent, -1);
      
      // Oval width is typically ~70-80% of height for face proportions
      expect(oval.width).toBeGreaterThan(oval.height * 0.65);
      expect(oval.width).toBeLessThan(oval.height * 0.85);
    });

    it('should calculate correct oval for UK standard', () => {
      const oval = calculateOvalDimensions('uk', viewportWidth, viewportHeight);
      
      // UK: 64-75.5% target: 69.75%
      const targetHeightPercent = (0.64 + 0.755) / 2;
      expect(oval.height).toBeCloseTo(viewportHeight * targetHeightPercent, -1);
      expect(oval.centerX).toBe(320);
    });

    it('should calculate correct oval for EU standard', () => {
      const oval = calculateOvalDimensions('eu', viewportWidth, viewportHeight);
      
      // EU: 71-80% target: 75.5%
      const targetHeightPercent = (0.71 + 0.80) / 2;
      expect(oval.height).toBeCloseTo(viewportHeight * targetHeightPercent, -1);
    });

    it('should calculate correct oval for Canada standard', () => {
      const oval = calculateOvalDimensions('canada', viewportWidth, viewportHeight);
      
      // Canada: 44-51% target: 47.5%
      const targetHeightPercent = (0.44 + 0.51) / 2;
      expect(oval.height).toBeCloseTo(viewportHeight * targetHeightPercent, -1);
    });

    it('should calculate correct oval for India standard', () => {
      const oval = calculateOvalDimensions('india', viewportWidth, viewportHeight);
      
      // India: same as US 50-69%
      const targetHeightPercent = (0.50 + 0.69) / 2;
      expect(oval.height).toBeCloseTo(viewportHeight * targetHeightPercent, -1);
    });

    it('should handle different viewport aspect ratios', () => {
      // Portrait viewport
      const portraitOval = calculateOvalDimensions('us', 480, 640);
      expect(portraitOval.centerX).toBe(240);
      
      // Wide viewport
      const wideOval = calculateOvalDimensions('us', 1920, 1080);
      expect(wideOval.centerX).toBe(960);
    });

    it('should return min and max height values', () => {
      const oval = calculateOvalDimensions('us', viewportWidth, viewportHeight);
      
      expect(oval.minHeight).toBeDefined();
      expect(oval.maxHeight).toBeDefined();
      expect(oval.minHeight).toBeLessThan(oval.height);
      expect(oval.maxHeight).toBeGreaterThan(oval.height);
    });
  });

  describe('analyzeFacePosition', () => {
    const viewportWidth = 640;
    const viewportHeight = 480;

    it('should detect perfectly centered face', () => {
      const faceBox = {
        x: 220, // Face starts near center
        y: 90,
        w: 200,
        h: 250,
      };
      
      const result = analyzeFacePosition(faceBox, viewportWidth, viewportHeight);
      
      expect(result.isCentered).toBe(true);
      expect(result.horizontalOffset).toBeCloseTo(0, 0);
    });

    it('should detect face too far left', () => {
      const faceBox = {
        x: 50, // Face on left side
        y: 90,
        w: 150,
        h: 200,
      };
      
      const result = analyzeFacePosition(faceBox, viewportWidth, viewportHeight);
      
      expect(result.isCentered).toBe(false);
      expect(result.horizontalOffset).toBeLessThan(-0.1);
      expect(result.direction).toBe('left');
    });

    it('should detect face too far right', () => {
      const faceBox = {
        x: 450, // Face on right side
        y: 90,
        w: 150,
        h: 200,
      };
      
      const result = analyzeFacePosition(faceBox, viewportWidth, viewportHeight);
      
      expect(result.isCentered).toBe(false);
      expect(result.horizontalOffset).toBeGreaterThan(0.1);
      expect(result.direction).toBe('right');
    });

    it('should detect face too high', () => {
      const faceBox = {
        x: 220,
        y: 10, // Face very high
        w: 200,
        h: 200,
      };
      
      const result = analyzeFacePosition(faceBox, viewportWidth, viewportHeight);
      
      expect(result.verticalOffset).toBeLessThan(-0.1);
      expect(result.verticalDirection).toBe('up');
    });

    it('should detect face too low', () => {
      const faceBox = {
        x: 220,
        y: 280, // Face low
        w: 200,
        h: 200,
      };
      
      const result = analyzeFacePosition(faceBox, viewportWidth, viewportHeight);
      
      expect(result.verticalOffset).toBeGreaterThan(0.1);
      expect(result.verticalDirection).toBe('down');
    });

    it('should handle null face data', () => {
      const result = analyzeFacePosition(null, viewportWidth, viewportHeight);
      
      expect(result.isCentered).toBe(false);
      expect(result.faceDetected).toBe(false);
    });

    it('should provide overlap percentage with target oval', () => {
      const faceBox = {
        x: 220,
        y: 90,
        w: 200,
        h: 250,
      };
      
      const result = analyzeFacePosition(faceBox, viewportWidth, viewportHeight);
      
      expect(result.overlapPercent).toBeDefined();
      expect(result.overlapPercent).toBeGreaterThanOrEqual(0);
      expect(result.overlapPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeDistance', () => {
    const viewportHeight = 480;

    it('should detect perfect distance (face at target size)', () => {
      // Target is around 59.5% of viewport for US
      const faceHeight = viewportHeight * 0.595;
      
      const result = analyzeDistance(faceHeight, viewportHeight, 'us');
      
      expect(result.status).toBe('good');
      expect(result.isGood).toBe(true);
    });

    it('should detect too close (face too large)', () => {
      // Face taking up 80% of viewport (too large)
      const faceHeight = viewportHeight * 0.80;
      
      const result = analyzeDistance(faceHeight, viewportHeight, 'us');
      
      expect(result.status).toBe('too-close');
      expect(result.isGood).toBe(false);
      expect(result.message).toContain('back');
    });

    it('should detect too far (face too small)', () => {
      // Face taking up only 30% of viewport (too small)
      const faceHeight = viewportHeight * 0.30;
      
      const result = analyzeDistance(faceHeight, viewportHeight, 'us');
      
      expect(result.status).toBe('too-far');
      expect(result.isGood).toBe(false);
      expect(result.message).toContain('closer');
    });

    it('should handle different country standards', () => {
      // Canada has smaller head requirement (44-51%)
      const faceHeightCanada = viewportHeight * 0.475; // Target for Canada
      const resultCanada = analyzeDistance(faceHeightCanada, viewportHeight, 'canada');
      expect(resultCanada.status).toBe('good');
      
      // Same size would be wrong for EU (71-80%)
      const resultEU = analyzeDistance(faceHeightCanada, viewportHeight, 'eu');
      expect(resultEU.status).toBe('too-far');
    });

    it('should provide percentage difference from target', () => {
      const faceHeight = viewportHeight * 0.40; // 40%
      
      const result = analyzeDistance(faceHeight, viewportHeight, 'us');
      
      expect(result.percentFromTarget).toBeDefined();
      expect(typeof result.percentFromTarget).toBe('number');
    });

    it('should handle edge cases at boundaries', () => {
      // Exactly at minimum boundary for US (50%)
      const faceHeightMin = viewportHeight * 0.50;
      const resultMin = analyzeDistance(faceHeightMin, viewportHeight, 'us');
      expect(resultMin.isGood).toBe(true);
      
      // Exactly at maximum boundary for US (69%)
      const faceHeightMax = viewportHeight * 0.69;
      const resultMax = analyzeDistance(faceHeightMax, viewportHeight, 'us');
      expect(resultMax.isGood).toBe(true);
    });

    it('should handle zero face height', () => {
      const result = analyzeDistance(0, viewportHeight, 'us');
      
      expect(result.status).toBe('too-far');
      expect(result.isGood).toBe(false);
    });
  });

  describe('analyzeBrightness', () => {
    // Mock ImageData structure
    function createMockImageData(brightness: number): ImageData {
      // Create uniform brightness image data
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = brightness;     // R
        data[i + 1] = brightness; // G
        data[i + 2] = brightness; // B
        data[i + 3] = 255;        // A
      }
      
      return { data, width, height } as ImageData;
    }

    it('should detect good lighting (moderate brightness)', () => {
      const imageData = createMockImageData(128); // Middle brightness
      
      const result = analyzeBrightness(imageData);
      
      expect(result.status).toBe('good');
      expect(result.isGood).toBe(true);
      expect(result.icon).toBe('☀️');
    });

    it('should detect too dark', () => {
      const imageData = createMockImageData(40); // Dark
      
      const result = analyzeBrightness(imageData);
      
      expect(result.status).toBe('too-dark');
      expect(result.isGood).toBe(false);
      expect(result.icon).toBe('🌑');
      expect(result.message).toContain('dark');
    });

    it('should detect overexposed/too bright', () => {
      const imageData = createMockImageData(240); // Very bright
      
      const result = analyzeBrightness(imageData);
      
      expect(result.status).toBe('too-bright');
      expect(result.isGood).toBe(false);
      expect(result.icon).toBe('💡');
      expect(result.message).toContain('bright');
    });

    it('should return brightness score 0-100', () => {
      const imageData = createMockImageData(128);
      
      const result = analyzeBrightness(imageData);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle variable brightness (natural lighting)', () => {
      // Create image with varied brightness (simulating natural lighting)
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      for (let i = 0; i < data.length; i += 4) {
        const variance = Math.sin(i / 100) * 30;
        const brightness = Math.max(0, Math.min(255, 128 + variance));
        data[i] = brightness;
        data[i + 1] = brightness;
        data[i + 2] = brightness;
        data[i + 3] = 255;
      }
      
      const imageData = { data, width, height } as ImageData;
      const result = analyzeBrightness(imageData);
      
      // Should still be good with moderate variance
      expect(result.isGood).toBe(true);
    });

    it('should handle empty image data', () => {
      const imageData = {
        data: new Uint8ClampedArray(0),
        width: 0,
        height: 0,
      } as ImageData;
      
      const result = analyzeBrightness(imageData);
      
      expect(result.status).toBe('too-dark');
      expect(result.isGood).toBe(false);
    });
  });

  describe('analyzeHeadTilt', () => {
    it('should detect level head (no tilt)', () => {
      const leftEye = { x: 200, y: 150 };
      const rightEye = { x: 300, y: 150 }; // Same Y = level
      
      const result = analyzeHeadTilt(leftEye, rightEye);
      
      expect(result.isLevel).toBe(true);
      expect(result.tiltAngle).toBeCloseTo(0, 0);
    });

    it('should detect head tilted right (clockwise)', () => {
      const leftEye = { x: 200, y: 160 };
      const rightEye = { x: 300, y: 140 }; // Right eye higher
      
      const result = analyzeHeadTilt(leftEye, rightEye);
      
      expect(result.isLevel).toBe(false);
      expect(result.tiltAngle).toBeLessThan(0); // Negative = tilted right
      expect(result.direction).toBe('right');
    });

    it('should detect head tilted left (counter-clockwise)', () => {
      const leftEye = { x: 200, y: 140 };
      const rightEye = { x: 300, y: 160 }; // Left eye higher
      
      const result = analyzeHeadTilt(leftEye, rightEye);
      
      expect(result.isLevel).toBe(false);
      expect(result.tiltAngle).toBeGreaterThan(0); // Positive = tilted left
      expect(result.direction).toBe('left');
    });

    it('should allow small tilt within tolerance (< 5 degrees)', () => {
      // 3 degree tilt
      const leftEye = { x: 200, y: 150 };
      const radians = 3 * Math.PI / 180;
      const rightEyeY = 150 + Math.tan(radians) * 100;
      const rightEye = { x: 300, y: rightEyeY };
      
      const result = analyzeHeadTilt(leftEye, rightEye);
      
      expect(result.isLevel).toBe(true); // Within tolerance
      expect(Math.abs(result.tiltAngle)).toBeLessThan(5);
    });

    it('should detect significant tilt (> 8 degrees)', () => {
      // 10 degree tilt
      const leftEye = { x: 200, y: 150 };
      const radians = 10 * Math.PI / 180;
      const rightEyeY = 150 + Math.tan(radians) * 100;
      const rightEye = { x: 300, y: rightEyeY };
      
      const result = analyzeHeadTilt(leftEye, rightEye);
      
      expect(result.isLevel).toBe(false);
      expect(Math.abs(result.tiltAngle)).toBeGreaterThan(8);
    });

    it('should handle null left eye', () => {
      const result = analyzeHeadTilt(null, { x: 300, y: 150 });
      
      expect(result.isLevel).toBe(false);
      expect(result.eyesDetected).toBe(false);
    });

    it('should handle null right eye', () => {
      const result = analyzeHeadTilt({ x: 200, y: 150 }, null);
      
      expect(result.isLevel).toBe(false);
      expect(result.eyesDetected).toBe(false);
    });

    it('should handle both eyes null', () => {
      const result = analyzeHeadTilt(null, null);
      
      expect(result.isLevel).toBe(false);
      expect(result.eyesDetected).toBe(false);
    });
  });

  describe('checkAllConditions', () => {
    const goodPosition: FacePositionResult = {
      isCentered: true,
      faceDetected: true,
      horizontalOffset: 0,
      verticalOffset: 0,
      direction: 'center',
      verticalDirection: 'center',
      overlapPercent: 90,
    };

    const goodDistance: DistanceResult = {
      status: 'good',
      isGood: true,
      message: 'Perfect distance',
      percentFromTarget: 0,
    };

    const goodBrightness: BrightnessResult = {
      status: 'good',
      isGood: true,
      icon: '☀️',
      message: 'Good lighting',
      score: 75,
    };

    const goodTilt: HeadTiltResult = {
      isLevel: true,
      eyesDetected: true,
      tiltAngle: 0,
      direction: 'level',
    };

    it('should return all good when all conditions are met', () => {
      const result = checkAllConditions(goodPosition, goodDistance, goodBrightness, goodTilt);
      
      expect(result.allGood).toBe(true);
      expect(result.readyToCapture).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should fail when face is not centered', () => {
      const badPosition: FacePositionResult = {
        ...goodPosition,
        isCentered: false,
        direction: 'left',
      };
      
      const result = checkAllConditions(badPosition, goodDistance, goodBrightness, goodTilt);
      
      expect(result.allGood).toBe(false);
      expect(result.issues).toContain('position');
    });

    it('should fail when distance is wrong', () => {
      const badDistance: DistanceResult = {
        ...goodDistance,
        status: 'too-far',
        isGood: false,
      };
      
      const result = checkAllConditions(goodPosition, badDistance, goodBrightness, goodTilt);
      
      expect(result.allGood).toBe(false);
      expect(result.issues).toContain('distance');
    });

    it('should fail when lighting is bad', () => {
      const badBrightness: BrightnessResult = {
        ...goodBrightness,
        status: 'too-dark',
        isGood: false,
      };
      
      const result = checkAllConditions(goodPosition, goodDistance, badBrightness, goodTilt);
      
      expect(result.allGood).toBe(false);
      expect(result.issues).toContain('lighting');
    });

    it('should fail when head is tilted', () => {
      const badTilt: HeadTiltResult = {
        ...goodTilt,
        isLevel: false,
        direction: 'left',
      };
      
      const result = checkAllConditions(goodPosition, goodDistance, goodBrightness, badTilt);
      
      expect(result.allGood).toBe(false);
      expect(result.issues).toContain('tilt');
    });

    it('should report multiple issues', () => {
      const badPosition: FacePositionResult = { ...goodPosition, isCentered: false };
      const badDistance: DistanceResult = { ...goodDistance, isGood: false };
      const badBrightness: BrightnessResult = { ...goodBrightness, isGood: false };
      const badTilt: HeadTiltResult = { ...goodTilt, isLevel: false };
      
      const result = checkAllConditions(badPosition, badDistance, badBrightness, badTilt);
      
      expect(result.allGood).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(4);
    });

    it('should fail when no face detected', () => {
      const noFace: FacePositionResult = {
        ...goodPosition,
        faceDetected: false,
        isCentered: false,
      };
      
      const result = checkAllConditions(noFace, goodDistance, goodBrightness, goodTilt);
      
      expect(result.allGood).toBe(false);
      expect(result.issues).toContain('no-face');
    });
  });
});

describe('Camera Analysis Edge Cases', () => {
  describe('Boundary conditions', () => {
    it('should handle viewport dimensions of 1x1', () => {
      const oval = calculateOvalDimensions('us', 1, 1);
      expect(oval.width).toBeGreaterThan(0);
      expect(oval.height).toBeGreaterThan(0);
    });

    it('should handle very large viewport', () => {
      const oval = calculateOvalDimensions('us', 4096, 2160);
      expect(oval.centerX).toBe(2048);
      expect(oval.height).toBeGreaterThan(0);
    });

    it('should handle face at exact center', () => {
      const faceBox = {
        x: 270, // (640-100)/2
        y: 190, // (480-100)/2
        w: 100,
        h: 100,
      };
      
      const result = analyzeFacePosition(faceBox, 640, 480);
      expect(result.horizontalOffset).toBeCloseTo(0, 1);
    });
  });

  describe('Mathematical verification', () => {
    it('should correctly calculate tilt angle', () => {
      // 45 degree tilt
      const leftEye = { x: 100, y: 100 };
      const rightEye = { x: 200, y: 200 }; // deltaY = deltaX = 100
      
      const result = analyzeHeadTilt(leftEye, rightEye);
      
      // atan2(100, 100) = 45 degrees
      expect(Math.abs(result.tiltAngle)).toBeCloseTo(45, 0);
    });

    it('should correctly calculate horizontal offset', () => {
      // Face centered at x=100 in viewport width 400
      // Face center = 100 + 100/2 = 150
      // Viewport center = 200
      // Offset = (150 - 200) / 200 = -0.25
      const faceBox = { x: 100, y: 100, w: 100, h: 100 };
      
      const result = analyzeFacePosition(faceBox, 400, 400);
      
      expect(result.horizontalOffset).toBeCloseTo(-0.25, 1);
    });
  });
});
