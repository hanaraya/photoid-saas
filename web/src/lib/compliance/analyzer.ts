/**
 * Image Analyzer for Passport Photo Compliance
 * Analyzes images and produces ImageAnalysis objects for the compliance checker
 */

import { ImageAnalysis, FaceDetection } from './types';

/**
 * Analyze an image element and extract all properties needed for compliance checking
 */
export async function analyzeImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageData,
  faceDetectionResult?: FaceDetection
): Promise<ImageAnalysis> {
  // Get image data
  const { imageData, width, height } = getImageData(imageSource);
  
  // Analyze various aspects
  const brightness = calculateBrightness(imageData);
  const contrast = calculateContrast(imageData);
  const sharpness = await calculateSharpness(imageData, width, height);
  const { backgroundColor, backgroundUniformity } = analyzeBackground(imageData, width, height);
  
  // Use provided face detection or create default
  const face = faceDetectionResult || createDefaultFaceDetection();
  
  return {
    width,
    height,
    aspectRatio: width / height,
    brightness,
    contrast,
    sharpness,
    backgroundColor,
    backgroundUniformity,
    face,
    // These would typically come from ML models
    hasGlasses: false, // TODO: Integrate glasses detection
    hasSmile: false, // TODO: Integrate smile detection
    hasHeadwear: false, // TODO: Integrate headwear detection
    eyesOpen: true, // TODO: Integrate eye state detection
    mouthClosed: true, // TODO: Integrate mouth state detection
  };
}

/**
 * Get ImageData from various sources
 */
function getImageData(source: HTMLImageElement | HTMLCanvasElement | ImageData): {
  imageData: ImageData;
  width: number;
  height: number;
} {
  if (source instanceof ImageData) {
    return { imageData: source, width: source.width, height: source.height };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  if (source instanceof HTMLImageElement) {
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    ctx.drawImage(source, 0, 0);
  } else {
    canvas.width = source.width;
    canvas.height = source.height;
    ctx.drawImage(source, 0, 0);
  }
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { imageData, width: canvas.width, height: canvas.height };
}

/**
 * Calculate average brightness (0-255)
 */
function calculateBrightness(imageData: ImageData): number {
  const data = imageData.data;
  let totalBrightness = 0;
  const pixelCount = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    // Using perceived brightness formula
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalBrightness += (0.299 * r + 0.587 * g + 0.114 * b);
  }
  
  return totalBrightness / pixelCount;
}

/**
 * Calculate contrast (0-1)
 */
function calculateContrast(imageData: ImageData): number {
  const data = imageData.data;
  let min = 255;
  let max = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
    min = Math.min(min, luminance);
    max = Math.max(max, luminance);
  }
  
  return (max - min) / 255;
}

/**
 * Calculate sharpness using Laplacian variance (0-1 normalized)
 */
async function calculateSharpness(
  imageData: ImageData,
  width: number,
  height: number
): Promise<number> {
  const data = imageData.data;
  
  // Convert to grayscale
  const gray: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    gray.push((data[i] + data[i + 1] + data[i + 2]) / 3);
  }
  
  // Apply Laplacian operator
  let variance = 0;
  let count = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Laplacian kernel: [0, 1, 0], [1, -4, 1], [0, 1, 0]
      const laplacian = 
        -4 * gray[idx] +
        gray[idx - 1] + gray[idx + 1] +
        gray[idx - width] + gray[idx + width];
      
      variance += laplacian * laplacian;
      count++;
    }
  }
  
  variance = variance / count;
  
  // Normalize to 0-1 (typical variance ranges from 0 to ~10000)
  // Higher variance = sharper image
  return Math.min(1, Math.sqrt(variance) / 100);
}

/**
 * Analyze background color and uniformity
 */
