'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';

interface AdvancedControlsProps {
  zoom: number;
  brightness: number;
  onZoomChange: (value: number) => void;
  onBrightnessChange: (value: number) => void;
}

export function AdvancedControls({
  zoom,
  brightness,
  onZoomChange,
  onBrightnessChange,
}: AdvancedControlsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors list-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-medium text-sm">Advanced adjustments</div>
            <div className="text-xs text-muted-foreground">
              Zoom & brightness controls
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>

      <div className="border-t border-border/50 p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Zoom</span>
            <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">
              {zoom}%
            </span>
          </div>
          <Slider
            value={[zoom]}
            min={50}
            max={200}
            step={1}
            onValueChange={([v]) => onZoomChange(v)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Brightness</span>
            <span className="font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">
              {brightness}%
            </span>
          </div>
          <Slider
            value={[brightness]}
            min={50}
            max={150}
            step={1}
            onValueChange={([v]) => onBrightnessChange(v)}
          />
        </div>
      </div>
    </details>
  );
}
