/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ComplianceChecker } from '@/components/compliance-checker';
import { type ComplianceCheck } from '@/lib/compliance';

describe('ComplianceChecker Component', () => {
  const mockPassingChecks: ComplianceCheck[] = [
    {
      id: 'face',
      label: 'Face Detection',
      status: 'pass',
      message: 'Face detected successfully',
    },
    {
      id: 'head_size',
      label: 'Head Size',
      status: 'pass',
      message: 'Head height is within acceptable range',
    },
    {
      id: 'eye_position',
      label: 'Eye Position',
      status: 'pass',
      message: 'Eyes correctly positioned',
    },
    {
      id: 'background',
      label: 'Background',
      status: 'pass',
      message: 'White background applied',
    },
    {
      id: 'resolution',
      label: 'Resolution',
      status: 'pass',
      message: '1000×800px — sufficient quality',
    },
  ];

  it('should render compliance checks', () => {
    render(<ComplianceChecker checks={mockPassingChecks} />);

    expect(screen.getByText('Face Detection')).toBeInTheDocument();
    expect(screen.getByText('Head Size')).toBeInTheDocument();
    expect(screen.getByText('Eye Position')).toBeInTheDocument();
    expect(screen.getByText('Background')).toBeInTheDocument();
    expect(screen.getByText('Resolution')).toBeInTheDocument();
  });

  it('should show all checks passed message when all pass', () => {
    render(<ComplianceChecker checks={mockPassingChecks} />);

    expect(screen.getByText('All Checks Passed')).toBeInTheDocument();
  });

  it('should show compliance status when some checks fail', () => {
    const mixedChecks: ComplianceCheck[] = [
      {
        id: 'face',
        label: 'Face Detection',
        status: 'fail',
        message: 'No face detected — using center crop',
      },
      {
        id: 'head_size',
        label: 'Head Size',
        status: 'pending',
        message: 'Requires face detection',
      },
    ];

    render(<ComplianceChecker checks={mixedChecks} />);

    expect(screen.getByText('Compliance Status')).toBeInTheDocument();
  });

  it('should return null when checks array is empty', () => {
    const { container } = render(<ComplianceChecker checks={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should display pass indicator for passing checks', () => {
    render(<ComplianceChecker checks={mockPassingChecks} />);

    // Should show checkmarks for passing checks
    const passIndicators = screen.getAllByText('✓');
    expect(passIndicators.length).toBe(5);
  });

  it('should display fail indicator for failing checks', () => {
    const failingChecks: ComplianceCheck[] = [
      {
        id: 'face',
        label: 'Face Detection',
        status: 'fail',
        message: 'No face detected — using center crop',
      },
    ];

    render(<ComplianceChecker checks={failingChecks} />);

    expect(screen.getByText('✗')).toBeInTheDocument();
  });

  it('should display warning indicator for warn status', () => {
    const warningChecks: ComplianceCheck[] = [
      {
        id: 'head_size',
        label: 'Head Size',
        status: 'warn',
        message: 'Head appears too small — try zooming in',
      },
    ];

    render(<ComplianceChecker checks={warningChecks} />);

    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('should display pending indicator for pending status', () => {
    const pendingChecks: ComplianceCheck[] = [
      {
        id: 'head_size',
        label: 'Head Size',
        status: 'pending',
        message: 'Requires face detection',
      },
    ];

    render(<ComplianceChecker checks={pendingChecks} />);

    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('should display check messages', () => {
    render(<ComplianceChecker checks={mockPassingChecks} />);

    expect(screen.getByText(/Face detected successfully/)).toBeInTheDocument();
    expect(
      screen.getByText(/Head height is within acceptable range/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Eyes correctly positioned/)).toBeInTheDocument();
    expect(screen.getByText(/White background applied/)).toBeInTheDocument();
    expect(
      screen.getByText(/1000×800px — sufficient quality/)
    ).toBeInTheDocument();
  });

  it('should handle no face detected check', () => {
    const noFaceChecks: ComplianceCheck[] = [
      {
        id: 'face',
        label: 'Face Detection',
        status: 'fail',
        message: 'No face detected — using center crop',
      },
      {
        id: 'head_size',
        label: 'Head Size',
        status: 'pending',
        message: 'Requires face detection',
      },
      {
        id: 'eye_position',
        label: 'Eye Position',
        status: 'pending',
        message: 'Requires face detection',
      },
    ];

    render(<ComplianceChecker checks={noFaceChecks} />);

    expect(screen.getByText(/No face detected/)).toBeInTheDocument();
    expect(screen.getAllByText(/Requires face detection/).length).toBe(2);
  });

  it('should handle background not removed check', () => {
    const bgChecks: ComplianceCheck[] = [
      {
        id: 'background',
        label: 'Background',
        status: 'warn',
        message: 'Click "Remove Background" for white background',
      },
    ];

    render(<ComplianceChecker checks={bgChecks} />);

    expect(screen.getByText(/Remove Background/)).toBeInTheDocument();
  });

  it('should handle low resolution warning', () => {
    const resolutionChecks: ComplianceCheck[] = [
      {
        id: 'resolution',
        label: 'Resolution',
        status: 'warn',
        message: '400×300px — may be low quality',
      },
    ];

    render(<ComplianceChecker checks={resolutionChecks} />);

    expect(screen.getByText(/may be low quality/)).toBeInTheDocument();
  });

  it('should handle low resolution fail', () => {
    const resolutionChecks: ComplianceCheck[] = [
      {
        id: 'resolution',
        label: 'Resolution',
        status: 'fail',
        message: '200×150px — too low resolution',
      },
    ];

    render(<ComplianceChecker checks={resolutionChecks} />);

    expect(screen.getByText(/too low resolution/)).toBeInTheDocument();
  });

  it('should show success icon when all checks pass', () => {
    render(<ComplianceChecker checks={mockPassingChecks} />);

    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('should show warning icon when some checks fail', () => {
    const failingChecks: ComplianceCheck[] = [
      {
        id: 'face',
        label: 'Face Detection',
        status: 'fail',
        message: 'No face detected',
      },
    ];

    render(<ComplianceChecker checks={failingChecks} />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('should update when checks prop changes', () => {
    const { rerender } = render(
      <ComplianceChecker checks={mockPassingChecks} />
    );

    expect(screen.getByText('All Checks Passed')).toBeInTheDocument();

    const newChecks: ComplianceCheck[] = [
      {
        id: 'face',
        label: 'Face Detection',
        status: 'fail',
        message: 'No face detected',
      },
    ];

    rerender(<ComplianceChecker checks={newChecks} />);

    expect(screen.getByText('Compliance Status')).toBeInTheDocument();
  });
});
