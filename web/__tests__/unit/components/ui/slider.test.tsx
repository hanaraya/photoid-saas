/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Slider } from '@/components/ui/slider';

describe('Slider Component', () => {
  it('should render slider', () => {
    render(<Slider defaultValue={[50]} max={100} step={1} />);

    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
  });

  it('should have data-slot attribute', () => {
    const { container } = render(<Slider defaultValue={[50]} />);

    const sliderRoot = container.querySelector('[data-slot="slider"]');
    expect(sliderRoot).toBeInTheDocument();
  });

  it('should render slider track', () => {
    const { container } = render(<Slider defaultValue={[50]} />);

    const track = container.querySelector('[data-slot="slider-track"]');
    expect(track).toBeInTheDocument();
  });

  it('should render slider range', () => {
    const { container } = render(<Slider defaultValue={[50]} />);

    const range = container.querySelector('[data-slot="slider-range"]');
    expect(range).toBeInTheDocument();
  });

  it('should render slider thumb', () => {
    const { container } = render(<Slider defaultValue={[50]} />);

    const thumb = container.querySelector('[data-slot="slider-thumb"]');
    expect(thumb).toBeInTheDocument();
  });

  it('should support range sliders with two thumbs', () => {
    render(<Slider defaultValue={[25, 75]} max={100} />);

    const sliders = screen.getAllByRole('slider');
    expect(sliders).toHaveLength(2);
  });

  it('should respect min and max values', () => {
    render(<Slider defaultValue={[50]} min={10} max={90} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '10');
    expect(slider).toHaveAttribute('aria-valuemax', '90');
  });

  it('should handle disabled state', () => {
    const { container } = render(<Slider defaultValue={[50]} disabled />);

    const sliderRoot = container.querySelector('[data-slot="slider"]');
    expect(sliderRoot).toHaveAttribute('data-disabled');
  });

  it('should have proper ARIA valuenow', () => {
    render(<Slider defaultValue={[30]} max={100} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '30');
  });

  it('should support custom className', () => {
    const { container } = render(
      <Slider defaultValue={[50]} className="custom-slider" />
    );

    const sliderRoot = container.querySelector('[data-slot="slider"]');
    expect(sliderRoot).toHaveClass('custom-slider');
  });

  it('should render without errors', () => {
    expect(() => render(<Slider defaultValue={[50]} />)).not.toThrow();
  });

  it('should have accessible structure', () => {
    render(<Slider defaultValue={[50]} />);

    // Slider should have aria-valuenow, aria-valuemin, aria-valuemax
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow');
    expect(slider).toHaveAttribute('aria-valuemin');
    expect(slider).toHaveAttribute('aria-valuemax');
  });

  it('should work with controlled value', () => {
    const { rerender } = render(<Slider value={[25]} max={100} />);

    let slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '25');

    rerender(<Slider value={[75]} max={100} />);

    slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '75');
  });
});
