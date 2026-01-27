/**
 * Content Moderation for Passport Photos
 * 
 * Client-side checks for photo compliance issues.
 * All processing happens in the browser - photos never leave the device.
 */

import { type FaceData } from './face-detection';

export type ModerationSeverity = 'block' | 'warn' | 'pass';

export interface ModerationResult {
  allowed: boolean;
  severity: ModerationSeverity;
  violations: ModerationViolation[];
  summary: string;
}

export interface ModerationViolation {
  code: string;
  label: string;
  severity: ModerationSeverity;
  message: string;
  details?: string;
}

// Violation codes
export const VIOLATION_CODES = {
  // Blocking violations (critical - stop processing)
  MULTIPLE_FACES: 'multiple_faces',
  NO_FACE: 'no_face',
  FACE_COVERED: 'face_covered',
} as const;

/**
 * Initial moderation check - runs after face detection
 * Checks for issues with the source photo
 */
export function moderateContent(
  faceData: FaceData | null,
  faceCount: number
): ModerationResult {
  const violations: ModerationViolation[] = [];
  
  // Multiple faces detected
  if (faceCount > 1) {
    violations.push({
      code: VIOLATION_CODES.MULTIPLE_FACES,
      label: 'Multiple Faces',
      severity: 'block',
      message: 'Passport photos must contain only one person',
      details: `${faceCount} faces detected. Please upload a photo of yourself only.`,
    });
  }
  
  // No face detected
  if (!faceData && faceCount === 0) {
    violations.push({
      code: VIOLATION_CODES.NO_FACE,
      label: 'No Face Detected',
      severity: 'block',
      message: 'Could not detect a face in the photo',
      details: 'Please upload a clear, front-facing photo of yourself.',
    });
  }
  
  // Check face visibility (face mostly visible, not covered)
  // Only block if BOTH eyes are missing - nose/mouth detection is unreliable
  if (faceData) {
    if (!faceData.leftEye && !faceData.rightEye) {
      violations.push({
        code: VIOLATION_CODES.FACE_COVERED,
        label: 'Face Obstructed',
        severity: 'block',
        message: 'Face appears to be covered or obstructed',
        details: 'Ensure your full face is visible without any obstructions.',
      });
    }
  }
  
  // Determine overall result
  const blockingViolations = violations.filter(v => v.severity === 'block');
  
  const allowed = blockingViolations.length === 0;
  const severity: ModerationSeverity = blockingViolations.length > 0 ? 'block' : 'pass';
  
  const summary = blockingViolations.length > 0
    ? `Upload blocked: ${blockingViolations.map(v => v.label).join(', ')}`
    : 'Content check passed';
  
  return {
    allowed,
    severity,
    violations,
    summary,
  };
}

/**
 * Check if any violations are blocking
 */
export function hasBlockingViolation(result: ModerationResult): boolean {
  return !result.allowed;
}

/**
 * Get user-friendly error message for blocked content
 */
export function getBlockedMessage(result: ModerationResult): string {
  const blockingViolations = result.violations.filter(v => v.severity === 'block');
  
  if (blockingViolations.length === 0) {
    return '';
  }
  
  if (blockingViolations.length === 1) {
    return `${blockingViolations[0].message}. ${blockingViolations[0].details || ''}`;
  }
  
  return `This photo cannot be used:\n${blockingViolations.map(v => `• ${v.message}`).join('\n')}`;
}

/**
 * Final compliance check result
 */
export interface FinalComplianceResult {
  canProceed: boolean;
  issues: FinalComplianceIssue[];
}

export interface FinalComplianceIssue {
  id: string;
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Final compliance check - runs before download/print
 * Checks that modifications (zoom, pan) haven't introduced issues
 */
export function checkFinalCompliance(
  complianceChecks: Array<{ id: string; status: string; message: string }>
): FinalComplianceResult {
  const issues: FinalComplianceIssue[] = [];
  
  // Check for any failed compliance checks
  for (const check of complianceChecks) {
    if (check.status === 'fail') {
      issues.push({
        id: check.id,
        severity: 'error',
        message: check.message,
      });
    } else if (check.status === 'warn') {
      issues.push({
        id: check.id,
        severity: 'warning',
        message: check.message,
      });
    }
  }
  
  // Can proceed only if no errors (warnings are okay)
  const hasErrors = issues.some(i => i.severity === 'error');
  
  return {
    canProceed: !hasErrors,
    issues,
  };
}
