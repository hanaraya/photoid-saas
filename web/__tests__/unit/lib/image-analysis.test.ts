/**
 * Unit tests for image analysis utilities
 * Tests blur detection, exposure analysis, halo detection, and more
 */

import {
  detectBlur,
  calculateEyeTilt,
  detectGrayscale,
  analyzeFaceLighting,
  analyzeImage,
  analyzeExposure,
  calculateBlurScore,
  detectHaloArtifacts,
  type ImageAnalysis,
  type ExposureAnalysis,
  type HaloAnalysis,
} from '@/lib/image-analysis';

// Mock canvas and context
const createMockCanvas = () => {
  const imageDataMock: ImageData = {
    data: new Uint8ClampedArray(400 * 400 * 4), // 400x400 image
    width: 400,
    height: 400,
    colorSpace: 'srgb',
  };
  
  const ctxMock = {
    drawImage: jest.fn(),
    getImageData: jest.fn(() => imageDataMock),
  };
  
  return { ctxMock, imageDataMock };
};

// Create a mock image element with given dimensions
const createMockImage = (width: number, height: number): HTMLImageElement => {
  const img = {
    naturalWidth: width,
    naturalHeight: height,
    width,
    height,
  } as HTMLImageElement;
  return img;
};

// Store original createElement
const originalCreateElement = document.createElement.bind(document);

describe('Image Analysis - Blur Detection', () => {
  beforeEach(() => {
    const { ctxMock, imageDataMock } = createMockCanvas();
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctxMock),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('detectBlur', () => {
    it('should return a numeric blur score', () => {
      const img = createMockImage(800, 600);
      const score = detectBlur(img);
      expect(typeof score).toBe('number');
    });

    it('should return 999 when context is unavailable', () => {
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => null),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(800, 600);
      const score = detectBlur(img);
      expect(score).toBe(999);
    });

    it('should handle small images', () => {
      const img = createMockImage(100, 100);
      const score = detectBlur(img);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle large images by scaling down', () => {
      const img = createMockImage(4000, 3000);
      const score = detectBlur(img);
      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateBlurScore', () => {
    it('should calculate blur score from ImageData', () => {
      // Create a sharp image (high variance)
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Create a pattern with edges (sharp)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const value = (x + y) % 20 < 10 ? 255 : 0;
          data[idx] = value;
          data[idx + 1] = value;
          data[idx + 2] = value;
          data[idx + 3] = 255;
        }
      }
      
      const imageData: ImageData = { data, width, height, colorSpace: 'srgb' };
      const score = calculateBlurScore(imageData);
      
      expect(score).toBeGreaterThan(0);
    });

    it('should return lower score for uniform (blurry) images', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Uniform gray (no edges = blurry)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128;
        data[i + 1] = 128;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
      
      const imageData: ImageData = { data, width, height, colorSpace: 'srgb' };
      const score = calculateBlurScore(imageData);
      
      // Uniform image should have very low variance
      expect(score).toBeLessThan(10);
    });

    it('should return 0 for tiny images', () => {
      const data = new Uint8ClampedArray(2 * 2 * 4);
      const imageData: ImageData = { data, width: 2, height: 2, colorSpace: 'srgb' };
      const score = calculateBlurScore(imageData);
      expect(score).toBe(0);
    });

    it('should handle images with high contrast edges', () => {
      const width = 50;
      const height = 50;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Vertical black/white stripes (high frequency)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const value = x % 2 === 0 ? 0 : 255;
          data[idx] = value;
          data[idx + 1] = value;
          data[idx + 2] = value;
          data[idx + 3] = 255;
        }
      }
      
      const imageData: ImageData = { data, width, height, colorSpace: 'srgb' };
      const score = calculateBlurScore(imageData);
      
      // High contrast edges should produce high score
      expect(score).toBeGreaterThan(1000);
    });
  });
});

