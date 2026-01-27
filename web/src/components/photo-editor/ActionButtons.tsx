'use client';

import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  bgRemoved: boolean;
  onGenerate: () => void;
}

export function ActionButtons({
  bgRemoved,
  onGenerate,
}: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      {/* Primary CTA */}
      <Button
        onClick={onGenerate}
        size="lg"
        className="w-full h-14 text-base font-medium gap-2"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
        </svg>
        Generate Printable Photos
      </Button>

      {/* Background removed indicator */}
      {bgRemoved && (
        <p className="text-center text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Background removed
        </p>
      )}
    </div>
  );
}
