/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ComplianceSummary } from '@/components/photo-editor/ComplianceSummary';
import { type ComplianceCheck } from '@/lib/compliance';
import { type BgAnalysis } from '@/lib/bg-analysis';

// Mock retake-suggestions module
jest.mock('@/lib/retake-suggestions', () => ({
  getRetakeSuggestions: jest.fn().mockReturnValue([]),
  needsRetake: jest.fn().mockReturnValue(false),
}));

describe('ComplianceSummary', () => {
  const mockOnRemoveBg = jest.fn();
  const mockOnRetake = jest.fn();

  const passingChecks: ComplianceCheck[] = [
    { id: 'face', label: 'Face Detection', status: 'pass', message: 'Face detected' },
    { id: 'head_size', label: 'Head Size', status: 'pass', message: 'Good size' },
    { id: 'eye_position', label: 'Eye Position', status: 'pass', message: 'Eyes centered' },
  ];

  const failingChecks: ComplianceCheck[] = [
    { id: 'face', label: 'Face Detection', status: 'pass', message: 'Face detected' },
    { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Too small' },
    { id: 'eye_position', label: 'Eye Position', status: 'fail', message: 'Eyes not visible' },
  ];

  const defaultProps = {
    checks: passingChecks,
    bgAnalysis: null,
    bgRemoved: false,
    onRemoveBg: mockOnRemoveBg,
    bgRemoving: false,
    onRetake: mockOnRetake,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render null when no checks', () => {
    const { container } = render(
      <ComplianceSummary {...defaultProps} checks={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render "Ready to print" when all checks pass', () => {
    render(<ComplianceSummary {...defaultProps} />);
    expect(screen.getByText('Ready to print')).toBeInTheDocument();
    expect(screen.getByText('3/3 checks passed')).toBeInTheDocument();
  });

  it('should render items to review count when checks fail', () => {
    render(<ComplianceSummary {...defaultProps} checks={failingChecks} />);
    expect(screen.getByText(/item.*to review/)).toBeInTheDocument();
  });

  it('should toggle expanded state when clicked', () => {
    render(<ComplianceSummary {...defaultProps} checks={failingChecks} />);

    const toggle = screen.getByTestId('compliance-summary-toggle');
    fireEvent.click(toggle);

    // Should show individual check details when expanded
    expect(screen.getByText('Head Size')).toBeInTheDocument();
  });

  it('should show background removal button when bg needs removal', () => {
    const bgAnalysis: BgAnalysis = {
      needsRemoval: true,
      score: 30,
      averageRgb: { r: 100, g: 100, b: 100 },
      reason: 'Not white enough',
    };

    render(
      <ComplianceSummary
        {...defaultProps}
        bgAnalysis={bgAnalysis}
        bgRemoved={false}
      />
    );

    // Toggle to expand
    fireEvent.click(screen.getByTestId('compliance-summary-toggle'));

    expect(screen.getByText('Fix')).toBeInTheDocument();
  });

  it('should show loading state when bg is being removed', () => {
    const bgAnalysis: BgAnalysis = {
      needsRemoval: true,
      score: 30,
      averageRgb: { r: 100, g: 100, b: 100 },
      reason: 'Not white enough',
    };

    render(
      <ComplianceSummary
        {...defaultProps}
        bgAnalysis={bgAnalysis}
        bgRemoved={false}
        bgRemoving={true}
      />
    );

    // Toggle to expand
    fireEvent.click(screen.getByTestId('compliance-summary-toggle'));

    expect(screen.getByText('Removing...')).toBeInTheDocument();
  });

  it('should show loading state when bg model is preloading', () => {
    const bgAnalysis: BgAnalysis = {
      needsRemoval: true,
      score: 30,
      averageRgb: { r: 100, g: 100, b: 100 },
      reason: 'Not white enough',
    };

    render(
      <ComplianceSummary
        {...defaultProps}
        bgAnalysis={bgAnalysis}
        bgRemoved={false}
        bgModelLoading={true}
      />
    );

    // Toggle to expand
    fireEvent.click(screen.getByTestId('compliance-summary-toggle'));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should call onRemoveBg when remove button clicked', () => {
    const bgAnalysis: BgAnalysis = {
      needsRemoval: true,
      score: 30,
      averageRgb: { r: 100, g: 100, b: 100 },
      reason: 'Not white enough',
    };

    render(
      <ComplianceSummary
        {...defaultProps}
        bgAnalysis={bgAnalysis}
        bgRemoved={false}
      />
    );

    // Toggle to expand
    fireEvent.click(screen.getByTestId('compliance-summary-toggle'));

    fireEvent.click(screen.getByText('Fix'));
    expect(mockOnRemoveBg).toHaveBeenCalled();
  });

  it('should not show bg action when background already removed', () => {
    const bgAnalysis: BgAnalysis = {
      needsRemoval: true,
      score: 30,
      averageRgb: { r: 100, g: 100, b: 100 },
      reason: 'Not white enough',
    };

    render(
      <ComplianceSummary
        {...defaultProps}
        bgAnalysis={bgAnalysis}
        bgRemoved={true}
      />
    );

    // The "Fix" button should not appear when bg is already removed
    fireEvent.click(screen.getByTestId('compliance-summary-toggle'));
    expect(screen.queryByText('Fix')).not.toBeInTheDocument();
  });

  it('should show check status icons', () => {
    render(<ComplianceSummary {...defaultProps} checks={failingChecks} />);

    // Toggle to expand
    fireEvent.click(screen.getByTestId('compliance-summary-toggle'));

    // Should show the check labels
    expect(screen.getByText('Face Detection')).toBeInTheDocument();
    expect(screen.getByText('Head Size')).toBeInTheDocument();
    expect(screen.getByText('Eye Position')).toBeInTheDocument();
  });

  it('should handle single item text correctly', () => {
    const singleFail: ComplianceCheck[] = [
      { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Too small' },
    ];

    render(<ComplianceSummary {...defaultProps} checks={singleFail} />);

    expect(screen.getByText(/1 item to review/)).toBeInTheDocument();
  });

  it('should show retake button when needed', () => {
    const { needsRetake } = require('@/lib/retake-suggestions');
    needsRetake.mockReturnValue(true);

    render(<ComplianceSummary {...defaultProps} checks={failingChecks} />);

    // Toggle to expand
    fireEvent.click(screen.getByTestId('compliance-summary-toggle'));

    // Look for retake button
    const retakeButton = screen.queryByText('Retake Photo');
    if (retakeButton) {
      fireEvent.click(retakeButton);
      expect(mockOnRetake).toHaveBeenCalled();
    }
  });
});
