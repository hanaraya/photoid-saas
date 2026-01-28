'use client';

import { Button } from '@/components/ui/button';

interface OutputViewProps {
  sheetDataUrl: string | null;
  isPaid: boolean;
  paymentError?: string | null;
  onBackToEditor: () => void;
  onRequestPayment: () => void;
  onDownloadSheet: () => void;
  onDownloadSingle: () => void;
  onPrint: () => void;
}

export function OutputView({
  sheetDataUrl,
  isPaid,
  paymentError,
  onBackToEditor,
  onRequestPayment,
  onDownloadSheet,
  onDownloadSingle,
  onPrint,
}: OutputViewProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-8">
      {/* Back button */}
      <button
        onClick={onBackToEditor}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors print-hide"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to editor
      </button>

      {/* Header */}
      <div className="text-center print-hide">
        <h2 className="text-2xl font-semibold tracking-tight">Your photos are ready</h2>
        <p className="mt-2 text-muted-foreground">
          Print on 4×6" glossy paper at 100% scale
        </p>
      </div>

      {/* Sheet preview - scrollable container */}
      <div className="overflow-x-auto print-container">
        <div className="flex justify-center min-w-fit px-4">
          {sheetDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sheetDataUrl}
              alt="Passport photo sheet"
              className="rounded-2xl shadow-2xl ring-1 ring-border/50 print-sheet"
              style={{ width: '500px', maxWidth: 'none', height: 'auto' }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isPaid ? (
        <div className="text-center space-y-4 print-hide">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Remove watermark to download
          </div>
          <div>
            <Button onClick={onRequestPayment} size="lg" className="h-12 px-8 text-base">
              Pay $4.99 & Download
            </Button>
          </div>
          {paymentError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
              {paymentError}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-center gap-3 print-hide">
          <Button onClick={onDownloadSheet} size="lg" className="gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download Sheet
          </Button>
          <Button onClick={onDownloadSingle} variant="outline" size="lg" className="gap-2">
            Download Single
          </Button>
          <Button variant="ghost" size="lg" onClick={onPrint} className="gap-2">
            🖨️ Print
          </Button>
        </div>
      )}
    </div>
  );
}
