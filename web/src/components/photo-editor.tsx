'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { CountrySelector } from './country-selector';
import { ComplianceChecker } from './compliance-checker';
import { type FaceData, initFaceDetector, detectFace } from '@/lib/face-detection';
import { removeImageBackground } from '@/lib/bg-removal';
import { renderPassportPhoto, renderSheet } from '@/lib/crop';
import { checkCompliance, type ComplianceCheck } from '@/lib/compliance';
import { STANDARDS } from '@/lib/photo-standards';
import { analyzeBackground, type BgAnalysis } from '@/lib/bg-analysis';

interface PhotoEditorProps {
  imageBlob: Blob;
  onBack: () => void;
  isPaid: boolean;
  onRequestPayment: () => void;
}

type Step = 'editing' | 'output';

export function PhotoEditor({
  imageBlob,
  onBack,
  isPaid,
  onRequestPayment,
}: PhotoEditorProps) {
  const [step, setStep] = useState<Step>('editing');
  const [standardId, setStandardId] = useState('us');
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [faceStatus, setFaceStatus] = useState<'detecting' | 'found' | 'not-found'>('detecting');
  const [userZoom, setUserZoom] = useState(100);
  const [userH, setUserH] = useState(0);
  const [userV, setUserV] = useState(0);
  const [userBrightness, setUserBrightness] = useState(100);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgAnalysis, setBgAnalysis] = useState<BgAnalysis | null>(null);
  const [bgModelPreloading, setBgModelPreloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Loading face detection...');
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [showDragHint, setShowDragHint] = useState(true);
  const [sheetDataUrl, setSheetDataUrl] = useState<string | null>(null);

  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const passportCanvasRef = useRef<HTMLCanvasElement>(null);
  const sheetCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, h: 0, v: 0 });
  const userHRef = useRef(0);
  const userVRef = useRef(0);

  // Keep refs in sync
  useEffect(() => { userHRef.current = userH; }, [userH]);
  useEffect(() => { userVRef.current = userV; }, [userV]);

  const standard = STANDARDS[standardId];

  // Load image and detect face
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = async () => {
      if (cancelled) return;
      sourceImgRef.current = img;

      setLoadingText('Detecting face...');
      setFaceStatus('detecting');

      try {
        await initFaceDetector();
        const face = await detectFace(img);
        if (cancelled) return;

        if (face) {
          setFaceData(face);
          setFaceStatus('found');

          // Analyze background with face data for exclusion
          const analysis = analyzeBackground(img, face);
          setBgAnalysis(analysis);

          // If bg removal is needed, start preloading the model in background
          if (analysis.needsRemoval) {
            setBgModelPreloading(true);
            import('@/lib/bg-removal').then(m => m.initBgRemoval()).then(() => {
              if (!cancelled) setBgModelPreloading(false);
            }).catch(() => {
              if (!cancelled) setBgModelPreloading(false);
            });
          }
        } else {
          setFaceData(null);
          setFaceStatus('not-found');

          // Analyze without face exclusion
          const analysis = analyzeBackground(img, null);
          setBgAnalysis(analysis);
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
  }, [imageBlob]);

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
      !isPaid
    );
  }, [faceData, standard, userZoom, userH, userV, userBrightness, isPaid]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

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
      userZoom
    );
    setComplianceChecks(checks);
  }, [faceData, standard, bgRemoved, bgAnalysis, userZoom]);

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
        tempCanvas.toBlob((compositeBlob) => {
          if (!compositeBlob) return;
          const newImg = new Image();
          newImg.onload = () => {
            sourceImgRef.current = newImg;
            setBgRemoved(true);
            setBgRemoving(false);
            renderPreview();
          };
          newImg.src = URL.createObjectURL(compositeBlob);
        }, 'image/jpeg', 0.95);
      };
      tempImg.src = URL.createObjectURL(resultBlob);
    } catch (err) {
      console.error('BG removal failed:', err);
      setBgRemoving(false);
      alert('Background removal failed. Try with a clearer photo.');
    }
  };

  // Drag handlers
  const onDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
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
    },
    []
  );

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
        Math.min(300, dragStartRef.current.h + (pos.x - dragStartRef.current.x) * scaleX)
      );
      const newV = Math.max(
        -300,
        Math.min(300, dragStartRef.current.v + (pos.y - dragStartRef.current.y) * scaleY)
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
    if (!canvas) return;
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
        <button
          onClick={() => setStep('editing')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to editor
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold">Your Passport Photos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            4×6 inch sheet · Print at 100% scale on 4×6 glossy paper
          </p>
        </div>

        <div className="flex justify-center">
          {sheetDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sheetDataUrl}
              alt="Passport photo sheet"
              className="max-w-full rounded-lg shadow-2xl"
              style={{ maxWidth: '600px', height: 'auto' }}
            />
          ) : (
            <div className="text-muted-foreground text-sm">Generating sheet...</div>
          )}
        </div>

        {!isPaid ? (
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm">
              🔒 Pay $4.99 to remove watermark and download
            </div>
            <div>
              <Button onClick={onRequestPayment} size="lg" className="gap-2">
                💳 Pay & Download — $4.99
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
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
            <Button onClick={downloadSingle} variant="secondary" className="gap-2">
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
            <Button variant="secondary" onClick={() => window.print()} className="gap-2">
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
            <canvas
              ref={passportCanvasRef}
              className="w-[200px] h-[200px] rounded border border-border bg-white cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none', userSelect: 'none' }}
              onMouseDown={onDragStart}
              onTouchStart={onDragStart}
              onWheel={onWheel}
            />
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
            <div className="flex-1">
              <CountrySelector
                value={standardId}
                onValueChange={(v) => {
                  setStandardId(v);
                  setUserZoom(100);
                  setUserH(0);
                  setUserV(0);
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-muted-foreground min-w-[100px]">Zoom</label>
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
            <label className="text-sm text-muted-foreground min-w-[100px]">Brightness</label>
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
        <div className={`rounded-lg border p-3 text-sm ${
          bgAnalysis.needsRemoval
            ? 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'
            : 'border-green-500/30 bg-green-500/5 text-green-400'
        }`}>
          <span className="font-medium">
            {bgAnalysis.needsRemoval ? '⚠️ ' : '✅ '}
            Background:
          </span>{' '}
          {bgAnalysis.reason}
          {bgModelPreloading && bgAnalysis.needsRemoval && (
            <span className="ml-2 text-xs text-muted-foreground">(AI model loading...)</span>
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
        {!bgRemoved && bgAnalysis && !bgAnalysis.needsRemoval && bgAnalysis.score < 80 && (
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
