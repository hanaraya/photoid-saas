/**
 * Test: Crop should NEVER produce white padding for valid portrait photos
 *
 * This test verifies that the crop calculation constrains scale properly
 * to ensure the crop always fits within the source image.
 */

import { calculateCrop, simulateCrop } from '@/lib/crop';
import { STANDARDS, specToPx, HEAD_TO_FACE_RATIO } from '@/lib/photo-standards';
import type { FaceData } from '@/lib/face-detection';

describe('Crop - No White Padding', () => {
  // Test case: Reyansh's passport photo (1280x1280)
  // This photo was producing white padding before the fix
  describe('reyansh-passport.jpg (1280x1280)', () => {
    const sourceWidth = 1280;
    const sourceHeight = 1280;

    // Approximate face data (face roughly centered, takes up good portion of frame)
    const faceData: FaceData = {
      x: 390,
      y: 200,
      w: 500,
      h: 580,
      leftEye: { x: 540, y: 380 },
      rightEye: { x: 740, y: 380 },
    };

    const standard = STANDARDS.us;
    const spec = specToPx(standard);

    it('should produce crop dimensions that fit within source', () => {
      const crop = calculateCrop(sourceWidth, sourceHeight, faceData, standard);

      expect(crop.cropW).toBeLessThanOrEqual(sourceWidth);
      expect(crop.cropH).toBeLessThanOrEqual(sourceHeight);
    });

    it('should have crop position within valid bounds', () => {
      const crop = calculateCrop(sourceWidth, sourceHeight, faceData, standard);

      // Crop should start at 0 or positive
      expect(crop.cropX).toBeGreaterThanOrEqual(0);
      expect(crop.cropY).toBeGreaterThanOrEqual(0);

      // Crop should not extend beyond source
      expect(crop.cropX + crop.cropW).toBeLessThanOrEqual(sourceWidth);
      expect(crop.cropY + crop.cropH).toBeLessThanOrEqual(sourceHeight);
    });

    it('should produce valid head size percentage (50-69% for US)', () => {
      const simulation = simulateCrop(
        sourceWidth,
        sourceHeight,
        faceData,
        standard
      );

      const minPercent = (spec.headMin / spec.h) * 100; // 50%
      const maxPercent = (spec.headMax / spec.h) * 100; // ~69%

      expect(simulation.headHeightPercent).toBeGreaterThanOrEqual(
        minPercent - 2
      ); // 2% tolerance
      expect(simulation.headHeightPercent).toBeLessThanOrEqual(maxPercent + 2);
    });

    it('should not report any padding issues', () => {
      const simulation = simulateCrop(
        sourceWidth,
        sourceHeight,
        faceData,
        standard
      );

      const paddingIssues = simulation.issues.filter((i) =>
        i.startsWith('needs-padding')
      );
      expect(paddingIssues).toHaveLength(0);
    });

    it('should be marked as valid (no blocking issues)', () => {
      const simulation = simulateCrop(
        sourceWidth,
        sourceHeight,
        faceData,
        standard
      );

      // May have centering warnings but should not have padding or head size issues
      const blockingIssues = simulation.issues.filter(
        (i) =>
          i.startsWith('needs-padding') ||
          i === 'head-too-small' ||
          i === 'head-too-large'
      );
      expect(blockingIssues).toHaveLength(0);
    });
  });

  describe('Generic padding prevention', () => {
    const standard = STANDARDS.us;

    it('should never produce crop larger than source for any reasonable face', () => {
      // Test with various source sizes
      const testCases = [
        { w: 1280, h: 1280, faceH: 600 }, // Square, large face
        { w: 1920, h: 1080, faceH: 400 }, // Landscape
        { w: 1080, h: 1920, faceH: 500 }, // Portrait
        { w: 800, h: 800, faceH: 350 }, // Small square
        { w: 640, h: 480, faceH: 200 }, // Minimum viable
      ];

      for (const tc of testCases) {
        const faceData: FaceData = {
          x: tc.w / 2 - 100,
          y: tc.h * 0.2,
          w: tc.faceH * 0.8,
          h: tc.faceH,
          leftEye: null,
          rightEye: null,
        };

        const crop = calculateCrop(tc.w, tc.h, faceData, standard);

        expect(crop.cropW).toBeLessThanOrEqual(tc.w);
        expect(crop.cropH).toBeLessThanOrEqual(tc.h);
      }
    });

    it('should constrain scale when face is very large relative to frame', () => {
      // Face taking up most of the frame - should still not produce oversized crop
      const sourceWidth = 1000;
      const sourceHeight = 1000;
      const faceData: FaceData = {
        x: 200,
        y: 100,
        w: 600,
        h: 700, // Very large face
        leftEye: null,
        rightEye: null,
      };

      const crop = calculateCrop(sourceWidth, sourceHeight, faceData, standard);
      const simulation = simulateCrop(
        sourceWidth,
        sourceHeight,
        faceData,
        standard
      );

      // Crop must fit
      expect(crop.cropW).toBeLessThanOrEqual(sourceWidth);
      expect(crop.cropH).toBeLessThanOrEqual(sourceHeight);

      // No padding issues
      const paddingIssues = simulation.issues.filter((i) =>
        i.startsWith('needs-padding')
      );
      expect(paddingIssues).toHaveLength(0);
    });
  });
});
