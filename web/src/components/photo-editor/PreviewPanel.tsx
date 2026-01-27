'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  ComplianceOverlay,
} from '../compliance-overlay';
import { renderPassportPhoto } from '@/lib/crop';
import { type FaceData, type CropParams, type MeasurementState, type PhotoStandard } from './types';

interface PreviewPanelProps {
  sourceImg: HTMLImageElement | null;
  faceData: FaceData | null;
  cropParams?: CropParams;
  standard: PhotoStandard;
  userZoom: number;
  userH: number;
  userV: number;
  userBrightness: number;
  isPaid: boolean;
  showWatermark: boolean;
  faceStatus: 'detecting' | 'found' | 'not-found';
  measurementState: MeasurementState | null;
  showOverlay: boolean;
  showDragHint: boolean;
  onToggleOverlay: () => void;
  onHideDragHint: () => void;
  onPositionChange: (h: number, v: number) => void;
  onZoomChange: (zoom: number) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function PreviewPanel({
  sourceImg,
  faceData,
  cropParams,
  standard,
  userZoom,
  userH,
  userV,
  userBrightness,
  showWatermark,
  faceStatus,
  measurementState,
  showOverlay,
  showDragHint,
  onToggleOverlay,
  onHideDragHint,
  onPositionChange,
  onZoomChange,
  canvasRef,
}: PreviewPanelProps) {
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, h: 0, v: 0 });
  const userHRef = useRef(userH);
  const userVRef = useRef(userV);

  // Keep refs in sync
  useEffect(() => {
    userHRef.current = userH;
  }, [userH]);
  
  useEffect(() => {
    userVRef.current = userV;
  }, [userV]);

  // Calculate canvas dimensions based on standard aspect ratio
  const canvasWidth = standard.w >= standard.h ? 280 : Math.round(280 * (standard.w / standard.h));
  const canvasHeight = standard.h >= standard.w ? 280 : Math.round(280 * (standard.h / standard.w));

  // Render preview whenever dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceImg) return;

    renderPassportPhoto(
      canvas,
      sourceImg,
      faceData,
      standard,
      userZoom,
      userH,
      userV,
      userBrightness,
      showWatermark,
      cropParams
    );
  }, [canvasRef, sourceImg, faceData, standard, userZoom, userH, userV, userBrightness, showWatermark, cropParams]);

  // Drag start handler
  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    onHideDragHint();

    const pos = 'touches' in e
      ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
      : { x: e.clientX, y: e.clientY };

    dragStartRef.current = {
      x: pos.x,
      y: pos.y,
      h: userHRef.current,
      v: userVRef.current,
    };
  }, [onHideDragHint]);

  // Global drag move/end handlers
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const pos = 'touches' in e
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : { x: e.clientX, y: e.clientY };

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = 400 / rect.width;
      const scaleY = 400 / rect.height;

      const newH = Math.max(-300, Math.min(300, dragStartRef.current.h + (pos.x - dragStartRef.current.x) * scaleX));
      const newV = Math.max(-300, Math.min(300, dragStartRef.current.v + (pos.y - dragStartRef.current.y) * scaleY));

      onPositionChange(newH, newV);
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
  }, [canvasRef, onPositionChange]);

  // Wheel zoom handler
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -3 : 3;
    const newZoom = Math.max(50, Math.min(200, userZoom + delta));
    onZoomChange(newZoom);
  }, [userZoom, onZoomChange]);

  return (
    <div className="relative">
      {/* Standard badge */}
      <div className="absolute -top-3 left-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1 text-xs font-medium shadow-sm">
          {standard.flag} {standard.name}
        </span>
      </div>

      <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-muted/30 to-muted/10 p-8">
        <div className="relative flex items-center justify-center">
          {/* Main canvas */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="rounded-lg border-2 border-border/50 bg-white cursor-grab active:cursor-grabbing shadow-lg"
              style={{
                touchAction: 'none',
                userSelect: 'none',
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
              }}
              onMouseDown={onDragStart}
              onTouchStart={onDragStart}
              onWheel={onWheel}
            />
            
            {/* Compliance overlay */}
            {measurementState && (
              <ComplianceOverlay
                faceData={faceData}
                standard={standard}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
                headHeightPercent={measurementState.headHeightPercent}
                eyePositionPercent={measurementState.eyePositionPercent}
                topMarginPercent={measurementState.topMarginPercent}
                bottomMarginPercent={measurementState.bottomMarginPercent}
                complianceStatus={measurementState.complianceStatus}
                visible={showOverlay}
                showToggle={true}
                onToggle={onToggleOverlay}
              />
            )}

            {/* Face status indicator */}
            {faceStatus !== 'found' && (
              <div className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                faceStatus === 'not-found'
                  ? 'bg-red-500/90 text-white'
                  : 'bg-amber-500/90 text-white'
              }`}>
                {faceStatus === 'not-found' ? '✗ No face' : 'Detecting...'}
              </div>
            )}
          </div>
        </div>

        {/* Drag hint */}
        {showDragHint && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Drag to reposition • Scroll to zoom
          </p>
        )}
      </div>
    </div>
  );
}
