'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
// CountrySelector removed - standard is now read-only in editor
import { ComplianceChecker } from './compliance-checker';
import {
  ComplianceOverlay,
  calculateMeasurementState,
  type MeasurementState,
} from './compliance-overlay';
import {
  type FaceData,
  initFaceDetector,
  detectFace,
} from '@/lib/face-detection';

// Re-export FaceData for consumers of EditState
export type { FaceData };
import { removeImageBackground } from '@/lib/bg-removal';
import {
  renderPassportPhoto,
  renderSheet,
  calculateCrop,
  type CropParams,
} from '@/lib/crop';
import { checkCompliance, type ComplianceCheck } from '@/lib/compliance';
import { analyzeImage, type ImageAnalysis } from '@/lib/image-analysis';
import { STANDARDS } from '@/lib/photo-standards';
import { analyzeBackground, type BgAnalysis } from '@/lib/bg-analysis';

export interface EditState {
  zoom: number;
  h: number;
  v: number;
  brightness: number;
  standardId: string;
  bgRemoved?: boolean;
  processedImageDataUrl?: string; // Base64 of the processed image (with bg removed)
  cropParams?: CropParams; // Calculated crop parameters (saves re-running face detection)
  faceData?: FaceData | null; // Save face detection results for compliance checks
}

interface PhotoEditorProps {
  imageBlob: Blob;
  onBack: () => void;
  isPaid: boolean;
  onRequestPayment: () => void;
  paymentError?: string | null;
  initialStep?: 'editing' | 'output';
  initialEditState?: EditState;
  initialCropParams?: CropParams; // Skip face detection if provided
  onEditStateChange?: (state: EditState) => void;
}

