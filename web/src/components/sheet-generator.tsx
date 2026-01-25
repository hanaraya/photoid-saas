'use client';

import { useEffect, useRef } from 'react';
import { renderSheet } from '@/lib/crop';
import { type PhotoStandard } from '@/lib/photo-standards';

interface SheetGeneratorProps {
  passportCanvas: HTMLCanvasElement;
  standard: PhotoStandard;
  addWatermark: boolean;
}

export function SheetGenerator({
  passportCanvas,
  standard,
  addWatermark,
}: SheetGeneratorProps) {
  const sheetCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = sheetCanvasRef.current;
    if (!canvas) return;
    renderSheet(canvas, passportCanvas, standard, addWatermark);
  }, [passportCanvas, standard, addWatermark]);

  return (
    <div className="text-center">
      <canvas
        ref={sheetCanvasRef}
        className="mx-auto max-w-full rounded-lg shadow-2xl"
        style={{ maxWidth: '600px', height: 'auto' }}
      />
    </div>
  );
}
