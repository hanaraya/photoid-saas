import { type FaceData } from './face-detection';
import { 
  type SpecPx, 
  specToPx, 
  type PhotoStandard,
  HEAD_TO_FACE_RATIO,
  CROWN_CLEARANCE_RATIO,
  HEAD_SIZE_TOLERANCE,
} from './photo-standards';

export interface CropParams {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
}

/**
 * Result of simulating a crop - tells you exactly what would happen
 */
export interface CropSimulationResult {
  // Will the crop succeed without issues?
  isValid: boolean;
  
  // Quality metrics
  headHeightPercent: number;     // Head height as % of output (spec wants 50-69% for US)
  eyePositionPercent: number;    // Eye position from bottom as % of output
  
  // Issues that would occur
  issues: CropIssue[];
  
  // What to tell the user - precise guidance based on analysis
  guidance: 'perfect' | 'move-closer' | 'move-back' | 'center-face' | 'move-up' | 'move-down' | 'tilt-head' | 'no-face';
  
  // The calculated crop params (for preview)
  cropParams: CropParams | null;
  
  // Padding that would be added (0 = no padding = good)
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

export type CropIssue = 
  | 'no-face'
  | 'head-too-small'
  | 'head-too-large'
  | 'needs-padding-top'
  | 'needs-padding-bottom'
  | 'needs-padding-left'
  | 'needs-padding-right'
  | 'eyes-position-bad'
  | 'face-not-centered';

/**
 * Simulate what a crop would produce WITHOUT rendering
 * Use this in camera guides to show real-time feedback
 */
export function simulateCrop(
  sourceWidth: number,
  sourceHeight: number,
  faceData: FaceData | null,
  standard: PhotoStandard
): CropSimulationResult {
  const spec = specToPx(standard);
  const issues: CropIssue[] = [];
  
  if (!faceData) {
    return {
      isValid: false,
      headHeightPercent: 0,
      eyePositionPercent: 0,
      issues: ['no-face'],
      guidance: 'no-face',
      cropParams: null,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    };
  }
  
  const face = faceData;
  const faceCenterX = face.x + face.w / 2;
  
  // Eye position
  let eyeY: number;
  if (face.leftEye && face.rightEye) {
    eyeY = (face.leftEye.y + face.rightEye.y) / 2;
  } else {
    eyeY = face.y + face.h * 0.35;
  }
  
  // Head estimation
  const estimatedHeadH = face.h * HEAD_TO_FACE_RATIO;
  const crownY = face.y - face.h * CROWN_CLEARANCE_RATIO;
  const crownToEye = eyeY - crownY;
  
  // Spec requirements
  const targetEyeFromTop = spec.h - spec.eyeFromBottom;
  const minTopMargin = spec.h * 0.05;
  
  // Calculate scale bounds (same logic as calculateCrop)
  const minScaleHead = spec.headMin / estimatedHeadH;
  const maxScaleHead = spec.headMax / estimatedHeadH;
  const maxScaleCrown = crownToEye > 0 
    ? (targetEyeFromTop - minTopMargin) / crownToEye 
    : maxScaleHead;
  const minScaleCropY = eyeY > 0 ? targetEyeFromTop / eyeY : minScaleHead;
  
  const minScale = Math.max(minScaleHead, minScaleCropY);
  const maxScale = Math.min(maxScaleHead, maxScaleCrown);
  
  // Pick target scale
  let scale: number;
  if (minScale <= maxScale) {
    scale = minScale + (maxScale - minScale) * 0.35;
  } else {
    scale = Math.max(minScaleHead, Math.min(maxScaleHead, maxScaleCrown));
  }
  
  // Calculate crop dimensions
  const cropW = spec.w / scale;
  const cropH = spec.h / scale;
  
  // Position crop
  const eyeFromTopInSrc = targetEyeFromTop / scale;
  let cropY = eyeY - eyeFromTopInSrc;
  let cropX = faceCenterX - cropW / 2;
  
  // SAFETY MARGIN: Account for render's head framing constraints
  // The render enforces 8% padding around crown/chin, which can push the crop
  // Add 10% safety margin to ensure we never hit the edge
  const safetyMargin = Math.max(cropW, cropH) * 0.10;
  
  // Check for padding (crop exceeds source bounds WITH safety margin)
  let paddingTop = 0, paddingBottom = 0, paddingLeft = 0, paddingRight = 0;
  
  if (cropY < safetyMargin) {
    paddingTop = safetyMargin - cropY;
    issues.push('needs-padding-top');
  }
  if (cropY + cropH > sourceHeight - safetyMargin) {
    paddingBottom = (cropY + cropH) - (sourceHeight - safetyMargin);
    issues.push('needs-padding-bottom');
  }
  if (cropX < safetyMargin) {
    paddingLeft = safetyMargin - cropX;
    issues.push('needs-padding-left');
  }
  if (cropX + cropW > sourceWidth - safetyMargin) {
    paddingRight = (cropX + cropW) - (sourceWidth - safetyMargin);
    issues.push('needs-padding-right');
  }
  
  // Calculate output metrics
  const headInOutput = estimatedHeadH * scale;
  const headHeightPercent = (headInOutput / spec.h) * 100;
  const eyePositionPercent = (spec.eyeFromBottom / spec.h) * 100;
  
  // Check head size compliance
  const minHeadPercent = (spec.headMin / spec.h) * 100;
  const maxHeadPercent = (spec.headMax / spec.h) * 100;
  
  // Use a small tolerance to avoid flickering at boundaries
  const headTolerance = HEAD_SIZE_TOLERANCE;
  
  if (headHeightPercent < minHeadPercent - headTolerance) {
    issues.push('head-too-small');
  }
  if (headHeightPercent > maxHeadPercent + headTolerance) {
    issues.push('head-too-large');
  }
  
  // Check centering (face should be roughly centered horizontally)
  const faceCenterOffset = Math.abs(faceCenterX - sourceWidth / 2) / sourceWidth;
  if (faceCenterOffset > 0.15) {
    issues.push('face-not-centered');
  }
  
  // SMART GUIDANCE LOGIC:
  // Distinguish between distance issues and position issues
  // This is critical for giving users the RIGHT advice
  
  let guidance: CropSimulationResult['guidance'] = 'perfect';
  
  // Priority 1: Head size issues (distance)
  if (issues.includes('head-too-small')) {
    guidance = 'move-closer';
  } else if (issues.includes('head-too-large')) {
    guidance = 'move-back';
  }
  // Priority 2: Vertical position issues
  // Analyze WHY padding is needed - is it a position issue or size issue?
  else if (paddingTop > 0 || paddingBottom > 0) {
    // If head size is within valid range, this is a POSITION issue, not distance
    if (headHeightPercent >= minHeadPercent - headTolerance && 
        headHeightPercent <= maxHeadPercent + headTolerance) {
      // Face is the right size but wrong vertical position
      if (paddingTop > paddingBottom) {
        // Need more room at top = face is too HIGH, move down
        guidance = 'move-down';
      } else {
        // Need more room at bottom = face is too LOW, move up
        guidance = 'move-up';
      }
    } else if (headHeightPercent < minHeadPercent) {
      // Face too small causes padding issues
      guidance = 'move-closer';
    } else {
      // Face too large but needs padding = weird edge case
      guidance = 'move-back';
    }
  }
  // Priority 3: Horizontal position issues
  else if (paddingLeft > 0 || paddingRight > 0) {
    // Horizontal padding typically means centering issue
    guidance = 'center-face';
  }
  // Priority 4: Just a centering issue
  else if (issues.includes('face-not-centered')) {
    guidance = 'center-face';
  }
  
  const isValid = issues.length === 0;
  
  return {
    isValid,
    headHeightPercent,
    eyePositionPercent,
    issues,
    guidance,
    cropParams: { cropX, cropY, cropW, cropH },
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
  };
}

export function calculateCrop(
  sourceWidth: number,
  sourceHeight: number,
  faceData: FaceData | null,
  standard: PhotoStandard
): CropParams {
  const spec: SpecPx = specToPx(standard);

  if (faceData) {
    const face = faceData;
    const faceCenterX = face.x + face.w / 2;

    // Eye line Y position in source
    let eyeY: number;
    if (face.leftEye && face.rightEye) {
      eyeY = (face.leftEye.y + face.rightEye.y) / 2;
    } else {
      eyeY = face.y + face.h * 0.35;
    }

    // Key positions in source
    const crownY = face.y - face.h * CROWN_CLEARANCE_RATIO; // Top of head (including hair)
    const chinY = face.y + face.h; // Bottom of chin

    // Full head height estimate (uses imported HEAD_TO_FACE_RATIO)
    const estimatedHeadH = face.h * HEAD_TO_FACE_RATIO;

    // Spec requirements (all in output pixels)
    const targetEyeFromTop = spec.h - spec.eyeFromBottom;
    const minTopMargin = spec.h * 0.05; // 5% above crown minimum
    
    // Distance from crown to eyes in source
    const crownToEye = eyeY - crownY;
    
    // CONSTRAINT SOLVING:
    // We need to find a scale that satisfies:
    // 1. Head height in range: scale ∈ [headMin/headH, headMax/headH]
    // 2. Crown has margin: when eyes are at targetEyeFromTop, crown is at >= minTopMargin
    //    Crown position in output = targetEyeFromTop - crownToEye * scale
    //    Constraint: targetEyeFromTop - crownToEye * scale >= minTopMargin
    //    => crownToEye * scale <= targetEyeFromTop - minTopMargin
    //    => scale <= (targetEyeFromTop - minTopMargin) / crownToEye
    
    // Scale bounds from head height
    const minScaleHead = spec.headMin / estimatedHeadH;
    const maxScaleHead = spec.headMax / estimatedHeadH;
    
    // Scale bound from crown margin (ensure crown doesn't get cut off when eyes are positioned)
    const maxScaleCrown = crownToEye > 0 
      ? (targetEyeFromTop - minTopMargin) / crownToEye 
      : maxScaleHead;
    
    // Scale bound to ensure cropY stays non-negative (eyes are low enough in source)
    // cropY = eyeY - targetEyeFromTop/scale >= 0  =>  scale >= targetEyeFromTop/eyeY
    const minScaleCropY = eyeY > 0 ? targetEyeFromTop / eyeY : minScaleHead;
    
    // Final scale bounds - must satisfy ALL constraints
    const minScale = Math.max(minScaleHead, minScaleCropY);
    const maxScale = Math.min(maxScaleHead, maxScaleCrown);
    
    // Target scale: aim for middle of valid range, biased toward smaller head
    let scale: number;
    if (minScale <= maxScale) {
      // Valid range exists - pick 35% from min (smaller head = more breathing room)
      scale = minScale + (maxScale - minScale) * 0.35;
    } else {
      // Constraints conflict - pick best compromise
      // Prioritize head size compliance over crown margin
      scale = Math.max(minScaleHead, Math.min(maxScaleHead, maxScaleCrown));
    }

    // Calculate crop dimensions
    const cropW = spec.w / scale;
    const cropH = spec.h / scale;

    // Position crop so eyes are at the correct position
    const eyeFromTopInSrc = targetEyeFromTop / scale;
    let cropY = eyeY - eyeFromTopInSrc;

    // Center horizontally on face
    let cropX = faceCenterX - cropW / 2;

    // Boundary clamping (only if absolutely necessary)
    if (cropY + cropH > sourceHeight) {
      cropY = sourceHeight - cropH;
    }
    cropY = Math.max(0, cropY);
    
    if (cropX + cropW > sourceWidth) {
      cropX = sourceWidth - cropW;
    }
    cropX = Math.max(0, cropX);

    return { cropX, cropY, cropW, cropH };
  }

  // Fallback: center crop with correct aspect ratio
  const aspect = spec.w / spec.h;
  let cropW: number, cropH: number, cropX: number, cropY: number;

  if (sourceWidth / sourceHeight > aspect) {
    cropH = sourceHeight;
    cropW = sourceHeight * aspect;
    cropX = (sourceWidth - cropW) / 2;
    cropY = 0;
  } else {
    cropW = sourceWidth;
    cropH = sourceWidth / aspect;
    cropX = 0;
    cropY = (sourceHeight - cropH) / 2;
  }

  return { cropX, cropY, cropW, cropH };
}

export function renderPassportPhoto(
  canvas: HTMLCanvasElement,
  sourceImage: HTMLImageElement,
  faceData: FaceData | null,
  standard: PhotoStandard,
  userZoom: number,
  userH: number,
  userV: number,
  userBrightness: number,
  addWatermark: boolean,
  preCalculatedCrop?: CropParams
): void {
  const spec = specToPx(standard);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = spec.w;
  canvas.height = spec.h;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, spec.w, spec.h);

