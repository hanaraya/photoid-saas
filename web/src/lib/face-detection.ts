export interface FaceData {
  x: number;
  y: number;
  w: number;
  h: number;
  leftEye: { x: number; y: number } | null;
  rightEye: { x: number; y: number } | null;
  nose?: { x: number; y: number } | null;
  mouth?: { x: number; y: number } | null;
}

export interface FaceDetectionResult {
  face: FaceData | null;
  faceCount: number;
}

// MediaPipe module type (dynamic import)
interface FaceDetectorStatic {
  createFromOptions(
    vision: unknown,
    options: {
      baseOptions: {
        modelAssetPath: string;
        delegate?: 'GPU' | 'CPU';
      };
      runningMode: string;
      minDetectionConfidence: number;
    }
  ): Promise<unknown>;
}

interface MediaPipeVision {
  FaceDetector: FaceDetectorStatic;
  FilesetResolver: {
    forVisionTasks: (wasmPath: string) => Promise<unknown>;
  };
  [key: string]: unknown;
}

// MediaPipe service interface for easier testing
interface MediaPipeService {
  loadMediaPipe(): Promise<MediaPipeVision>;
}

class ProductionMediaPipeService implements MediaPipeService {
  async loadMediaPipe() {
    return await import(
      /* webpackIgnore: true */
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest'
    );
  }
}

// Export for testing purposes
export let mediaPipeService: MediaPipeService =
  new ProductionMediaPipeService();

// Function to inject a mock service for testing
export function setMediaPipeService(service: MediaPipeService) {
  mediaPipeService = service;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let faceDetector: any = null;
let initPromise: Promise<void> | null = null;

export async function initFaceDetector(): Promise<void> {
  if (faceDetector) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Load MediaPipe through the service
    const { FaceDetector, FilesetResolver } =
      await mediaPipeService.loadMediaPipe();

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.4,
      });
    } catch {
      // GPU fallback to CPU
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      faceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
        },
        runningMode: 'IMAGE',
        minDetectionConfidence: 0.4,
      });
    }
  })();

  return initPromise;
}

/**
 * Detect faces in an image and return the primary face + total count
 * Useful for moderation (detecting multiple people in photo)
 */
export async function detectFaces(
  imgElement: HTMLImageElement
): Promise<FaceDetectionResult> {
  if (!faceDetector) return { face: null, faceCount: 0 };

  try {
    const results = faceDetector.detect(imgElement);
    if (!results?.detections?.length) return { face: null, faceCount: 0 };

    const faceCount = results.detections.length;

    // Take the largest face
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const det = results.detections.sort((a: any, b: any) => {
      const areaA = a.boundingBox.width * a.boundingBox.height;
      const areaB = b.boundingBox.width * b.boundingBox.height;
      return areaB - areaA;
    })[0];

    const bb = det.boundingBox;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const keypoints: any[] = det.keypoints || [];

    let leftEye: { x: number; y: number } | null = null;
    let rightEye: { x: number; y: number } | null = null;
    let nose: { x: number; y: number } | null = null;
    let mouth: { x: number; y: number } | null = null;

    for (const kp of keypoints) {
      if (kp.x !== undefined && kp.y !== undefined) {
        const px = kp.x * imgElement.naturalWidth;
        const py = kp.y * imgElement.naturalHeight;
        if (kp.label === 'leftEye' || kp.index === 0)
          leftEye = { x: px, y: py };
        if (kp.label === 'rightEye' || kp.index === 1)
          rightEye = { x: px, y: py };
        if (kp.label === 'noseTip' || kp.index === 2) nose = { x: px, y: py };
        if (
          kp.label === 'mouth' ||
          kp.label === 'mouthCenter' ||
          kp.index === 3
        )
          mouth = { x: px, y: py };
      }
    }

    // Fallback: estimate eye positions from face bounding box if not detected
    // Eyes are typically at ~45% from top of face bounding box
    if (!leftEye && !rightEye) {
      const eyeY = bb.originY + bb.height * 0.45;
      const eyeSpacing = bb.width * 0.2;
      const centerX = bb.originX + bb.width / 2;
      leftEye = { x: centerX - eyeSpacing, y: eyeY };
      rightEye = { x: centerX + eyeSpacing, y: eyeY };
    } else if (!leftEye && rightEye) {
      // Estimate left eye from right eye position
      const eyeSpacing = bb.width * 0.4;
      leftEye = { x: rightEye.x - eyeSpacing, y: rightEye.y };
    } else if (leftEye && !rightEye) {
      // Estimate right eye from left eye position
      const eyeSpacing = bb.width * 0.4;
      rightEye = { x: leftEye.x + eyeSpacing, y: leftEye.y };
    }

    return {
      face: {
        x: bb.originX,
        y: bb.originY,
        w: bb.width,
        h: bb.height,
        leftEye,
        rightEye,
        nose,
        mouth,
      },
      faceCount,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Legacy function - returns only the primary face
 * @deprecated Use detectFaces() for moderation support
 */
export async function detectFace(
  imgElement: HTMLImageElement
): Promise<FaceData | null> {
  const result = await detectFaces(imgElement);
  return result.face;
}

export function isFaceDetectorReady(): boolean {
  return faceDetector !== null;
}

// Reset function for testing
export function resetFaceDetector(): void {
  faceDetector = null;
  initPromise = null;
}