function analyzeBackground(
  imageData: ImageData,
  width: number,
  height: number
): { backgroundColor: string; backgroundUniformity: number } {
  const data = imageData.data;
  
  // Sample corners and edges (typically background areas)
  const cornerSize = Math.floor(Math.min(width, height) * 0.1);
  const samples: { r: number; g: number; b: number }[] = [];
  
  // Top-left corner
  for (let y = 0; y < cornerSize; y++) {
    for (let x = 0; x < cornerSize; x++) {
      const idx = (y * width + x) * 4;
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  }
  
  // Top-right corner
  for (let y = 0; y < cornerSize; y++) {
    for (let x = width - cornerSize; x < width; x++) {
      const idx = (y * width + x) * 4;
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  }
  
  // Bottom-left corner
  for (let y = height - cornerSize; y < height; y++) {
    for (let x = 0; x < cornerSize; x++) {
      const idx = (y * width + x) * 4;
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  }
  
  // Bottom-right corner
  for (let y = height - cornerSize; y < height; y++) {
    for (let x = width - cornerSize; x < width; x++) {
      const idx = (y * width + x) * 4;
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  }
  
  // Calculate average color
  let avgR = 0, avgG = 0, avgB = 0;
  for (const sample of samples) {
    avgR += sample.r;
    avgG += sample.g;
    avgB += sample.b;
  }
  avgR = Math.round(avgR / samples.length);
  avgG = Math.round(avgG / samples.length);
  avgB = Math.round(avgB / samples.length);
  
  // Calculate uniformity (standard deviation based)
  let variance = 0;
  for (const sample of samples) {
    variance += Math.pow(sample.r - avgR, 2) + 
                Math.pow(sample.g - avgG, 2) + 
                Math.pow(sample.b - avgB, 2);
  }
  variance = variance / (samples.length * 3);
  const stdDev = Math.sqrt(variance);
  
  // Convert to uniformity (0-1, where 1 is perfectly uniform)
  // Max reasonable stdDev is around 100
  const uniformity = Math.max(0, 1 - (stdDev / 100));
  
  // Convert to hex
  const backgroundColor = rgbToHex(avgR, avgG, avgB);
  
  return { backgroundColor, backgroundUniformity: uniformity };
}

/**
 * Convert RGB to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

/**
 * Create a default face detection result when none is provided
 */
function createDefaultFaceDetection(): FaceDetection {
  return {
    detected: false,
    count: 0,
    confidence: 0,
  };
}

/**
 * Convert face detection from popular libraries to our format
 */
export function convertFaceApiResult(
  faceApiResult: {
    detection: {
      box: { x: number; y: number; width: number; height: number };
      score: number;
    };
    landmarks?: {
      getLeftEye: () => { x: number; y: number }[];
      getRightEye: () => { x: number; y: number }[];
      getNose: () => { x: number; y: number }[];
      getMouth: () => { x: number; y: number }[];
      getJawOutline: () => { x: number; y: number }[];
    };
    angle?: { pitch: number; yaw: number; roll: number };
  }[]
): FaceDetection {
  if (!faceApiResult || faceApiResult.length === 0) {
    return createDefaultFaceDetection();
  }
  
  const face = faceApiResult[0];
  const landmarks = face.landmarks ? {
    leftEye: centerOf(face.landmarks.getLeftEye()),
    rightEye: centerOf(face.landmarks.getRightEye()),
    nose: centerOf(face.landmarks.getNose()),
    mouth: centerOf(face.landmarks.getMouth()),
    chin: lastOf(face.landmarks.getJawOutline()),
  } : undefined;
  
  return {
    detected: true,
    count: faceApiResult.length,
    confidence: face.detection.score,
    boundingBox: {
      x: face.detection.box.x,
      y: face.detection.box.y,
      width: face.detection.box.width,
      height: face.detection.box.height,
    },
    landmarks,
    rotation: face.angle,
  };
}

function centerOf(points: { x: number; y: number }[]): { x: number; y: number } {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function lastOf(points: { x: number; y: number }[]): { x: number; y: number } {
  return points[points.length - 1] || { x: 0, y: 0 };
}

/**
 * Convert MediaPipe face detection result to our format
 */
export function convertMediaPipeResult(
  results: {
    detections: {
      boundingBox: { xCenter: number; yCenter: number; width: number; height: number };
      keypoints: { x: number; y: number; name?: string }[];
    }[];
  },
  imageWidth: number,
  imageHeight: number
): FaceDetection {
  if (!results.detections || results.detections.length === 0) {
    return createDefaultFaceDetection();
  }
  
  const detection = results.detections[0];
  const box = detection.boundingBox;
  
  // Convert normalized coordinates to pixels
  const boundingBox = {
    x: (box.xCenter - box.width / 2) * imageWidth,
    y: (box.yCenter - box.height / 2) * imageHeight,
    width: box.width * imageWidth,
    height: box.height * imageHeight,
  };
  
  // Extract landmarks by name
  const keypoints = detection.keypoints;
  const getKeypoint = (name: string) => {
    const kp = keypoints.find(k => k.name === name);
    return kp ? { x: kp.x * imageWidth, y: kp.y * imageHeight } : { x: 0, y: 0 };
  };
  
  return {
    detected: true,
    count: results.detections.length,
    confidence: 0.9, // MediaPipe doesn't provide confidence by default
    boundingBox,
    landmarks: {
      leftEye: getKeypoint('leftEye'),
      rightEye: getKeypoint('rightEye'),
      nose: getKeypoint('noseTip'),
      mouth: getKeypoint('mouthCenter'),
      chin: { x: boundingBox.x + boundingBox.width / 2, y: boundingBox.y + boundingBox.height },
    },
  };
}
