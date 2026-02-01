'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Header } from '@/components/header';
import { PhotoUpload } from '@/components/photo-upload';
import { PhotoEditor, EditState } from '@/components/photo-editor';
import { CountrySelector } from '@/components/country-selector';
import { STANDARDS } from '@/lib/photo-standards';

const STORAGE_KEY = 'passport-photo-pending';
const EDIT_STATE_KEY = 'passport-photo-edit-state';
const VERIFIED_SESSION_KEY = 'passport-photo-verified';

function AppContent() {
  const searchParams = useSearchParams();
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );
  const [restoredFromPayment, setRestoredFromPayment] = useState(false);
  const [restoredEditState, setRestoredEditState] = useState<
    EditState | undefined
  >(undefined);
  const [selectedStandardId, setSelectedStandardId] = useState('us');
  const [countryFromUrl, setCountryFromUrl] = useState(false);
  const currentEditStateRef = useRef<EditState | undefined>(undefined);

  // Set country from URL parameter (e.g., /app?country=uk)
  // Syncing URL state to component state is a valid pattern
   
  useEffect(() => {
    const country = searchParams.get('country');
    if (country && STANDARDS[country]) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setSelectedStandardId(country);
      setCountryFromUrl(true);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [searchParams]);

  // Verify payment and restore photo after Stripe redirect
  useEffect(() => {
    const verifyAndRestore = async () => {
      const sessionId = searchParams.get('session_id');

      // Check if we have a previously verified session in this browser session
      const verifiedSession = sessionStorage.getItem(VERIFIED_SESSION_KEY);
      if (verifiedSession) {
        setIsPaid(true);
      }

      // If returning from Stripe with a session_id, verify it
      if (sessionId) {
        try {
          const res = await fetch(
            `/api/verify-session?session_id=${encodeURIComponent(sessionId)}`
          );
          const data = await res.json();

          if (data.verified) {
            setIsPaid(true);
            // Store verified status for this browser session
            sessionStorage.setItem(VERIFIED_SESSION_KEY, sessionId);

            // Try to restore the saved photo and edit state
            const savedPhoto = sessionStorage.getItem(STORAGE_KEY);
            const savedEditState = sessionStorage.getItem(EDIT_STATE_KEY);
            if (savedPhoto) {
              const response = await fetch(savedPhoto);
              const blob = await response.blob();
              setImageBlob(blob);
              setRestoredFromPayment(true); // Mark that we're coming from payment
              sessionStorage.removeItem(STORAGE_KEY);

              // Restore edit state if available
              if (savedEditState) {
                try {
                  setRestoredEditState(JSON.parse(savedEditState));
                } catch (e) {
                  console.error('Failed to parse edit state:', e);
                }
                sessionStorage.removeItem(EDIT_STATE_KEY);
              }
            }
          } else {
            setVerificationError(data.error || 'Payment verification failed');
          }
        } catch (error) {
          console.error('Verification error:', error);
          setVerificationError('Failed to verify payment. Please try again.');
        }
      }

      setIsRestoring(false);
    };

    verifyAndRestore();
  }, [searchParams]);

  const handleImageLoaded = (file: Blob) => {
    setImageBlob(file);
    // Reset payment state when uploading a new photo (not returning from Stripe)
    // Only reset if not currently restoring from payment redirect
    if (!isRestoring) {
      setRestoredFromPayment(false);
      setRestoredEditState(undefined);
    }
  };

  const handleBack = () => {
    setImageBlob(null);
    // Reset payment-related state so next photo starts fresh in editor
    setRestoredFromPayment(false);
    setRestoredEditState(undefined);
  };

  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Convert Blob to base64 for storage
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleRequestPayment = async () => {
    setPaymentError(null);

    try {
      // Save photo and edit state to sessionStorage before redirect
      if (imageBlob) {
        try {
          // If background was removed, save the processed image instead of original
          const editState = currentEditStateRef.current;
          if (editState?.bgRemoved && editState?.processedImageDataUrl) {
            // Save processed image (with background removed)
            sessionStorage.setItem(
              STORAGE_KEY,
              editState.processedImageDataUrl
            );
          } else {
            // Save original image
            const base64 = await blobToBase64(imageBlob);
            sessionStorage.setItem(STORAGE_KEY, base64);
          }
          // Save edit state (without the large processedImageDataUrl to save space)
          if (editState) {
            const stateToSave = { ...editState };
            delete stateToSave.processedImageDataUrl; // Don't duplicate the image data
            sessionStorage.setItem(EDIT_STATE_KEY, JSON.stringify(stateToSave));
          }
        } catch (error) {
          console.error('Failed to save photo:', error);
          // Continue with payment even if save fails
        }
      }

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Checkout error:', data);
        setPaymentError(
          data.error || 'Payment service unavailable. Please try again.'
        );
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setPaymentError('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(
        'Network error. Please check your connection and try again.'
      );
    }
  };

  // Show loading while verifying payment and restoring photo
  if (isRestoring) {
    const sessionId = searchParams.get('session_id');
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-muted-foreground">
              {sessionId ? 'Verifying payment...' : 'Loading...'}
            </p>
          </div>
        </main>
      </div>
    );
  }

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
                Snap a selfie → auto-detect face → get printable passport
                photos
              </p>
            </div>

            {/* Country/Standard Selection */}
            <div className="space-y-2">
              {countryFromUrl ? (
                // Simplified view when coming from country-specific page
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{STANDARDS[selectedStandardId]?.flag}</span>
                    <span className="font-medium">{STANDARDS[selectedStandardId]?.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCountryFromUrl(false)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <label className="text-sm font-medium text-foreground">
                    Select Photo Type
                  </label>
                  <CountrySelector
                    value={selectedStandardId}
                    onValueChange={setSelectedStandardId}
                  />
                </>
              )}
            </div>

            <PhotoUpload onImageLoaded={handleImageLoaded} />

            <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">
                  {STANDARDS[selectedStandardId]?.flag}{' '}
                  {STANDARDS[selectedStandardId]?.name} Specs:
                </strong>{' '}
                {STANDARDS[selectedStandardId]?.description} · White background
                · Front-facing · Eyes open · Neutral expression
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
                ✅ Payment verified! Take your photo to get started.
              </div>
            )}

            {verificationError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-600 dark:text-red-400">
                ⚠️ {verificationError}
              </div>
            )}
          </div>
        ) : (
          <PhotoEditor
            imageBlob={imageBlob}
            onBack={handleBack}
            isPaid={isPaid}
            onRequestPayment={handleRequestPayment}
            paymentError={paymentError}
            initialStep={restoredFromPayment ? 'output' : 'editing'}
            initialEditState={
              restoredEditState ?? {
                zoom: 100,
                h: 0,
                v: 0,
                brightness: 100,
                standardId: selectedStandardId,
              }
            }
            onEditStateChange={(state) => {
              currentEditStateRef.current = state;
            }}
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
