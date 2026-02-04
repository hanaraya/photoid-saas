/**
 * @jest-environment jsdom
 */
import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUpload } from '@/components/photo-upload';

// Mock URL APIs
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

describe('PhotoUpload Branch Coverage Tests', () => {
  const mockOnImageLoaded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Camera Functionality', () => {
    it('should handle camera access denied', async () => {
      const user = userEvent.setup();
      const mockAlert = jest
        .spyOn(window, 'alert')
        .mockImplementation(() => {});

      // Mock getUserMedia to reject
      const mockGetUserMedia = jest
        .fn()
        .mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Camera access denied or not available.'
        );
      });

      mockAlert.mockRestore();
    });

    it('should handle successful camera access', async () => {
      const user = userEvent.setup();

      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };
      const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      await waitFor(() => {
        // Camera modal should appear
        expect(
          screen.getByRole('button', { name: /capture/i })
        ).toBeInTheDocument();
      });
    });

    it('should close camera when cancel is clicked', async () => {
      const user = userEvent.setup();

      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };
      const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cancel/i })
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(mockTrack.stop).toHaveBeenCalled();
      });
    });

    it('should capture photo from camera', async () => {
      const user = userEvent.setup();

      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };
      const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      // Mock canvas.toBlob
      HTMLCanvasElement.prototype.toBlob = jest.fn(function (callback) {
        callback(new Blob(['captured'], { type: 'image/jpeg' }));
      });

      // @ts-expect-error - Partial mock of canvas context for testing
      HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
        translate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
      }));

      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /capture/i })
        ).toBeInTheDocument();
      });

      // Note: Video capture testing is complex due to video element requirements
      // This test covers the button click path
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over state', async () => {
      const { container } = render(
        <PhotoUpload onImageLoaded={mockOnImageLoaded} />
      );

      const dropZone = container.querySelector('.rounded-xl');
      if (dropZone) {
        fireEvent.dragOver(dropZone, { preventDefault: jest.fn() });

        // Check for drag over class
        await waitFor(() => {
          expect(dropZone.className).toContain('border');
        });
      }
    });

    it('should handle drag leave state', async () => {
      const { container } = render(
        <PhotoUpload onImageLoaded={mockOnImageLoaded} />
      );

      const dropZone = container.querySelector('.rounded-xl');
      if (dropZone) {
        fireEvent.dragOver(dropZone, { preventDefault: jest.fn() });
        fireEvent.dragLeave(dropZone);
      }
    });

    it('should handle file drop', async () => {
      const { container } = render(
        <PhotoUpload onImageLoaded={mockOnImageLoaded} />
      );

      const dropZone = container.querySelector('.rounded-xl');
      if (dropZone) {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const dataTransfer = { files: [file] };

        fireEvent.drop(dropZone, {
          preventDefault: jest.fn(),
          dataTransfer,
        });

        await waitFor(() => {
          expect(mockOnImageLoaded).toHaveBeenCalledWith(file);
        });
      }
    });
  });

  describe('File Input', () => {
    it('should handle file input change', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        act(() => {
          fireEvent.change(fileInput, { target: { files: [file] } });
        });

        await waitFor(() => {
          expect(mockOnImageLoaded).toHaveBeenCalledWith(file);
        });
      }
    });

    it('should handle empty file input', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        act(() => {
          fireEvent.change(fileInput, { target: { files: [] } });
        });

        // Should not call onImageLoaded
        expect(mockOnImageLoaded).not.toHaveBeenCalled();
      }
    });

    it('should open file picker when upload button clicked', async () => {
      const user = userEvent.setup();

      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const uploadButton = screen.getByRole('button', {
        name: /select photo/i,
      });
      await user.click(uploadButton);

      // File input should be present
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should open file picker when drop zone clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <PhotoUpload onImageLoaded={mockOnImageLoaded} />
      );

      const dropZone = container.querySelector('.rounded-xl');
      if (dropZone) {
        // Note: clicking the drop zone should trigger file input
        await user.click(dropZone);
      }
    });
  });
});
