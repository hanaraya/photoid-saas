/**
 * @jest-environment jsdom
 */
import {
  detectFace,
  initFaceDetector,
  isFaceDetectorReady,
  setMediaPipeService,
  resetFaceDetector,
  type FaceData,
} from '@/lib/face-detection';

// Create mock MediaPipe service
class MockMediaPipeService {
  private mockFaceDetector = (global as any).__MEDIAPIPE_MOCKS__.faceDetector;
  private mockFilesetResolver = (global as any).__MEDIAPIPE_MOCKS__
    .filesetResolver;

  async loadMediaPipe() {
    return {
      FaceDetector: this.mockFaceDetector,
      FilesetResolver: this.mockFilesetResolver,
    };
  }
}

const mockService = new MockMediaPipeService();
const getMockFaceDetector = () =>
  (global as any).__MEDIAPIPE_MOCKS__.faceDetector;
const getMockFilesetResolver = () =>
  (global as any).__MEDIAPIPE_MOCKS__.filesetResolver;

describe('Face Detection', () => {
  let mockImage: HTMLImageElement;

  beforeEach(() => {
    // Inject mock service
    setMediaPipeService(mockService);

    // Clear mocks
    const mockFaceDetector = getMockFaceDetector();
    const mockFilesetResolver = getMockFilesetResolver();

    mockFaceDetector.detect.mockReset();
    mockFaceDetector.createFromOptions.mockReset();
    mockFilesetResolver.forVisionTasks.mockReset();

    // Create mock image element
    mockImage = {
      naturalWidth: 1000,
      naturalHeight: 800,
    } as HTMLImageElement;

    // Reset face detector state
    resetFaceDetector();
  });

  describe('initFaceDetector', () => {
    it('should initialize face detector with GPU delegate', async () => {
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions.mockResolvedValue(mockFaceDetector);

      await initFaceDetector();

      expect(mockFilesetResolver.forVisionTasks).toHaveBeenCalledWith(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      expect(mockFaceDetector.createFromOptions).toHaveBeenCalledWith(
        'mock-vision',
        expect.objectContaining({
          baseOptions: expect.objectContaining({
            delegate: 'GPU',
          }),
          minDetectionConfidence: 0.4,
          runningMode: 'IMAGE',
        })
      );
    });

    it('should fallback to CPU when GPU fails', async () => {
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions
        .mockRejectedValueOnce(new Error('GPU not available'))
        .mockResolvedValueOnce(mockFaceDetector);

      await initFaceDetector();

      expect(mockFaceDetector.createFromOptions).toHaveBeenCalledTimes(2);
      expect(mockFaceDetector.createFromOptions).toHaveBeenLastCalledWith(
        'mock-vision',
        expect.objectContaining({
          baseOptions: expect.not.objectContaining({
            delegate: 'GPU',
          }),
        })
      );
    });

    it('should handle complete initialization failure', async () => {
      const mockFilesetResolver = getMockFilesetResolver();

      mockFilesetResolver.forVisionTasks.mockRejectedValue(
        new Error('Network error')
      );

      await expect(initFaceDetector()).rejects.toThrow('Network error');
    });

    it('should not re-initialize if already initialized', async () => {
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions.mockResolvedValue(mockFaceDetector);

      await initFaceDetector();
      await initFaceDetector();

      expect(mockFaceDetector.createFromOptions).toHaveBeenCalledTimes(1);
    });
  });

  describe('detectFace', () => {
    beforeEach(async () => {
      // Initialize detector for tests
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions.mockResolvedValue(mockFaceDetector);
      await initFaceDetector();
    });

    it('should detect a face successfully', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const mockDetection = {
        boundingBox: {
          originX: 100,
          originY: 150,
          width: 200,
          height: 250,
        },
        keypoints: [
          { label: 'leftEye', x: 0.15, y: 0.25 },
          { label: 'rightEye', x: 0.25, y: 0.25 },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(mockImage);

      expect(result).toEqual({
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 150, y: 200 }, // 0.15 * 1000, 0.25 * 800
        rightEye: { x: 250, y: 200 }, // 0.25 * 1000, 0.25 * 800
        nose: null,
        mouth: null,
      });
    });

    it('should return null when no face detected', async () => {
      const mockFaceDetector = getMockFaceDetector();

      mockFaceDetector.detect.mockReturnValue({
        detections: [],
      });

      const result = await detectFace(mockImage);

      expect(result).toBeNull();
    });

    it('should handle missing detections property', async () => {
      const mockFaceDetector = getMockFaceDetector();

      mockFaceDetector.detect.mockReturnValue({});

      const result = await detectFace(mockImage);

      expect(result).toBeNull();
    });

    it('should select the largest face when multiple detected', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const smallFace = {
        boundingBox: {
          originX: 0,
          originY: 0,
          width: 100,
          height: 100,
        },
        keypoints: [],
      };

      const largeFace = {
        boundingBox: {
          originX: 100,
          originY: 100,
          width: 300,
          height: 300,
        },
        keypoints: [
          { label: 'leftEye', x: 0.2, y: 0.3 },
          { label: 'rightEye', x: 0.3, y: 0.3 },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [smallFace, largeFace],
      });

      const result = await detectFace(mockImage);

      expect(result).toEqual({
        x: 100,
        y: 100,
        w: 300,
        h: 300,
        leftEye: { x: 200, y: 240 },
        rightEye: { x: 300, y: 240 },
        nose: null,
        mouth: null,
      });
    });

    it('should handle missing keypoints', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const mockDetection = {
        boundingBox: {
          originX: 100,
          originY: 150,
          width: 200,
          height: 250,
        },
        keypoints: null,
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(mockImage);

      // Eyes are estimated from bounding box when keypoints not detected
      expect(result).toEqual({
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 160, y: 262.5 },
        rightEye: { x: 240, y: 262.5 },
        nose: null,
        mouth: null,
      });
    });

    it('should handle keypoints with missing coordinates', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const mockDetection = {
        boundingBox: {
          originX: 100,
          originY: 150,
          width: 200,
          height: 250,
        },
        keypoints: [
          { label: 'leftEye', x: undefined, y: 0.25 },
          { label: 'rightEye', x: 0.25, y: undefined },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(mockImage);

      // Eyes are estimated from bounding box when keypoints have undefined coords
      expect(result).toEqual({
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 160, y: 262.5 },
        rightEye: { x: 240, y: 262.5 },
        nose: null,
        mouth: null,
      });
    });

    it('should return null when detector not initialized', async () => {
      // Reset detector state
      resetFaceDetector();

      const result = await detectFace(mockImage);

      expect(result).toBeNull();
    });

    it('should handle detector errors gracefully', async () => {
      const mockFaceDetector = getMockFaceDetector();

      mockFaceDetector.detect.mockImplementation(() => {
        throw new Error('Detector error');
      });

      await expect(detectFace(mockImage)).rejects.toThrow('Detector error');
    });

    it('should estimate left eye when only right eye is detected', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const mockDetection = {
        boundingBox: {
          originX: 100,
          originY: 150,
          width: 200,
          height: 250,
        },
        keypoints: [
          { label: 'rightEye', x: 0.25, y: 0.25 },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(mockImage);

      // Left eye should be estimated from right eye position
      expect(result).toEqual({
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 170, y: 200 }, // rightEye.x - eyeSpacing (0.25*1000 - 80)
        rightEye: { x: 250, y: 200 }, // 0.25 * 1000, 0.25 * 800
        nose: null,
        mouth: null,
      });
    });

    it('should estimate right eye when only left eye is detected', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const mockDetection = {
        boundingBox: {
          originX: 100,
          originY: 150,
          width: 200,
          height: 250,
        },
        keypoints: [
          { label: 'leftEye', x: 0.15, y: 0.25 },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(mockImage);

      // Right eye should be estimated from left eye position
      expect(result).toEqual({
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 150, y: 200 }, // 0.15 * 1000, 0.25 * 800
        rightEye: { x: 230, y: 200 }, // leftEye.x + eyeSpacing (150 + 80)
        nose: null,
        mouth: null,
      });
    });

    it('should detect nose and mouth keypoints', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const mockDetection = {
        boundingBox: {
          originX: 100,
          originY: 150,
          width: 200,
          height: 250,
        },
        keypoints: [
          { label: 'leftEye', x: 0.15, y: 0.25 },
          { label: 'rightEye', x: 0.25, y: 0.25 },
          { label: 'noseTip', x: 0.2, y: 0.4 },
          { label: 'mouth', x: 0.2, y: 0.55 },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(mockImage);

      expect(result).toMatchObject({
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 150, y: 200 },
        rightEye: { x: 250, y: 200 },
        nose: { x: 200, y: 320 },
      });
      expect(result?.mouth?.x).toBe(200);
      expect(result?.mouth?.y).toBeCloseTo(440, 0);
    });

    it('should handle keypoints with index-based labels', async () => {
      const mockFaceDetector = getMockFaceDetector();

      const mockDetection = {
        boundingBox: {
          originX: 100,
          originY: 150,
          width: 200,
          height: 250,
        },
        keypoints: [
          { index: 0, x: 0.15, y: 0.25 }, // leftEye
          { index: 1, x: 0.25, y: 0.25 }, // rightEye
          { index: 2, x: 0.2, y: 0.4 }, // nose
          { index: 3, x: 0.2, y: 0.55 }, // mouth
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(mockImage);

      expect(result).toMatchObject({
        x: 100,
        y: 150,
        w: 200,
        h: 250,
        leftEye: { x: 150, y: 200 },
        rightEye: { x: 250, y: 200 },
        nose: { x: 200, y: 320 },
      });
      expect(result?.mouth?.x).toBe(200);
      expect(result?.mouth?.y).toBeCloseTo(440, 0);
    });
  });

  describe('isFaceDetectorReady', () => {
    it('should return false when not initialized', () => {
      expect(isFaceDetectorReady()).toBe(false);
    });

    it('should return true when initialized', async () => {
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions.mockResolvedValue(mockFaceDetector);

      await initFaceDetector();

      expect(isFaceDetectorReady()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely small images', async () => {
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions.mockResolvedValue(mockFaceDetector);
      await initFaceDetector();

      const tinyImage = {
        naturalWidth: 1,
        naturalHeight: 1,
      } as HTMLImageElement;

      const mockDetection = {
        boundingBox: {
          originX: 0,
          originY: 0,
          width: 1,
          height: 1,
        },
        keypoints: [
          { label: 'leftEye', x: 0.1, y: 0.1 },
          { label: 'rightEye', x: 0.9, y: 0.1 },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(tinyImage);

      expect(result).toEqual({
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        leftEye: { x: 0.1, y: 0.1 },
        rightEye: { x: 0.9, y: 0.1 },
        nose: null,
        mouth: null,
      });
    });

    it('should handle extremely large images', async () => {
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions.mockResolvedValue(mockFaceDetector);
      await initFaceDetector();

      const hugeImage = {
        naturalWidth: 10000,
        naturalHeight: 8000,
      } as HTMLImageElement;

      const mockDetection = {
        boundingBox: {
          originX: 1000,
          originY: 800,
          width: 2000,
          height: 2500,
        },
        keypoints: [
          { label: 'leftEye', x: 0.15, y: 0.25 },
          { label: 'rightEye', x: 0.25, y: 0.25 },
        ],
      };

      mockFaceDetector.detect.mockReturnValue({
        detections: [mockDetection],
      });

      const result = await detectFace(hugeImage);

      expect(result).toEqual({
        x: 1000,
        y: 800,
        w: 2000,
        h: 2500,
        leftEye: { x: 1500, y: 2000 },
        rightEye: { x: 2500, y: 2000 },
        nose: null,
        mouth: null,
      });
    });

    it('should handle concurrent detection calls', async () => {
      const mockFilesetResolver = getMockFilesetResolver();
      const mockFaceDetector = getMockFaceDetector();

      mockFilesetResolver.forVisionTasks.mockResolvedValue('mock-vision');
      mockFaceDetector.createFromOptions.mockResolvedValue(mockFaceDetector);
      await initFaceDetector();

      mockFaceDetector.detect.mockReturnValue({
        detections: [
          {
            boundingBox: {
              originX: 100,
              originY: 100,
              width: 200,
              height: 200,
            },
            keypoints: [],
          },
        ],
      });

      const promises = [
        detectFace(mockImage),
        detectFace(mockImage),
        detectFace(mockImage),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result).toEqual({
          x: 100,
          y: 100,
          w: 200,
          h: 200,
          // Eyes are estimated from bounding box when keypoints not detected
          leftEye: { x: 160, y: 190 },
          rightEye: { x: 240, y: 190 },
          nose: null,
          mouth: null,
        });
      });
    });
  });
});
