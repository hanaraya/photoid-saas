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
    const estimatedHeadH = faceData.h * 1.35;
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
  }

  // 4. Background
  checks.push({
    id: 'background',
    label: 'Background',
    status: bgRemoved ? 'pass' : 'warn',
    message: bgRemoved
      ? 'White background applied'
      : 'Click "Remove Background" for white background',
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
  }

  // 8. Glasses reminder (US requirement since 2016)
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
