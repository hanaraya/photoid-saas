/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoEditor } from '@/components/photo-editor';

// Mock all dependencies
const mockDetectFace = jest.fn();
const mockInitFaceDetector = jest.fn();
const mockRemoveImageBackground = jest.fn();
const mockInitBgRemoval = jest.fn();
const mockRenderPassportPhoto = jest.fn();
const mockRenderSheet = jest.fn();
const mockCalculateCrop = jest.fn();
const mockCheckCompliance = jest.fn();
const mockAnalyzeBackground = jest.fn();

const mockDetectFaces = jest.fn();

jest.mock('@/lib/face-detection', () => ({
  initFaceDetector: (...args: unknown[]) => mockInitFaceDetector(...args),
  detectFace: (...args: unknown[]) => mockDetectFace(...args),
  detectFaces: (...args: unknown[]) => mockDetectFaces(...args),
}));

const mockIsBgRemovalReady = jest.fn();
const mockResetBgRemoval = jest.fn();
const mockGetBgRemovalError = jest.fn();

jest.mock('@/lib/bg-removal', () => ({
  removeImageBackground: (...args: unknown[]) =>
    mockRemoveImageBackground(...args),
  initBgRemoval: (...args: unknown[]) => mockInitBgRemoval(...args),
  isBgRemovalReady: (...args: unknown[]) => mockIsBgRemovalReady(...args),
  resetBgRemoval: (...args: unknown[]) => mockResetBgRemoval(...args),
  getBgRemovalError: (...args: unknown[]) => mockGetBgRemovalError(...args),
}));

const mockAnalyzeImage = jest.fn();

jest.mock('@/lib/image-analysis', () => ({
  analyzeImage: (...args: unknown[]) => mockAnalyzeImage(...args),
}));

jest.mock('@/lib/crop', () => ({
  renderPassportPhoto: (...args: unknown[]) => mockRenderPassportPhoto(...args),
  renderSheet: (...args: unknown[]) => mockRenderSheet(...args),
  calculateCrop: (...args: unknown[]) => mockCalculateCrop(...args),
}));

jest.mock('@/lib/compliance', () => ({
  checkCompliance: (...args: unknown[]) => mockCheckCompliance(...args),
}));

jest.mock('@/lib/bg-analysis', () => ({
  analyzeBackground: (...args: unknown[]) => mockAnalyzeBackground(...args),
}));

const mockModerateContent = jest.fn();
const mockCheckFinalCompliance = jest.fn();

