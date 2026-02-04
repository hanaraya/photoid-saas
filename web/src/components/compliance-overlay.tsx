'use client';

import React from 'react';
import type { FaceData } from '@/lib/face-detection';
import type { CropParams } from '@/lib/crop';
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
 * Calculate measurement state from face data, crop params, and photo standard
 *
 * Uses ACTUAL crop params to determine where the head appears in the output,
 * ensuring the overlay matches the rendered preview exactly.
 */
export function calculateMeasurementState(
  faceData: FaceData,
  standard: PhotoStandard,
  _canvasWidth: number,
  _canvasHeight: number,
  userZoom: number,
  cropParams?: CropParams
): MeasurementState {
  const spec = specToPx(standard);

  // If we have actual crop params, calculate EXACTLY where the head appears
  if (cropParams) {
    // Scale factor from source to output
    const scale = spec.w / cropParams.cropW;

    // Calculate crown and chin positions in output
    const crownYSource = faceData.y - faceData.h * CROWN_CLEARANCE_RATIO;
    const chinYSource = faceData.y + faceData.h;

    // Apply user zoom adjustment (zoom > 100 = head appears larger)
    const zoomFactor = userZoom / 100;
    const zoomOffset = (spec.h * (1 - 1 / zoomFactor)) / 2; // How much we've zoomed in

    // Position in output (accounting for crop and zoom)
    const crownYOutput =
      (crownYSource - cropParams.cropY) * scale * zoomFactor + zoomOffset;
    const chinYOutput =
      (chinYSource - cropParams.cropY) * scale * zoomFactor + zoomOffset;

    // Head height in output
    const headHeightOutput = chinYOutput - crownYOutput;
    const headHeightPercent = (headHeightOutput / spec.h) * 100;

    // Eye position (actual, from face data)
    const eyeYSource =
      faceData.leftEye && faceData.rightEye
        ? (faceData.leftEye.y + faceData.rightEye.y) / 2
        : faceData.y + faceData.h * 0.35;
    const eyeYOutput =
      (eyeYSource - cropParams.cropY) * scale * zoomFactor + zoomOffset;
    const eyePositionPercent = ((spec.h - eyeYOutput) / spec.h) * 100; // From bottom

    // Convert to margins (as percentages from top/bottom)
    const topMarginPercent = Math.max(
      0,
      Math.min(100, (crownYOutput / spec.h) * 100)
    );
    const bottomMarginPercent = Math.max(
      0,
      Math.min(100, ((spec.h - chinYOutput) / spec.h) * 100)
    );

    // Compliance status
    const minHeadPercent = (spec.headMin / spec.h) * 100;
    const maxHeadPercent = (spec.headMax / spec.h) * 100;

    let complianceStatus: ComplianceStatus;
    if (
      headHeightPercent >= minHeadPercent &&
      headHeightPercent <= maxHeadPercent
    ) {
      complianceStatus = 'pass';
    } else if (
      headHeightPercent >= minHeadPercent * 0.9 &&
      headHeightPercent <= maxHeadPercent * 1.1
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

  // Fallback: estimate from face data without crop params (less accurate)
  const estimatedHeadHeight = faceData.h * HEAD_TO_FACE_RATIO;
  const targetHeadHeight = spec.headTarget;
  const baseScale = targetHeadHeight / estimatedHeadHeight;
  const zoomFactor = userZoom / 100;
  const effectiveScale = baseScale * zoomFactor;
  const headInOutputPx = estimatedHeadHeight * effectiveScale;
  const headHeightPercent = (headInOutputPx / spec.h) * 100;
  const eyePositionPercent = (spec.eyeFromBottom / spec.h) * 100;

  // Use anthropometric ratios for bracket position
  const EYE_FROM_CROWN_RATIO = 0.4;
  const eyePositionFromTop = 100 - eyePositionPercent;
  const crownToEyePercent = headHeightPercent * EYE_FROM_CROWN_RATIO;
  const crownFromTopPercent = eyePositionFromTop - crownToEyePercent;
  const eyeToChinPercent = headHeightPercent * (1 - EYE_FROM_CROWN_RATIO);
  const chinFromTopPercent = eyePositionFromTop + eyeToChinPercent;

  const topMarginPercent = Math.max(0, crownFromTopPercent);
  const bottomMarginPercent = Math.max(0, 100 - chinFromTopPercent);

  // Determine compliance status based on head height range
  const minHeadPercent = (spec.headMin / spec.h) * 100;
  const maxHeadPercent = (spec.headMax / spec.h) * 100;

  let complianceStatus: ComplianceStatus;

  if (
    headHeightPercent >= minHeadPercent &&
    headHeightPercent <= maxHeadPercent
  ) {
    complianceStatus = 'pass';
  } else if (
    headHeightPercent >= minHeadPercent * 0.9 &&
    headHeightPercent <= maxHeadPercent * 1.1
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
      <div
        className="absolute inset-0"
        style={{ backgroundColor: colors.fill }}
      />

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
