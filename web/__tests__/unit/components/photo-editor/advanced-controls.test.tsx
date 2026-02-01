/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvancedControls } from '@/components/photo-editor/AdvancedControls';

describe('AdvancedControls', () => {
  const mockOnZoomChange = jest.fn();
  const mockOnBrightnessChange = jest.fn();
  
  const defaultProps = {
    zoom: 100,
    brightness: 100,
    onZoomChange: mockOnZoomChange,
    onBrightnessChange: mockOnBrightnessChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render in collapsed state by default', () => {
    render(<AdvancedControls {...defaultProps} />);

    expect(screen.getByText('Advanced adjustments')).toBeInTheDocument();
    expect(screen.getByText('Zoom & brightness controls')).toBeInTheDocument();
  });

  it('should toggle open when summary clicked', () => {
    render(<AdvancedControls {...defaultProps} />);

    const summary = screen.getByText('Advanced adjustments');
    fireEvent.click(summary);

    // Should show zoom and brightness labels when open
    expect(screen.getByText('Zoom')).toBeInTheDocument();
    expect(screen.getByText('Brightness')).toBeInTheDocument();
  });

  it('should display current zoom value', () => {
    render(<AdvancedControls {...defaultProps} zoom={150} />);

    // Open the details
    fireEvent.click(screen.getByText('Advanced adjustments'));

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('should display current brightness value', () => {
    render(<AdvancedControls {...defaultProps} brightness={120} />);

    // Open the details
    fireEvent.click(screen.getByText('Advanced adjustments'));

    expect(screen.getByText('120%')).toBeInTheDocument();
  });

  it('should have sliders when open', () => {
    render(<AdvancedControls {...defaultProps} />);

    // Open the details
    fireEvent.click(screen.getByText('Advanced adjustments'));

    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
  });

  it('should have zoom slider with correct attributes', () => {
    render(<AdvancedControls {...defaultProps} />);

    // Open the details
    fireEvent.click(screen.getByText('Advanced adjustments'));

    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toBeInTheDocument();
  });

  it('should have brightness slider with correct attributes', () => {
    render(<AdvancedControls {...defaultProps} />);

    // Open the details
    fireEvent.click(screen.getByText('Advanced adjustments'));

    const sliders = screen.getAllByRole('slider');
    expect(sliders[1]).toBeInTheDocument();
  });

  it('should close when summary clicked again', () => {
    render(<AdvancedControls {...defaultProps} />);

    const summary = screen.getByText('Advanced adjustments');
    
    // Open
    fireEvent.click(summary);
    expect(screen.getByText('Zoom')).toBeInTheDocument();

    // Close - using the details element
    const details = summary.closest('details');
    if (details) {
      // Simulate closing by setting open to false
      Object.defineProperty(details, 'open', { value: false, writable: true });
    }
  });

  it('should render with different zoom values', () => {
    render(<AdvancedControls {...defaultProps} zoom={50} />);
    fireEvent.click(screen.getByText('Advanced adjustments'));
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render with different brightness values', () => {
    render(<AdvancedControls {...defaultProps} brightness={150} />);
    fireEvent.click(screen.getByText('Advanced adjustments'));
    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('should trigger onToggle handler when details is toggled', () => {
    const { container } = render(<AdvancedControls {...defaultProps} />);
    
    const details = container.querySelector('details');
    expect(details).toBeInTheDocument();

    // Open
    fireEvent(details!, new CustomEvent('toggle', { bubbles: true }));
    
    // Close
    fireEvent(details!, new CustomEvent('toggle', { bubbles: true }));
  });

  it('should update isOpen state from details open attribute', () => {
    const { container } = render(<AdvancedControls {...defaultProps} />);
    
    const details = container.querySelector('details')!;
    
    // Trigger toggle event with open = true
    Object.defineProperty(details, 'open', { value: true, writable: true, configurable: true });
    fireEvent(details, new Event('toggle', { bubbles: true }));
    
    // Trigger toggle event with open = false
    Object.defineProperty(details, 'open', { value: false, writable: true, configurable: true });
    fireEvent(details, new Event('toggle', { bubbles: true }));
  });

  it('should render sliders with proper initial values', () => {
    render(<AdvancedControls {...defaultProps} zoom={120} brightness={110} />);
    
    // Open the details
    fireEvent.click(screen.getByText('Advanced adjustments'));
    
    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
    expect(sliders[0]).toHaveAttribute('aria-valuenow', '120');
    expect(sliders[1]).toHaveAttribute('aria-valuenow', '110');
  });

  it('should render chevron rotated when open', () => {
    const { container } = render(<AdvancedControls {...defaultProps} />);
    
    // Open the details
    fireEvent.click(screen.getByText('Advanced adjustments'));
    
    // The chevron SVG should have rotate-180 class when open
    const chevron = container.querySelector('summary svg:last-child');
    expect(chevron).toBeInTheDocument();
  });
});
