/**
 * Analyze the background of a photo to determine if bg removal is needed.
 * Samples pixels around the edges (where background typically is) and checks
 * if they're already white/light enough for passport standards.
 *
 * Returns a score 0-100 (100 = perfectly white background, 0 = dark/complex bg)
 * and a recommendation.
 */

export interface BgAnalysis {
  score: number; // 0-100
  averageRgb: { r: number; g: number; b: number };
  needsRemoval: boolean;
  reason: string;
}

export function analyzeBackground(
  img: HTMLImageElement,
  faceData: { x: number; y: number; w: number; h: number } | null
): BgAnalysis {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { score: 0, averageRgb: { r: 0, g: 0, b: 0 }, needsRemoval: true, reason: 'Could not analyze' };
  }

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  const w = canvas.width;
  const h = canvas.height;

  // Define sample regions around the edges, AVOIDING the face area
  // We sample: top strip, bottom strip, left strip, right strip, corners
  const samplePoints: { x: number; y: number }[] = [];
  const margin = Math.floor(Math.min(w, h) * 0.05); // 5% inset
  const step = Math.max(4, Math.floor(Math.min(w, h) / 50)); // sample every N pixels

  // Face exclusion zone (expanded by 30%)
  let faceLeft = 0, faceRight = w, faceTop = 0, faceBottom = h;
  if (faceData) {
    const expand = 0.3;
    faceLeft = faceData.x - faceData.w * expand;
    faceRight = faceData.x + faceData.w * (1 + expand);
    faceTop = faceData.y - faceData.h * expand;
    faceBottom = faceData.y + faceData.h * (1 + expand);
  }

  const isInFace = (px: number, py: number): boolean => {
    return px >= faceLeft && px <= faceRight && py >= faceTop && py <= faceBottom;
  };

  // Top strip
  for (let x = margin; x < w - margin; x += step) {
    for (let y = margin; y < Math.min(h * 0.15, h - margin); y += step) {
      if (!isInFace(x, y)) samplePoints.push({ x, y });
    }
  }

  // Bottom strip
  for (let x = margin; x < w - margin; x += step) {
    for (let y = Math.max(h * 0.85, margin); y < h - margin; y += step) {
      if (!isInFace(x, y)) samplePoints.push({ x, y });
    }
  }

  // Left strip
  for (let x = margin; x < Math.min(w * 0.15, w - margin); x += step) {
    for (let y = margin; y < h - margin; y += step) {
      if (!isInFace(x, y)) samplePoints.push({ x, y });
    }
  }

  // Right strip
  for (let x = Math.max(w * 0.85, margin); x < w - margin; x += step) {
    for (let y = margin; y < h - margin; y += step) {
      if (!isInFace(x, y)) samplePoints.push({ x, y });
    }
  }

  // Four corners (extra weight)
  const cornerSize = Math.floor(Math.min(w, h) * 0.1);
  const corners = [
    { sx: margin, sy: margin },                           // top-left
    { sx: w - cornerSize - margin, sy: margin },           // top-right
    { sx: margin, sy: h - cornerSize - margin },           // bottom-left
    { sx: w - cornerSize - margin, sy: h - cornerSize - margin }, // bottom-right
  ];
  for (const corner of corners) {
    for (let x = corner.sx; x < corner.sx + cornerSize; x += step) {
      for (let y = corner.sy; y < corner.sy + cornerSize; y += step) {
        if (!isInFace(x, y)) samplePoints.push({ x, y });
      }
    }
  }

  if (samplePoints.length === 0) {
    return { score: 0, averageRgb: { r: 0, g: 0, b: 0 }, needsRemoval: true, reason: 'Could not sample background' };
  }

  // Sample pixels
  let totalR = 0, totalG = 0, totalB = 0;
  let whiteCount = 0;     // RGB all > 230
  let lightCount = 0;     // RGB all > 200
  let uniformCount = 0;   // Low variance between R, G, B (grayish)

  for (const pt of samplePoints) {
    const pixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
    const r = pixel[0], g = pixel[1], b = pixel[2];
    totalR += r;
    totalG += g;
    totalB += b;

    if (r > 230 && g > 230 && b > 230) whiteCount++;
    if (r > 200 && g > 200 && b > 200) lightCount++;
    
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    if (maxC - minC < 30) uniformCount++;
  }

  const n = samplePoints.length;
  const avgR = Math.round(totalR / n);
  const avgG = Math.round(totalG / n);
  const avgB = Math.round(totalB / n);

  const whitePct = (whiteCount / n) * 100;
  const lightPct = (lightCount / n) * 100;
  const uniformPct = (uniformCount / n) * 100;

  // Score calculation:
  // - High white percentage = high score
  // - Light + uniform = moderate score
  // - Dark or colorful = low score
  let score = 0;
  score += whitePct * 0.5;           // 50% weight on white pixels
  score += lightPct * 0.3;           // 30% weight on light pixels
  score += uniformPct * 0.2;         // 20% weight on uniform color

  score = Math.min(100, Math.round(score));

  // Decision thresholds
  let needsRemoval: boolean;
  let reason: string;

  if (score >= 80) {
    needsRemoval = false;
    reason = 'Background is already white/light — looks good!';
  } else if (score >= 55) {
    needsRemoval = false;
    reason = `Background is mostly light (score: ${score}/100). Removal optional.`;
  } else {
    needsRemoval = true;
    if (lightPct < 30) {
      reason = `Dark background detected (avg RGB: ${avgR},${avgG},${avgB}). Removal recommended.`;
    } else if (uniformPct < 40) {
      reason = `Complex/textured background detected. Removal recommended.`;
    } else {
      reason = `Background isn't white enough for passport standards. Removal recommended.`;
    }
  }

  return {
    score,
    averageRgb: { r: avgR, g: avgG, b: avgB },
    needsRemoval,
    reason,
  };
}
