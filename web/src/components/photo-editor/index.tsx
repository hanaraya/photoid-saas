'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { calculateMeasurementState } from '../compliance-overlay';
import { initFaceDetector, detectFaces } from '@/lib/face-detection';
import { moderateContent, checkFinalCompliance } from '@/lib/content-moderation';
import { ModerationBlocker, ModerationWarning } from '../moderation-blocker';
import { removeImageBackground, isBgRemovalReady, resetBgRemoval, getBgRemovalError } from '@/lib/bg-removal';
import { renderPassportPhoto, renderSheet, calculateCrop } from '@/lib/crop';
import { checkCompliance } from '@/lib/compliance';
import { analyzeImage } from '@/lib/image-analysis';
import { STANDARDS } from '@/lib/photo-standards';
import { analyzeBackground } from '@/lib/bg-analysis';
import { FeedbackModal } from '../feedback-modal';

// Import sub-components
import { PreviewPanel } from './PreviewPanel';
import { OriginalPhoto } from './OriginalPhoto';
import { ComplianceSummary } from './ComplianceSummary';
import { AdvancedControls } from './AdvancedControls';
import { ActionButtons } from './ActionButtons';
import { OutputView } from './OutputView';
import { LoadingOverlay } from './LoadingOverlay';

// Import types
import {
  type EditState,
  type PhotoEditorProps,
  type Step,
  type FaceStatus,
  type FaceData,
  type CropParams,
  type ComplianceCheck,
  type BgAnalysis,
  type ImageAnalysis,
  type ModerationResult,
  type FinalComplianceResult,
  type MeasurementState,
} from './types';

// Re-export types for external consumers
export type { EditState, FaceData };

