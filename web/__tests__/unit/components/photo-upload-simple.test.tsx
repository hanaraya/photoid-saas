/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoUpload } from '@/components/photo-upload';

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

describe('PhotoUpload Component - Basic Functionality', () => {
  const mockOnImageLoaded = jest.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
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

    it('should render hidden file input', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const hiddenInput = document.querySelector('input[type="file"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveClass('hidden');
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

    it('should handle drag over state', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      // Find the drop zone - it's the outer container with border-dashed
      const dropZone = document.querySelector('.border-dashed');
      expect(dropZone).toBeTruthy();

      // Simulate drag over
      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [] },
      });

      // Check that border-primary class is added during drag over
      expect(dropZone?.className).toContain('border-primary');
    });

    it('should clear drag over state after drag leave', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      // Find the drop zone - it's the outer container with border-dashed
      const dropZone = document.querySelector('.border-dashed');
      expect(dropZone).toBeTruthy();

      // Start drag
      fireEvent.dragOver(dropZone!, {
        dataTransfer: { files: [] },
      });

      expect(dropZone?.className).toContain('border-primary');

      // End drag
      fireEvent.dragLeave(dropZone!);

      expect(dropZone?.className).toContain('border-border');
    });

    it('should handle multiple files by taking the first one', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const file1 = new File(['fake-image-data-1'], 'test-image-1.jpg', {
        type: 'image/jpeg',
      });
      const file2 = new File(['fake-image-data-2'], 'test-image-2.jpg', {
        type: 'image/jpeg',
      });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file1, file2],
        },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(file1);
      expect(mockOnImageLoaded).toHaveBeenCalledTimes(1);
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
  });

  describe('Camera Basic Functionality', () => {
    it('should handle camera access denial gracefully', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      // Mock alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const takePhotoButton = screen.getByRole('button', {
        name: /take photo/i,
      });
      await user.click(takePhotoButton);

      // Wait a bit for async operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGetUserMedia).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Camera access denied or not available.'
      );

      alertSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large files', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      // Create a large file
      const largeFileData = 'a'.repeat(1000000); // 1MB of 'a' characters
      const largeFile = new File([largeFileData], 'large-image.jpg', {
        type: 'image/jpeg',
      });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [largeFile],
        },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(largeFile);
    });

    it('should handle invalid file types gracefully', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const textFile = new File(['not-an-image'], 'test.txt', {
        type: 'text/plain',
      });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [textFile],
        },
      });

      fireEvent(dropZone!, dropEvent);

      // Component doesn't validate file type, passes through to parent
      expect(mockOnImageLoaded).toHaveBeenCalledWith(textFile);
    });

    it('should handle corrupted/empty files', async () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const emptyFile = new File([''], 'empty.jpg', {
        type: 'image/jpeg',
      });

      const dropZone = screen.getByText('Drop your photo here').closest('div');
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [emptyFile],
        },
      });

      fireEvent(dropZone!, dropEvent);

      expect(mockOnImageLoaded).toHaveBeenCalledWith(emptyFile);
    });
  });

  describe('File Input', () => {
    it('should accept image files', () => {
      render(<PhotoUpload onImageLoaded={mockOnImageLoaded} />);

      const hiddenInput = document.querySelector('input[type="file"]');
      expect(hiddenInput).toHaveAttribute('accept', 'image/*');
    });
  });
});