  // Use pre-calculated crop if provided, otherwise calculate from face data
  const { cropX, cropY, cropW, cropH } =
    preCalculatedCrop ??
    calculateCrop(
      sourceImage.naturalWidth,
      sourceImage.naturalHeight,
      faceData,
      standard
    );

  // Apply user adjustments
  const zoomFactor = 100 / userZoom;
  const adjCropW = cropW * zoomFactor;
  const adjCropH = cropH * zoomFactor;
  let adjCropX = cropX + (cropW - adjCropW) / 2 - userH * (cropW / spec.w);
  let adjCropY = cropY + (cropH - adjCropH) / 2 - userV * (cropH / spec.h);

  // CRITICAL: Keep crop within source image bounds (no white space)
  const srcW = sourceImage.naturalWidth;
  const srcH = sourceImage.naturalHeight;
  
  // Horizontal bounds - never show white space on sides
  if (adjCropX < 0) {
    adjCropX = 0;
  }
  if (adjCropX + adjCropW > srcW) {
    adjCropX = srcW - adjCropW;
  }
  // If crop is wider than source, center it (will have white space, unavoidable)
  if (adjCropW > srcW) {
    adjCropX = (srcW - adjCropW) / 2;
  }
  
  // Vertical bounds - never show white space on top/bottom
  if (adjCropY < 0) {
    adjCropY = 0;
  }
  if (adjCropY + adjCropH > srcH) {
    adjCropY = srcH - adjCropH;
  }
  // If crop is taller than source, center it (will have white space, unavoidable)
  if (adjCropH > srcH) {
    adjCropY = (srcH - adjCropH) / 2;
  }