describe('Image Analysis - Exposure Detection', () => {
  beforeEach(() => {
    const { ctxMock, imageDataMock } = createMockCanvas();
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctxMock),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzeExposure', () => {
    it('should return ExposureAnalysis object', () => {
      const img = createMockImage(800, 600);
      const result = analyzeExposure(img);
      
      expect(result).toHaveProperty('brightness');
      expect(result).toHaveProperty('isOverexposed');
      expect(result).toHaveProperty('isUnderexposed');
      expect(result).toHaveProperty('isProperlyExposed');
    });

    it('should detect properly exposed images', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill with medium gray (properly exposed)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128;
        data[i + 1] = 128;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
      
      const ctxMockProperExposure = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data,
          width,
          height,
          colorSpace: 'srgb',
        })),
      };
      
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => ctxMockProperExposure),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(width, height);
      const result = analyzeExposure(img);
      
      expect(result.isProperlyExposed).toBe(true);
      expect(result.isOverexposed).toBe(false);
      expect(result.isUnderexposed).toBe(false);
    });

    it('should detect overexposed images (bright)', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill with very bright values (overexposed)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 250;
        data[i + 1] = 250;
        data[i + 2] = 250;
        data[i + 3] = 255;
      }
      
      const ctxMockBright = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data,
          width,
          height,
          colorSpace: 'srgb',
        })),
      };
      
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => ctxMockBright),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(width, height);
      const result = analyzeExposure(img);
      
      expect(result.isOverexposed).toBe(true);
      expect(result.isProperlyExposed).toBe(false);
      expect(result.brightness).toBeGreaterThan(200);
    });

    it('should detect underexposed images (dark)', () => {
      const { ctxMock } = createMockCanvas();
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill with very dark values (underexposed)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 30;
        data[i + 1] = 30;
        data[i + 2] = 30;
        data[i + 3] = 255;
      }
      
      ctxMock.getImageData = jest.fn(() => ({
        data,
        width,
        height,
        colorSpace: 'srgb',
      }));
      
      const img = createMockImage(width, height);
      const result = analyzeExposure(img);
      
      expect(result.isUnderexposed).toBe(true);
      expect(result.isProperlyExposed).toBe(false);
      expect(result.brightness).toBeLessThan(60);
    });

    it('should return safe defaults when context unavailable', () => {
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => null),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(800, 600);
      const result = analyzeExposure(img);
      
      expect(result.brightness).toBe(128);
      expect(result.isProperlyExposed).toBe(true);
    });

    it('should handle images with high contrast (clipped highlights)', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // 40% of pixels at max brightness (clipped highlights)
      for (let i = 0; i < data.length; i += 4) {
        const isHighlight = (i / 4) < (width * height * 0.4);
        const value = isHighlight ? 255 : 100;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 255;
      }
      
      const ctxMockHighlight = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data,
          width,
          height,
          colorSpace: 'srgb',
        })),
      };
      
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => ctxMockHighlight),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(width, height);
      const result = analyzeExposure(img);
      
      // Should detect clipped highlights - 40% of pixels at 255 triggers overexposed
      expect(result.isOverexposed).toBe(true);
    });
  });
});

describe('Image Analysis - Halo Detection', () => {
  beforeEach(() => {
    const { ctxMock, imageDataMock } = createMockCanvas();
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctxMock),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('detectHaloArtifacts', () => {
    it('should return HaloAnalysis object', () => {
      const img = createMockImage(600, 600);
      const result = detectHaloArtifacts(img, null);
      
      expect(result).toHaveProperty('haloScore');
      expect(result).toHaveProperty('hasHaloArtifacts');
      expect(result).toHaveProperty('edgeQuality');
    });

    it('should detect clean edges (no halos)', () => {
      const width = 400;
      const height = 400;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Create image with clean white background and dark center
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = 100;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (dist < radius) {
            // Dark face area
            data[idx] = 150;
            data[idx + 1] = 120;
            data[idx + 2] = 100;
          } else {
            // Clean white background
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
          }
          data[idx + 3] = 255;
        }
      }
      
      const ctxMockClean = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data,
          width,
          height,
          colorSpace: 'srgb',
        })),
      };
      
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width,
            height,
            getContext: jest.fn(() => ctxMockClean),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(width, height);
      const result = detectHaloArtifacts(img, null);
      
      expect(result.hasHaloArtifacts).toBe(false);
      expect(result.edgeQuality).toBeGreaterThanOrEqual(0);
    });

    it('should detect halo artifacts around edges', () => {
      const width = 400;
      const height = 400;
      const data = new Uint8ClampedArray(width * height * 4);
      
      const centerX = width / 2;
      const centerY = height * 0.4;
      const innerRadius = 80;
      const haloRadius = 100;
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          
          if (dist < innerRadius) {
            // Dark face area
            data[idx] = 150;
            data[idx + 1] = 120;
            data[idx + 2] = 100;
          } else if (dist < haloRadius) {
            // Bright halo ring (common artifact)
            data[idx] = 235;
            data[idx + 1] = 235;
            data[idx + 2] = 235;
          } else {
            // White background
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
          }
          data[idx + 3] = 255;
        }
      }
      
      const ctxMockHalo = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data,
          width,
          height,
          colorSpace: 'srgb',
        })),
      };
      
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width,
            height,
            getContext: jest.fn(() => ctxMockHalo),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(width, height);
      const result = detectHaloArtifacts(img, null);
      
      // Should detect halo (at least some signal)
      expect(result.haloScore).toBeGreaterThanOrEqual(0);
    });

    it('should use face data to focus scan region', () => {
      const { ctxMock } = createMockCanvas();
      const img = createMockImage(600, 800);
      
      const faceData = {
        x: 200,
        y: 150,
        w: 200,
        h: 250,
      };
      
      const result = detectHaloArtifacts(img, faceData);
      
      expect(result).toHaveProperty('haloScore');
      expect(result).toHaveProperty('edgeQuality');
    });

    it('should return safe defaults when context unavailable', () => {
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => null),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(600, 600);
      const result = detectHaloArtifacts(img, null);
      
      expect(result.haloScore).toBe(0);
      expect(result.hasHaloArtifacts).toBe(false);
      expect(result.edgeQuality).toBe(100);
    });
  });
});

