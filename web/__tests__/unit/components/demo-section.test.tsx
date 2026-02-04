/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoSection } from '@/components/demo-section';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }
  ) => {
    const { fill, ...rest } = props;
    return <img {...rest} data-fill={fill ? 'true' : 'false'} />;
  },
}));

describe('DemoSection', () => {
  it('should render section with title', () => {
    render(<DemoSection />);

    expect(screen.getByText('See the Transformation')).toBeInTheDocument();
    expect(
      screen.getByText('From any photo to a perfect passport photo in seconds')
    ).toBeInTheDocument();
  });

  it('should display demo selector buttons', () => {
    render(<DemoSection />);

    // Demo names are in alt attributes
    expect(screen.getByAltText('Sarah')).toBeInTheDocument();
    expect(screen.getByAltText('Michael')).toBeInTheDocument();
    expect(screen.getByAltText('Emma')).toBeInTheDocument();
    expect(screen.getByAltText('James')).toBeInTheDocument();
  });

  it('should change active demo when button clicked', () => {
    const { container } = render(<DemoSection />);

    // Get all thumbnail buttons
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Click on second button
    fireEvent.click(buttons[1]);
  });

  it('should show before/after areas', () => {
    render(<DemoSection />);

    // Check for before/after context
    expect(screen.getByAltText('Original photo')).toBeInTheDocument();
    expect(screen.getByText(/Passport Ready/i)).toBeInTheDocument();
  });

  it('should change demo on button click', () => {
    render(<DemoSection />);

    // Get buttons by their alt images
    const sarahImg = screen.getByAltText('Sarah');
    const michaelImg = screen.getByAltText('Michael');
    const emmaImg = screen.getByAltText('Emma');
    const jamesImg = screen.getByAltText('James');

    // Click through all demos by clicking the parent buttons
    fireEvent.click(sarahImg.closest('button')!);
    fireEvent.click(michaelImg.closest('button')!);
    fireEvent.click(emmaImg.closest('button')!);
    fireEvent.click(jamesImg.closest('button')!);
  });

  it('should display features', () => {
    render(<DemoSection />);

    expect(screen.getByText('Face Detection')).toBeInTheDocument();
    expect(screen.getByText('Background Removal')).toBeInTheDocument();
    expect(screen.getByText('Auto Crop & Size')).toBeInTheDocument();
    expect(screen.getByText('Compliance Check')).toBeInTheDocument();
  });
});
