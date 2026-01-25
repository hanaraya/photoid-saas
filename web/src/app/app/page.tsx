'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Header } from '@/components/header';
import { PhotoUpload } from '@/components/photo-upload';
import { PhotoEditor } from '@/components/photo-editor';

function AppContent() {
  const searchParams = useSearchParams();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  // Check for payment success from Stripe redirect
  useEffect(() => {
    if (searchParams.get('paid') === 'true') {
      setIsPaid(true);
    }
  }, [searchParams]);

  const handleImageLoaded = (file: Blob) => {
    setImageBlob(file);
  };

  const handleBack = () => {
    setImageBlob(null);
  };

  const handleRequestPayment = async () => {
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        // If Stripe isn't configured, simulate payment for demo
        const data = await res.json();
        if (data.error?.includes('not configured')) {
          // Demo mode: mark as paid
          setIsPaid(true);
          return;
        }
        throw new Error('Payment failed');
      }

      const data = await res.json();
      if (data.url) {
        // Save current state to sessionStorage before redirect
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Payment error:', error);
      // Fallback: demo mode
      setIsPaid(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {!imageBlob ? (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold sm:text-3xl">
                📸 Passport Photo Maker
              </h1>
              <p className="mt-2 text-muted-foreground">
                Upload a photo → auto-detect face → get printable passport photos
              </p>
            </div>

            <PhotoUpload onImageLoaded={handleImageLoaded} />

            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">🇺🇸 US Passport Photo Specs:</strong>{' '}
                2×2 inches · Head height 1&quot;–1⅜&quot; · White background ·
                Front-facing · Eyes open · Neutral expression
              </p>
              <p className="mt-2">
                <strong className="text-foreground">📄 Output:</strong> 4×6 inch
                printable sheet with multiple photos · 300 DPI
              </p>
              <p className="mt-2">
                <strong className="text-foreground">🔒 Privacy:</strong> All
                processing happens in your browser. Photos never leave your
                device.
              </p>
            </div>

            {isPaid && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-center text-sm">
                ✅ Payment successful! Upload your photo to get started.
              </div>
            )}
          </div>
        ) : (
          <PhotoEditor
            imageBlob={imageBlob}
            onBack={handleBack}
            isPaid={isPaid}
            onRequestPayment={handleRequestPayment}
          />
        )}
      </main>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}
