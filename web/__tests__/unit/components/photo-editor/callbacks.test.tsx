/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoEditor } from '@/components/photo-editor';

// Mock all dependencies
const mockRemoveImageBackground = jest.fn();
const mockRenderPassportPhoto = jest.fn();
const mockRenderSheet = jest.fn();
const mockCheckFinalCompliance = jest.fn();

jest.mock('@/lib/face-detection', () => ({
  initFaceDetector: jest.fn().mockResolvedValue(undefined),
  detectFace: jest.fn().mockResolvedValue({
    x: 100,
    y: 100,
    w: 200,
    h: 250,
    leftEye: { x: 150, y: 150 },
    rightEye: { x: 250, y: 150 },
  }),
  detectFaces: jest.fn().mockResolvedValue({
    face: {
      x: 100,
      y: 100,
      w: 200,
      h: 250,
      leftEye: { x: 150, y: 150 },
      rightEye: { x: 250, y: 150 },
    },
    faceCount: 1,
  }),
  isFaceDetectorReady: jest.fn().mockReturnValue(true),
}));

jest.mock('@/lib/bg-removal', () => ({
  removeImageBackground: (...args: unknown[]) => mockRemoveImageBackground(...args),
  initBgRemoval: jest.fn().mockResolvedValue(undefined),
  isBgRemovalReady: jest.fn().mockReturnValue(true),
  resetBgRemoval: jest.fn(),
  getBgRemovalError: jest.fn().mockReturnValue(null),
}));

jest.mock('@/lib/image-analysis', () => ({
  analyzeImage: jest.fn().mockReturnValue({
    quality: { sharpness: 85, noise: 10, contrast: 70, brightness: 128, overall: 80 },
    compliance: { eyeLinePercent: 62.5, headHeightPercent: 55, topMarginPercent: 10, bottomMarginPercent: 10 },
  }),
}));

jest.mock('@/lib/crop', () => ({
  renderPassportPhoto: (...args: unknown[]) => mockRenderPassportPhoto(...args),
  renderSheet: (...args: unknown[]) => mockRenderSheet(...args),
  calculateCrop: jest.fn().mockReturnValue({ cropX: 0, cropY: 0, cropW: 100, cropH: 100 }),
}));

jest.mock('@/lib/compliance', () => ({
  checkCompliance: jest.fn().mockReturnValue([
    { id: 'face', label: 'Face Detection', status: 'pass', message: 'Face detected' },
    { id: 'head_size', label: 'Head Size', status: 'pass', message: 'Good size' },
  ]),
}));

jest.mock('@/lib/bg-analysis', () => ({
  analyzeBackground: jest.fn().mockReturnValue({
    score: 30,
    averageRgb: { r: 100, g: 100, b: 100 },
    needsRemoval: true,
    reason: 'Dark background',
  }),
}));

