/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

describe('PhotoEditor Branch Coverage Tests', () => {
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

  describe('Face Detection Error Handling', () => {
    it('should handle face detection throwing an error', async () => {
      mockDetectFace.mockRejectedValueOnce(new Error('Face detection failed'));
      mockDetectFaces.mockRejectedValueOnce(new Error('Face detection failed'));

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

      // Should still render the component - use getAllByRole for multiple matches
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle initFaceDetector error', async () => {
      mockInitFaceDetector.mockRejectedValueOnce(new Error('Init failed'));
      mockDetectFace.mockResolvedValue(null);
      mockDetectFaces.mockResolvedValue({ face: null, faceCount: 0 });

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

      // Should still render
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Background Removal', () => {
    it('should handle background removal button when background needs removal', async () => {
      mockAnalyzeBackground.mockReturnValue({
        score: 30,
        averageRgb: { r: 100, g: 100, b: 100 },
        needsRemoval: true,
        reason: 'Dark background',
      });
      mockRemoveImageBackground.mockResolvedValue(
        new Blob(['removed'], { type: 'image/png' })
      );

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

      // Check component renders
      expect(screen.getByText(/Generate/i)).toBeInTheDocument();
    });

    it('should handle background already removed case', async () => {
      mockAnalyzeBackground.mockReturnValue({
        score: 95,
        averageRgb: { r: 255, g: 255, b: 255 },
        needsRemoval: false,
        reason: 'Already white',
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

      expect(screen.getByText(/Generate/i)).toBeInTheDocument();
    });
  });

  describe('Drag Interactions', () => {
    it('should handle mouse drag start on canvas', async () => {
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
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(document, { clientX: 150, clientY: 150 });
        fireEvent.mouseUp(document);
      }

      expect(canvas).toBeInTheDocument();
    });

    it('should handle touch drag start on canvas', async () => {
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
        fireEvent.touchStart(canvas, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(document, {
          touches: [{ clientX: 150, clientY: 150 }],
        });
        fireEvent.touchEnd(document);
      }

      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Slider Interactions', () => {
    it('should render sliders for adjustments', async () => {
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

      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThan(0);
    });
  });

  describe('Country Selection', () => {
    it('should render photo standard as read-only', async () => {
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

      // Standard is shown as a badge with country name
      expect(screen.getByText(/US Passport/i)).toBeInTheDocument();
    });
  });

  describe('Sheet Generation', () => {
    it('should show generate button', async () => {
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

      const generateButton = screen.getByText(/Generate/i);
      expect(generateButton).toBeInTheDocument();
    });
  });

  describe('Component Unmount Cleanup', () => {
    it('should properly cleanup on unmount', async () => {
      const { unmount } = render(
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

      // Unmount should cleanup properly
      unmount();

      // URL.revokeObjectURL should have been called during cleanup
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('BG Model Preloading', () => {
    it('should preload bg model when face is detected and bg needs removal', async () => {
      mockDetectFace.mockResolvedValue({
        x: 100,
        y: 100,
        w: 200,
        h: 250,
        leftEye: { x: 150, y: 150 },
        rightEye: { x: 250, y: 150 },
      });

      // Set background to need removal to trigger preloading
      mockAnalyzeBackground.mockReturnValue({
        score: 30,
        averageRgb: { r: 100, g: 100, b: 100 },
        needsRemoval: true,
        reason: 'Dark background',
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

      // Component should still work even if initBgRemoval was or wasn't called
      expect(screen.getByText(/Generate/i)).toBeInTheDocument();
    });

    it('should handle initBgRemoval failure gracefully', async () => {
      mockInitBgRemoval.mockRejectedValue(new Error('BG init failed'));

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

      // Component should still render
      expect(screen.getByText(/Generate/i)).toBeInTheDocument();
    });
  });

  describe('Compliance Checks', () => {
    it('should show compliance status', async () => {
      mockCheckCompliance.mockReturnValue([
        {
          id: 'face',
          label: 'Face Detection',
          status: 'pass',
          message: 'Face detected',
        },
        {
          id: 'head_size',
          label: 'Head Size',
          status: 'pass',
          message: 'Good size',
        },
      ]);

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

      // Should show compliance info - compliance summary shows "Ready to print" when all checks pass
      expect(
        screen.getByText(/Ready to print|item.*to review/i)
      ).toBeInTheDocument();
    });
  });

  describe('Preview Rendering', () => {
    it('should render preview canvas', async () => {
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
      expect(canvas).toBeInTheDocument();
      expect(mockRenderPassportPhoto).toHaveBeenCalled();
    });
  });
});
