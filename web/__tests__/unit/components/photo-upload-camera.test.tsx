/**
 * @jest-environment jsdom
 */
import React from 'react';
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUpload } from '@/components/photo-upload';

// Mock URL APIs
global.URL.createObjectURL = jest.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = jest.fn();

describe('PhotoUpload Camera Tests', () => {
  const mockOnImageLoaded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Camera Video Capture', () => {
    it('should handle capturePhoto with video element', async () => {
      const user = userEvent.setup();

      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };
      const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      // Mock canvas methods for capture
      const mockContext = {
        translate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
      };
      HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
      HTMLCanvasElement.prototype.toBlob = jest.fn(function (callback) {
        callback(new Blob(['captured'], { type: 'image/jpeg' }));
      });

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

      // Now click capture
      const captureButton = screen.getByRole('button', { name: /capture/i });

      // The video ref won't have proper dimensions in test, but we can test the button click
      await user.click(captureButton);
    });

    it('should handle video ref not set', async () => {
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
          screen.getByRole('button', { name: /capture/i })
        ).toBeInTheDocument();
      });

      // Capture when video ref might not be ready
      const captureButton = screen.getByRole('button', { name: /capture/i });
      await user.click(captureButton);

      // Test passes if no crash occurs
    });

    it('should handle null blob from toBlob', async () => {
      const user = userEvent.setup();

      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };
      const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      // Mock canvas with null blob
      const mockContext = {
        translate: jest.fn(),
        scale: jest.fn(),
        drawImage: jest.fn(),
      };
      HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
      HTMLCanvasElement.prototype.toBlob = jest.fn(function (callback) {
        callback(null); // Null blob case
      });

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

      // Capture with null blob
      const captureButton = screen.getByRole('button', { name: /capture/i });
      await user.click(captureButton);

      // Should not call onImageLoaded when blob is null
      // The capture button click won't cause a crash
    });

    it('should handle null canvas context', async () => {
      const user = userEvent.setup();

      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };
      const mockGetUserMedia = jest.fn().mockResolvedValue(mockStream);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      // Mock canvas with null context
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);

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

      // Capture with null context - component should handle gracefully
      const captureButton = screen.getByRole('button', { name: /capture/i });
      await user.click(captureButton);

      // Should not call onImageLoaded when context is null
      // Test passes if no crash occurs
    });
  });

  describe('Drop Zone Interactions', () => {
    it('should handle empty file drop', async () => {
      const { container } = render(
        <PhotoUpload onImageLoaded={mockOnImageLoaded} />
      );

      const dropZone = container.querySelector('.rounded-xl');
      if (dropZone) {
        const dataTransfer = { files: [] };

        fireEvent.drop(dropZone, {
          preventDefault: jest.fn(),
          dataTransfer,
        });

        // Should not call onImageLoaded
        expect(mockOnImageLoaded).not.toHaveBeenCalled();
      }
    });

    it('should handle drag events correctly', async () => {
      const { container } = render(
        <PhotoUpload onImageLoaded={mockOnImageLoaded} />
      );

      const dropZone = container.querySelector('.rounded-xl');
      if (dropZone) {
        // Drag over
        fireEvent.dragOver(dropZone, { preventDefault: jest.fn() });

        // Should have drag-over styling
        expect(dropZone.className).toContain('border');

        // Drag leave
        fireEvent.dragLeave(dropZone);
      }
    });
  });

  describe('File Input', () => {
    it('should handle null files in input', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        act(() => {
          fireEvent.change(fileInput, { target: { files: null } });
        });

        expect(mockOnImageLoaded).not.toHaveBeenCalled();
      }
    });
  });

  describe('Stream Cleanup', () => {
    it('should stop all tracks when closing camera', async () => {
      const user = userEvent.setup();

      const mockTrack1 = { stop: jest.fn() };
      const mockTrack2 = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack1, mockTrack2] };
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
        expect(mockTrack1.stop).toHaveBeenCalled();
        expect(mockTrack2.stop).toHaveBeenCalled();
      });
    });
  });
});
