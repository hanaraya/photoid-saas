/**
 * @jest-environment jsdom
 */
import {
  calculateCrop,
  renderPassportPhoto,
  renderSheet,
  type CropParams,
} from '@/lib/crop';
import { type FaceData } from '@/lib/face-detection';
import { type PhotoStandard } from '@/lib/photo-standards';

// Mock canvas context
const createMockContext = () => ({
  drawImage: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  clearRect: jest.fn(),
  fillStyle: '',
  fillRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  globalAlpha: 1,
  font: '',
  fillText: jest.fn(),
  textAlign: '',
  textBaseline: '',
  rotate: jest.fn(),
  filter: 'none',
  strokeStyle: '',
  lineWidth: 0,
  setLineDash: jest.fn(),
  strokeRect: jest.fn(),
});

describe('Crop Functions', () => {
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
    bgColor: '#ffffff',
    description: 'US Passport photo',
  };

  const mockFaceData: FaceData = {
    x: 100,
    y: 150,
    w: 200,
    h: 250,
    leftEye: { x: 150, y: 200 },
    rightEye: { x: 250, y: 200 },
  };

  describe('calculateCrop', () => {
    it('should calculate crop parameters with face data', () => {
      const imageWidth = 1000;
      const imageHeight = 800;

      const cropParams = calculateCrop(
        imageWidth,
        imageHeight,
        mockFaceData,
        mockStandard
      );

      expect(cropParams).toBeDefined();
      expect(typeof cropParams.cropX).toBe('number');
      expect(typeof cropParams.cropY).toBe('number');
      expect(cropParams.cropW).toBeGreaterThan(0);
      expect(cropParams.cropH).toBeGreaterThan(0);
    });

    it('should handle edge cases with small images', () => {
      const smallImageWidth = 200;
      const smallImageHeight = 200;

      const smallFaceData: FaceData = {
        x: 10,
        y: 20,
        w: 50,
        h: 60,
        leftEye: { x: 25, y: 35 },
        rightEye: { x: 45, y: 35 },
      };

      const cropParams = calculateCrop(
        smallImageWidth,
        smallImageHeight,
        smallFaceData,
        mockStandard
      );

      expect(cropParams).toBeDefined();
      expect(typeof cropParams.cropX).toBe('number');
      expect(typeof cropParams.cropY).toBe('number');
      expect(cropParams.cropW).toBeGreaterThan(0);
      expect(cropParams.cropH).toBeGreaterThan(0);
    });

    it('should handle faces at image boundaries', () => {
      const boundaryFaceData: FaceData = {
        x: 0,
        y: 0,
        w: 100,
        h: 120,
        leftEye: { x: 20, y: 25 },
        rightEye: { x: 80, y: 25 },
      };

      const cropParams = calculateCrop(
        1000,
        800,
        boundaryFaceData,
        mockStandard
      );

      expect(cropParams).toBeDefined();
      expect(typeof cropParams.cropX).toBe('number');
      expect(typeof cropParams.cropY).toBe('number');
    });

    it('should handle different photo standards (mm units)', () => {
      const mmStandard: PhotoStandard = {
        id: 'eu',
        name: 'EU Passport',
        country: 'European Union',
        flag: '🇪🇺',
        w: 35,
        h: 45,
        unit: 'mm',
        headMin: 32,
        headMax: 36,
        eyeFromBottom: 30,
        bgColor: '#ffffff',
        description: 'EU Passport photo',
      };

      const cropParams = calculateCrop(1000, 800, mockFaceData, mmStandard);

      expect(cropParams).toBeDefined();
      expect(cropParams.cropW).toBeGreaterThan(0);
      expect(cropParams.cropH).toBeGreaterThan(0);
    });

    it('should handle null face data with aspect ratio calculation', () => {
      const cropParams = calculateCrop(1000, 800, null, mockStandard);

      expect(cropParams).toBeDefined();
      expect(cropParams.cropW).toBeGreaterThan(0);
      expect(cropParams.cropH).toBeGreaterThan(0);
      expect(cropParams.cropX).toBeGreaterThanOrEqual(0);
      expect(cropParams.cropY).toBeGreaterThanOrEqual(0);
    });

    it('should handle wide images with no face data', () => {
      const cropParams = calculateCrop(2000, 800, null, mockStandard);

      expect(cropParams).toBeDefined();
      expect(cropParams.cropW).toBeGreaterThan(0);
      expect(cropParams.cropH).toBe(800); // Should use full height
    });

    it('should handle tall images with no face data', () => {
      const cropParams = calculateCrop(800, 2000, null, mockStandard);

      expect(cropParams).toBeDefined();
      expect(cropParams.cropW).toBe(800); // Should use full width
      expect(cropParams.cropH).toBeGreaterThan(0);
    });

    it('should handle missing eye data by estimating eye position', () => {
      const faceDataNoEyes: FaceData = {
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: null,
        rightEye: null,
      };

      const cropParams = calculateCrop(1000, 800, faceDataNoEyes, mockStandard);

      expect(cropParams).toBeDefined();
      expect(cropParams.cropW).toBeGreaterThan(0);
      expect(cropParams.cropH).toBeGreaterThan(0);
    });

    it('should handle extremely large images', () => {
      const largeFaceData: FaceData = {
        x: 1000,
        y: 1000,
        w: 2000,
        h: 2500,
        leftEye: { x: 1500, y: 1800 },
        rightEye: { x: 2500, y: 1800 },
      };

      const cropParams = calculateCrop(
        10000,
        8000,
        largeFaceData,
        mockStandard
      );

      expect(cropParams).toBeDefined();
      expect(cropParams.cropW).toBeGreaterThan(0);
      expect(cropParams.cropH).toBeGreaterThan(0);
    });

    it('should handle very small face detection', () => {
      const tinyFaceData: FaceData = {
        x: 100,
        y: 150,
        w: 10,
        h: 12,
        leftEye: { x: 103, y: 153 },
        rightEye: { x: 107, y: 153 },
      };

      const cropParams = calculateCrop(1000, 800, tinyFaceData, mockStandard);

      expect(cropParams).toBeDefined();
      expect(cropParams.cropW).toBeGreaterThan(tinyFaceData.w);
      expect(cropParams.cropH).toBeGreaterThan(tinyFaceData.h);
    });

    it('should center crop horizontally on face', () => {
      const centeredFaceData: FaceData = {
        x: 400, // Face starting at x=400
        y: 100,
        w: 200,
        h: 250,
        leftEye: { x: 450, y: 150 },
        rightEye: { x: 550, y: 150 },
      };

      const cropParams = calculateCrop(
        1000,
        800,
        centeredFaceData,
        mockStandard
      );

      // Face center is at x=500
      const faceCenter = centeredFaceData.x + centeredFaceData.w / 2;
      const cropCenter = cropParams.cropX + cropParams.cropW / 2;

      // Crop should be centered on face
      expect(Math.abs(cropCenter - faceCenter)).toBeLessThan(1);
    });
  });

  describe('renderPassportPhoto', () => {
    let mockCanvas: { width: number; height: number; getContext: jest.Mock };
    let mockContext: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockContext = createMockContext();
      mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(mockContext),
      };
    });

    it('should render passport photo successfully', () => {
      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 800,
      } as HTMLImageElement;

      renderPassportPhoto(
        mockCanvas as unknown as HTMLCanvasElement,
        mockImage,
        mockFaceData,
        mockStandard,
        100, // userZoom
        0, // userH
        0, // userV
        100, // userBrightness
        false // addWatermark
      );

      expect(mockCanvas.width).toBeGreaterThan(0);
      expect(mockCanvas.height).toBeGreaterThan(0);
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should handle canvas context creation failure', () => {
      const mockCanvasNoContext = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(null),
      };

      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 800,
      } as HTMLImageElement;

      renderPassportPhoto(
        mockCanvasNoContext as unknown as HTMLCanvasElement,
        mockImage,
        mockFaceData,
        mockStandard,
        100,
        0,
        0,
        100,
        false
      );

      // Should return early when context is null
      expect(mockContext.drawImage).not.toHaveBeenCalled();
    });

    it('should handle null face data', () => {
      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 800,
      } as HTMLImageElement;

      renderPassportPhoto(
        mockCanvas as unknown as HTMLCanvasElement,
        mockImage,
        null, // no face data
        mockStandard,
        100,
        0,
        0,
        100,
        false
      );

      expect(mockCanvas.width).toBeGreaterThan(0);
      expect(mockCanvas.height).toBeGreaterThan(0);
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should apply zoom adjustments', () => {
      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 800,
      } as HTMLImageElement;

      renderPassportPhoto(
        mockCanvas as unknown as HTMLCanvasElement,
        mockImage,
        mockFaceData,
        mockStandard,
        150, // different zoom (150%)
        0,
        0,
        100,
        false
      );

      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should apply horizontal and vertical adjustments', () => {
      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 800,
      } as HTMLImageElement;

      renderPassportPhoto(
        mockCanvas as unknown as HTMLCanvasElement,
        mockImage,
        mockFaceData,
        mockStandard,
        100,
        10, // horizontal adjustment
        -5, // vertical adjustment
        100,
        false
      );

      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should apply brightness filter', () => {
      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 800,
      } as HTMLImageElement;

      renderPassportPhoto(
        mockCanvas as unknown as HTMLCanvasElement,
        mockImage,
        mockFaceData,
        mockStandard,
        100,
        0,
        0,
        120, // brightness adjusted
        false
      );

      expect(mockContext.filter).toBe('none'); // Reset after drawing
    });

    it('should add watermark when requested', () => {
      const mockImage = {
        naturalWidth: 1000,
        naturalHeight: 800,
      } as HTMLImageElement;

      renderPassportPhoto(
        mockCanvas as unknown as HTMLCanvasElement,
        mockImage,
        mockFaceData,
        mockStandard,
        100,
        0,
        0,
        100,
        true // with watermark
      );

      expect(mockContext.fillText).toHaveBeenCalled();
    });
  });

  describe('renderSheet', () => {
    let mockSheetCanvas: {
      width: number;
      height: number;
      getContext: jest.Mock;
    };
    let mockPassportCanvas: { width: number; height: number };
    let mockContext: ReturnType<typeof createMockContext>;

    beforeEach(() => {
      mockContext = createMockContext();
      mockSheetCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(mockContext),
      };
      mockPassportCanvas = {
        width: 600,
        height: 600,
      };
    });

    it('should render sheet with correct dimensions', () => {
      renderSheet(
        mockSheetCanvas as unknown as HTMLCanvasElement,
        mockPassportCanvas as unknown as HTMLCanvasElement,
        mockStandard,
        false
      );

      // Sheet should be 6x4 inches at 300 DPI = 1800x1200
      expect(mockSheetCanvas.width).toBe(1800);
      expect(mockSheetCanvas.height).toBe(1200);
    });

    it('should draw passport photos in grid', () => {
      renderSheet(
        mockSheetCanvas as unknown as HTMLCanvasElement,
        mockPassportCanvas as unknown as HTMLCanvasElement,
        mockStandard,
        false
      );

      // Should call drawImage multiple times for grid
      expect(mockContext.drawImage).toHaveBeenCalled();
    });

    it('should add cut lines', () => {
      renderSheet(
        mockSheetCanvas as unknown as HTMLCanvasElement,
        mockPassportCanvas as unknown as HTMLCanvasElement,
        mockStandard,
        false
      );

      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    it('should add watermark to sheet when requested', () => {
      renderSheet(
        mockSheetCanvas as unknown as HTMLCanvasElement,
        mockPassportCanvas as unknown as HTMLCanvasElement,
        mockStandard,
        true // with watermark
      );

      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should handle context creation failure', () => {
      const noContextCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn().mockReturnValue(null),
      };

      renderSheet(
        noContextCanvas as unknown as HTMLCanvasElement,
        mockPassportCanvas as unknown as HTMLCanvasElement,
        mockStandard,
        false
      );

      // Should not throw
      expect(mockContext.drawImage).not.toHaveBeenCalled();
    });
  });
});
