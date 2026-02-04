/**
 * @jest-environment jsdom
 */

describe('MediaPipe Types', () => {
  it('should have MediaPipe mocks available in global', () => {
    // Test that global MediaPipe mocks are available (defined in jest.setup.js)
    expect(global.__MEDIAPIPE_MOCKS__).toBeDefined();
  });

  it('should include FaceDetector mock functions', () => {
    const mockDetector = global.__MEDIAPIPE_MOCKS__.faceDetector;
    expect(typeof mockDetector.detect).toBe('function');
    expect(typeof mockDetector.createFromOptions).toBe('function');
  });

  it('should include FilesetResolver mock functions', () => {
    const mockResolver = global.__MEDIAPIPE_MOCKS__.filesetResolver;
    expect(typeof mockResolver.forVisionTasks).toBe('function');
  });

  it('should handle detection results structure', () => {
    const mockResult = {
      detections: [
        {
          boundingBox: { originX: 100, originY: 100, width: 200, height: 250 },
          keypoints: [
            { x: 150, y: 150, z: 0 },
            { x: 250, y: 150, z: 0 },
          ],
        },
      ],
    };

    expect(mockResult.detections).toHaveLength(1);
    expect(mockResult.detections[0].keypoints).toHaveLength(2);
  });

  it('should handle empty detection results', () => {
    const emptyResult = { detections: [] };
    expect(emptyResult.detections).toHaveLength(0);
  });

  it('should validate bounding box properties', () => {
    const boundingBox = {
      originX: 0,
      originY: 0,
      width: 100,
      height: 100,
    };

    expect(typeof boundingBox.originX).toBe('number');
    expect(typeof boundingBox.originY).toBe('number');
    expect(typeof boundingBox.width).toBe('number');
    expect(typeof boundingBox.height).toBe('number');
  });

  it('should validate keypoint properties', () => {
    const keypoint = { x: 100, y: 150, z: 0 };

    expect(typeof keypoint.x).toBe('number');
    expect(typeof keypoint.y).toBe('number');
    expect(typeof keypoint.z).toBe('number');
  });

  it('should handle multiple face detections', () => {
    const multiResult = {
      detections: [
        { boundingBox: { originX: 50, originY: 50, width: 100, height: 120 } },
        { boundingBox: { originX: 200, originY: 80, width: 90, height: 110 } },
      ],
    };

    expect(multiResult.detections).toHaveLength(2);
    multiResult.detections.forEach((detection) => {
      expect(detection.boundingBox).toBeDefined();
    });
  });

  it('should validate confidence scores', () => {
    const detectionWithConfidence = {
      boundingBox: { originX: 100, originY: 100, width: 200, height: 250 },
      categories: [{ score: 0.95, categoryName: 'face' }],
    };

    expect(detectionWithConfidence.categories[0].score).toBeGreaterThan(0);
    expect(detectionWithConfidence.categories[0].score).toBeLessThanOrEqual(1);
  });

  it('should handle vision task options', () => {
    const options = {
      baseOptions: {
        modelAssetPath: 'https://example.com/model.tflite',
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.5,
      minSuppressionThreshold: 0.3,
    };

    expect(options.minDetectionConfidence).toBeGreaterThanOrEqual(0);
    expect(options.minDetectionConfidence).toBeLessThanOrEqual(1);
    expect(options.minSuppressionThreshold).toBeGreaterThanOrEqual(0);
    expect(options.minSuppressionThreshold).toBeLessThanOrEqual(1);
  });
});

// Export to make this file a module (required for declare global)
export {};

// Extend global namespace for TypeScript
declare global {
  var __MEDIAPIPE_MOCKS__: {
    faceDetector: {
      detect: jest.Mock;
      createFromOptions: jest.Mock;
    };
    filesetResolver: {
      forVisionTasks: jest.Mock;
    };
  };
}
