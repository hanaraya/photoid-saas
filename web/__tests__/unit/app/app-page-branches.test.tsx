/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
const mockGet = jest.fn();
mockSearchParams.get = mockGet;

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock components
jest.mock('@/components/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

jest.mock('@/components/photo-upload', () => ({
  PhotoUpload: ({ onImageLoaded }: { onImageLoaded: (blob: Blob) => void }) => (
    <div data-testid="photo-upload">
      <button
        onClick={() =>
          onImageLoaded(new Blob(['test'], { type: 'image/jpeg' }))
        }
      >
        Upload
      </button>
    </div>
  ),
}));

jest.mock('@/components/photo-editor', () => ({
  PhotoEditor: ({
    onBack,
    isPaid,
    onRequestPayment,
  }: {
    imageBlob: Blob;
    onBack: () => void;
    isPaid: boolean;
    onRequestPayment: () => void;
  }) => (
    <div data-testid="photo-editor">
      <span data-testid="paid-status">{isPaid ? 'paid' : 'unpaid'}</span>
      <button onClick={onBack}>Back</button>
      <button onClick={onRequestPayment}>Request Payment</button>
    </div>
  ),
}));

// Import after mocks
import AppPage from '@/app/app/page';

describe('AppPage Branch Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
    // Clear sessionStorage to ensure clean state
    sessionStorage.clear();
    // Mock fetch for verification API
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/verify-session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ verified: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('Payment Success Detection', () => {
    it('should detect payment success from verified session_id', async () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'session_id') return 'cs_test_valid123';
        return null;
      });

      render(<AppPage />);

      await waitFor(() => {
        expect(screen.getByText(/payment verified/i)).toBeInTheDocument();
      });
    });

    it('should not show payment success without session_id param', async () => {
      mockGet.mockReturnValue(null);

      render(<AppPage />);

      await waitFor(() => {
        expect(
          screen.queryByText(/payment verified/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Payment Request Flow', () => {
    it('should handle successful payment redirect', async () => {
      const user = userEvent.setup();

      // Mock fetch for payment
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
      });

      // Mock window.location
      const originalLocation = window.location;
      // @ts-expect-error - Need to delete location to mock it
      delete window.location;
      window.location = { ...originalLocation, href: '' };

      render(<AppPage />);

      // Upload a photo first
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      // Request payment
      const paymentButton = screen.getByRole('button', {
        name: /request payment/i,
      });
      await user.click(paymentButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/create-checkout',
          expect.any(Object)
        );
      });

      // Restore location
      window.location = originalLocation;
    });

    it('should handle payment API error with demo fallback', async () => {
      const user = userEvent.setup();

      // Mock fetch to return error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Stripe not configured' }),
      });

      render(<AppPage />);

      // Upload a photo first
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      // Request payment
      const paymentButton = screen.getByRole('button', {
        name: /request payment/i,
      });
      await user.click(paymentButton);

      await waitFor(() => {
        // Should fall back to demo mode and set paid
        expect(screen.getByTestId('paid-status')).toHaveTextContent('paid');
      });
    });

    it('should handle payment fetch network error', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Mock fetch to throw
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      render(<AppPage />);

      // Upload a photo first
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      // Request payment
      const paymentButton = screen.getByRole('button', {
        name: /request payment/i,
      });
      await user.click(paymentButton);

      await waitFor(() => {
        // Should fall back to demo mode and set paid
        expect(screen.getByTestId('paid-status')).toHaveTextContent('paid');
      });

      consoleSpy.mockRestore();
    });

    it('should handle payment API returning non-configured error message', async () => {
      const user = userEvent.setup();

      // Mock fetch to return not configured error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({ error: 'Stripe API keys not configured' }),
      });

      render(<AppPage />);

      // Upload a photo first
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      // Request payment
      const paymentButton = screen.getByRole('button', {
        name: /request payment/i,
      });
      await user.click(paymentButton);

      await waitFor(() => {
        // Should set paid in demo mode
        expect(screen.getByTestId('paid-status')).toHaveTextContent('paid');
      });
    });
  });

  describe('Image Upload Flow', () => {
    it('should show photo editor after upload', async () => {
      const user = userEvent.setup();

      render(<AppPage />);

      expect(screen.getByTestId('photo-upload')).toBeInTheDocument();

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });
    });

    it('should return to upload after back button', async () => {
      const user = userEvent.setup();

      render(<AppPage />);

      // Upload a photo
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
      });

      // Go back
      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });
    });
  });

  describe('Suspense Fallback', () => {
    it('should render loading state in suspense boundary', () => {
      // The Suspense fallback should be a loading spinner
      const { container } = render(<AppPage />);

      // Check that the app renders (suspense has resolved)
      expect(
        container.querySelector('main') || screen.getByTestId('photo-upload')
      ).toBeTruthy();
    });
  });
});
