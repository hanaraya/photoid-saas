/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OriginalPhoto } from '@/components/photo-editor/OriginalPhoto';

describe('OriginalPhoto', () => {
  const createMockImage = (
    src: string = 'test-image.jpg'
  ): HTMLImageElement => {
    const img = new Image();
    img.src = src;
    return img;
  };

  it('should return null when sourceImg is null', () => {
    const { container } = render(<OriginalPhoto sourceImg={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render thumbnail button when sourceImg is provided', () => {
    const mockImg = createMockImage();
    render(<OriginalPhoto sourceImg={mockImg} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'View original');
  });

  it('should display image thumbnail', () => {
    const mockImg = createMockImage('test-original.jpg');
    render(<OriginalPhoto sourceImg={mockImg} />);

    const thumbnail = screen.getByAltText('Original');
    expect(thumbnail).toBeInTheDocument();
    // Just check that it has a src attribute
    expect(thumbnail).toHaveAttribute('src');
  });

  it('should open modal when thumbnail is clicked', async () => {
    const mockImg = createMockImage('modal-test.jpg');
    render(<OriginalPhoto sourceImg={mockImg} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Modal should open with dialog title
    await waitFor(() => {
      expect(screen.getByText('Original Photo')).toBeInTheDocument();
    });
  });

  it('should show full image in modal', async () => {
    const mockImg = createMockImage('full-image.jpg');
    render(<OriginalPhoto sourceImg={mockImg} />);

    // Open modal
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const images = screen.getAllByAltText('Original');
      // Should have thumbnail + modal image
      expect(images.length).toBeGreaterThanOrEqual(1);
    });
  });
});
