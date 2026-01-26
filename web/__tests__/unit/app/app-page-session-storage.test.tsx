/**
 * @jest-environment jsdom
 */
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';

// Storage key constants - must match the ones in app/page.tsx
const STORAGE_KEY = 'passport-photo-pending';
const VERIFIED_SESSION_KEY = 'passport-photo-verified';

// Create a mock blob for testing
const createMockBlob = () =>
  new Blob(['test-image-data'], { type: 'image/jpeg' });

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock fetch for blob restoration
const originalFetch = global.fetch;

// Variable to control searchParams mock
let mockSessionId: string | null = null;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'session_id' ? mockSessionId : null),
  }),
}));

// Track onRequestPayment calls
let capturedOnRequestPayment: (() => void) | null = null;

// Mock components
jest.mock('@/components/photo-upload', () => ({
  PhotoUpload: ({ onImageLoaded }: { onImageLoaded: (file: Blob) => void }) => (
    <div data-testid="photo-upload">
      <button
        data-testid="upload-button"
        onClick={() => onImageLoaded(createMockBlob())}
      >
        Select Photo
      </button>
    </div>
  ),
}));

jest.mock('@/components/photo-editor', () => ({
  PhotoEditor: ({
    onBack,
    onRequestPayment,
    isPaid,
  }: {
    imageBlob: Blob;
    onBack: () => void;
    isPaid: boolean;
    onRequestPayment: () => void;
    paymentError?: string | null;
  }) => {
    capturedOnRequestPayment = onRequestPayment;
    return (
      <div data-testid="photo-editor">
        <span data-testid="is-paid">{isPaid ? 'paid' : 'unpaid'}</span>
        <button data-testid="back-button" onClick={onBack}>
          Back
        </button>
        <button data-testid="pay-button" onClick={onRequestPayment}>
          Pay
        </button>
      </div>
    );
  },
}));

jest.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

// Import after mocks are set up
import AppPage from '@/app/app/page';

