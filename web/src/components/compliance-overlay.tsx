'use client';

import React from 'react';
import type { FaceData } from '@/lib/face-detection';
import type { PhotoStandard } from '@/lib/photo-standards';
import { specToPx } from '@/lib/photo-standards';

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
 */
export function calculateMeasurementState(
  faceData: FaceData,
  standard: PhotoStandard,
  canvasWidth: number,
  canvasHeight: number,
  userZoom: number
): MeasurementState {
  const spec = specToPx(standard);
  
  // Calculate head height as percentage of photo
  // Head includes face height + estimated forehead/hair
  const estimatedHeadHeight = faceData.h * 1.35;
  
  // Scale factor based on zoom
  const zoomFactor = userZoom / 100;
  
  // Effective head height in output
  const headHeightPercent = (estimatedHeadHeight / canvasHeight) * 100 * zoomFactor;
  
  // Calculate eye position from bottom
  const eyeY = faceData.leftEye && faceData.rightEye
    ? (faceData.leftEye.y + faceData.rightEye.y) / 2
    : faceData.y + faceData.h * 0.35; // Estimate if no eye data
  
  // Eye position as percentage from bottom
  const eyePositionPercent = ((canvasHeight - eyeY) / canvasHeight) * 100;
  
  // Calculate margins
  // Crown position (top of head including hair)
  const crownY = faceData.y - faceData.h * 0.5;
  const chinY = faceData.y + faceData.h;
  
  const topMarginPercent = (crownY / canvasHeight) * 100;
  const bottomMarginPercent = ((canvasHeight - chinY) / canvasHeight) * 100;
  
  // Determine compliance status based on head height range
  const minHeadPercent = (spec.headMin / spec.h) * 100;
  const maxHeadPercent = (spec.headMax / spec.h) * 100;
  
  let complianceStatus: ComplianceStatus;
  
  if (headHeightPercent >= minHeadPercent && headHeightPercent <= maxHeadPercent) {
    complianceStatus = 'pass';
  } else if (
    headHeightPercent >= minHeadPercent * 0.85 && headHeightPercent <= maxHeadPercent * 1.15
  ) {
    complianceStatus = 'warn';
  } else {
    complianceStatus = 'fail';
  }
  
  return {
    headHeightPercent: Math.round(headHeightPercent * 10) / 10,
    eyePositionPercent: Math.round(eyePositionPercent * 10) / 10,
    topMarginPercent: Math.max(0, Math.round(topMarginPercent * 10) / 10),
    bottomMarginPercent: Math.max(0, Math.round(bottomMarginPercent * 10) / 10),
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
      
      {/* Eye Line Indicator */}
      <div
        data-testid="eye-line-indicator"
        className={`absolute left-0 right-0 ${statusClass}`}
        style={{
          bottom: `${eyePositionPercent}%`,
          height: '2px',
          backgroundColor: colors.line,
        }}
      >
        <span
          className="absolute right-2 -top-5 text-xs font-medium px-1 rounded"
          style={{ color: colors.text, backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          Eye Line
        </span>
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