type Step = 'editing' | 'output';

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
  const [step, setStep] = useState<Step>(initialStep);
  const [standardId] = useState(initialEditState?.standardId ?? 'us');
  const [faceData, setFaceData] = useState<FaceData | null>(
    initialEditState?.faceData ?? null
  );
  const [cropParams, setCropParams] = useState<CropParams | undefined>(
    initialCropParams ?? initialEditState?.cropParams
  );
  const [faceStatus, setFaceStatus] = useState<
    'detecting' | 'found' | 'not-found'
  >(
    initialEditState?.faceData
      ? 'found'
      : initialCropParams || initialEditState?.cropParams
        ? 'found'
        : 'detecting'
  );
  const [userZoom, setUserZoom] = useState(initialEditState?.zoom ?? 100);
  const [userH, setUserH] = useState(initialEditState?.h ?? 0);
  const [userV, setUserV] = useState(initialEditState?.v ?? 0);
  const [userBrightness, setUserBrightness] = useState(
    initialEditState?.brightness ?? 100
  );
  const [bgRemoved, setBgRemoved] = useState(
    initialEditState?.bgRemoved ?? false
  );
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgAnalysis, setBgAnalysis] = useState<BgAnalysis | null>(null);
  const [bgModelPreloading, setBgModelPreloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading face detection...');
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>(
    []
  );
  const [showDragHint, setShowDragHint] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [measurementState, setMeasurementState] = useState<MeasurementState | null>(null);
  const [sheetDataUrl, setSheetDataUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false); // Track when source image is loaded
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);

  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const passportCanvasRef = useRef<HTMLCanvasElement>(null);
  // sheetCanvasRef removed - sheet is now generated directly in handleGenerate
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, h: 0, v: 0 });
  const userHRef = useRef(0);
  const userVRef = useRef(0);

  // Keep refs in sync
  useEffect(() => {
    userHRef.current = userH;
  }, [userH]);
  useEffect(() => {
    userVRef.current = userV;
  }, [userV]);

  // Report edit state changes to parent (for saving before payment)
  useEffect(() => {
    // Capture processed image if background was removed
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
      cropParams, // Include calculated crop params for restore
      faceData, // Include face data for compliance checks
    });
  }, [
    userZoom,
    userH,
    userV,
    userBrightness,
    standardId,
    bgRemoved,
    cropParams,
    faceData,
    onEditStateChange,
  ]);

  const standard = STANDARDS[standardId];

  // Load image and detect face (skip detection if we have pre-calculated crop params)
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = async () => {
      if (cancelled) return;
      sourceImgRef.current = img;
      setImageReady(true); // Signal that image is loaded and ready for rendering

      // If we have pre-calculated crop params (e.g., returning from payment), skip face detection
      if (cropParams) {
        setLoading(false);
        return;
      }

      setLoadingText('Detecting face...');
      setFaceStatus('detecting');

      try {
        await initFaceDetector();
        const face = await detectFace(img);
        if (cancelled) return;

        if (face) {
          setFaceData(face);
          setFaceStatus('found');

          // Calculate and store crop params for later use
          const standard = STANDARDS[standardId];
          const calculatedCrop = calculateCrop(
            img.naturalWidth,
            img.naturalHeight,
            face,
            standard
          );
          setCropParams(calculatedCrop);

          // Analyze background with face data for exclusion
          const analysis = analyzeBackground(img, face);
          setBgAnalysis(analysis);

          // If bg removal is needed, start preloading the model in background
          if (analysis.needsRemoval) {
            setBgModelPreloading(true);
            import('@/lib/bg-removal')
              .then((m) => m.initBgRemoval())
              .then(() => {
                if (!cancelled) setBgModelPreloading(false);
              })
              .catch(() => {
                if (!cancelled) setBgModelPreloading(false);
              });
          }

          // Run image analysis for blur/sharpness and face angle
          const imgAnalysis = analyzeImage(img, face);
          setImageAnalysis(imgAnalysis);
        } else {
          setFaceData(null);
          setFaceStatus('not-found');

          // Calculate fallback crop params
          const standard = STANDARDS[standardId];
          const calculatedCrop = calculateCrop(
            img.naturalWidth,
            img.naturalHeight,
            null,
            standard
          );
          setCropParams(calculatedCrop);

          // Analyze without face exclusion
          const analysis = analyzeBackground(img, null);
          setBgAnalysis(analysis);

          // Run image analysis (blur detection still works without face)
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
  }, [imageBlob, cropParams, standardId]);

  // Render passport photo on any change
  const renderPreview = useCallback(() => {
    const canvas = passportCanvasRef.current;
    const img = sourceImgRef.current;
    if (!canvas || !img) return;

    renderPassportPhoto(
      canvas,
      img,
      faceData,
      standard,
      userZoom,
      userH,
      userV,
      userBrightness,
      !isPaid,
      cropParams // Use pre-calculated crop params if available
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- imageReady triggers re-render when image loads
  }, [
    faceData,
    standard,
    userZoom,
    userH,
    userV,
    userBrightness,
    isPaid,
    cropParams,
    imageReady,
  ]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Auto-generate sheet when starting on output step (e.g., returning from payment)
  useEffect(() => {
    // Only generate when image is ready AND we have crop params AND we're on output step
    if (
      initialStep === 'output' &&
      step === 'output' &&
      cropParams &&
      !sheetDataUrl &&
      imageReady
    ) {
      // Delay to ensure canvas is rendered and renderPreview has executed
      const timer = setTimeout(() => {
        const passportCanvas = passportCanvasRef.current;
        const img = sourceImgRef.current;

        if (passportCanvas && img) {
          // First render the passport photo to the canvas
          renderPassportPhoto(
            passportCanvas,
            img,
            faceData,
            standard,
            userZoom,
            userH,
            userV,
            userBrightness,
            !isPaid,
            cropParams
          );

          // Then generate the sheet from it
          if (passportCanvas.width > 0) {
            const tempSheet = document.createElement('canvas');
            renderSheet(tempSheet, passportCanvas, standard, !isPaid);
            setSheetDataUrl(tempSheet.toDataURL('image/jpeg', 0.95));
          }
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [
    initialStep,
    step,
    cropParams,
    sheetDataUrl,
    standard,
    isPaid,
    imageReady,
    faceData,
    userZoom,
    userH,
    userV,
    userBrightness,
  ]);

  // Update compliance checks
  useEffect(() => {
    const img = sourceImgRef.current;
    if (!img) return;

    // Consider bg compliant if removed OR analysis says it's already white
    const bgOk = bgRemoved || (bgAnalysis !== null && !bgAnalysis.needsRemoval);

    const checks = checkCompliance(
      img.naturalWidth,
      img.naturalHeight,
      faceData,
      standard,
      bgOk,
      userZoom,
      imageAnalysis ?? undefined
    );
    setComplianceChecks(checks);
  }, [faceData, standard, bgRemoved, bgAnalysis, userZoom, imageAnalysis]);

  // Update measurement state for overlay
  useEffect(() => {
    const canvas = passportCanvasRef.current;
    if (!faceData || !canvas) {
      setMeasurementState(null);
      return;
    }

    // Calculate canvas display dimensions
    const canvasWidth =
      standard.w >= standard.h
        ? 200
        : Math.round(200 * (standard.w / standard.h));
    const canvasHeight =
      standard.h >= standard.w
        ? 200
        : Math.round(200 * (standard.h / standard.w));

    const state = calculateMeasurementState(
      faceData,
      standard,
      canvasWidth,
      canvasHeight,
      userZoom
    );
    setMeasurementState(state);
  }, [faceData, standard, userZoom]);

  // Background removal
  const handleBgRemoval = async () => {
    setBgRemoving(true);
    try {
      const resultBlob = await removeImageBackground(imageBlob);

      // Create new image from the transparent result, composite on white
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

        // Convert composited canvas to a new image for the editor
        tempCanvas.toBlob(
          (compositeBlob) => {
            if (!compositeBlob) return;
            const newImg = new Image();
            newImg.onload = () => {
              sourceImgRef.current = newImg;
              setBgRemoved(true);
              setBgRemoving(false);
              renderPreview();
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
      alert('Background removal failed. Try with a clearer photo.');
    }
  };

  // Drag handlers
  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setShowDragHint(false);

    const pos =
      'touches' in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };

    dragStartRef.current = {
      x: pos.x,
      y: pos.y,
      h: userHRef.current,
      v: userVRef.current,
    };
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const pos =
        'touches' in e
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : { x: e.clientX, y: e.clientY };

      const canvas = passportCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = 400 / rect.width;
      const scaleY = 400 / rect.height;

      const newH = Math.max(
        -300,
        Math.min(
          300,
          dragStartRef.current.h + (pos.x - dragStartRef.current.x) * scaleX
        )
      );
      const newV = Math.max(
        -300,
        Math.min(
          300,
          dragStartRef.current.v + (pos.y - dragStartRef.current.y) * scaleY
        )
      );

      setUserH(newH);
      setUserV(newV);
    };

    const onEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  // Scroll to zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -3 : 3;
    setUserZoom((prev) => Math.max(50, Math.min(200, prev + delta)));
  }, []);

  // Generate sheet and show output
  const handleGenerate = () => {
    renderPreview();
    // Render sheet to a temporary canvas and capture as data URL
    const tempSheet = document.createElement('canvas');
    const passportCanvas = passportCanvasRef.current;
    if (passportCanvas) {
      renderSheet(tempSheet, passportCanvas, standard, !isPaid);
      setSheetDataUrl(tempSheet.toDataURL('image/jpeg', 0.95));
    }
    setStep('output');
  };

  // Downloads
  const downloadSheet = () => {
    if (!sheetDataUrl) return;
    const link = document.createElement('a');
    link.download = 'passport-photos-sheet.jpg';
    link.href = sheetDataUrl;
    link.click();
  };

  const downloadSingle = () => {
    const canvas = passportCanvasRef.current;
    const img = sourceImgRef.current;
    if (!canvas || !img) return;

    // Ensure canvas is rendered before download (fixes blank canvas issue in output view)
    renderPassportPhoto(
      canvas,
      img,
      faceData,
      standard,
      userZoom,
      userH,
      userV,
      userBrightness,
      !isPaid,
      cropParams
    );

    const link = document.createElement('a');
    link.download = 'passport-photo.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // Loading overlay
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm">{loadingText}</p>
        </div>
      </div>
    );
  }

  if (step === 'output') {
    return (
      <div className="space-y-6">
        {/* Hidden canvas for generating passport photo - needed even in output view */}
        <canvas ref={passportCanvasRef} className="hidden" aria-hidden="true" />

        <button
          onClick={() => setStep('editing')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors print-hide"
        >
          ← Back to editor
        </button>

        <div className="text-center print-hide">
          <h2 className="text-2xl font-bold">Your Passport Photos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            4×6 inch sheet · Print at 100% scale on 4×6 glossy paper
          </p>
        </div>

        <div className="flex justify-center print-container">
          {sheetDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sheetDataUrl}
              alt="Passport photo sheet"
              className="max-w-full rounded-lg shadow-2xl print-sheet"
              style={{ maxWidth: '600px', height: 'auto' }}
            />
          ) : (
            <div className="text-muted-foreground text-sm">
              Generating sheet...
            </div>
          )}
        </div>

        {!isPaid ? (
          <div className="text-center space-y-4 print-hide">
            <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm">
              🔒 Pay $4.99 to remove watermark and download
            </div>
            <div>
              <Button onClick={onRequestPayment} size="lg" className="gap-2">
                💳 Pay & Download — $4.99
              </Button>
            </div>
            {paymentError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
                ⚠️ {paymentError}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 print-hide">
            <Button onClick={downloadSheet} className="gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Download Sheet
            </Button>
            <Button
              onClick={downloadSingle}
              variant="secondary"
              className="gap-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="10" r="3" />
                <path d="M6 21v-1a6 6 0 0112 0v1" />
              </svg>
              Download Single
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.print()}
              className="gap-2"
            >
              🖨️ Print
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Start over
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source image panel */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Original Photo
            </span>
          </div>
          <div className="relative flex items-center justify-center p-4 min-h-[300px]">
            {sourceImgRef.current && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sourceImgRef.current.src}
                alt="Source"
                className="max-w-full max-h-[400px] rounded-lg"
              />
            )}
            <Badge
              className={`absolute top-6 right-6 ${
                faceStatus === 'found'
                  ? 'bg-green-500/15 text-green-500 border-green-500/30'
                  : faceStatus === 'not-found'
                    ? 'bg-red-500/15 text-red-500 border-red-500/30'
                    : 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30'
              }`}
              variant="outline"
            >
              {faceStatus === 'found' && '✓ Face detected'}
              {faceStatus === 'not-found' && '✗ No face found'}
              {faceStatus === 'detecting' && 'Detecting...'}
            </Badge>
          </div>
        </div>

        {/* Passport preview panel */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Passport Photo Preview
            </span>
          </div>
          <div className="relative flex items-center justify-center p-4 min-h-[300px]">
            <div className="relative">
              <canvas
                ref={passportCanvasRef}
                className="rounded border border-border bg-white cursor-grab active:cursor-grabbing"
                style={{
                  touchAction: 'none',
                  userSelect: 'none',
                  // Dynamic size based on aspect ratio, max 200px on longest side
                  width:
                    standard.w >= standard.h
                      ? '200px'
                      : `${Math.round(200 * (standard.w / standard.h))}px`,
                  height:
                    standard.h >= standard.w
                      ? '200px'
                      : `${Math.round(200 * (standard.h / standard.w))}px`,
                }}
                onMouseDown={onDragStart}
                onTouchStart={onDragStart}
                onWheel={onWheel}
              />
              {/* Compliance Measurement Overlay */}
              {measurementState && (
                <ComplianceOverlay
                  faceData={faceData}
                  standard={standard}
                  canvasWidth={
                    standard.w >= standard.h
                      ? 200
                      : Math.round(200 * (standard.w / standard.h))
                  }
                  canvasHeight={
                    standard.h >= standard.w
                      ? 200
                      : Math.round(200 * (standard.h / standard.w))
                  }
                  headHeightPercent={measurementState.headHeightPercent}
                  eyePositionPercent={measurementState.eyePositionPercent}
                  topMarginPercent={measurementState.topMarginPercent}
                  bottomMarginPercent={measurementState.bottomMarginPercent}
                  complianceStatus={measurementState.complianceStatus}
                  visible={showOverlay}
                  showToggle={true}
                  onToggle={() => setShowOverlay((prev) => !prev)}
                />
              )}
            </div>
            {showDragHint && (
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary pointer-events-none">
                ✋ Drag to reposition · Scroll to zoom
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground min-w-[100px]">
              Photo Standard
            </label>
            <div className="flex-1 flex items-center gap-2">
              <div className="px-3 py-2 rounded-md border border-border bg-muted/50 text-sm">
                {standard.flag} {standard.name} ({standard.description})
              </div>
              <span className="text-xs text-muted-foreground">
                Start over to change
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground min-w-[100px]">
              Zoom
            </label>
            <div className="flex-1">
              <Slider
                value={[userZoom]}
                min={50}
                max={200}
                step={1}
                onValueChange={([v]) => setUserZoom(v)}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-[40px] text-right">
              {userZoom}%
            </span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground min-w-[100px]">
              Brightness
            </label>
            <div className="flex-1">
              <Slider
                value={[userBrightness]}
                min={50}
                max={150}
                step={1}
                onValueChange={([v]) => setUserBrightness(v)}
              />
            </div>
            <span className="text-xs text-muted-foreground min-w-[40px] text-right">
              {userBrightness}%
            </span>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <ComplianceChecker checks={complianceChecks} />

      {/* Background Analysis + Actions */}
      {bgAnalysis && !bgRemoved && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            bgAnalysis.needsRemoval
              ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'
              : 'border-green-500/30 bg-green-500/5 text-green-400'
          }`}
        >
          <span className="font-medium">
            {bgAnalysis.needsRemoval ? '⚠️ ' : '✅ '}
            Background:
          </span>{' '}
          {bgAnalysis.reason}
          {bgModelPreloading && bgAnalysis.needsRemoval && (
            <span className="ml-2 text-xs text-muted-foreground">
              (AI model loading...)
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Only show bg removal button if needed OR not yet removed */}
        {!bgRemoved && (bgAnalysis?.needsRemoval || bgAnalysis === null) && (
          <Button
            onClick={handleBgRemoval}
            variant="secondary"
            disabled={bgRemoving}
            className="gap-2"
          >
            {bgRemoving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Removing Background...
              </>
            ) : (
              <>🎨 Remove Background</>
            )}
          </Button>
        )}

        {/* Show optional removal for borderline cases */}
        {!bgRemoved &&
          bgAnalysis &&
          !bgAnalysis.needsRemoval &&
          bgAnalysis.score < 80 && (
            <Button
              onClick={handleBgRemoval}
              variant="ghost"
              disabled={bgRemoving}
              className="gap-2 text-muted-foreground"
              size="sm"
            >
              {bgRemoving ? 'Removing...' : '🎨 Remove anyway'}
            </Button>
          )}

        {bgRemoved && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            ✅ Background removed
          </div>
        )}

        <Button onClick={handleGenerate} className="gap-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
          </svg>
          Generate Printable Sheet
        </Button>
      </div>
    </div>
  );
}
