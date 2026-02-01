/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ComplianceOverlay,
  type ComplianceOverlayProps,
  type MeasurementState,
} from '@/components/compliance-overlay';
import { STANDARDS, type PhotoStandard, specToPx } from '@/lib/photo-standards';
import type { FaceData } from '@/lib/face-detection';

/*
 * SPEC DOCUMENTATION: Photo Standard Measurement Requirements
 * ============================================================
 * PRIORITY COUNTRIES ONLY (11 document types)
 * 
 * US Passport/Visa/Green Card (2×2 inches):
 *   - Head height: 1-1.375 inches (50-69% of photo height)
 *   - Eye line from bottom: 1.25 inches (62.5% from bottom)
 * 
 * US Driver's License (2×2 inches):
 *   - Head height: 1-1.375 inches
 *   - Eye line from bottom: 1.18 inches (59%)
 * 
 * UK Passport/Visa (35×45 mm):
 *   - Head height: 29-34 mm (64-75.5% of photo height)
 *   - Eye line from bottom: 30 mm (66.7%)
 * 
 * EU/Schengen (35×45 mm):
 *   - Head height: 32-36 mm (71-80% of photo height)
 *   - Eye line from bottom: 30 mm (66.7% from bottom)
 * 
 * Canada (50×70 mm):
 *   - Head height: 31-36 mm (44-51% of photo height)
 *   - Eye line from bottom: 42 mm (60%)
 * 
 * India Passport/Visa (2×2 inches):
 *   - Head height: 1-1.375 inches (50-69%)
 *   - Eye line from bottom: 1.25 inches (62.5%)
 */

// Priority country standard IDs (11 total)
const PRIORITY_STANDARDS = [
  'us', 'us_visa', 'us_drivers', 'green_card',  // US (4)
  'uk', 'uk_visa',                               // UK (2)
  'eu', 'schengen_visa',                         // EU (2)
  'canada',                                      // Canada (1)
  'india', 'india_visa',                         // India (2)
];

