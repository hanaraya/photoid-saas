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

    // Eye line Y position
    let eyeY: number;
    if (face.leftEye && face.rightEye) {
      eyeY = (face.leftEye.y + face.rightEye.y) / 2;
    } else {
      eyeY = face.y + face.h * 0.35;
    }

    // Key positions
    const crownY = face.y - face.h * 0.5; // Top of head (including hair)
    const chinY = face.y + face.h; // Bottom of chin

    // Full head height estimate (face bbox + hair)
    const estimatedHeadH = face.h * 1.5;

    // Required margins (in output pixels)
    const minTopMargin = spec.h * 0.10; // 10% above crown
    const minBottomMargin = spec.h * 0.05; // 5% below chin

    // Calculate initial scale to fit head at target size
    let scale = spec.headTarget / estimatedHeadH;

    // Calculate crop dimensions
    let cropW = spec.w / scale;
    let cropH = spec.h / scale;

    // Position based on eye line
    const targetEyeFromTop = spec.h - spec.eyeFromBottom;
    const eyeFromTopInSrc = targetEyeFromTop / scale;
    let cropY = eyeY - eyeFromTopInSrc;

    // Center horizontally on face
    let cropX = faceCenterX - cropW / 2;

    // Convert margins to source pixels
    const topMarginSrc = minTopMargin / scale;
    const bottomMarginSrc = minBottomMargin / scale;

    // Check if crown has enough headroom
    const crownInCrop = crownY - cropY; // Where crown appears relative to crop top
    if (crownInCrop < topMarginSrc) {
      // Crown is too close to top or cut off - move crop up
      cropY = crownY - topMarginSrc;
    }

    // Ensure cropY doesn't go negative (above image)
    if (cropY < 0) {
      // Can't fit with current scale - need to zoom out
      // Calculate the scale that would put crown at correct position with margin
      const availableAboveCrown = crownY; // Space from image top to crown
      if (availableAboveCrown > 0) {
        // New scale where topMargin/newScale = availableAboveCrown
        const newScale = minTopMargin / availableAboveCrown;
        if (newScale < scale) {
          scale = Math.max(newScale, scale * 0.7); // Don't zoom out more than 30%
          cropW = spec.w / scale;
          cropH = spec.h / scale;
          cropX = faceCenterX - cropW / 2;
          // Recalculate cropY with new scale
          const newEyeFromTopInSrc = targetEyeFromTop / scale;
          cropY = eyeY - newEyeFromTopInSrc;
          // Re-check crown position
          const newTopMarginSrc = minTopMargin / scale;
          if (crownY - cropY < newTopMarginSrc) {
            cropY = crownY - newTopMarginSrc;
          }
        }
      }
      // Final clamp to 0
      cropY = Math.max(0, cropY);
    }

    // Check chin position
    const chinInCrop = chinY - cropY; // Where chin appears relative to crop top
    const bottomInCrop = cropH; // Crop height in source
    if (chinInCrop + bottomMarginSrc > bottomInCrop) {
      // Chin would be cut off - this shouldn't happen with proper scaling
      // but if it does, prioritize showing full head over eye position
      cropY = Math.min(cropY, chinY + bottomMarginSrc - cropH);
    }

    // Ensure we don't go below the image
    if (cropY + cropH > sourceHeight) {
      cropY = sourceHeight - cropH;
    }

    // Final clamp
    cropY = Math.max(0, cropY);

    console.log('[CROP]', {
      source: { w: sourceWidth, h: sourceHeight },
      face: { y: face.y, h: face.h },
      crownY,
      chinY,
      scale: scale.toFixed(3),
      crop: { x: cropX.toFixed(0), y: cropY.toFixed(0), w: cropW.toFixed(0), h: cropH.toFixed(0) },
    });

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
  let adjCropW = cropW * zoomFactor;
  let adjCropH = cropH * zoomFactor;
  let adjCropX = cropX + (cropW - adjCropW) / 2 - userH * (cropW / spec.w);
  let adjCropY = cropY + (cropH - adjCropH) / 2 - userV * (cropH / spec.h);

  // CRITICAL: Enforce head framing constraints after zoom/pan adjustments
  if (faceData) {
    const crownY = faceData.y - faceData.h * 0.5;
    const chinY = faceData.y + faceData.h;
    const scale = spec.w / adjCropW;
    const minPaddingSrc = (spec.h * 0.08) / scale;

    // Ensure crown is visible with padding
    const minCropY = crownY - minPaddingSrc;
    if (adjCropY > minCropY) {
      adjCropY = minCropY;
    }

    // Ensure chin is visible with padding
    const maxCropY = chinY + minPaddingSrc - adjCropH;
    if (adjCropY < maxCropY) {
      adjCropY = maxCropY;
    }

    // Clamp to image bounds
    adjCropY = Math.max(0, adjCropY);

    // Limit horizontal offset
    const faceCenterX = faceData.x + faceData.w / 2;
    const maxHorizontalOffset = adjCropW * 0.15;
    const idealCropX = faceCenterX - adjCropW / 2;
    if (adjCropX < idealCropX - maxHorizontalOffset) {
      adjCropX = idealCropX - maxHorizontalOffset;
    } else if (adjCropX > idealCropX + maxHorizontalOffset) {
      adjCropX = idealCropX + maxHorizontalOffset;
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