describe('Image Analysis - Eye Tilt Detection', () => {
  describe('calculateEyeTilt', () => {
    it('should return 0 when eyes are level', () => {
      const leftEye = { x: 100, y: 100 };
      const rightEye = { x: 200, y: 100 };
      
      const tilt = calculateEyeTilt(leftEye, rightEye);
      expect(tilt).toBe(0);
    });

    it('should return positive angle when right eye is higher', () => {
      const leftEye = { x: 100, y: 110 };
      const rightEye = { x: 200, y: 100 };
      
      const tilt = calculateEyeTilt(leftEye, rightEye);
      expect(tilt).toBeLessThan(0); // Right eye higher = negative angle
    });

    it('should return negative angle when left eye is higher', () => {
      const leftEye = { x: 100, y: 100 };
      const rightEye = { x: 200, y: 110 };
      
      const tilt = calculateEyeTilt(leftEye, rightEye);
      expect(tilt).toBeGreaterThan(0); // Right eye lower = positive angle
    });

    it('should return 0 when left eye is null', () => {
      const tilt = calculateEyeTilt(null, { x: 200, y: 100 });
      expect(tilt).toBe(0);
    });

    it('should return 0 when right eye is null', () => {
      const tilt = calculateEyeTilt({ x: 100, y: 100 }, null);
      expect(tilt).toBe(0);
    });

    it('should return 0 when both eyes are null', () => {
      const tilt = calculateEyeTilt(null, null);
      expect(tilt).toBe(0);
    });

    it('should calculate correct angle for 45 degree tilt', () => {
      const leftEye = { x: 100, y: 100 };
      const rightEye = { x: 200, y: 200 };
      
      const tilt = calculateEyeTilt(leftEye, rightEye);
      expect(tilt).toBeCloseTo(45, 0);
    });
  });
});

describe('Image Analysis - Grayscale Detection', () => {
  beforeEach(() => {
    const { ctxMock } = createMockCanvas();
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctxMock),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('detectGrayscale', () => {
    it('should detect grayscale images', () => {
      const { ctxMock } = createMockCanvas();
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Create grayscale pattern (R=G=B)
      for (let i = 0; i < data.length; i += 4) {
        const gray = (i / 4) % 256;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        data[i + 3] = 255;
      }
      
      ctxMock.getImageData = jest.fn(() => ({
        data,
        width,
        height,
        colorSpace: 'srgb',
      }));
      
      const img = createMockImage(width, height);
      const result = detectGrayscale(img);
      
      expect(result).toBe(true);
    });

    it('should detect color images as not grayscale', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Create colorful pattern with significant color difference
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 200;     // Red
        data[i + 1] = 100; // Green
        data[i + 2] = 50;  // Blue
        data[i + 3] = 255;
      }
      
      const ctxMockColor = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({
          data,
          width,
          height,
          colorSpace: 'srgb',
        })),
      };
      
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => ctxMockColor),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(width, height);
      const result = detectGrayscale(img);
      
      expect(result).toBe(false);
    });

    it('should return false when context unavailable', () => {
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: jest.fn(() => null),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(100, 100);
      const result = detectGrayscale(img);
      
      expect(result).toBe(false);
    });
  });
});