jest.mock('@/lib/content-moderation', () => ({
  moderateContent: jest.fn().mockReturnValue({
    allowed: true,
    severity: 'pass',
    violations: [],
    summary: 'Content check passed',
  }),
  checkFinalCompliance: (...args: unknown[]) => mockCheckFinalCompliance(...args),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

// Mock canvas and Image
const mockToBlob = jest.fn((callback: (blob: Blob | null) => void) => {
  callback(new Blob(['test'], { type: 'image/jpeg' }));
});
const mockToDataURL = jest.fn(() => 'data:image/jpeg;base64,test');
const mockGetContext = jest.fn(() => ({
  fillRect: jest.fn(),
  drawImage: jest.fn(),
}));

global.HTMLCanvasElement.prototype.getContext = mockGetContext;
global.HTMLCanvasElement.prototype.toBlob = mockToBlob;
global.HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

class MockImage {
  src: string = '';
  naturalWidth: number = 1000;
  naturalHeight: number = 800;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
}

(global as any).Image = MockImage;

// Store original createElement
const originalCreateElement = document.createElement;

// Mock document.createElement for specific tags
document.createElement = jest.fn((tagName: string) => {
  if (tagName === 'canvas') {
    const canvas = originalCreateElement.call(document, 'canvas');
    canvas.getContext = mockGetContext;
    canvas.toBlob = mockToBlob;
    canvas.toDataURL = mockToDataURL;
    return canvas;
  }
  if (tagName === 'a') {
    const link = originalCreateElement.call(document, 'a');
    link.click = jest.fn();
    return link;
  }
  return originalCreateElement.call(document, tagName);
}) as any;

describe('PhotoEditor Callbacks', () => {
  const mockOnBack = jest.fn();
  const mockOnRequestPayment = jest.fn();
  const mockImageBlob = new Blob(['test-image'], { type: 'image/jpeg' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckFinalCompliance.mockReturnValue({
      canProceed: true,
      issues: [],
    });
    mockRemoveImageBackground.mockResolvedValue(new Blob(['removed'], { type: 'image/png' }));
  });

  it('should call handleBgRemoval when Remove Background button clicked', async () => {
    const user = userEvent.setup();

    render(
      <PhotoEditor
        imageBlob={mockImageBlob}
        onBack={mockOnBack}
        isPaid={false}
        onRequestPayment={mockOnRequestPayment}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/Detecting face/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find and click the Remove Background button
    const removeBgButton = await screen.findByText(/Remove Background/i);
    await user.click(removeBgButton);

    // Should have called removeImageBackground
    await waitFor(() => {
      expect(mockRemoveImageBackground).toHaveBeenCalled();
    });
  });

  it('should call handleGenerate when Generate button clicked', async () => {
    const user = userEvent.setup();

    render(
      <PhotoEditor
        imageBlob={mockImageBlob}
        onBack={mockOnBack}
        isPaid={false}
        onRequestPayment={mockOnRequestPayment}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/Detecting face/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Click generate button
    const generateButton = screen.getByText(/Generate Printable Photos/i);
    await user.click(generateButton);

    // Should have checked compliance
    expect(mockCheckFinalCompliance).toHaveBeenCalled();
  });

  it('should handle position change from PreviewPanel', async () => {
    render(
      <PhotoEditor
        imageBlob={mockImageBlob}
        onBack={mockOnBack}
        isPaid={false}
        onRequestPayment={mockOnRequestPayment}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/Detecting face/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Component should render successfully with drag handlers
    expect(screen.getByText(/Generate Printable Photos/i)).toBeInTheDocument();
  });

  it('should handle zoom change', async () => {
    const user = userEvent.setup();

    render(
      <PhotoEditor
        imageBlob={mockImageBlob}
        onBack={mockOnBack}
        isPaid={false}
        onRequestPayment={mockOnRequestPayment}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/Detecting face/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open advanced controls
    const advancedControls = screen.getByText(/Advanced adjustments/i);
    await user.click(advancedControls);

    // Should show zoom label (specific to the advanced controls section)
    const zoomLabels = screen.getAllByText(/Zoom/i);
    expect(zoomLabels.length).toBeGreaterThan(0);
  });

  it('should handle brightness change', async () => {
    const user = userEvent.setup();

    render(
      <PhotoEditor
        imageBlob={mockImageBlob}
        onBack={mockOnBack}
        isPaid={false}
        onRequestPayment={mockOnRequestPayment}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/Detecting face/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open advanced controls
    const advancedControls = screen.getByText(/Advanced adjustments/i);
    await user.click(advancedControls);

    // Should show brightness label (specific to the advanced controls section)
    const brightnessLabels = screen.getAllByText(/Brightness/i);
    expect(brightnessLabels.length).toBeGreaterThan(0);
  });

  it('should handle overlay toggle', async () => {
    const user = userEvent.setup();

    render(
      <PhotoEditor
        imageBlob={mockImageBlob}
        onBack={mockOnBack}
        isPaid={false}
        onRequestPayment={mockOnRequestPayment}
      />
    );

    await waitFor(
      () => {
        expect(screen.queryByText(/Detecting face/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Should render toggle overlay button by aria-label
    const toggleButton = screen.getByLabelText(/toggle overlay/i);
    await user.click(toggleButton);

    // Should still be rendered
    expect(screen.getByText(/Generate Printable Photos/i)).toBeInTheDocument();
  });
});
