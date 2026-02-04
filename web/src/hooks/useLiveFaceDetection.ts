import { useEffect, useRef, useState, useCallback } from 'react';

export interface LiveFaceData {
  x: number;
  y: number;
  w: number;
  h: number;
  leftEye?: { x: number; y: number } | null;
  rightEye?: { x: number; y: number } | null;
}

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
}

// Singleton detector with VIDEO mode
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let videoFaceDetector: any = null;
let videoInitPromise: Promise<void> | null = null;

async function initVideoFaceDetector(): Promise<void> {
  if (videoFaceDetector) return;
  if (videoInitPromise) return videoInitPromise;

  videoInitPromise = (async () => {
    const { FaceDetector, FilesetResolver } = (await import(
      /* webpackIgnore: true */
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest'
    )) as MediaPipeVision;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      videoFaceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    } catch {
      // GPU fallback to CPU
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      videoFaceDetector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    }
  })();

  return videoInitPromise;
}

/**
 * Hook for real-time face detection on video stream
 * @param videoRef Reference to video element
 * @param isActive Whether detection should be running
 * @param intervalMs Detection interval (default 100ms = ~10fps)
 */
export function useLiveFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isActive: boolean,
  intervalMs: number = 100
): LiveFaceData | null {
  const [faceData, setFaceData] = useState<LiveFaceData | null>(null);
  // Start ready if detector already initialized (happens on remount)
  const [isReady, setIsReady] = useState(() => videoFaceDetector !== null);
  const animationFrameRef = useRef<number>(0);
  const lastDetectionRef = useRef<number>(0);

  // Initialize detector on mount
  useEffect(() => {
    if (videoFaceDetector) {
      setIsReady(true);
      return;
    }
    initVideoFaceDetector()
      .then(() => setIsReady(true))
      .catch((err) => console.error('Failed to init face detector:', err));
  }, []);

  const detectFace = useCallback(() => {
    const now = performance.now();
    if (now - lastDetectionRef.current < intervalMs) {
      // eslint-disable-next-line react-hooks/immutability
      animationFrameRef.current = requestAnimationFrame(detectFace);
      return;
    }
    lastDetectionRef.current = now;

    const video = videoRef.current;
    if (!video || !videoFaceDetector || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
      return;
    }

    try {
      const results = videoFaceDetector.detectForVideo(video, now);

      if (!results?.detections?.length) {
        setFaceData(null);
      } else {
        // Get largest face
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

        for (const kp of keypoints) {
          if (kp.x !== undefined && kp.y !== undefined) {
            const px = kp.x * video.videoWidth;
            const py = kp.y * video.videoHeight;
            if (kp.label === 'leftEye' || kp.index === 0)
              leftEye = { x: px, y: py };
            if (kp.label === 'rightEye' || kp.index === 1)
              rightEye = { x: px, y: py };
          }
        }

        // Estimate eyes if not detected
        if (!leftEye && !rightEye) {
          const eyeY = bb.originY + bb.height * 0.45;
          const eyeSpacing = bb.width * 0.2;
          const centerX = bb.originX + bb.width / 2;
          leftEye = { x: centerX - eyeSpacing, y: eyeY };
          rightEye = { x: centerX + eyeSpacing, y: eyeY };
        }

        setFaceData({
          x: bb.originX,
          y: bb.originY,
          w: bb.width,
          h: bb.height,
          leftEye,
          rightEye,
        });
      }
    } catch (err) {
      console.error('Face detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(detectFace);
  }, [videoRef, intervalMs]);

  // Run detection loop when active
  useEffect(() => {
    if (!isActive || !isReady) {
      cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(detectFace);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isActive, isReady, detectFace]);

  // Clear face data when deactivated
  useEffect(() => {
    if (!isActive) {
      setFaceData(null);
    }
  }, [isActive]);

  return faceData;
}
