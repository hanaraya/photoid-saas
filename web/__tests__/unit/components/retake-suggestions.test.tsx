import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetakeSuggestions, RetakeSuggestionsInline } from '@/components/retake-suggestions';
import { type ComplianceCheck } from '@/lib/compliance';

describe('RetakeSuggestions', () => {
  describe('rendering', () => {
    it('returns null when all checks pass', () => {
      const checks: ComplianceCheck[] = [
        { id: 'face', label: 'Face', status: 'pass', message: 'OK' },
        { id: 'head_size', label: 'Head Size', status: 'pass', message: 'OK' },
      ];

      const { container } = render(<RetakeSuggestions checks={checks} />);

      expect(container.firstChild).toBeNull();
    });

    it('renders suggestions when checks fail', () => {
      const checks: ComplianceCheck[] = [
        { id: 'face', label: 'Face', status: 'fail', message: 'No face detected' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      expect(screen.getByText('Photo Needs Retake')).toBeInTheDocument();
      expect(screen.getByText('Face Not Detected')).toBeInTheDocument();
    });

    it('shows warning style for adjustable issues only', () => {
      const checks: ComplianceCheck[] = [
        { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Head appears too small' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      expect(screen.getByText('Suggestions to Improve')).toBeInTheDocument();
      expect(screen.getByText('Head Size Issue')).toBeInTheDocument();
    });

    it('separates retake-required from adjustable suggestions', () => {
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Blurry' },
        { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Too small' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      expect(screen.getByText('Requires New Photo')).toBeInTheDocument();
      expect(screen.getByText('Quick Fixes Available')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('expands suggestion on click', () => {
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Photo appears blurry' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      // Initially collapsed - tips not visible
      expect(screen.queryByText('How to Fix')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(screen.getByText('Blurry Photo'));

      // Now expanded - tips visible
      expect(screen.getByText('How to Fix')).toBeInTheDocument();
      expect(screen.getByText('Tips')).toBeInTheDocument();
    });

    it('collapses suggestion on second click', () => {
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Photo appears blurry' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      // Expand
      fireEvent.click(screen.getByText('Blurry Photo'));
      expect(screen.getByText('How to Fix')).toBeInTheDocument();

      // Collapse
      fireEvent.click(screen.getByText('Blurry Photo'));
      expect(screen.queryByText('How to Fix')).not.toBeInTheDocument();
    });

    it('only expands one suggestion at a time', () => {
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Blurry' },
        { id: 'lighting', label: 'Lighting', status: 'warn', message: 'Uneven' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      // Expand first
      fireEvent.click(screen.getByText('Blurry Photo'));
      expect(screen.getByText('Hold your phone with both hands')).toBeInTheDocument();

      // Expand second - first should collapse
      fireEvent.click(screen.getByText('Uneven Lighting'));
      expect(screen.queryByText('Hold your phone with both hands')).not.toBeInTheDocument();
      expect(screen.getByText('Face a window for natural light')).toBeInTheDocument();
    });

    it('calls onRetake when button clicked', () => {
      const mockRetake = jest.fn();
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Blurry' },
      ];

      render(<RetakeSuggestions checks={checks} onRetake={mockRetake} />);

      fireEvent.click(screen.getByText('📷 Take New Photo'));

      expect(mockRetake).toHaveBeenCalledTimes(1);
    });

    it('hides retake button when not required', () => {
      const mockRetake = jest.fn();
      const checks: ComplianceCheck[] = [
        { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Too small' },
      ];

      render(<RetakeSuggestions checks={checks} onRetake={mockRetake} />);

      expect(screen.queryByText('📷 Take New Photo')).not.toBeInTheDocument();
    });

    it('hides retake button when no onRetake provided', () => {
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Blurry' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      expect(screen.queryByText('📷 Take New Photo')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-expanded attribute', () => {
      const checks: ComplianceCheck[] = [
        { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Blurry' },
      ];

      render(<RetakeSuggestions checks={checks} />);

      const button = screen.getByRole('button', { name: /blurry photo/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });
  });
});

describe('RetakeSuggestionsInline', () => {
  it('returns null when all checks pass', () => {
    const checks: ComplianceCheck[] = [
      { id: 'face', label: 'Face', status: 'pass', message: 'OK' },
    ];

    const { container } = render(<RetakeSuggestionsInline checks={checks} />);

    expect(container.firstChild).toBeNull();
  });

  it('shows issue count for single issue', () => {
    const checks: ComplianceCheck[] = [
      { id: 'head_size', label: 'Size', status: 'warn', message: 'Too small' },
    ];

    render(<RetakeSuggestionsInline checks={checks} />);

    expect(screen.getByText(/1 issue found/)).toBeInTheDocument();
  });

  it('shows plural for multiple issues', () => {
    const checks: ComplianceCheck[] = [
      { id: 'head_size', label: 'Size', status: 'warn', message: 'Too small' },
      { id: 'lighting', label: 'Lighting', status: 'warn', message: 'Uneven' },
    ];

    render(<RetakeSuggestionsInline checks={checks} />);

    expect(screen.getByText(/2 issues found/)).toBeInTheDocument();
  });

  it('shows retake recommendation when required', () => {
    const checks: ComplianceCheck[] = [
      { id: 'sharpness', label: 'Sharpness', status: 'fail', message: 'Blurry' },
    ];

    render(<RetakeSuggestionsInline checks={checks} />);

    expect(screen.getByText(/retake recommended/)).toBeInTheDocument();
  });

  it('does not show retake recommendation for adjustable issues', () => {
    const checks: ComplianceCheck[] = [
      { id: 'head_size', label: 'Size', status: 'warn', message: 'Too small' },
    ];

    render(<RetakeSuggestionsInline checks={checks} />);

    expect(screen.queryByText(/retake recommended/)).not.toBeInTheDocument();
  });
});