  // ADDITIONAL: Enforce head framing constraints (but within image bounds)
  if (faceData) {
    const crownY = faceData.y - faceData.h * CROWN_CLEARANCE_RATIO;
    const chinY = faceData.y + faceData.h;
    const scale = spec.w / adjCropW;
    const minPaddingSrc = (spec.h * 0.08) / scale;

    // Ensure crown is visible with padding (but respect image bounds)
    const minCropY = Math.max(0, crownY - minPaddingSrc);
    if (adjCropY > minCropY) {
      adjCropY = minCropY;
    }

    // Ensure chin is visible with padding (but respect image bounds)
    const maxCropY = Math.min(srcH - adjCropH, chinY + minPaddingSrc - adjCropH);
    if (adjCropY < maxCropY) {
      adjCropY = Math.max(0, maxCropY);
    }

    // Limit horizontal offset (but ALWAYS respect image bounds - no white space)
    const faceCenterX = faceData.x + faceData.w / 2;
    const maxHorizontalOffset = adjCropW * 0.15;
    const idealCropX = faceCenterX - adjCropW / 2;
    
    // Calculate allowed range, but ALWAYS clamp to image bounds first
    const absoluteMinX = 0;
    const absoluteMaxX = Math.max(0, srcW - adjCropW);
    
    // Then apply face centering preference within those absolute bounds
    const minX = Math.max(absoluteMinX, idealCropX - maxHorizontalOffset);
    const maxX = Math.min(absoluteMaxX, idealCropX + maxHorizontalOffset);
    
    // Clamp adjCropX to the valid range
    if (adjCropX < minX) {
      adjCropX = Math.max(absoluteMinX, minX);
    } else if (adjCropX > maxX) {
      adjCropX = Math.min(absoluteMaxX, maxX);
    }
    
    // Final safety clamp - NEVER exceed image bounds
    adjCropX = Math.max(0, Math.min(srcW - adjCropW, adjCropX));
  }

