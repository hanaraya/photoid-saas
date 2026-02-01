/**
 * Tests for Image Analyzer module
 */

import {
  analyzeImage,
  convertFaceApiResult,
  convertMediaPipeResult,
} from '@/lib/compliance/analyzer';
import { FaceDetection } from '@/lib/compliance/types';

// ============================================================
// MOCK SETUP
// ============================================================

// Mock canvas context
const mockGetImageData = jest.fn();
const mockDrawImage = jest.fn();

const mockContext = {
  getImageData: mockGetImageData,
  drawImage: mockDrawImage,
};

// Mock canvas
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => mockContext),
};

// Mock document.createElement
const originalCreateElement = document.createElement.bind(document);
beforeAll(() => {
  document.createElement = jest.fn((tag: string) => {
    if (tag === 'canvas') {
      return mockCanvas as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tag);
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create test image data with uniform color
 */
function createUniformImageData(
  width: number,
  height: number,
  r: number,
  g: number,
  b: number
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return new ImageData(data, width, height);
}

/**
 * Create test image data with gradient (less uniform)
 */
function createGradientImageData(
  width: number,
  height: number
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const value = Math.floor((x / width) * 255);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, width, height);
}

// ============================================================
// IMAGE ANALYSIS TESTS
// ============================================================

describe('analyzeImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should analyze uniform white image correctly', async () => {
    const imageData = createUniformImageData(600, 600, 255, 255, 255);
    mockGetImageData.mockReturnValue(imageData);
    mockCanvas.width = 600;
    mockCanvas.height = 600;

    const result = await analyzeImage(imageData);

    expect(result.width).toBe(600);
    expect(result.height).toBe(600);
    expect(result.aspectRatio).toBe(1);
    expect(result.brightness).toBe(255);
    expect(result.backgroundColor).toBe('#FFFFFF');
    expect(result.backgroundUniformity).toBe(1); // Perfectly uniform
  });

  test('should calculate brightness correctly for gray image', async () => {
    const imageData = createUniformImageData(100, 100, 128, 128, 128);

    const result = await analyzeImage(imageData);

    expect(result.brightness).toBeCloseTo(128, 0);
  });

  test('should calculate brightness correctly for dark image', async () => {
    const imageData = createUniformImageData(100, 100, 50, 50, 50);

    const result = await analyzeImage(imageData);

    expect(result.brightness).toBe(50);
  });

  test('should detect non-uniform background', async () => {
    const imageData = createGradientImageData(100, 100);

    const result = await analyzeImage(imageData);

    expect(result.backgroundUniformity).toBeLessThan(1);
  });

  test('should include face detection when provided', async () => {
    const imageData = createUniformImageData(600, 600, 255, 255, 255);
    const faceDetection: FaceDetection = {
      detected: true,
      count: 1,
      confidence: 0.95,
      boundingBox: { x: 150, y: 100, width: 300, height: 350 },
    };

    const result = await analyzeImage(imageData, faceDetection);

    expect(result.face.detected).toBe(true);
    expect(result.face.count).toBe(1);
    expect(result.face.confidence).toBe(0.95);
  });

  test('should default to no face detection when not provided', async () => {
    const imageData = createUniformImageData(600, 600, 255, 255, 255);

    const result = await analyzeImage(imageData);

    expect(result.face.detected).toBe(false);
    expect(result.face.count).toBe(0);
  });
});

// ============================================================
// FACE-API CONVERSION TESTS
// ============================================================

describe('convertFaceApiResult', () => {
  test('should return default detection for empty results', () => {
    const result = convertFaceApiResult([]);

    expect(result.detected).toBe(false);
    expect(result.count).toBe(0);
  });

  test('should return default detection for null/undefined', () => {
    const result = convertFaceApiResult(null as any);

    expect(result.detected).toBe(false);
  });

  test('should convert valid face-api result', () => {
    const faceApiResult = [{
      detection: {
        box: { x: 100, y: 50, width: 200, height: 250 },
        score: 0.92,
      },
    }];

    const result = convertFaceApiResult(faceApiResult);

    expect(result.detected).toBe(true);
    expect(result.count).toBe(1);
    expect(result.confidence).toBe(0.92);
    expect(result.boundingBox).toEqual({ x: 100, y: 50, width: 200, height: 250 });
  });

  test('should convert face-api result with landmarks', () => {
    const faceApiResult = [{
      detection: {
        box: { x: 100, y: 50, width: 200, height: 250 },
        score: 0.92,
      },
      landmarks: {
        getLeftEye: () => [{ x: 150, y: 120 }, { x: 160, y: 120 }],
        getRightEye: () => [{ x: 240, y: 120 }, { x: 250, y: 120 }],
        getNose: () => [{ x: 200, y: 180 }],
        getMouth: () => [{ x: 180, y: 230 }, { x: 220, y: 230 }],
        getJawOutline: () => [{ x: 100, y: 250 }, { x: 150, y: 280 }, { x: 200, y: 300 }],
      },
    }];

    const result = convertFaceApiResult(faceApiResult);

    expect(result.landmarks).toBeDefined();
    expect(result.landmarks?.leftEye).toEqual({ x: 155, y: 120 });
    expect(result.landmarks?.rightEye).toEqual({ x: 245, y: 120 });
    expect(result.landmarks?.chin).toEqual({ x: 200, y: 300 }); // Last jaw point
  });

  test('should convert face-api result with rotation', () => {
    const faceApiResult = [{
      detection: {
        box: { x: 100, y: 50, width: 200, height: 250 },
        score: 0.92,
      },
      angle: { pitch: 5, yaw: -3, roll: 2 },
    }];

    const result = convertFaceApiResult(faceApiResult);

    expect(result.rotation).toEqual({ pitch: 5, yaw: -3, roll: 2 });
  });

  test('should count multiple faces correctly', () => {
    const faceApiResult = [
      {
        detection: { box: { x: 50, y: 50, width: 100, height: 120 }, score: 0.9 },
      },
      {
        detection: { box: { x: 300, y: 50, width: 100, height: 120 }, score: 0.85 },
      },
    ];

    const result = convertFaceApiResult(faceApiResult);

    expect(result.count).toBe(2);
    // Should use first face for details
    expect(result.confidence).toBe(0.9);
  });
});

// ============================================================
// MEDIAPIPE CONVERSION TESTS
// ============================================================

describe('convertMediaPipeResult', () => {
  const imageWidth = 640;
  const imageHeight = 480;

  test('should return default detection for empty results', () => {
    const result = convertMediaPipeResult({ detections: [] }, imageWidth, imageHeight);

    expect(result.detected).toBe(false);
    expect(result.count).toBe(0);
  });

  test('should convert MediaPipe detection result', () => {
    const mediaPipeResult = {
      detections: [{
        boundingBox: {
          xCenter: 0.5, // Center of image
          yCenter: 0.5,
          width: 0.3,
          height: 0.4,
        },
        keypoints: [],
      }],
    };

    const result = convertMediaPipeResult(mediaPipeResult, imageWidth, imageHeight);

    expect(result.detected).toBe(true);
    expect(result.count).toBe(1);
    // Bounding box should be converted to pixels
    expect(result.boundingBox?.x).toBeCloseTo(224); // (0.5 - 0.15) * 640
    expect(result.boundingBox?.y).toBeCloseTo(144); // (0.5 - 0.2) * 480
    expect(result.boundingBox?.width).toBeCloseTo(192); // 0.3 * 640
    expect(result.boundingBox?.height).toBeCloseTo(192); // 0.4 * 480
  });

  test('should convert MediaPipe keypoints to landmarks', () => {
    const mediaPipeResult = {
      detections: [{
        boundingBox: { xCenter: 0.5, yCenter: 0.5, width: 0.3, height: 0.4 },
        keypoints: [
          { x: 0.4, y: 0.4, name: 'leftEye' },
          { x: 0.6, y: 0.4, name: 'rightEye' },
          { x: 0.5, y: 0.5, name: 'noseTip' },
          { x: 0.5, y: 0.6, name: 'mouthCenter' },
        ],
      }],
    };

    const result = convertMediaPipeResult(mediaPipeResult, imageWidth, imageHeight);

    expect(result.landmarks?.leftEye).toEqual({ x: 256, y: 192 }); // 0.4 * 640, 0.4 * 480
    expect(result.landmarks?.rightEye).toEqual({ x: 384, y: 192 });
    expect(result.landmarks?.nose).toEqual({ x: 320, y: 240 });
    expect(result.landmarks?.mouth).toEqual({ x: 320, y: 288 });
  });

  test('should count multiple detections', () => {
    const mediaPipeResult = {
      detections: [
        { boundingBox: { xCenter: 0.3, yCenter: 0.5, width: 0.2, height: 0.3 }, keypoints: [] },
        { boundingBox: { xCenter: 0.7, yCenter: 0.5, width: 0.2, height: 0.3 }, keypoints: [] },
      ],
    };

    const result = convertMediaPipeResult(mediaPipeResult, imageWidth, imageHeight);

    expect(result.count).toBe(2);
  });
});

// ============================================================
// EDGE CASES
// ============================================================

describe('Edge Cases', () => {
  test('should handle very small images', async () => {
    const imageData = createUniformImageData(10, 10, 200, 200, 200);

    const result = await analyzeImage(imageData);

    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  test('should handle non-square aspect ratios', async () => {
    const imageData = createUniformImageData(800, 600, 255, 255, 255);

    const result = await analyzeImage(imageData);

    expect(result.aspectRatio).toBeCloseTo(1.333, 2);
  });

  test('should handle zero brightness (black image)', async () => {
    const imageData = createUniformImageData(100, 100, 0, 0, 0);

    const result = await analyzeImage(imageData);

    expect(result.brightness).toBe(0);
    expect(result.backgroundColor).toBe('#000000');
  });
});
