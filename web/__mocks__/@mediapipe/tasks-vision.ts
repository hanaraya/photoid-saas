// Mock MediaPipe tasks-vision module
export const mockFaceDetector = {
  detect: jest.fn(),
  createFromOptions: jest.fn(),
};

export const mockFilesetResolver = {
  forVisionTasks: jest.fn(),
};

export const FaceDetector = mockFaceDetector;
export const FilesetResolver = mockFilesetResolver;

// Reset function for tests
export function resetMediaPipeMocks() {
  jest.clearAllMocks();
  mockFaceDetector.detect.mockReset();
  mockFaceDetector.createFromOptions.mockReset();
  mockFilesetResolver.forVisionTasks.mockReset();
}

export default {
  FaceDetector: mockFaceDetector,
  FilesetResolver: mockFilesetResolver,
  resetMediaPipeMocks,
};
