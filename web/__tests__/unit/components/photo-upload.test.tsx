/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUpload } from '@/components/photo-upload';

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
const mockMediaStreamTrack = {
  stop: jest.fn(),
};
const mockMediaStream = {
  getTracks: jest.fn(() => [mockMediaStreamTrack]),
};

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

describe('PhotoUpload Component', () => {
  const mockOnImageLoaded = jest.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
  });

  describe('Rendering', () => {
    it('should render upload interface', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      expect(screen.getByText('Drop your photo here')).toBeInTheDocument();
      expect(screen.getByText('Select Photo')).toBeInTheDocument();
      expect(screen.getByText('Take Photo')).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const uploadButton = screen.getByRole('button', {
        name: /select photo/i,
      });
      expect(uploadButton).toBeInTheDocument();

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      expect(takePhotoButton).toBeInTheDocument();
    });

    it('should render with correct description text', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      expect(screen.getByText('or use the buttons below')).toBeInTheDocument();
    });

    it('should have a hidden file input', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });
  });

  describe('File Upload', () => {
    it('should handle file upload via input', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const file = new File(['fake-image-data'], 'test-image.jpg', {
        type: 'image/jpeg',
      });

      const hiddenInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      // Simulate file selection
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(hiddenInput);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(file);
    });

    it('should handle drag and drop', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const file = new File(['fake-image-data'], 'test-image.jpg', {
        type: 'image/jpeg',
      });

      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(file);
    });

    it('should show drag over state', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const dropZone = document.querySelector('.border-dashed');
      expect(dropZone).toBeTruthy();

      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [] },
      });

      expect(dropZone?.className).toContain('border-primary');
    });

    it('should clear drag over state on drag leave', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const dropZone = document.querySelector('.border-dashed');
      expect(dropZone).toBeTruthy();

      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [] },
      });

      expect(dropZone?.className).toContain('border-primary');

      fireEvent.dragLeave(dropZone!);

      expect(dropZone?.className).toContain('border-border');
    });

    it('should handle missing files gracefully', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const hiddenInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;

      // Simulate no file selection
      Object.defineProperty(hiddenInput, 'files', {
        value: null,
        writable: false,
      });

      fireEvent.change(hiddenInput);

      expect(mockOnImageLoaded).not.toHaveBeenCalled();
    });

    it('should take first file when multiple dropped', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const file1 = new File(['data1'], 'img1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['data2'], 'img2.jpg', { type: 'image/jpeg' });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file1, file2] },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(file1);
      expect(mockOnImageLoaded).toHaveBeenCalledTimes(1);
    });
  });

  describe('Camera', () => {
    it('should handle camera access denial', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith(
          'Camera access denied or not available.'
        );
      });

      alertSpy.mockRestore();
    });

    it('should request camera with correct constraints', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      // Default is US (square 1:1)
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'user',
          width: { ideal: 1920, min: 1080 },
          height: { ideal: 1920, min: 1080 },
          aspectRatio: { ideal: 1, min: 0.8, max: 1.25 },
        },
      });
    });

    it('should show camera modal when camera opens', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText(/Capture/i)).toBeInTheDocument();
      });
    });

    it('should close camera when cancel is clicked', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      });

      expect(mockMediaStreamTrack.stop).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle large file', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const largeData = new Array(1000000).fill('a').join('');
      const largeFile = new File([largeData], 'large.jpg', {
        type: 'image/jpeg',
      });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [largeFile] },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(largeFile);
    });

    it('should handle empty file', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const emptyFile = new File([''], 'empty.jpg', { type: 'image/jpeg' });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [emptyFile] },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(emptyFile);
    });

    it('should pass through non-image files', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const textFile = new File(['text'], 'test.txt', { type: 'text/plain' });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [textFile] },
      });

      fireEvent(dropZone!, dropEvent);

      // Component passes file to parent, doesn't validate type
      expect(mockOnImageLoaded).toHaveBeenCalledWith(textFile);
    });

    it('should handle drop with no files', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [] },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).not.toHaveBeenCalled();
    });
  });

  describe('Interactions', () => {
    it('should trigger file input when upload button clicked', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');

      const uploadButton = screen.getByRole('button', {
        name: /select photo/i,
      });
      await user.click(uploadButton);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should trigger file input when drop zone clicked', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      await user.click(dropZone!);

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