  // Brightness
  if (userBrightness !== 100) {
    ctx.filter = `brightness(${userBrightness}%)`;
  } else {
    ctx.filter = 'none';
  }

  ctx.drawImage(
    sourceImage,
    adjCropX,
    adjCropY,
    adjCropW,
    adjCropH,
    0,
    0,
    spec.w,
    spec.h
  );
  ctx.filter = 'none';

  // Add watermark if not paid
  if (addWatermark) {
    drawWatermark(ctx, spec.w, spec.h);
  }
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#6366f1';
  ctx.font = `bold ${Math.max(width / 8, 24)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw diagonal watermark
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillText('PREVIEW', 0, 0);
  ctx.fillText('safepassportpic.com', 0, Math.max(width / 6, 30));
  ctx.restore();
}

export function renderSheet(
  sheetCanvas: HTMLCanvasElement,
  passportCanvas: HTMLCanvasElement,
  standard: PhotoStandard,
  addWatermark: boolean
): void {
  const spec = specToPx(standard);
  const DPI = 300;
  const sheetW = 6 * DPI; // 1800
  const sheetH = 4 * DPI; // 1200

  sheetCanvas.width = sheetW;
  sheetCanvas.height = sheetH;
  const ctx = sheetCanvas.getContext('2d');
  if (!ctx) return;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sheetW, sheetH);

  // Calculate grid
  const cols = Math.floor(sheetW / spec.w);
  const rows = Math.floor(sheetH / spec.h);
  const offsetX = Math.floor((sheetW - cols * spec.w) / 2);
  const offsetY = Math.floor((sheetH - rows * spec.h) / 2);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * spec.w;
      const y = offsetY + r * spec.h;
      ctx.drawImage(passportCanvas, x, y);

      // Cut lines
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, spec.w, spec.h);
    }
  }

  ctx.setLineDash([]);

  if (addWatermark) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(sheetW / 2, sheetH / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText('PREVIEW — safepassportpic.com', 0, 0);
    ctx.restore();
  }
}
