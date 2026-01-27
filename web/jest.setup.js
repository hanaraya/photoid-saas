require('@testing-library/jest-dom');
require('jest-canvas-mock');

// Global MediaPipe mocks for easier access in tests
global.__MEDIAPIPE_MOCKS__ = {
  faceDetector: {
    detect: jest.fn(),
    createFromOptions: jest.fn(),
  },
  filesetResolver: {
    forVisionTasks: jest.fn(),
  },
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test',
}));

// Mock background removal
jest.mock('@imgly/background-removal', () => ({
  removeBackground: jest.fn(() =>
    Promise.resolve(new Blob(['fake-removed-bg'], { type: 'image/png' }))
  ),
}));

// Mock useLiveFaceDetection hook (CDN module not available in Jest)
jest.mock('@/hooks/useLiveFaceDetection', () => ({
  useLiveFaceDetection: jest.fn(() => null),
}));

// Mock getUserMedia for camera tests
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() =>
      Promise.resolve({
        getVideoTracks: () => [{ stop: jest.fn() }],
      })
    ),
  },
  writable: true,
});

// Mock canvas and image processing after DOM is available
if (typeof document !== 'undefined') {
  const originalCreateElement = document.createElement;
  document.createElement = jest.fn((tag) => {
    if (tag === 'canvas') {
      const canvas = originalCreateElement.call(document, 'canvas');
      const mockContext = {
        drawImage: jest.fn(),
        getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: jest.fn(),
        translate: jest.fn(),
        scale: jest.fn(),
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        canvas: { width: 300, height: 300 },
      };
      canvas.getContext = jest.fn(() => mockContext);
      canvas.toBlob = jest.fn((callback) => {
        callback(new Blob(['fake-image-data'], { type: 'image/jpeg' }));
      });
      canvas.width = 300;
      canvas.height = 300;
      return canvas;
    }
    return originalCreateElement.call(document, tag);
  });

  HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
    callback(new Blob(['fake-image-data'], { type: 'image/jpeg' }));
  });
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mocked-blob-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: jest.fn(),
});

// Suppress console errors in tests unless explicitly testing error handling
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
      args[0].includes('Warning: React.createFactory is deprecated'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() =>
    Promise.resolve({
      redirectToCheckout: jest.fn(() => Promise.resolve({ error: null })),
    })
  ),
}));

// Setup test environment variables
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';

// Global test timeout
jest.setTimeout(10000);
