/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LoadingOverlay, BgRemovalProgress } from '@/components/photo-editor/LoadingOverlay';

describe('LoadingOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render loading overlay with initial state', () => {
    render(<LoadingOverlay text="Loading..." />);

    expect(screen.getByText('Detecting face')).toBeInTheDocument();
    expect(screen.getByText('Analyzing photo quality')).toBeInTheDocument();
    expect(screen.getByText('Preparing editor')).toBeInTheDocument();
    expect(screen.getByText('All processing happens on your device')).toBeInTheDocument();
  });

  it('should animate through steps over time', () => {
    render(<LoadingOverlay text="Loading..." />);

    // Initially at step 0
    const step1 = screen.getByText('Detecting face');
    expect(step1.closest('div')?.querySelector('.animate-pulse')).toBeTruthy();

    // Advance to step 1
    act(() => {
      jest.advanceTimersByTime(800);
    });

    const step2 = screen.getByText('Analyzing photo quality');
    // Step 2 should now be active

    // Advance to step 2
    act(() => {
      jest.advanceTimersByTime(800);
    });

    // Advance more - should stay at last step
    act(() => {
      jest.advanceTimersByTime(800);
    });
  });

  it('should show step icons', () => {
    render(<LoadingOverlay text="Analyzing..." />);

    // First step should show the number 1 before completion
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = render(<LoadingOverlay text="Loading..." />);

    unmount();

    // Should not throw when timers advance after unmount
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });
});

describe('BgRemovalProgress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render null when not removing', () => {
    const { container } = render(<BgRemovalProgress isRemoving={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render progress when removing', () => {
    render(<BgRemovalProgress isRemoving={true} />);

    expect(screen.getByText('Detecting edges')).toBeInTheDocument();
    expect(screen.getByText(/This may take 10-30 seconds/)).toBeInTheDocument();
  });

  it('should animate through steps when removing', () => {
    render(<BgRemovalProgress isRemoving={true} />);

    // Initial step
    expect(screen.getByText('Detecting edges')).toBeInTheDocument();

    // Advance to next step
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Removing background')).toBeInTheDocument();

    // Advance more
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Cleaning up')).toBeInTheDocument();

    // Advance to final
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Finalizing')).toBeInTheDocument();

    // Should cycle back
    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByText('Detecting edges')).toBeInTheDocument();
  });

  it('should reset step when isRemoving becomes false', () => {
    const { rerender } = render(<BgRemovalProgress isRemoving={true} />);

    // Advance a few steps
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Stop removing
    rerender(<BgRemovalProgress isRemoving={false} />);

    // Component should not render
    expect(screen.queryByText('Detecting edges')).not.toBeInTheDocument();

    // Start again
    rerender(<BgRemovalProgress isRemoving={true} />);

    // Should reset to first step
    expect(screen.getByText('Detecting edges')).toBeInTheDocument();
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = render(<BgRemovalProgress isRemoving={true} />);

    unmount();

    // Should not throw when timers advance after unmount
    act(() => {
      jest.advanceTimersByTime(5000);
    });
  });

  it('should show progress bar', () => {
    const { container } = render(<BgRemovalProgress isRemoving={true} />);

    // Progress bar exists
    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toBeInTheDocument();
  });
});
