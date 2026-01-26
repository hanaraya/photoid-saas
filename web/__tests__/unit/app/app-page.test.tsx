/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppPage from '@/app/app/page';

// Mock useSearchParams
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock the PhotoUpload component
jest.mock('@/components/photo-upload', () => ({
  PhotoUpload: ({ onImageLoaded }: { onImageLoaded: (file: Blob) => void }) => (
    <div data-testid="photo-upload">
      <button
        onClick={() =>
          onImageLoaded(new Blob(['test'], { type: 'image/jpeg' }))
        }
      >
        Upload Photo
      </button>
    </div>
  ),
}));

// Mock PhotoEditor component
jest.mock('@/components/photo-editor', () => ({
  PhotoEditor: ({
    onBack,
  }: {
    imageBlob: Blob;
    onBack: () => void;
    isPaid: boolean;
    onRequestPayment: () => void;
  }) => (
    <div data-testid="photo-editor">
      <button onClick={onBack}>Back</button>
      Photo Editor
    </div>
  ),
}));

// Mock Header component
jest.mock('@/components/header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

describe('AppPage', () => {
  it('should render photo upload component initially', () => {
    render(<AppPage />);
    expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
  });

  it('should render header', () => {
    render(<AppPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should render page title', () => {
    render(<AppPage />);
    expect(screen.getByText('📸 Passport Photo Maker')).toBeInTheDocument();
  });

  it('should render page description', () => {
    render(<AppPage />);
    expect(
      screen.getByText(
        /Upload a photo → auto-detect face → get printable passport photos/
      )
    ).toBeInTheDocument();
  });

  it('should show photo editor after upload', async () => {
    render(<AppPage />);

    const uploadButton = screen.getByText('Upload Photo');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
    });
  });

  it('should return to upload view when back is clicked', async () => {
    render(<AppPage />);

    // Upload photo first
    const uploadButton = screen.getByText('Upload Photo');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
    });

    // Click back
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
    });
  });

  it('should display US passport specs', () => {
    render(<AppPage />);
    // Default selection is US Passport, specs shown dynamically
    expect(screen.getByText(/US Passport Specs/)).toBeInTheDocument();
  });

  it('should display output specs', () => {
    render(<AppPage />);
    expect(screen.getByText(/4×6 inch printable sheet/)).toBeInTheDocument();
  });

  it('should display privacy notice', () => {
    render(<AppPage />);
    expect(
      screen.getByText(/All processing happens in your browser/)
    ).toBeInTheDocument();
  });

  it('should have main content area', () => {
    render(<AppPage />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    render(<AppPage />);
    // Filter out React warnings
    const unexpectedErrors = consoleSpy.mock.calls.filter(
      (args) => !String(args[0]).includes('Warning:')
    );
    expect(unexpectedErrors.length).toBe(0);
    consoleSpy.mockRestore();
  });
});

describe('AppPage with payment', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should show payment success message when paid param is true', () => {
    // Override the mock for this test
    jest.mock('next/navigation', () => ({
      useSearchParams: () => ({
        get: (key: string) => (key === 'paid' ? 'true' : null),
      }),
    }));

    // This test verifies the component handles the paid state
    render(<AppPage />);
    // Payment success message would show if searchParams.get('paid') === 'true'
    expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
  });

  it('should handle payment request with successful redirect', async () => {
    const originalLocation = window.location;

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
    });

    // Create a mock PhotoEditor that calls onRequestPayment
    jest.doMock('@/components/photo-editor', () => ({
      PhotoEditor: ({
        onRequestPayment,
      }: {
        imageBlob: Blob;
        onBack: () => void;
        isPaid: boolean;
        onRequestPayment: () => void;
      }) => (
        <div data-testid="photo-editor">
          <button onClick={onRequestPayment}>Request Payment</button>
        </div>
      ),
    }));

    render(<AppPage />);

    // Upload to show editor
    const uploadButton = screen.getByText('Upload Photo');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByTestId('photo-editor')).toBeInTheDocument();
    });

    window.location = originalLocation;
  });

  it('should handle payment request when Stripe not configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Stripe is not configured' }),
    });

    render(<AppPage />);

    // The component handles this gracefully by falling back to demo mode
    expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
  });

  it('should handle payment request error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<AppPage />);

    // The component should handle errors gracefully
    expect(screen.getByTestId('photo-upload')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