jest.mock('@/lib/content-moderation', () => ({
  moderateContent: (...args: unknown[]) => mockModerateContent(...args),
  checkFinalCompliance: (...args: unknown[]) =>
    mockCheckFinalCompliance(...args),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window.alert
global.alert = jest.fn();

// Mock Image
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

// Mock canvas toDataURL
HTMLCanvasElement.prototype.toDataURL = jest.fn(
  () => 'data:image/jpeg;base64,test'
);

describe('PhotoEditor Output and Download Tests', () => {
  const mockOnBack = jest.fn();
  const mockOnRequestPayment = jest.fn();
  const mockImageBlob = new Blob(['test-image'], { type: 'image/jpeg' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockInitFaceDetector.mockResolvedValue(undefined);
    mockInitBgRemoval.mockResolvedValue(undefined);
    mockDetectFace.mockResolvedValue({
      x: 100,
      y: 100,
      w: 200,
      h: 250,
      leftEye: { x: 150, y: 150 },
      rightEye: { x: 250, y: 150 },
      nose: { x: 200, y: 200 },
      mouth: { x: 200, y: 230 },
    });
    mockDetectFaces.mockResolvedValue({
      face: {
        x: 100,
        y: 100,
        w: 200,
        h: 250,
        leftEye: { x: 150, y: 150 },
        rightEye: { x: 250, y: 150 },
        nose: { x: 200, y: 200 },
        mouth: { x: 200, y: 230 },
      },
      faceCount: 1,
    });
    mockModerateContent.mockReturnValue({
      allowed: true,
      severity: 'pass',
      violations: [],
      summary: 'Content check passed',
    });
    mockCheckFinalCompliance.mockReturnValue({
      canProceed: true,
      issues: [],
    });
    mockAnalyzeBackground.mockReturnValue({
      score: 90,
      averageRgb: { r: 255, g: 255, b: 255 },
      needsRemoval: false,
      reason: 'Already white',
    });
    mockCheckCompliance.mockReturnValue([
      {
        id: 'face',
        label: 'Face Detection',
        status: 'pass',
        message: 'Face detected',
      },
    ]);
    mockCalculateCrop.mockReturnValue({
      cropX: 0,
      cropY: 0,
      cropW: 100,
      cropH: 100,
    });
    mockIsBgRemovalReady.mockReturnValue(true);
    mockResetBgRemoval.mockReturnValue(undefined);
    mockGetBgRemovalError.mockReturnValue(null);
    mockAnalyzeImage.mockReturnValue({
      quality: {
        sharpness: 85,
        noise: 10,
        contrast: 70,
        brightness: 128,
        overall: 80,
      },
      compliance: {
        eyeLinePercent: 62.5,
        headHeightPercent: 55,
        topMarginPercent: 10,
        bottomMarginPercent: 10,
      },
    });
  });

  describe('Generate and Output Flow', () => {
    it('should show generate button and handle click', async () => {
      const user = userEvent.setup();

      render(
        <PhotoEditor
          imageBlob={mockImageBlob}
          onBack={mockOnBack}
          isPaid={true}
          onRequestPayment={mockOnRequestPayment}
        />
      );

      await waitFor(
        () => {
          expect(screen.queryByText(/Detecting face/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Find and click generate button
      const generateButton = screen.getByText(/Generate/i);
      expect(generateButton).toBeInTheDocument();

      await user.click(generateButton);

      // After click, should transition to output step
      await waitFor(() => {
        expect(mockRenderSheet).toHaveBeenCalled();
      });
    });

    it('should handle generate with unpaid state', async () => {
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

      // Find and click generate button - this generates the sheet with watermark
      const generateButton = screen.getByText(/Generate/i);
      await user.click(generateButton);

      // Should transition to output step and call renderSheet
      await waitFor(() => {
        expect(mockRenderSheet).toHaveBeenCalled();
      });
    });
  });

  describe('Scroll Zoom', () => {
    it('should handle wheel event for zoom', async () => {
      const { container } = render(
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

      const canvas = container.querySelector('canvas');
      if (canvas) {
        // Zoom in
        fireEvent.wheel(canvas, { deltaY: -100 });
        // Zoom out
        fireEvent.wheel(canvas, { deltaY: 100 });
      }

      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Back Button', () => {
    it('should call onBack when back button clicked', async () => {
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

      // Click the "Start over" back button
      const backButton = screen.getByText(/Start over/i);
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      render(
        <PhotoEditor
          imageBlob={mockImageBlob}
          onBack={mockOnBack}
          isPaid={false}
          onRequestPayment={mockOnRequestPayment}
        />
      );

      // Should show loading text
      expect(screen.getByText(/Detecting face/i)).toBeInTheDocument();
    });
  });

  describe('Face Status Display', () => {
    it('should show face found status when face is detected', async () => {
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

      // Should show compliance summary - displays "Ready to print" or "X/Y checks passed"
      const complianceElements = screen.getAllByText(
        /Ready to print|checks passed/i
      );
      expect(complianceElements.length).toBeGreaterThan(0);
    });

    it('should show no face found status when face is not detected', async () => {
      mockDetectFace.mockResolvedValue(null);
      mockDetectFaces.mockResolvedValue({
        face: null,
        faceCount: 0,
      });
      // Don't block on no-face for this test - just warn so badge is visible
      mockModerateContent.mockReturnValue({
        allowed: true,
        severity: 'warn',
        violations: [],
        summary: 'Content check passed',
      });

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

      // Should show no face indicator (displays as "✗ No face")
      const noFaceBadge = screen.queryByText(/No face/i);
      expect(noFaceBadge).toBeInTheDocument();
    });
  });

  describe('Drag Hint', () => {
    it('should show drag hint initially', async () => {
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

      // Should show drag hint
      const dragHint = screen.queryByText(/Drag to reposition|Scroll to zoom/i);
      expect(dragHint).toBeInTheDocument();
    });
  });
});