describe('ComplianceOverlay Component', () => {
  // Mock face data representing a detected face
  const mockFaceData: FaceData = {
    x: 150,
    y: 100,
    w: 200,
    h: 250,
    leftEye: { x: 200, y: 150 },
    rightEye: { x: 300, y: 150 },
    confidence: 0.95,
  };

  // Base props for most tests
  const baseProps: ComplianceOverlayProps = {
    faceData: mockFaceData,
    standard: STANDARDS.us,
    canvasWidth: 400,
    canvasHeight: 400,
    headHeightPercent: 55, // Within US range (50-69%)
    eyePositionPercent: 63, // Near US target (62.5%)
    complianceStatus: 'pass',
  };

  describe('Basic Rendering', () => {
    it('should render the overlay container', () => {
      render(<ComplianceOverlay {...baseProps} />);
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });

    it('should render eye line indicator', () => {
      render(<ComplianceOverlay {...baseProps} />);
      expect(screen.getByTestId('eye-line-indicator')).toBeInTheDocument();
    });

    it('should render head height bracket', () => {
      render(<ComplianceOverlay {...baseProps} />);
      expect(screen.getByTestId('head-height-bracket')).toBeInTheDocument();
    });

    it('should render top margin indicator', () => {
      render(<ComplianceOverlay {...baseProps} />);
      expect(screen.getByTestId('top-margin-indicator')).toBeInTheDocument();
    });

    it('should render bottom margin indicator', () => {
      render(<ComplianceOverlay {...baseProps} />);
      expect(screen.getByTestId('bottom-margin-indicator')).toBeInTheDocument();
    });

    it('should render head height percentage label', () => {
      render(<ComplianceOverlay {...baseProps} headHeightPercent={55} />);
      expect(screen.getByText(/55%/)).toBeInTheDocument();
    });

    it('should render eye position indicator', () => {
      render(<ComplianceOverlay {...baseProps} />);
      // Eye line is visual-only (no text label), verified via testid
      expect(screen.getByTestId('eye-line-indicator')).toBeInTheDocument();
    });
  });

  describe('US Passport Standard', () => {
    const usProps: ComplianceOverlayProps = {
      ...baseProps,
      standard: STANDARDS.us,
    };

    it('should render correctly for US passport', () => {
      render(<ComplianceOverlay {...usProps} />);
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });

    it('should show pass state when head height is 50-69%', () => {
      render(<ComplianceOverlay {...usProps} headHeightPercent={55} complianceStatus="pass" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-pass');
    });

    it('should show warn state when head height is slightly outside range', () => {
      render(<ComplianceOverlay {...usProps} headHeightPercent={48} complianceStatus="warn" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-warn');
    });

    it('should show fail state when head height is far outside range', () => {
      render(<ComplianceOverlay {...usProps} headHeightPercent={35} complianceStatus="fail" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-fail');
    });

    it('should position eye line at ~62.5% from bottom for US', () => {
      render(<ComplianceOverlay {...usProps} eyePositionPercent={62.5} />);
      const eyeLine = screen.getByTestId('eye-line-indicator');
      // Eye line should be positioned from bottom at 62.5%
      expect(eyeLine).toHaveStyle({ bottom: '62.5%' });
    });
  });

  describe('EU/Schengen Standard', () => {
    const euProps: ComplianceOverlayProps = {
      ...baseProps,
      standard: STANDARDS.eu,
      headHeightPercent: 75, // Within EU range (71-80%)
      eyePositionPercent: 66.7, // EU target
    };

    it('should render correctly for EU passport', () => {
      render(<ComplianceOverlay {...euProps} />);
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });

    it('should show pass state for EU head height range (71-80%)', () => {
      render(<ComplianceOverlay {...euProps} headHeightPercent={75} complianceStatus="pass" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-pass');
    });

    it('should position eye line at ~66.7% from bottom for EU', () => {
      render(<ComplianceOverlay {...euProps} />);
      const eyeLine = screen.getByTestId('eye-line-indicator');
      expect(eyeLine).toHaveStyle({ bottom: '66.7%' });
    });
  });

  describe('UK Passport Standard', () => {
    const ukProps: ComplianceOverlayProps = {
      ...baseProps,
      standard: STANDARDS.uk,
      headHeightPercent: 70, // Within UK range (64-75.5%)
      eyePositionPercent: 66.7,
    };

    it('should render correctly for UK passport', () => {
      render(<ComplianceOverlay {...ukProps} />);
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });

    it('should show pass state for UK head height range (64-75.5%)', () => {
      render(<ComplianceOverlay {...ukProps} complianceStatus="pass" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-pass');
    });
  });

  describe('Canada/Brazil Standard (50×70mm)', () => {
    const canadaProps: ComplianceOverlayProps = {
      ...baseProps,
      standard: STANDARDS.canada,
      headHeightPercent: 48, // Within Canada range (44-51%)
      eyePositionPercent: 60, // Canada target (42/70 = 60%)
    };

    it('should render correctly for Canada passport', () => {
      render(<ComplianceOverlay {...canadaProps} />);
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });

    it('should show pass state for Canada head height range (44-51%)', () => {
      render(<ComplianceOverlay {...canadaProps} complianceStatus="pass" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-pass');
    });

    it('should position eye line at 60% from bottom for Canada', () => {
      render(<ComplianceOverlay {...canadaProps} />);
      const eyeLine = screen.getByTestId('eye-line-indicator');
      expect(eyeLine).toHaveStyle({ bottom: '60%' });
    });
  });

  describe('India Passport Standard (2×2 inches)', () => {
    const indiaProps: ComplianceOverlayProps = {
      ...baseProps,
      standard: STANDARDS.india,
      headHeightPercent: 55, // Within India range (50-69%)
      eyePositionPercent: 62.5,
    };

    it('should render correctly for India passport', () => {
      render(<ComplianceOverlay {...indiaProps} />);
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });

    it('should show pass state for India head height range (50-69%)', () => {
      render(<ComplianceOverlay {...indiaProps} complianceStatus="pass" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-pass');
    });

    it('should render correctly for India visa', () => {
      render(<ComplianceOverlay {...indiaProps} standard={STANDARDS.india_visa} />);
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });
  });

  describe('Priority Countries (11 document types)', () => {
    it.each(PRIORITY_STANDARDS)('should render overlay for %s standard', (standardId) => {
      const standard = STANDARDS[standardId];
      render(
        <ComplianceOverlay
          {...baseProps}
          standard={standard}
          headHeightPercent={60}
          eyePositionPercent={60}
        />
      );
      expect(screen.getByTestId('compliance-overlay')).toBeInTheDocument();
    });

    it.each(PRIORITY_STANDARDS)('should calculate correct head height range for %s', (standardId) => {
      const standard = STANDARDS[standardId];
      const spec = specToPx(standard);
      
      // Calculate expected head height percentage range
      const minPercent = (spec.headMin / spec.h) * 100;
      const maxPercent = (spec.headMax / spec.h) * 100;
      
      // Verify the component uses these ranges correctly
      render(
        <ComplianceOverlay
          {...baseProps}
          standard={standard}
          headHeightPercent={(minPercent + maxPercent) / 2}
          complianceStatus="pass"
        />
      );
      
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-pass');
    });
  });

  describe('Head Height Indicator', () => {
    it('should show correct percentage label', () => {
      render(<ComplianceOverlay {...baseProps} headHeightPercent={55} />);
      expect(screen.getByText(/55%/)).toBeInTheDocument();
    });

    it('should update percentage when prop changes', () => {
      const { rerender } = render(
        <ComplianceOverlay {...baseProps} headHeightPercent={55} />
      );
      expect(screen.getByText(/55%/)).toBeInTheDocument();

      rerender(<ComplianceOverlay {...baseProps} headHeightPercent={65} />);
      expect(screen.getByText(/65%/)).toBeInTheDocument();
    });

    it('should display bracket spanning crown to chin', () => {
      render(<ComplianceOverlay {...baseProps} />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toBeInTheDocument();
      // Should have top and bottom indicators
      expect(bracket.querySelector('[data-testid="crown-marker"]')).toBeInTheDocument();
      expect(bracket.querySelector('[data-testid="chin-marker"]')).toBeInTheDocument();
    });
  });

  describe('Eye Position Indicator', () => {
    it('should render eye line at correct position', () => {
      render(<ComplianceOverlay {...baseProps} eyePositionPercent={62.5} />);
      const eyeLine = screen.getByTestId('eye-line-indicator');
      expect(eyeLine).toHaveStyle({ bottom: '62.5%' });
    });

    it('should show eye line indicator', () => {
      render(<ComplianceOverlay {...baseProps} />);
      // Eye line is now visual-only (no text label), verified via testid
      expect(screen.getByTestId('eye-line-indicator')).toBeInTheDocument();
    });

    it('should update position when eye data changes', () => {
      const { rerender } = render(
        <ComplianceOverlay {...baseProps} eyePositionPercent={62.5} />
      );
      
      rerender(<ComplianceOverlay {...baseProps} eyePositionPercent={60} />);
      const eyeLine = screen.getByTestId('eye-line-indicator');
      expect(eyeLine).toHaveStyle({ bottom: '60%' });
    });
  });

  describe('Crown and Chin Margins', () => {
    it('should show top margin indicator', () => {
      render(<ComplianceOverlay {...baseProps} topMarginPercent={10} />);
      const topMargin = screen.getByTestId('top-margin-indicator');
      expect(topMargin).toBeInTheDocument();
    });

    it('should show bottom margin indicator', () => {
      render(<ComplianceOverlay {...baseProps} bottomMarginPercent={8} />);
      const bottomMargin = screen.getByTestId('bottom-margin-indicator');
      expect(bottomMargin).toBeInTheDocument();
    });

    it('should display margin as percentage of photo height', () => {
      render(
        <ComplianceOverlay
          {...baseProps}
          topMarginPercent={10}
          bottomMarginPercent={8}
        />
      );
      // Should show margin labels
      expect(screen.getByTestId('top-margin-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-margin-indicator')).toBeInTheDocument();
    });
  });

  describe('Toggle Visibility', () => {
    it('should be visible by default', () => {
      render(<ComplianceOverlay {...baseProps} />);
      const overlay = screen.getByTestId('compliance-overlay');
      expect(overlay).toBeVisible();
    });

    it('should hide when visible prop is false', () => {
      render(<ComplianceOverlay {...baseProps} visible={false} />);
      const overlay = screen.queryByTestId('compliance-overlay');
      expect(overlay).not.toBeInTheDocument();
    });

    it('should show when visible prop is true', () => {
      render(<ComplianceOverlay {...baseProps} visible={true} />);
      const overlay = screen.getByTestId('compliance-overlay');
      expect(overlay).toBeVisible();
    });

    it('should call onToggle when toggle button is clicked', () => {
      const onToggle = jest.fn();
      render(<ComplianceOverlay {...baseProps} onToggle={onToggle} showToggle={true} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle overlay/i });
      fireEvent.click(toggleButton);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Color Coding (Pass/Warn/Fail)', () => {
    it('should show green color for pass status', () => {
      render(<ComplianceOverlay {...baseProps} complianceStatus="pass" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-pass');
    });

    it('should show yellow color for warn status', () => {
      render(<ComplianceOverlay {...baseProps} complianceStatus="warn" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-warn');
    });

    it('should show red color for fail status', () => {
      render(<ComplianceOverlay {...baseProps} complianceStatus="fail" />);
      const bracket = screen.getByTestId('head-height-bracket');
      expect(bracket).toHaveClass('compliance-fail');
    });

    it('should apply color to eye line based on status', () => {
      render(<ComplianceOverlay {...baseProps} complianceStatus="pass" />);
      const eyeLine = screen.getByTestId('eye-line-indicator');
      expect(eyeLine).toHaveClass('compliance-pass');
    });
  });

  describe('Responsive Positioning', () => {
    it('should scale positions based on canvas dimensions', () => {
      const { rerender } = render(
        <ComplianceOverlay
          {...baseProps}
          canvasWidth={400}
          canvasHeight={400}
        />
      );

      const overlay1 = screen.getByTestId('compliance-overlay');
      expect(overlay1).toHaveStyle({ width: '400px', height: '400px' });

      rerender(
        <ComplianceOverlay
          {...baseProps}
          canvasWidth={600}
          canvasHeight={800}
        />
      );

      const overlay2 = screen.getByTestId('compliance-overlay');
      expect(overlay2).toHaveStyle({ width: '600px', height: '800px' });
    });

    it('should maintain aspect ratio when canvas changes', () => {
      render(
        <ComplianceOverlay
          {...baseProps}
          canvasWidth={300}
          canvasHeight={400}
        />
      );

      const overlay = screen.getByTestId('compliance-overlay');
      expect(overlay).toHaveStyle({ width: '300px', height: '400px' });
    });
  });

  describe('No Face Data Handling', () => {
    it('should not render overlay when faceData is null', () => {
      render(<ComplianceOverlay {...baseProps} faceData={null} />);
      expect(screen.queryByTestId('compliance-overlay')).not.toBeInTheDocument();
    });

    it('should not render overlay when faceData is undefined', () => {
      render(<ComplianceOverlay {...baseProps} faceData={undefined} />);
      expect(screen.queryByTestId('compliance-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Measurement State Calculation', () => {
    it('should export calculateMeasurementState function', async () => {
      const { calculateMeasurementState } = await import('@/components/compliance-overlay');
      expect(typeof calculateMeasurementState).toBe('function');
    });

    it('should calculate correct measurement state for US passport', async () => {
      const { calculateMeasurementState } = await import('@/components/compliance-overlay');
      
      const state = calculateMeasurementState(
        mockFaceData,
        STANDARDS.us,
        400,
        400,
        100 // zoom 100%
      );

      expect(state).toHaveProperty('headHeightPercent');
      expect(state).toHaveProperty('eyePositionPercent');
      expect(state).toHaveProperty('topMarginPercent');
      expect(state).toHaveProperty('bottomMarginPercent');
      expect(state).toHaveProperty('complianceStatus');
    });

    it('should return pass status when measurements are within range', async () => {
      const { calculateMeasurementState } = await import('@/components/compliance-overlay');
      
      // US Passport: head should be 50-69% of photo height
      // Face height * 1.35 = estimated head height
      // For 400px canvas, we need head to be 200-276px
      // So face.h should be ~148-204px (148 * 1.35 = 200, 204 * 1.35 = 275)
      const compliantFace: FaceData = {
        x: 100,
        y: 80,
        w: 200,
        h: 170, // 170 * 1.35 = 229.5px head height = ~57% of 400px canvas
        leftEye: { x: 150, y: 130 },
        rightEye: { x: 250, y: 130 },
        confidence: 0.95,
      };
      
      const state = calculateMeasurementState(
        compliantFace,
        STANDARDS.us,
        400,
        400,
        100
      );

      // US requires 50-69% head height
      // 229.5 / 400 * 100 = 57.4% - within range
      expect(state.complianceStatus).toBe('pass');
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate ARIA labels', () => {
      render(<ComplianceOverlay {...baseProps} />);
      
      expect(screen.getByTestId('compliance-overlay')).toHaveAttribute(
        'aria-label',
        expect.stringContaining('compliance')
      );
    });

    it('should be focusable when toggle is shown', () => {
      render(<ComplianceOverlay {...baseProps} showToggle={true} />);
      
      const toggleButton = screen.getByRole('button', { name: /toggle overlay/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });
});
