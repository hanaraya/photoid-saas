import { type CropParams } from '@/lib/crop';
import { type FaceData } from '@/lib/face-detection';
import { type ComplianceCheck } from '@/lib/compliance';
import { type BgAnalysis } from '@/lib/bg-analysis';
import { type ImageAnalysis } from '@/lib/image-analysis';
import { type ModerationResult, type FinalComplianceResult } from '@/lib/content-moderation';
import { type MeasurementState } from '../compliance-overlay';
import { type PhotoStandard } from '@/lib/photo-standards';

// Re-export for convenience
export type { FaceData, CropParams, ComplianceCheck, BgAnalysis, ImageAnalysis, ModerationResult, FinalComplianceResult, MeasurementState, PhotoStandard };

export interface EditState {
  zoom: number;
  h: number;
  v: number;
  brightness: number;
  standardId: string;
  bgRemoved?: boolean;
  processedImageDataUrl?: string;
  cropParams?: CropParams;
  faceData?: FaceData | null;
}

export interface PhotoEditorProps {
  imageBlob: Blob;
  onBack: () => void;
  isPaid: boolean;
  onRequestPayment: () => void;
  paymentError?: string | null;
  initialStep?: 'editing' | 'output';
  initialEditState?: EditState;
  initialCropParams?: CropParams;
  onEditStateChange?: (state: EditState) => void;
}

export type Step = 'editing' | 'output';
export type FaceStatus = 'detecting' | 'found' | 'not-found';

// Shared state interface for child components
export interface EditorState {
  faceData: FaceData | null;
  cropParams?: CropParams;
  faceStatus: FaceStatus;
  userZoom: number;
  userH: number;
  userV: number;
  userBrightness: number;
  bgRemoved: boolean;
  bgRemoving: boolean;
  bgAnalysis: BgAnalysis | null;
  bgModelPreloading: boolean;
  complianceChecks: ComplianceCheck[];
  showDragHint: boolean;
  showOverlay: boolean;
  measurementState: MeasurementState | null;
  imageAnalysis: ImageAnalysis | null;
  moderationResult: ModerationResult | null;
  standard: PhotoStandard;
  isPaid: boolean;
}
