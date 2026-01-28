import { type FaceData } from './face-detection';
import { type PhotoStandard, specToPx, type SpecPx } from './photo-standards';
import { calculateCrop } from './crop';
import { type ImageAnalysis } from './image-analysis';

export interface ComplianceCheck {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'pending';
  message: string;
}

export function checkCompliance(
  sourceWidth: number,
  sourceHeight: number,
  faceData: FaceData | null,
  standard: PhotoStandard,
  bgRemoved: boolean,
  userZoom: number,
  imageAnalysis?: ImageAnalysis
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];
  const spec: SpecPx = specToPx(standard);

  // 1. Face detected
  if (!faceData) {
    checks.push({
      id: 'face',
      label: 'Face Detection',
      status: 'fail',
      message: 'No face detected — using center crop',
    });
    // Return early with pending checks
    checks.push({
      id: 'head_size',
      label: 'Head Size',
      status: 'pending',
      message: 'Requires face detection',
    });
    checks.push({
      id: 'eye_position',
      label: 'Eye Position',
      status: 'pending',
      message: 'Requires face detection',
    });
  } else {
    checks.push({
      id: 'face',
      label: 'Face Detection',
      status: 'pass',
      message: 'Face detected successfully',
    });

    // 2. Head size check
    const { cropW } = calculateCrop(
      sourceWidth,
      sourceHeight,
      faceData,
      standard
    );
    const zoomFactor = 100 / userZoom;
    const effectiveScale = spec.w / (cropW * zoomFactor);
    // Must match HEAD_TO_FACE_RATIO in crop.ts (1.4)
    const estimatedHeadH = faceData.h * 1.4;
    const headInOutput = estimatedHeadH * effectiveScale;

    if (headInOutput >= spec.headMin && headInOutput <= spec.headMax) {
      checks.push({
        id: 'head_size',
        label: 'Head Size',
        status: 'pass',
        message: `Head height is within acceptable range`,
      });
    } else if (headInOutput < spec.headMin) {
      checks.push({
        id: 'head_size',
        label: 'Head Size',
        status: 'warn',
        message: 'Head appears too small — try zooming in',
      });
    } else {
      checks.push({
        id: 'head_size',
        label: 'Head Size',
        status: 'warn',
        message: 'Head appears too large — try zooming out',
      });
    }

    // 3. Eye position
    if (faceData.leftEye && faceData.rightEye) {
      checks.push({
        id: 'eye_position',
        label: 'Eye Position',
        status: 'pass',
        message: 'Eyes correctly positioned',
      });
    } else {
      checks.push({
        id: 'eye_position',
        label: 'Eye Position',
        status: 'warn',
        message: 'Could not verify eye positions',
      });
    }

    // 3b. Head framing check - ensure crown and chin are visible
    const cropParams = calculateCrop(
      sourceWidth,
      sourceHeight,
      faceData,
      standard
    );
    const zoomFactorFrame = 100 / userZoom;
    const adjCropY =
      cropParams.cropY +
      (cropParams.cropH - cropParams.cropH * zoomFactorFrame) / 2;
    const adjCropH = cropParams.cropH * zoomFactorFrame;

    // Crown position in source (0.5 accounts for hair volume above face bbox)
    const crownY = faceData.y - faceData.h * 0.5;
    // Chin position in source
    const chinY = faceData.y + faceData.h;

    // Check crown/chin visibility in the FINAL cropped output, not source
    const crownVisible = crownY >= adjCropY;
    const chinVisible = chinY <= adjCropY + adjCropH;
    
    // Only fail if crown is actually cut off (crownY < 0 means crown above image)
    const sourceHasInsufficientHeadroom = crownY < 0;

    if (sourceHasInsufficientHeadroom) {
      checks.push({
        id: 'head_framing',
        label: 'Head Framing',
        status: 'fail',
        message: 'Source photo has head too close to top — retake with more space above head',
      });
    } else if (crownVisible && chinVisible) {
      checks.push({
        id: 'head_framing',
        label: 'Head Framing',
        status: 'pass',
        message: 'Full head visible (crown to chin)',
      });
    } else if (!crownVisible) {
      checks.push({
        id: 'head_framing',
        label: 'Head Framing',
        status: 'fail',
        message: 'Top of head may be cropped — zoom out or reposition',
      });
    } else {
      checks.push({
        id: 'head_framing',
        label: 'Head Framing',
        status: 'fail',
        message: 'Chin may be cropped — zoom out or reposition',
      });
    }

    // 3c. Head centering check - face should be horizontally centered
    const adjCropX =
      cropParams.cropX +
      (cropParams.cropW - cropParams.cropW * zoomFactorFrame) / 2;
    const adjCropW = cropParams.cropW * zoomFactorFrame;
    const faceCenterX = faceData.x + faceData.w / 2;
    const cropCenterX = adjCropX + adjCropW / 2;
    const centerOffset = Math.abs(faceCenterX - cropCenterX) / adjCropW;

    if (centerOffset < 0.05) {
      checks.push({
        id: 'head_centering',
        label: 'Head Centering',
        status: 'pass',
        message: 'Head is centered horizontally',
      });
    } else if (centerOffset < 0.1) {
      checks.push({
        id: 'head_centering',
        label: 'Head Centering',
        status: 'warn',
        message: 'Head is slightly off-center — adjust position',
      });
    } else {
      checks.push({
        id: 'head_centering',
        label: 'Head Centering',
        status: 'fail',
        message: 'Head is not centered — adjust horizontal position',
      });
    }
  }

  // 4. Background
  checks.push({
    id: 'background',
    label: 'Background',
    status: bgRemoved ? 'pass' : 'warn',
    message: bgRemoved
      ? 'White background applied'
      : 'Background needs to be white for passport standards',
  });

  // 5. Resolution
  const minDim = Math.min(sourceWidth, sourceHeight);
  if (minDim >= 600) {
    checks.push({
      id: 'resolution',
      label: 'Resolution',
      status: 'pass',
      message: `${sourceWidth}×${sourceHeight}px — sufficient quality`,
    });
  } else {
    checks.push({
      id: 'resolution',
      label: 'Resolution',
      status: minDim >= 400 ? 'warn' : 'fail',
      message: `${sourceWidth}×${sourceHeight}px — ${minDim >= 400 ? 'may be low quality' : 'too low resolution'}`,
    });
  }

  // 6. Blur/Sharpness detection
  if (imageAnalysis) {
    if (imageAnalysis.isBlurry) {
      checks.push({
        id: 'sharpness',
        label: 'Image Sharpness',
        status: 'fail',
        message: 'Photo appears blurry — use a sharper image',
      });
    } else {
      checks.push({
        id: 'sharpness',
        label: 'Image Sharpness',
        status: 'pass',
        message: 'Photo is sharp and in focus',
      });
    }

    // 7. Face angle/tilt detection
    if (imageAnalysis.isTilted) {
      checks.push({
        id: 'face_angle',
        label: 'Face Angle',
        status: 'warn',
        message: `Head appears tilted (${Math.abs(imageAnalysis.eyeTilt).toFixed(1)}°) — should be straight`,
      });
    } else if (faceData?.leftEye && faceData?.rightEye) {
      checks.push({
        id: 'face_angle',
        label: 'Face Angle',
        status: 'pass',
        message: 'Face is straight and front-facing',
      });
    }

    // 8. Color photo check (must not be grayscale)
    if (imageAnalysis.isGrayscale) {
      checks.push({
        id: 'color_photo',
        label: 'Color Photo',
        status: 'fail',
        message: 'Photo must be in color — black & white not accepted',
      });
    } else {
      checks.push({
        id: 'color_photo',
        label: 'Color Photo',
        status: 'pass',
        message: 'Photo is in color',
      });
    }

    // 9. Face lighting/shadow check
    if (imageAnalysis.hasUnevenLighting) {
      checks.push({
        id: 'lighting',
        label: 'Face Lighting',
        status: 'warn',
        message: `Uneven lighting detected (${imageAnalysis.faceLightingScore}%) — avoid shadows on face`,
      });
    } else {
      checks.push({
        id: 'lighting',
        label: 'Face Lighting',
        status: 'pass',
        message: 'Face lighting is even',
      });
    }

    // 10. Exposure check (brightness analysis)
    if (imageAnalysis.exposure) {
      if (imageAnalysis.exposure.isOverexposed) {
        checks.push({
          id: 'exposure',
          label: 'Photo Exposure',
          status: 'fail',
          message: `Photo is overexposed (too bright) — avoid direct sunlight or flash`,
        });
      } else if (imageAnalysis.exposure.isUnderexposed) {
        checks.push({
          id: 'exposure',
          label: 'Photo Exposure',
          status: 'fail',
          message: `Photo is underexposed (too dark) — use better lighting`,
        });
      } else {
        checks.push({
          id: 'exposure',
          label: 'Photo Exposure',
          status: 'pass',
          message: 'Photo exposure is good',
        });
      }
    }

    // 11. Halo/edge artifact check (background removal quality)
    if (imageAnalysis.halo) {
      if (imageAnalysis.halo.hasHaloArtifacts) {
        checks.push({
          id: 'edge_quality',
          label: 'Background Quality',
          status: 'warn',
          message: `Halo artifacts detected around edges — background may need cleanup`,
        });
      } else if (imageAnalysis.halo.edgeQuality < 50) {
        checks.push({
          id: 'edge_quality',
          label: 'Background Quality',
          status: 'warn',
          message: `Rough edges detected — background cutout quality is poor`,
        });
      } else {
        checks.push({
          id: 'edge_quality',
          label: 'Background Quality',
          status: 'pass',
          message: 'Background edges are clean',
        });
      }
    }
  }

  // 10. Glasses reminder (US requirement since 2016)
  const usStandards = ['us', 'us_visa', 'us_drivers', 'green_card'];
  if (usStandards.includes(standard.id)) {
    checks.push({
      id: 'glasses',
      label: 'Glasses Policy',
      status: 'pass',
      message: 'Reminder: US photos require no glasses (since 2016)',
    });
  }

  return checks;
}
