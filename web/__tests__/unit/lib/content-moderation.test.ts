import {
  moderateContent,
  hasBlockingViolation,
  getBlockedMessage,
  checkFinalCompliance,
  type ModerationResult,
  VIOLATION_CODES,
} from '@/lib/content-moderation';
import { type FaceData } from '@/lib/face-detection';

describe('content-moderation', () => {
  // Helper to create a valid face
  const createValidFace = (): FaceData => ({
    x: 100,
    y: 100,
    w: 200,
    h: 250,
    leftEye: { x: 150, y: 170 },
    rightEye: { x: 250, y: 170 },
    nose: { x: 200, y: 220 },
    mouth: { x: 200, y: 280 },
  });

  describe('moderateContent', () => {
    it('should pass when single valid face is detected', () => {
      const result = moderateContent(createValidFace(), 1);

      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('pass');
      expect(result.violations).toHaveLength(0);
      expect(result.summary).toBe('Content check passed');
    });

    it('should block when multiple faces are detected', () => {
      const result = moderateContent(createValidFace(), 3);

      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('block');
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].code).toBe(VIOLATION_CODES.MULTIPLE_FACES);
      expect(result.violations[0].severity).toBe('block');
      expect(result.summary).toContain('Multiple Faces');
    });

    it('should block when no face is detected', () => {
      const result = moderateContent(null, 0);

      expect(result.allowed).toBe(false);
      expect(result.severity).toBe('block');
      expect(
        result.violations.some((v) => v.code === VIOLATION_CODES.NO_FACE)
      ).toBe(true);
    });

    it('should allow face even without eye landmarks (trust face detection)', () => {
      // MediaPipe may detect a face but not return eye landmarks
      // We trust the face detection and don't block
      const faceWithoutLandmarks: FaceData = {
        x: 100,
        y: 100,
        w: 200,
        h: 250,
        leftEye: null,
        rightEye: null,
        nose: null,
        mouth: null,
      };
      const result = moderateContent(faceWithoutLandmarks, 1);

      expect(result.allowed).toBe(true);
      expect(result.severity).toBe('pass');
    });
  });

  describe('checkFinalCompliance', () => {
    it('should allow when all checks pass', () => {
      const checks = [
        { id: 'face', status: 'pass', message: 'Face detected' },
        { id: 'head_size', status: 'pass', message: 'Head size OK' },
      ];

      const result = checkFinalCompliance(checks);

      expect(result.canProceed).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should block when any check fails', () => {
      const checks = [
        { id: 'face', status: 'pass', message: 'Face detected' },
        { id: 'head_size', status: 'fail', message: 'Head too large' },
      ];

      const result = checkFinalCompliance(checks);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('error');
    });

    it('should allow with warnings but flag them', () => {
      const checks = [
        { id: 'face', status: 'pass', message: 'Face detected' },
        { id: 'lighting', status: 'warn', message: 'Uneven lighting' },
      ];

      const result = checkFinalCompliance(checks);

      expect(result.canProceed).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].severity).toBe('warning');
    });

    it('should collect multiple issues', () => {
      const checks = [
        { id: 'face', status: 'fail', message: 'No face detected' },
        { id: 'head_size', status: 'fail', message: 'Head too small' },
        { id: 'lighting', status: 'warn', message: 'Shadows detected' },
      ];

      const result = checkFinalCompliance(checks);

      expect(result.canProceed).toBe(false);
      expect(result.issues).toHaveLength(3);
      expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(
        2
      );
      expect(
        result.issues.filter((i) => i.severity === 'warning')
      ).toHaveLength(1);
    });
  });

  describe('hasBlockingViolation', () => {
    it('should return true when result is blocked', () => {
      const blockedResult: ModerationResult = {
        allowed: false,
        severity: 'block',
        violations: [
          {
            code: VIOLATION_CODES.MULTIPLE_FACES,
            label: 'Multiple Faces',
            severity: 'block',
            message: 'Multiple faces detected',
          },
        ],
        summary: 'Upload blocked',
      };

      expect(hasBlockingViolation(blockedResult)).toBe(true);
    });

    it('should return false when result is allowed', () => {
      const allowedResult: ModerationResult = {
        allowed: true,
        severity: 'pass',
        violations: [],
        summary: 'Content check passed',
      };

      expect(hasBlockingViolation(allowedResult)).toBe(false);
    });
  });

  describe('getBlockedMessage', () => {
    it('should return empty string when no blocking violations', () => {
      const allowedResult: ModerationResult = {
        allowed: true,
        severity: 'pass',
        violations: [],
        summary: 'Content check passed',
      };

      expect(getBlockedMessage(allowedResult)).toBe('');
    });

    it('should return formatted message for single blocking violation', () => {
      const blockedResult: ModerationResult = {
        allowed: false,
        severity: 'block',
        violations: [
          {
            code: VIOLATION_CODES.MULTIPLE_FACES,
            label: 'Multiple Faces',
            severity: 'block',
            message: 'Passport photos must contain only one person',
            details: '2 faces detected.',
          },
        ],
        summary: 'Upload blocked',
      };

      const message = getBlockedMessage(blockedResult);
      expect(message).toContain('Passport photos must contain only one person');
      expect(message).toContain('2 faces detected');
    });

    it('should return bullet list for multiple blocking violations', () => {
      const blockedResult: ModerationResult = {
        allowed: false,
        severity: 'block',
        violations: [
          {
            code: VIOLATION_CODES.MULTIPLE_FACES,
            label: 'Multiple Faces',
            severity: 'block',
            message: 'Multiple people detected',
          },
          {
            code: VIOLATION_CODES.NO_FACE,
            label: 'No Face',
            severity: 'block',
            message: 'No face detected',
          },
        ],
        summary: 'Upload blocked',
      };

      const message = getBlockedMessage(blockedResult);
      expect(message).toContain('This photo cannot be used');
      expect(message).toContain('• Multiple people detected');
      expect(message).toContain('• No face detected');
    });
  });
});
