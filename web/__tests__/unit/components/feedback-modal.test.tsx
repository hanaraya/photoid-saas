/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackModal } from '@/components/feedback-modal';

// Mock fetch
global.fetch = jest.fn();

describe('FeedbackModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should not render when closed', () => {
    const { container } = render(
      <FeedbackModal isOpen={false} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render when open', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('How was your experience?')).toBeInTheDocument();
  });

  it('should display 5 star rating buttons', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    const stars = screen.getAllByRole('button', { name: /Rate \d star/ });
    expect(stars).toHaveLength(5);
  });

  it('should highlight stars on hover', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    const star3 = screen.getByRole('button', { name: 'Rate 3 stars' });
    fireEvent.mouseEnter(star3);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('should allow selecting a rating', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    const star5 = screen.getByRole('button', { name: 'Rate 5 stars' });
    fireEvent.click(star5);
    expect(screen.getByText('Excellent!')).toBeInTheDocument();
  });

  it('should disable submit button until rating is selected', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDisabled();

    const star4 = screen.getByRole('button', { name: 'Rate 4 stars' });
    fireEvent.click(star4);
    expect(submitButton).not.toBeDisabled();
  });

  it('should call onClose when Skip is clicked', () => {
    const onClose = jest.fn();
    render(<FeedbackModal isOpen={true} onClose={onClose} />);
    const skipButton = screen.getByRole('button', { name: 'Skip' });
    fireEvent.click(skipButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should submit feedback and show thank you message', async () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} photoStandard="US Passport" />);

    // Select rating
    const star5 = screen.getByRole('button', { name: 'Rate 5 stars' });
    fireEvent.click(star5);

    // Add comment
    const textarea = screen.getByPlaceholderText(/suggestions/i);
    fireEvent.change(textarea, { target: { value: 'Great app!' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('should show error message on submit failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);

    const star3 = screen.getByRole('button', { name: 'Rate 3 stars' });
    fireEvent.click(star3);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit/i)).toBeInTheDocument();
    });
  });

  it('should enforce comment character limit', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    const textarea = screen.getByPlaceholderText(/suggestions/i);
    expect(textarea).toHaveAttribute('maxLength', '500');
  });

  it('should show character count', () => {
    render(<FeedbackModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText('0/500')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/suggestions/i);
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });
});
