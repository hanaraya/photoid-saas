/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

interface MockComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const MockComponent = ({ children, ...props }: MockComponentProps) => (
  <div data-testid="mock-component-10" {...props}>
    {children}
  </div>
);

describe('UI Component 10', () => {
  it('should render component', () => {
    render(<MockComponent>Test Content</MockComponent>);
    expect(screen.getByTestId('mock-component-10')).toBeInTheDocument();
  });

  it('should handle className prop', () => {
    render(<MockComponent className="test-class">Content</MockComponent>);
    expect(screen.getByTestId('mock-component-10')).toHaveClass('test-class');
  });

  it('should render children', () => {
    render(<MockComponent>Child Content</MockComponent>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<MockComponent onClick={handleClick}>Clickable</MockComponent>);
    screen.getByTestId('mock-component-10').click();
    expect(handleClick).toHaveBeenCalled();
  });

  it('should support custom data attributes', () => {
    render(<MockComponent data-custom="value">Test</MockComponent>);
    expect(screen.getByTestId('mock-component-10')).toHaveAttribute(
      'data-custom',
      'value'
    );
  });

  it('should be accessible with role', () => {
    render(
      <MockComponent role="button" aria-label="Component">
        Test
      </MockComponent>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByLabelText('Component')).toBeInTheDocument();
  });

  it('should render without errors', () => {
    expect(() => render(<MockComponent>Test</MockComponent>)).not.toThrow();
  });

  it('should have proper visibility', () => {
    render(<MockComponent>Default State</MockComponent>);
    expect(screen.getByTestId('mock-component-10')).toBeVisible();
  });

  it('should support id attribute', () => {
    render(<MockComponent id="test-id">Test</MockComponent>);
    expect(screen.getByTestId('mock-component-10')).toHaveAttribute(
      'id',
      'test-id'
    );
  });

  it('should support style prop', () => {
    render(<MockComponent style={{ color: 'red' }}>Styled</MockComponent>);
    expect(screen.getByTestId('mock-component-10')).toHaveStyle({
      color: 'red',
    });
  });
});
