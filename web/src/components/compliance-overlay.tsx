'use client';

import React from 'react';
import type { FaceData } from '@/lib/face-detection';
import { 
  type PhotoStandard,
  specToPx,
  HEAD_TO_FACE_RATIO,
  CROWN_CLEARANCE_RATIO,
} from '@/lib/photo-standards';

export type ComplianceStatus = 'pass' | 'warn' | 'fail';

export interface MeasurementState {
  headHeightPercent: number;
  eyePositionPercent: number;
  topMarginPercent: number;
  bottomMarginPercent: number;
  complianceStatus: ComplianceStatus;
}

export interface ComplianceOverlayProps {
  faceData: FaceData | null | undefined;
  standard: PhotoStandard;
  canvasWidth: number;
  canvasHeight: number;
  headHeightPercent: number;
  eyePositionPercent: number;
  topMarginPercent?: number;
  bottomMarginPercent?: number;
  complianceStatus: ComplianceStatus;
  visible?: boolean;
  showToggle?: boolean;
  onToggle?: () => void;
}

/**
 * Calculate measurement state from face data and photo standard
 * 
 * The key insight: we need to calculate what percentage of the OUTPUT photo
 * the head occupies, based on the crop and scale applied during rendering.
 */
export function calculateMeasurementState(
  faceData: FaceData,
  standard: PhotoStandard,
  _canvasWidth: number,
  _canvasHeight: number,
  userZoom: number
): MeasurementState {
  const spec = specToPx(standard);
  
  // Calculate head height including hair
  const estimatedHeadHeight = faceData.h * HEAD_TO_FACE_RATIO;
  
  // Target head height in spec (midpoint of range)
  const targetHeadHeight = spec.headTarget;
  
  // Scale factor: how much we scale the source to fit head at target size
  const baseScale = targetHeadHeight / estimatedHeadHeight;
  
  // User zoom adjusts this (zoom in = head appears larger)
  const zoomFactor = userZoom / 100;
  const effectiveScale = baseScale * zoomFactor;
  
  // Actual head height in output pixels
  const headInOutputPx = estimatedHeadHeight * effectiveScale;
  
  // Head height as percentage of output photo height
  const headHeightPercent = (headInOutputPx / spec.h) * 100;
  
  // Calculate eye position from bottom in output
  const eyeY = faceData.leftEye && faceData.rightEye
    ? (faceData.leftEye.y + faceData.rightEye.y) / 2
    : faceData.y + faceData.h * 0.35;
  
  // Eye position should be at spec.eyeFromBottom in output
  // Calculate as percentage of output height from bottom
  const eyePositionPercent = (spec.eyeFromBottom / spec.h) * 100;
  
  // Calculate margins based on head position in output
  // Crown is at face.y minus crown clearance in source, scales to output
  const crownY = faceData.y - faceData.h * CROWN_CLEARANCE_RATIO;
  const chinY = faceData.y + faceData.h;
  
  // The top margin depends on where the crop positions the head
  // For now, estimate based on the target positioning
  // Top margin = (output height - head height - eye position adjustment) / 2
  const topMarginPercent = Math.max(0, (100 - headHeightPercent) / 3); // ~1/3 above
  const bottomMarginPercent = Math.max(0, 100 - headHeightPercent - topMarginPercent);
  
  // Determine compliance status based on head height range
  const minHeadPercent = (spec.headMin / spec.h) * 100;
  const maxHeadPercent = (spec.headMax / spec.h) * 100;
  
  let complianceStatus: ComplianceStatus;
  
  if (headHeightPercent >= minHeadPercent && headHeightPercent <= maxHeadPercent) {
    complianceStatus = 'pass';
  } else if (
    headHeightPercent >= minHeadPercent * 0.9 && headHeightPercent <= maxHeadPercent * 1.1
  ) {
    complianceStatus = 'warn';
  } else {
    complianceStatus = 'fail';
  }
  
  return {
    headHeightPercent: Math.round(headHeightPercent * 10) / 10,
    eyePositionPercent: Math.round(eyePositionPercent * 10) / 10,
    topMarginPercent: Math.round(topMarginPercent * 10) / 10,
    bottomMarginPercent: Math.round(bottomMarginPercent * 10) / 10,
    complianceStatus,
  };
}