// Helper to mock verification API response
const mockVerifySession = (verified: boolean, error?: string) => {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/verify-session')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ verified, error }),
      });
    }
    if (url.includes('/api/create-checkout')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
      });
    }
    // For blob restoration (data: URLs)
    if (url.startsWith('data:')) {
      return Promise.resolve({
        blob: () => Promise.resolve(createMockBlob()),
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
};

describe('AppPage sessionStorage photo persistence', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    mockSessionId = null;
    capturedOnRequestPayment = null;
    jest.clearAllMocks();

    // Default fetch mock
    global.fetch = mockVerifySession(true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('saving photo before payment', () => {
    it('should save photo to sessionStorage when requesting payment', async () => {
      // Mock FileReader for blob to base64 conversion
      const mockReadAsDataURL = jest.fn();
      const mockFileReader = {
        readAsDataURL: mockReadAsDataURL,
        result: 'data:image/jpeg;base64,dGVzdC1pbWFnZS1kYXRh',
        onloadend: null as (() => void) | null,
        onerror: null as ((error: Error) => void) | null,
      };

      jest
        .spyOn(global, 'FileReader')
        .mockImplementation(() => mockFileReader as unknown as FileReader);

      render(<AppPage />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      // Upload a photo
      const uploadButton = screen.getByTestId('upload-button');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      // Click pay button
      const payButton = screen.getByTestId('pay-button');

      await act(async () => {
        fireEvent.click(payButton);
        // Simulate FileReader completing
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend();
        }
      });

      // Verify sessionStorage.setItem was called
      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEY,
          expect.stringContaining('data:')
        );
      });
    });

    it('should call checkout API after saving photo', async () => {
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/jpeg;base64,test',
        onloadend: null as (() => void) | null,
        onerror: null as ((error: Error) => void) | null,
      };

      jest
        .spyOn(global, 'FileReader')
        .mockImplementation(() => mockFileReader as unknown as FileReader);

      render(<AppPage />);

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      // Upload photo
      fireEvent.click(screen.getByTestId('upload-button'));

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      // Click pay
      await act(async () => {
        fireEvent.click(screen.getByTestId('pay-button'));
        if (mockFileReader.onloadend) {
          mockFileReader.onloadend();
        }
      });

      // Verify fetch was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/create-checkout',
          expect.any(Object)
        );
      });
    });
  });

  describe('restoring photo after payment', () => {
    it('should verify payment and show success when valid session_id', async () => {
      mockSessionId = 'cs_test_valid123';
      global.fetch = mockVerifySession(true);

      render(<AppPage />);

      // Should eventually show the upload page (with success message)
      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      // Should show payment verified message
      expect(screen.getByText(/Payment verified/)).toBeInTheDocument();
    });

    it('should restore photo from sessionStorage after verified payment', async () => {
      const savedPhotoData = 'data:image/jpeg;base64,dGVzdC1pbWFnZS1kYXRh';
      mockSessionStorage.setItem(STORAGE_KEY, savedPhotoData);
      mockSessionId = 'cs_test_valid123';
      global.fetch = mockVerifySession(true);

      render(<AppPage />);

      // Should eventually show photo editor with restored photo
      await waitFor(
        () => {
          expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Should be marked as paid
      expect(screen.getByTestId('is-paid')).toHaveTextContent('paid');
    });

    it('should clear photo storage after successful restore', async () => {
      const savedPhotoData = 'data:image/jpeg;base64,dGVzdC1pbWFnZS1kYXRh';
      mockSessionStorage.setItem(STORAGE_KEY, savedPhotoData);
      mockSessionId = 'cs_test_valid123';
      global.fetch = mockVerifySession(true);

      render(<AppPage />);

      await waitFor(
        () => {
          expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Photo storage should be cleared
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should show upload page if no saved photo after verified payment', async () => {
      mockSessionId = 'cs_test_valid123';
      global.fetch = mockVerifySession(true);
      // No photo in sessionStorage

      render(<AppPage />);

      // Should show upload page (with payment verified message)
      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      expect(screen.getByText(/Payment verified/)).toBeInTheDocument();
    });

    it('should show error when verification fails', async () => {
      mockSessionId = 'cs_test_invalid';
      global.fetch = mockVerifySession(false, 'Payment not completed');

      render(<AppPage />);

      // Should show upload page with error
      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      // Should show error message
      expect(screen.getByText(/Payment not completed/)).toBeInTheDocument();
    });

    it('should handle verification network errors gracefully', async () => {
      mockSessionId = 'cs_test_123';
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<AppPage />);

      // Should gracefully fall back to upload page with error
      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to verify payment/)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('payment state', () => {
    it('should set isPaid to true when session is verified', async () => {
      mockSessionId = 'cs_test_verified';
      mockSessionStorage.setItem(STORAGE_KEY, 'data:image/jpeg;base64,test');
      global.fetch = mockVerifySession(true);

      render(<AppPage />);

      await waitFor(
        () => {
          expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByTestId('is-paid')).toHaveTextContent('paid');
    });

    it('should not set isPaid when no session_id present', async () => {
      mockSessionId = null;

      render(<AppPage />);

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      // Upload photo to see editor
      fireEvent.click(screen.getByTestId('upload-button'));

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      expect(screen.getByTestId('is-paid')).toHaveTextContent('unpaid');
    });

    it('should persist verified status in sessionStorage', async () => {
      mockSessionId = 'cs_test_persist';
      global.fetch = mockVerifySession(true);

      render(<AppPage />);

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      // Should store verified session
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        VERIFIED_SESSION_KEY,
        'cs_test_persist'
      );
    });

    it('should recognize previously verified session', async () => {
      mockSessionId = null; // No session_id in URL
      mockSessionStorage.setItem(VERIFIED_SESSION_KEY, 'cs_test_previous');

      render(<AppPage />);

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });

      // Upload photo to see editor - should be marked as paid from stored session
      fireEvent.click(screen.getByTestId('upload-button'));

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      expect(screen.getByTestId('is-paid')).toHaveTextContent('paid');
    });
  });
});
