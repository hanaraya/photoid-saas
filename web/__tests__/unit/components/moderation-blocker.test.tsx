/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ModerationBlocker,
  ModerationWarning,
} from '@/components/moderation-blocker';
import { type ModerationResult } from '@/lib/content-moderation';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <span data-testid="alert-triangle" />,
  XCircle: () => <span data-testid="x-circle" />,
  AlertCircle: () => <span data-testid="alert-circle" />,
}));

describe('ModerationBlocker', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render null when no blocking violations', () => {
    const result: ModerationResult = {
      allowed: true,
      severity: 'pass',
      violations: [],
      summary: 'Content check passed',
    };

    const { container } = render(
      <ModerationBlocker result={result} onRetry={mockOnRetry} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render null when only warning violations', () => {
    const result: ModerationResult = {
      allowed: true,
      severity: 'warn',
      violations: [
        {
          code: 'test_warning',
          label: 'Test Warning',
          message: 'This is a warning',
          severity: 'warn',
        },
      ],
      summary: 'Has warnings',
    };

    const { container } = render(
      <ModerationBlocker result={result} onRetry={mockOnRetry} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render blocker when blocking violations exist', () => {
    const result: ModerationResult = {
      allowed: false,
      severity: 'block',
      violations: [
        {
          code: 'inappropriate_content',
          label: 'Inappropriate Content',
          message: 'Photo contains inappropriate content',
          severity: 'block',
        },
      ],
      summary: 'Content blocked',
    };

    render(<ModerationBlocker result={result} onRetry={mockOnRetry} />);

    expect(screen.getByText('Photo Cannot Be Used')).toBeInTheDocument();
    expect(screen.getByText('Inappropriate Content')).toBeInTheDocument();
    expect(
      screen.getByText('Photo contains inappropriate content')
    ).toBeInTheDocument();
    expect(screen.getByText('Try Another Photo')).toBeInTheDocument();
  });

  it('should render multiple blocking violations', () => {
    const result: ModerationResult = {
      allowed: false,
      severity: 'block',
      violations: [
        {
          code: 'issue1',
          label: 'Issue 1',
          message: 'First issue',
          severity: 'block',
        },
        {
          code: 'issue2',
          label: 'Issue 2',
          message: 'Second issue',
          severity: 'block',
          details: 'Additional details here',
        },
      ],
      summary: 'Multiple issues',
    };

    render(<ModerationBlocker result={result} onRetry={mockOnRetry} />);

    expect(screen.getByText('Issue 1')).toBeInTheDocument();
    expect(screen.getByText('First issue')).toBeInTheDocument();
    expect(screen.getByText('Issue 2')).toBeInTheDocument();
    expect(screen.getByText('Second issue')).toBeInTheDocument();
    expect(screen.getByText('Additional details here')).toBeInTheDocument();
  });

  it('should call onRetry when button clicked', () => {
    const result: ModerationResult = {
      allowed: false,
      severity: 'block',
      violations: [
        {
          code: 'test',
          label: 'Test',
          message: 'Test message',
          severity: 'block',
        },
      ],
      summary: 'Blocked',
    };

    render(<ModerationBlocker result={result} onRetry={mockOnRetry} />);

    fireEvent.click(screen.getByText('Try Another Photo'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ModerationWarning', () => {
  it('should render null when no warnings', () => {
    const result: ModerationResult = {
      allowed: true,
      severity: 'pass',
      violations: [],
      summary: 'All clear',
    };

    const { container } = render(<ModerationWarning result={result} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render null when only blocking violations', () => {
    const result: ModerationResult = {
      allowed: false,
      severity: 'block',
      violations: [
        {
          code: 'block',
          label: 'Blocked',
          message: 'Blocked content',
          severity: 'block',
        },
      ],
      summary: 'Blocked',
    };

    const { container } = render(<ModerationWarning result={result} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render warnings when present', () => {
    const result: ModerationResult = {
      allowed: true,
      severity: 'warn',
      violations: [
        {
          code: 'warning1',
          label: 'Warning 1',
          message: 'First warning message',
          severity: 'warn',
        },
        {
          code: 'warning2',
          label: 'Warning 2',
          message: 'Second warning message',
          severity: 'warn',
        },
      ],
      summary: 'Has warnings',
    };

    render(<ModerationWarning result={result} />);

    expect(screen.getByText('Advisory Warnings')).toBeInTheDocument();
    expect(screen.getByText('• First warning message')).toBeInTheDocument();
    expect(screen.getByText('• Second warning message')).toBeInTheDocument();
    expect(screen.getByText(/You can proceed/)).toBeInTheDocument();
  });

  it('should filter out blocking violations and only show warnings', () => {
    const result: ModerationResult = {
      allowed: true,
      severity: 'warn',
      violations: [
        {
          code: 'block',
          label: 'Block',
          message: 'Should not show',
          severity: 'block',
        },
        {
          code: 'warn',
          label: 'Warning',
          message: 'Should show',
          severity: 'warn',
        },
      ],
      summary: 'Mixed',
    };

    render(<ModerationWarning result={result} />);

    expect(screen.getByText('• Should show')).toBeInTheDocument();
    expect(screen.queryByText('• Should not show')).not.toBeInTheDocument();
  });
});