/**
 * Visual overlay component that shows compliance measurement guides
 * on the passport photo preview
 */
export function ComplianceOverlay({
  faceData,
  standard,
  canvasWidth,
  canvasHeight,
  headHeightPercent,
  eyePositionPercent,
  topMarginPercent = 0,
  bottomMarginPercent = 0,
  complianceStatus,
  visible = true,
  showToggle = false,
  onToggle,
}: ComplianceOverlayProps) {
  // Don't render if no face data or not visible
  if (!faceData || !visible) {
    return null;
  }

  const statusClass = `compliance-${complianceStatus}`;
  
  // Color mapping for status
  const statusColors = {
    pass: {
      line: 'rgba(34, 197, 94, 0.8)', // green-500
      fill: 'rgba(34, 197, 94, 0.1)',
      text: 'rgb(34, 197, 94)',
    },
    warn: {
      line: 'rgba(234, 179, 8, 0.8)', // yellow-500
      fill: 'rgba(234, 179, 8, 0.1)',
      text: 'rgb(234, 179, 8)',
    },
    fail: {
      line: 'rgba(239, 68, 68, 0.8)', // red-500
      fill: 'rgba(239, 68, 68, 0.1)',
      text: 'rgb(239, 68, 68)',
    },
  };
  
  const colors = statusColors[complianceStatus];

  return (
    <div
      data-testid="compliance-overlay"
      aria-label="Photo compliance measurement overlay"
      className="absolute inset-0 pointer-events-none"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
      }}
    >
      {/* Semi-transparent overlay background */}
      <div className="absolute inset-0" style={{ backgroundColor: colors.fill }} />
      
      {/* Eye Line Indicator - subtle side markers only */}
      <div
        data-testid="eye-line-indicator"
        className={`absolute ${statusClass}`}
        style={{
          bottom: `${eyePositionPercent}%`,
          left: 0,
          right: 0,
          height: '2px',
        }}
      >
        {/* Left marker */}
        <div 
          className="absolute left-0 h-full"
          style={{ width: '12px', backgroundColor: colors.line }}
        />
        {/* Right marker */}
        <div 
          className="absolute right-0 h-full"
          style={{ width: '12px', backgroundColor: colors.line }}
        />
      </div>
      
      {/* Head Height Bracket */}
      <div
        data-testid="head-height-bracket"
        className={`absolute ${statusClass}`}
        style={{
          left: '8px',
          top: `${topMarginPercent}%`,
          bottom: `${bottomMarginPercent}%`,
          width: '16px',
        }}
      >
        {/* Bracket top (crown) */}
        <div
          data-testid="crown-marker"
          className="absolute top-0 left-0 w-full"
          style={{
            height: '2px',
            backgroundColor: colors.line,
          }}
        />
        
        {/* Bracket vertical line */}
        <div
          className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
          style={{
            width: '2px',
            backgroundColor: colors.line,
          }}
        />
        
        {/* Bracket bottom (chin) */}
        <div
          data-testid="chin-marker"
          className="absolute bottom-0 left-0 w-full"
          style={{
            height: '2px',
            backgroundColor: colors.line,
          }}
        />
        
        {/* Head height percentage label */}
        <span
          className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-bold px-1 rounded whitespace-nowrap"
          style={{ color: colors.text, backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          {headHeightPercent}%
        </span>
      </div>
      
      {/* Top Margin Indicator */}
      <div
        data-testid="top-margin-indicator"
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{
          height: `${topMarginPercent}%`,
          width: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        }}
      />
      
      {/* Bottom Margin Indicator */}
      <div
        data-testid="bottom-margin-indicator"
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          height: `${bottomMarginPercent}%`,
          width: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        }}
      />
      
      {/* Toggle Button (if enabled) */}
      {showToggle && (
        <button
          onClick={onToggle}
          className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-auto hover:bg-black/90 transition-colors"
          aria-label="Toggle overlay visibility"
        >
          📐
        </button>
      )}
    </div>
  );
}

export default ComplianceOverlay;
