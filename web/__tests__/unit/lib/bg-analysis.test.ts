/**
 * @jest-environment jsdom
 */
import { analyzeBackground, type BgAnalysis } from '@/lib/bg-analysis';

describe('Background Analysis', () => {
  const originalCreateElement = document.createElement.bind(document);

  function setupCanvasMock(pixelData: number[] = [255, 255, 255, 255]) {
    const mockContext = {
      drawImage: jest.fn(),
      getImageData: jest.fn().mockReturnValue({
        data: new Uint8ClampedArray(pixelData),
      }),
    } as unknown as CanvasRenderingContext2D;

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn().mockReturnValue(mockContext),
    } as unknown as HTMLCanvasElement;

    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return mockCanvas;
      }
      return originalCreateElement(tag);
    });

    return { mockCanvas, mockContext };
  }

  function createMockImage(width = 1000, height = 800) {
    return {
      naturalWidth: width,
      naturalHeight: height,
    } as HTMLImageElement;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Return value structure', () => {
    it('should return object with score property', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(), null);
      expect(typeof result.score).toBe('number');
    });

    it('should return object with averageRgb property', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(), null);
      expect(result.averageRgb).toHaveProperty('r');
      expect(result.averageRgb).toHaveProperty('g');
      expect(result.averageRgb).toHaveProperty('b');
    });

    it('should return object with needsRemoval boolean', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(), null);
      expect(typeof result.needsRemoval).toBe('boolean');
    });

    it('should return object with reason string', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(), null);
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('Score boundaries', () => {
    it('should return score >= 0', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(), null);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should return score <= 100', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(), null);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Null context handling', () => {
    it('should handle null canvas context', () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(null),
      } as unknown as HTMLCanvasElement;

      jest
        .spyOn(document, 'createElement')
        .mockImplementation((tag: string) => {
          if (tag === 'canvas') {
            return mockCanvas;
          }
          return originalCreateElement(tag);
        });

      const result = analyzeBackground(createMockImage(), null);

      expect(result.score).toBe(0);
      expect(result.needsRemoval).toBe(true);
      expect(result.reason).toContain('Could not analyze');
    });
  });

  describe('Face data handling', () => {
    it('should accept face data parameter', () => {
      setupCanvasMock();
      const faceData = { x: 400, y: 200, w: 200, h: 250 };

      expect(() => {
        analyzeBackground(createMockImage(), faceData);
      }).not.toThrow();
    });

    it('should work with null face data', () => {
      setupCanvasMock();

      expect(() => {
        analyzeBackground(createMockImage(), null);
      }).not.toThrow();
    });

    it('should return valid result with face data', () => {
      setupCanvasMock();
      const faceData = { x: 400, y: 200, w: 200, h: 250 };

      const result = analyzeBackground(createMockImage(), faceData);

      expect(typeof result.score).toBe('number');
      expect(typeof result.needsRemoval).toBe('boolean');
    });
  });

  describe('Image size handling', () => {
    it('should handle small images', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(100, 100), null);
      expect(typeof result.score).toBe('number');
    });

    it('should handle large images', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(5000, 4000), null);
      expect(typeof result.score).toBe('number');
    });

    it('should handle non-square images', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(1920, 1080), null);
      expect(typeof result.score).toBe('number');
    });
  });

  describe('Canvas setup', () => {
    it('should create canvas element', () => {
      const spy = jest.spyOn(document, 'createElement');
      setupCanvasMock();

      analyzeBackground(createMockImage(), null);

      expect(spy).toHaveBeenCalledWith('canvas');
    });

    it('should get 2d context', () => {
      const { mockCanvas } = setupCanvasMock();

      analyzeBackground(createMockImage(), null);

      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should draw image on canvas', () => {
      const { mockContext } = setupCanvasMock();
      const mockImage = createMockImage();

      analyzeBackground(mockImage, null);

      expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
    });
  });

  describe('RGB value ranges', () => {
    it('should return RGB values in valid range', () => {
      setupCanvasMock();
      const result = analyzeBackground(createMockImage(), null);

      expect(result.averageRgb.r).toBeGreaterThanOrEqual(0);
      expect(result.averageRgb.r).toBeLessThanOrEqual(255);
      expect(result.averageRgb.g).toBeGreaterThanOrEqual(0);
      expect(result.averageRgb.g).toBeLessThanOrEqual(255);
      expect(result.averageRgb.b).toBeGreaterThanOrEqual(0);
      expect(result.averageRgb.b).toBeLessThanOrEqual(255);
    });
  });

  describe('Type exports', () => {
    it('should export BgAnalysis type', () => {
      // Type-level test - just verify the type is importable
      const analysis: BgAnalysis = {
        score: 50,
        averageRgb: { r: 128, g: 128, b: 128 },
        needsRemoval: false,
        reason: 'Test',
      };
      expect(analysis.score).toBe(50);
    });
  });
});
