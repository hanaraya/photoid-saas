'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CameraGuides, CameraConditions } from '@/components/camera-guides';

interface PhotoUploadProps {
  onImageLoaded: (file: Blob) => void;
  countryCode?: string;
  enableCameraGuides?: boolean;
}

export function PhotoUpload({ 
  onImageLoaded, 
  countryCode = 'us',
  enableCameraGuides = true,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraConditions, setCameraConditions] = useState<CameraConditions | null>(null);

  const handleFile = useCallback(
    (file: File | Blob) => {
      onImageLoaded(file);
    },
    [onImageLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      setShowCamera(true);
      // Wait for video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      alert('Camera access denied or not available.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror the capture
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          closeCamera();
          handleFile(blob);
        }
      },
      'image/jpeg',
      0.95
    );
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  return (
    <>
      <div
        className={`rounded-xl border-2 border-dashed p-12 sm:p-16 text-center cursor-pointer transition-all bg-card
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-card/80'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <svg
              className="h-10 w-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M12 16V4m0 0L8 8m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Drop your photo here</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              or use the buttons below
            </p>
          </div>
          <div
            className="flex flex-col sm:flex-row gap-3 mt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Select Photo
            </Button>
            <Button variant="secondary" onClick={openCamera} className="gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take Photo
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="max-w-[90vw] max-h-[60vh] rounded-xl"
                style={{ transform: 'scaleX(-1)' }}
              />
              {/* Camera Guides Overlay */}
              {enableCameraGuides && (
                <CameraGuides
                  videoRef={videoRef}
                  countryCode={countryCode}
                  isActive={showCamera}
                  onConditionsChange={setCameraConditions}
                />
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={capturePhoto} 
                className="gap-2"
                variant={cameraConditions?.allGood ? 'default' : 'secondary'}
              >
                📸 {cameraConditions?.allGood ? 'Capture Now!' : 'Capture'}
              </Button>
              <Button variant="secondary" onClick={closeCamera}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
