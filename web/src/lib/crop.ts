import { type FaceData } from './face-detection';
import { type SpecPx, specToPx, type PhotoStandard } from './photo-standards';

export interface CropParams {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
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
    const crownY = face.y - face.h * 0.5; // Top of head (including hair)
    const chinY = face.y + face.h; // Bottom of chin

    // Full head height estimate
    const HEAD_TO_FACE_RATIO = 1.4;
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
    const crownY = faceData.y - faceData.h * 0.5;
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

    // Limit horizontal offset (but respect image bounds)
    const faceCenterX = faceData.x + faceData.w / 2;
    const maxHorizontalOffset = adjCropW * 0.15;
    const idealCropX = faceCenterX - adjCropW / 2;
    const minX = Math.max(0, idealCropX - maxHorizontalOffset);
    const maxX = Math.min(srcW - adjCropW, idealCropX + maxHorizontalOffset);
    
    if (adjCropX < minX) {
      adjCropX = minX;
    } else if (adjCropX > maxX) {
      adjCropX = maxX;
    }
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