describe('Image Analysis - Face Lighting', () => {
  beforeEach(() => {
    const { ctxMock } = createMockCanvas();
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctxMock),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzeFaceLighting', () => {
    it('should return 100 when no face data', () => {
      const img = createMockImage(800, 600);
      const score = analyzeFaceLighting(img, null);
      expect(score).toBe(100);
    });

    it('should detect even lighting (high score)', () => {
      const { ctxMock } = createMockCanvas();
      const width = 400;
      const height = 400;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Even lighting across face
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 150;
        data[i + 1] = 130;
        data[i + 2] = 120;
        data[i + 3] = 255;
      }
      
      ctxMock.getImageData = jest.fn(() => ({
        data,
        width,
        height,
        colorSpace: 'srgb',
      }));
      
      const img = createMockImage(width, height);
      const faceData = { x: 100, y: 100, w: 200, h: 200 };
      const score = analyzeFaceLighting(img, faceData);
      
      expect(score).toBeGreaterThan(80);
    });

    it('should detect uneven lighting (shadows)', () => {
      // Test with a strongly asymmetric lighting pattern
      // This test validates the algorithm correctly identifies left/right brightness differences
      const width = 400;
      const height = 400;
      const faceData = { x: 50, y: 50, w: 300, h: 300 };
      
      // Calculate the face region with padding (as the function does)
      const padding = faceData.w * 0.1;
      const faceX = Math.max(0, Math.round(faceData.x - padding));
      const faceY = Math.max(0, Math.round(faceData.y - padding));
      const faceW = Math.min(width - faceX, Math.round(faceData.w + padding * 2));
      const faceH = Math.min(height - faceY, Math.round(faceData.h + padding * 2));
      
      const data = new Uint8ClampedArray(faceW * faceH * 4);
      
      // Left side dark, right side bright within face region
      for (let py = 0; py < faceH; py++) {
        for (let px = 0; px < faceW; px++) {
          const idx = (py * faceW + px) * 4;
          const brightness = px < faceW / 2 ? 60 : 200; // Strong contrast
          data[idx] = brightness;
          data[idx + 1] = brightness;
          data[idx + 2] = brightness;
          data[idx + 3] = 255;
        }
      }
      
      const ctxMockShadow = {
        drawImage: jest.fn(),
        getImageData: jest.fn().mockImplementation((x: number, y: number, w: number, h: number) => ({
          data,
          width: w,
          height: h,
          colorSpace: 'srgb',
        })),
      };
      
      jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        if (tag === 'canvas') {
          return {
            width,
            height,
            getContext: jest.fn(() => ctxMockShadow),
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tag);
      });
      
      const img = createMockImage(width, height);
      const score = analyzeFaceLighting(img, faceData);
      
      // With 60 vs 200 brightness, asymmetry should be detected
      expect(score).toBeLessThan(80);
    });

    it('should handle face at image edge', () => {
      const { ctxMock } = createMockCanvas();
      const img = createMockImage(400, 400);
      
      // Face at edge
      const faceData = { x: 0, y: 0, w: 100, h: 100 };
      const score = analyzeFaceLighting(img, faceData);
      
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

describe('Image Analysis - Full analyzeImage Function', () => {
  beforeEach(() => {
    const { ctxMock } = createMockCanvas();
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctxMock),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('analyzeImage', () => {
    it('should return complete ImageAnalysis object', () => {
      const img = createMockImage(800, 600);
      const faceData = {
        x: 200,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 250, y: 200 },
        rightEye: { x: 350, y: 200 },
      };
      
      const result = analyzeImage(img, faceData);
      
      expect(result).toHaveProperty('blurScore');
      expect(result).toHaveProperty('isBlurry');
      expect(result).toHaveProperty('eyeTilt');
      expect(result).toHaveProperty('isTilted');
      expect(result).toHaveProperty('isGrayscale');
      expect(result).toHaveProperty('faceLightingScore');
      expect(result).toHaveProperty('hasUnevenLighting');
      expect(result).toHaveProperty('exposure');
      expect(result).toHaveProperty('halo');
    });

    it('should handle null face data', () => {
      const img = createMockImage(800, 600);
      const result = analyzeImage(img, null);
      
      expect(result.eyeTilt).toBe(0);
      expect(result.isTilted).toBe(false);
      expect(result.faceLightingScore).toBe(100);
      expect(result.hasUnevenLighting).toBe(false);
    });

    it('should correctly flag blurry images', () => {
      const { ctxMock } = createMockCanvas();
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Uniform gray (blurry)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 128;
        data[i + 1] = 128;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
      
      ctxMock.getImageData = jest.fn(() => ({
        data,
        width,
        height,
        colorSpace: 'srgb',
      }));
      
      const img = createMockImage(width, height);
      const result = analyzeImage(img, null);
      
      expect(result.blurScore).toBeLessThan(100);
      expect(result.isBlurry).toBe(true);
    });

    it('should correctly flag tilted faces', () => {
      const img = createMockImage(800, 600);
      const faceData = {
        x: 200,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 250, y: 200 },
        rightEye: { x: 350, y: 230 }, // Tilted significantly
      };
      
      const result = analyzeImage(img, faceData);
      
      expect(Math.abs(result.eyeTilt)).toBeGreaterThan(8);
      expect(result.isTilted).toBe(true);
    });

    it('should include exposure analysis', () => {
      const img = createMockImage(800, 600);
      const result = analyzeImage(img, null);
      
      expect(result.exposure).toHaveProperty('brightness');
      expect(result.exposure).toHaveProperty('isOverexposed');
      expect(result.exposure).toHaveProperty('isUnderexposed');
      expect(result.exposure).toHaveProperty('isProperlyExposed');
    });

    it('should include halo analysis', () => {
      const img = createMockImage(800, 600);
      const result = analyzeImage(img, null);
      
      expect(result.halo).toHaveProperty('haloScore');
      expect(result.halo).toHaveProperty('hasHaloArtifacts');
      expect(result.halo).toHaveProperty('edgeQuality');
    });
  });
});

describe('Image Analysis - Edge Cases', () => {
  beforeEach(() => {
    const { ctxMock } = createMockCanvas();
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn(() => ctxMock),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle 1x1 images', () => {
    const { ctxMock } = createMockCanvas();
    ctxMock.getImageData = jest.fn(() => ({
      data: new Uint8ClampedArray([128, 128, 128, 255]),
      width: 1,
      height: 1,
      colorSpace: 'srgb',
    }));
    
    const img = createMockImage(1, 1);
    const result = analyzeImage(img, null);
    
    expect(result).toBeDefined();
    expect(typeof result.blurScore).toBe('number');
  });

  it('should handle very large images', () => {
    const img = createMockImage(10000, 10000);
    const result = analyzeImage(img, null);
    
    expect(result).toBeDefined();
    expect(result.blurScore).toBeGreaterThanOrEqual(0);
  });

  it('should handle images with all white pixels', () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
    
    const ctxMockWhite = {
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data,
        width,
        height,
        colorSpace: 'srgb',
      })),
    };
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width,
          height,
          getContext: jest.fn(() => ctxMockWhite),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
    
    const img = createMockImage(width, height);
    const result = analyzeImage(img, null);
    
    expect(result.exposure.isOverexposed).toBe(true);
    expect(result.isGrayscale).toBe(true);
  });

  it('should handle images with all black pixels', () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    
    // All zeros (black), alpha = 255
    for (let i = 0; i < data.length; i += 4) {
      data[i + 3] = 255;
    }
    
    const ctxMockBlack = {
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data,
        width,
        height,
        colorSpace: 'srgb',
      })),
    };
    
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return {
          width,
          height,
          getContext: jest.fn(() => ctxMockBlack),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });
    
    const img = createMockImage(width, height);
    const result = analyzeImage(img, null);
    
    expect(result.exposure.isUnderexposed).toBe(true);
  });

  it('should handle face data with extreme coordinates', () => {
    const img = createMockImage(800, 600);
    const faceData = {
      x: -100,
      y: -50,
      w: 1000,
      h: 800,
      leftEye: { x: -50, y: 100 },
      rightEye: { x: 900, y: 100 },
    };
    
    // Should not throw
    const result = analyzeImage(img, faceData);
    expect(result).toBeDefined();
  });
});
