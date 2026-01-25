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

    // Eye line Y
    let eyeY: number;
    if (face.leftEye && face.rightEye) {
      eyeY = (face.leftEye.y + face.rightEye.y) / 2;
    } else {
      eyeY = face.y + face.h * 0.35;
    }

    // Full head estimate (MediaPipe bbox is forehead-to-chin, crown is ~1.35x)
    const estimatedHeadH = face.h * 1.35;

    // Scale so head fits at target size
    const scale = spec.headTarget / estimatedHeadH;

    // Source crop dimensions
    const cropW = spec.w / scale;
    const cropH = spec.h / scale;

    // Center horizontally on face
    const cropX = faceCenterX - cropW / 2;

    // Position eye line correctly
    const targetEyeFromTop = spec.h - spec.eyeFromBottom;
    const eyeFromTopInSrc = targetEyeFromTop / scale;
    const cropY = eyeY - eyeFromTopInSrc;

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
  addWatermark: boolean
): void {
  const spec = specToPx(standard);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = spec.w;
  canvas.height = spec.h;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, spec.w, spec.h);

  const { cropX, cropY, cropW, cropH } = calculateCrop(
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
    faceData,
    standard
  );

  // Apply user adjustments
  const zoomFactor = 100 / userZoom;
  const adjCropW = cropW * zoomFactor;
  const adjCropH = cropH * zoomFactor;
  const adjCropX = cropX + (cropW - adjCropW) / 2 - userH * (cropW / spec.w);
  const adjCropY = cropY + (cropH - adjCropH) / 2 - userV * (cropH / spec.h);

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
  ctx.fillText('photoid.app', 0, Math.max(width / 6, 30));
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
    ctx.fillText('PREVIEW — photoid.app', 0, 0);
    ctx.restore();
  }
}
