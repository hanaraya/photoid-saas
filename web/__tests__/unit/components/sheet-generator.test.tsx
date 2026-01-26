/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { SheetGenerator } from '@/components/sheet-generator';
import { type PhotoStandard } from '@/lib/photo-standards';

// Mock renderSheet
jest.mock('@/lib/crop', () => ({
  renderSheet: jest.fn(),
}));

describe('SheetGenerator Component', () => {
  const mockStandard: PhotoStandard = {
    id: 'us',
    name: 'US Passport',
    country: 'United States',
    flag: '🇺🇸',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.25,
    bgColor: '#ffffff',
    description: '2×2 inches, white background',
  };

  let mockPassportCanvas: HTMLCanvasElement;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPassportCanvas = document.createElement('canvas');
    mockPassportCanvas.width = 600;
    mockPassportCanvas.height = 600;
  });

  it('should render canvas element', () => {
    const { container } = render(
      <SheetGenerator
        passportCanvas={mockPassportCanvas}
        standard={mockStandard}
        addWatermark={false}
      />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should call renderSheet with correct parameters', () => {
    const { renderSheet } = require('@/lib/crop');

    render(
      <SheetGenerator
        passportCanvas={mockPassportCanvas}
        standard={mockStandard}
        addWatermark={false}
      />
    );

    expect(renderSheet).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      mockPassportCanvas,
      mockStandard,
      false
    );
  });

  it('should pass watermark flag correctly', () => {
    const { renderSheet } = require('@/lib/crop');

    render(
      <SheetGenerator
        passportCanvas={mockPassportCanvas}
        standard={mockStandard}
        addWatermark={true}
      />
    );

    expect(renderSheet).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      mockPassportCanvas,
      mockStandard,
      true
    );
  });

  it('should have proper styling classes', () => {
    const { container } = render(
      <SheetGenerator
        passportCanvas={mockPassportCanvas}
        standard={mockStandard}
        addWatermark={false}
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('text-center');

    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('mx-auto');
    expect(canvas).toHaveClass('max-w-full');
    expect(canvas).toHaveClass('rounded-lg');
    expect(canvas).toHaveClass('shadow-2xl');
  });

  it('should update when props change', () => {
    const { renderSheet } = require('@/lib/crop');

    const { rerender } = render(
      <SheetGenerator
        passportCanvas={mockPassportCanvas}
        standard={mockStandard}
        addWatermark={false}
      />
    );

    expect(renderSheet).toHaveBeenCalledTimes(1);

    const newStandard = { ...mockStandard, id: 'uk' };

    rerender(
      <SheetGenerator
        passportCanvas={mockPassportCanvas}
        standard={newStandard}
        addWatermark={false}
      />
    );

    expect(renderSheet).toHaveBeenCalledTimes(2);
  });

  it('should render without errors', () => {
    expect(() =>
      render(
        <SheetGenerator
          passportCanvas={mockPassportCanvas}
          standard={mockStandard}
          addWatermark={false}
        />
      )
    ).not.toThrow();
  });
});