export function PhotoEditor({
  imageBlob,
  onBack,
  isPaid,
  onRequestPayment,
  paymentError,
  initialStep = 'editing',
  initialEditState,
  initialCropParams,
  onEditStateChange,
}: PhotoEditorProps) {
  // Core state
  const [step, setStep] = useState<Step>(initialStep);
  const [standardId] = useState(initialEditState?.standardId ?? 'us');
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Analyzing your photo...');

  // Face detection state
  const [faceData, setFaceData] = useState<FaceData | null>(initialEditState?.faceData ?? null);
  const [cropParams, setCropParams] = useState<CropParams | undefined>(initialCropParams ?? initialEditState?.cropParams);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>(
    initialEditState?.faceData ? 'found' : initialCropParams || initialEditState?.cropParams ? 'found' : 'detecting'
  );

  // User adjustments
  const [userZoom, setUserZoom] = useState(initialEditState?.zoom ?? 100);
  const [userH, setUserH] = useState(initialEditState?.h ?? 0);
  const [userV, setUserV] = useState(initialEditState?.v ?? 0);
  const [userBrightness, setUserBrightness] = useState(initialEditState?.brightness ?? 100);

  // Background removal state
  const [bgRemoved, setBgRemoved] = useState(initialEditState?.bgRemoved ?? false);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgAnalysis, setBgAnalysis] = useState<BgAnalysis | null>(null);
  const [bgModelPreloading, setBgModelPreloading] = useState(false);

  // Sync bgModelPreloading with actual model state (handles edge cases/race conditions)
  useEffect(() => {
    if (bgModelPreloading && isBgRemovalReady()) {
      setBgModelPreloading(false);
    }
  }, [bgModelPreloading]);

  // Analysis & compliance state
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [measurementState, setMeasurementState] = useState<MeasurementState | null>(null);

  // UI state
  const [showDragHint, setShowDragHint] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [imageReady, setImageReady] = useState(false);

  // Output state
  const [sheetDataUrl, setSheetDataUrl] = useState<string | null>(null);
  const [finalComplianceResult, setFinalComplianceResult] = useState<FinalComplianceResult | null>(null);
  const [showComplianceWarning, setShowComplianceWarning] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Refs
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const passportCanvasRef = useRef<HTMLCanvasElement>(null);

  const standard = STANDARDS[standardId];

  // Report edit state changes to parent
  useEffect(() => {
    let processedImageDataUrl: string | undefined;
    if (bgRemoved && sourceImgRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = sourceImgRef.current.naturalWidth;
      canvas.height = sourceImgRef.current.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(sourceImgRef.current, 0, 0);
        processedImageDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      }
    }

    onEditStateChange?.({
      zoom: userZoom,
      h: userH,
      v: userV,
      brightness: userBrightness,
      standardId,
      bgRemoved,
      processedImageDataUrl,
      cropParams,
      faceData,
    });
  }, [userZoom, userH, userV, userBrightness, standardId, bgRemoved, cropParams, faceData, onEditStateChange]);

  // Load image and detect face
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    
    img.onload = async () => {
      if (cancelled) return;
      sourceImgRef.current = img;
      setImageReady(true);

      // Skip detection if we have pre-calculated crop params
      if (cropParams) {
        setLoading(false);
        return;
      }

      setLoadingText('Detecting face...');
      setFaceStatus('detecting');

      try {
        await initFaceDetector();
        const { face, faceCount } = await detectFaces(img);
        if (cancelled) return;

        const modResult = moderateContent(face, faceCount);
        setModerationResult(modResult);

        if (face) {
          setFaceData(face);
          setFaceStatus('found');

          const calculatedCrop = calculateCrop(img.naturalWidth, img.naturalHeight, face, standard);
          setCropParams(calculatedCrop);

          const analysis = analyzeBackground(img, face);
          setBgAnalysis(analysis);

          // Preload bg removal model if needed (only if not already loaded)
          if (analysis.needsRemoval && !isBgRemovalReady()) {
            setBgModelPreloading(true);
            import('@/lib/bg-removal')
              .then((m) => m.initBgRemoval())
              .then(() => { 
                // Always clear loading state - model loading is global singleton
                setBgModelPreloading(false); 
              })
              .catch((err) => { 
                console.error('[BG-REMOVAL] Preload failed:', err);
                setBgModelPreloading(false); 
              });
          }

          const imgAnalysis = analyzeImage(img, face);
          setImageAnalysis(imgAnalysis);
        } else {
          setFaceData(null);
          setFaceStatus('not-found');

          const calculatedCrop = calculateCrop(img.naturalWidth, img.naturalHeight, null, standard);
          setCropParams(calculatedCrop);

          const analysis = analyzeBackground(img, null);
          setBgAnalysis(analysis);

          const imgAnalysis = analyzeImage(img, null);
          setImageAnalysis(imgAnalysis);
        }
      } catch {
        if (!cancelled) {
          setFaceData(null);
          setFaceStatus('not-found');
        }
      }

      if (!cancelled) setLoading(false);
    };

    img.src = URL.createObjectURL(imageBlob);

    return () => {
      cancelled = true;
      if (img.src) URL.revokeObjectURL(img.src);
    };
  }, [imageBlob, cropParams, standard]);

  // Update compliance checks
  useEffect(() => {
    const img = sourceImgRef.current;
    if (!img) return;

    const bgOk = bgRemoved || (bgAnalysis !== null && !bgAnalysis.needsRemoval);
    const checks = checkCompliance(img.naturalWidth, img.naturalHeight, faceData, standard, bgOk, userZoom, imageAnalysis ?? undefined);
    setComplianceChecks(checks);
  }, [faceData, standard, bgRemoved, bgAnalysis, userZoom, imageAnalysis]);

  // Update measurement state for overlay
  useEffect(() => {
    if (!faceData || !passportCanvasRef.current) {
      setMeasurementState(null);
      return;
    }

    const canvasWidth = standard.w >= standard.h ? 280 : Math.round(280 * (standard.w / standard.h));
    const canvasHeight = standard.h >= standard.w ? 280 : Math.round(280 * (standard.h / standard.w));

    const state = calculateMeasurementState(faceData, standard, canvasWidth, canvasHeight, userZoom);
    setMeasurementState(state);
  }, [faceData, standard, userZoom]);

  // Auto-generate sheet when returning from payment
  useEffect(() => {
    if (initialStep === 'output' && step === 'output' && cropParams && !sheetDataUrl && imageReady) {
      const timer = setTimeout(() => {
        const passportCanvas = passportCanvasRef.current;
        const img = sourceImgRef.current;

        if (passportCanvas && img) {
          renderPassportPhoto(passportCanvas, img, faceData, standard, userZoom, userH, userV, userBrightness, !isPaid, cropParams);

          if (passportCanvas.width > 0) {
            const tempSheet = document.createElement('canvas');
            renderSheet(tempSheet, passportCanvas, standard, !isPaid);
            setSheetDataUrl(tempSheet.toDataURL('image/jpeg', 0.95));
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [initialStep, step, cropParams, sheetDataUrl, standard, isPaid, imageReady, faceData, userZoom, userH, userV, userBrightness]);

  // Background removal handler
  const handleBgRemoval = useCallback(async () => {
    setBgRemoving(true);
    try {
      const resultBlob = await removeImageBackground(imageBlob);

      const tempCanvas = document.createElement('canvas');
      const tempImg = new Image();
      tempImg.onload = () => {
        tempCanvas.width = tempImg.naturalWidth;
        tempCanvas.height = tempImg.naturalHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(tempImg, 0, 0);

        tempCanvas.toBlob(
          (compositeBlob) => {
            if (!compositeBlob) return;
            const newImg = new Image();
            newImg.onload = () => {
              sourceImgRef.current = newImg;
              setBgRemoved(true);
              setBgRemoving(false);
            };
            newImg.src = URL.createObjectURL(compositeBlob);
          },
          'image/jpeg',
          0.95
        );
      };
      tempImg.src = URL.createObjectURL(resultBlob);
    } catch (err) {
      console.error('BG removal failed:', err);
      setBgRemoving(false);
      // Silent fail - user can retry manually via the button
    }
  }, [imageBlob]);

  // Generate handler
  const handleGenerate = useCallback((bypassWarnings = false) => {
    const finalCheck = checkFinalCompliance(complianceChecks);
    setFinalComplianceResult(finalCheck);

    if (!finalCheck.canProceed) {
      setShowComplianceWarning(true);
      return;
    }

    if (finalCheck.issues.length > 0 && !bypassWarnings) {
      setShowComplianceWarning(true);
      return;
    }

    // Generate sheet
    const passportCanvas = passportCanvasRef.current;
    const img = sourceImgRef.current;
    if (passportCanvas && img) {
      renderPassportPhoto(passportCanvas, img, faceData, standard, userZoom, userH, userV, userBrightness, !isPaid, cropParams);
      const tempSheet = document.createElement('canvas');
      renderSheet(tempSheet, passportCanvas, standard, !isPaid);
      setSheetDataUrl(tempSheet.toDataURL('image/jpeg', 0.95));
    }

    setShowComplianceWarning(false);
    setStep('output');
  }, [complianceChecks, faceData, standard, userZoom, userH, userV, userBrightness, isPaid, cropParams]);

  // Download handlers
  const downloadSheet = useCallback(() => {
    if (!sheetDataUrl) return;
    const link = document.createElement('a');
    link.download = 'passport-photos-sheet.jpg';
    link.href = sheetDataUrl;
    link.click();

    if (isPaid && !hasDownloaded) {
      setHasDownloaded(true);
      setTimeout(() => setShowFeedbackModal(true), 1000);
    }
  }, [sheetDataUrl, isPaid, hasDownloaded]);

  const downloadSingle = useCallback(() => {
    const canvas = passportCanvasRef.current;
    const img = sourceImgRef.current;
    if (!canvas || !img) return;

    renderPassportPhoto(canvas, img, faceData, standard, userZoom, userH, userV, userBrightness, !isPaid, cropParams);

    const link = document.createElement('a');
    link.download = 'passport-photo.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();

    if (isPaid && !hasDownloaded) {
      setHasDownloaded(true);
      setTimeout(() => setShowFeedbackModal(true), 1000);
    }
  }, [faceData, standard, userZoom, userH, userV, userBrightness, isPaid, cropParams, hasDownloaded]);

  // Position change handler
  const handlePositionChange = useCallback((h: number, v: number) => {
    setUserH(h);
    setUserV(v);
  }, []);

  // Loading state
  if (loading) {
    return <LoadingOverlay text={loadingText} />;
  }

  // Output step
  if (step === 'output') {
    return (
      <>
        {/* Hidden canvas for rendering */}
        <canvas ref={passportCanvasRef} className="hidden" aria-hidden="true" />
        
        <OutputView
          sheetDataUrl={sheetDataUrl}
          isPaid={isPaid}
          paymentError={paymentError}
          onBackToEditor={() => setStep('editing')}
          onRequestPayment={onRequestPayment}
          onDownloadSheet={downloadSheet}
          onDownloadSingle={downloadSingle}
          onPrint={() => window.print()}
        />

        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          photoStandard={standard.name}
        />
      </>
    );
  }

  // Editing step
  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      {/* Moderation blocker */}
      {moderationResult && !moderationResult.allowed && (
        <ModerationBlocker result={moderationResult} onRetry={onBack} />
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Start over
      </button>

      {/* Moderation warnings */}
      {moderationResult && moderationResult.allowed && moderationResult.severity === 'warn' && (
        <ModerationWarning result={moderationResult} />
      )}

      {/* Hero preview panel */}
      <div className="relative">
        <PreviewPanel
          sourceImg={sourceImgRef.current}
          faceData={faceData}
          cropParams={cropParams}
          standard={standard}
          userZoom={userZoom}
          userH={userH}
          userV={userV}
          userBrightness={userBrightness}
          isPaid={isPaid}
          showWatermark={!isPaid}
          faceStatus={faceStatus}
          measurementState={measurementState}
          showOverlay={showOverlay}
          showDragHint={showDragHint}
          onToggleOverlay={() => setShowOverlay((prev) => !prev)}
          onHideDragHint={() => setShowDragHint(false)}
          onPositionChange={handlePositionChange}
          onZoomChange={setUserZoom}
          canvasRef={passportCanvasRef}
        />

        {/* Original photo thumbnail */}
        <div className="absolute -right-2 -bottom-2 z-10">
          <OriginalPhoto sourceImg={sourceImgRef.current} />
        </div>
      </div>

      {/* Prominent Background Removal CTA - shown when needed */}
      {bgAnalysis && bgAnalysis.needsRemoval && !bgRemoved && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎨</span>
              <div>
                <div className="font-medium text-amber-600 dark:text-amber-400">Background needs to be white</div>
                <div className="text-sm text-muted-foreground">{bgAnalysis.reason}</div>
              </div>
            </div>
            <Button
              onClick={handleBgRemoval}
              disabled={bgRemoving || bgModelPreloading}
              className="shrink-0"
            >
              {bgRemoving ? 'Removing...' : bgModelPreloading ? 'Loading...' : 'Remove Background'}
            </Button>
          </div>
        </div>
      )}

      {/* Background removed success */}
      {bgRemoved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div className="font-medium text-emerald-600 dark:text-emerald-400">Background removed successfully</div>
          </div>
        </div>
      )}

      {/* Unified feedback panel */}
      <ComplianceSummary
        checks={complianceChecks}
        bgAnalysis={bgAnalysis}
        bgRemoved={bgRemoved}
        onRemoveBg={handleBgRemoval}
        bgRemoving={bgRemoving}
        bgModelLoading={bgModelPreloading}
        onRetake={onBack}
      />

      {/* Advanced controls (collapsed) */}
      <AdvancedControls
        zoom={userZoom}
        brightness={userBrightness}
        onZoomChange={setUserZoom}
        onBrightnessChange={setUserBrightness}
      />

      {/* Action buttons */}
      <ActionButtons
        bgRemoved={bgRemoved}
        onGenerate={() => handleGenerate()}
      />

      {/* Compliance warning dialog */}
      <Dialog open={showComplianceWarning} onOpenChange={setShowComplianceWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {finalComplianceResult?.canProceed ? 'Some issues found' : 'Please fix these issues'}
            </DialogTitle>
            <DialogDescription>
              {finalComplianceResult?.canProceed
                ? 'Your photo may not be accepted for official use.'
                : 'These issues must be fixed before continuing.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {finalComplianceResult?.issues.map((issue) => (
              <div
                key={issue.id}
                className={`flex items-start gap-3 rounded-xl p-3 text-sm ${
                  issue.severity === 'error'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-amber-500/10 border border-amber-500/20'
                }`}
              >
                <span className={issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'}>
                  {issue.severity === 'error' ? '✗' : '!'}
                </span>
                <span>{issue.message}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowComplianceWarning(false)}>
              Go back
            </Button>
            {finalComplianceResult?.canProceed && (
              <Button onClick={() => handleGenerate(true)}>
                Continue anyway
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        photoStandard={standard.name}
      />
    </div>
  );
}
