declare module 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest' {
  export class FaceDetector {
    static createFromOptions(
      vision: unknown,
      options: {
        baseOptions: {
          modelAssetPath: string;
          delegate?: string;
        };
        runningMode: string;
        minDetectionConfidence: number;
      }
    ): Promise<FaceDetector>;
    detect(image: HTMLImageElement): {
      detections: Array<{
        boundingBox: {
          originX: number;
          originY: number;
          width: number;
          height: number;
        };
        keypoints: Array<{
          x: number;
          y: number;
          label?: string;
          index?: number;
        }>;
      }>;
    };
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<unknown>;
  }
}
