/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Toaster } from '@/components/ui/sonner';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  Toaster: ({ icons, style, className, ...props }: any) => (
    <div
      data-testid="sonner-toaster"
      className={className}
      style={style}
      {...props}
    >
      {icons && <span data-testid="has-icons">Has Icons</span>}
    </div>
  ),
}));

describe('Toaster Component', () => {
  it('should render Toaster component', () => {
    const { getByTestId } = render(<Toaster />);
    expect(getByTestId('sonner-toaster')).toBeInTheDocument();
  });

  it('should have correct className', () => {
    const { getByTestId } = render(<Toaster />);
    expect(getByTestId('sonner-toaster')).toHaveClass('toaster');
    expect(getByTestId('sonner-toaster')).toHaveClass('group');
  });

  it('should pass custom icons', () => {
    const { getByTestId } = render(<Toaster />);
    expect(getByTestId('has-icons')).toBeInTheDocument();
  });

  it('should apply custom styles', () => {
    const { getByTestId } = render(<Toaster />);
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toHaveStyle({
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    });
  });

  it('should pass through additional props', () => {
    const { getByTestId } = render(<Toaster position="top-center" />);
    expect(getByTestId('sonner-toaster')).toHaveAttribute(
      'position',
      'top-center'
    );
  });

  it('should render without errors', () => {
    expect(() => render(<Toaster />)).not.toThrow();
  });
});
