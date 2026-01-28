'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CameraGuides, CameraConditions } from '@/components/camera-guides';
import { useLiveFaceDetection } from '@/hooks/useLiveFaceDetection';

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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // Real-time face detection for camera preview
  const liveFaceData = useLiveFaceDetection(videoRef, showCamera);

  // Set video srcObject when stream is available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showCamera]);

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
      // Determine camera aspect ratio based on country's output spec
      // US: 2×2" = 1:1 (square)
      // UK/EU: 35×45mm = 7:9 ≈ 0.78 (portrait)
      // Canada: 50×70mm = 5:7 ≈ 0.71 (portrait)
      const aspectRatios: Record<string, number> = {
        us: 1,           // 2×2 inches (square)
        us_visa: 1,
        us_drivers: 1,
        green_card: 1,
        uk: 35/45,       // 35×45mm (portrait)
        uk_visa: 35/45,
        eu: 35/45,       // 35×45mm (portrait)
        schengen_visa: 35/45,
        germany: 35/45,
        france: 35/45,
        canada: 50/70,   // 50×70mm (portrait)
        india: 1,        // 2×2 inches (square, same as US)
        india_visa: 1,
        australia: 35/45,
        china: 33/48,    // 33×48mm (portrait)
        china_visa: 33/48,
        japan: 35/45,
        south_korea: 35/45,
        brazil: 50/70,   // 5×7cm (portrait)
        mexico: 35/45,
      };
      
      const targetAspect = aspectRatios[countryCode] || 1;
      const isPortrait = targetAspect < 1;
      
      // Request camera with country-appropriate aspect ratio
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: isPortrait ? 1440 : 1920, min: 1080 },
          height: { ideal: isPortrait ? 1920 : 1920, min: 1080 },
          aspectRatio: { 
            ideal: targetAspect, 
            min: targetAspect * 0.8, 
            max: targetAspect * 1.25 
          },
        },
      });
      setStream(mediaStream);
      setShowCamera(true);
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

    // DO NOT mirror the capture - passport photos must be un-mirrored
    // Preview is mirrored for UX (feels like a mirror), but saved image must be real
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

  const switchCamera = async () => {
    // Stop current stream
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    // Toggle facing mode
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    
    // Get new stream with switched camera
    try {
      const aspectRatios: Record<string, number> = {
        us: 1, us_visa: 1, us_drivers: 1, green_card: 1,
        uk: 35/45, uk_visa: 35/45, eu: 35/45, schengen_visa: 35/45,
        germany: 35/45, france: 35/45, canada: 50/70,
        india: 1, india_visa: 1, australia: 35/45,
        china: 33/48, china_visa: 33/48, japan: 35/45,
        south_korea: 35/45, brazil: 50/70, mexico: 35/45,
      };
      const targetAspect = aspectRatios[countryCode] || 1;
      const isPortrait = targetAspect < 1;
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newMode,
          width: { ideal: isPortrait ? 1440 : 1920, min: 1080 },
          height: { ideal: isPortrait ? 1920 : 1920, min: 1080 },
          aspectRatio: { ideal: targetAspect, min: targetAspect * 0.8, max: targetAspect * 1.25 },
        },
      });
      setStream(mediaStream);
    } catch {
      alert('Could not switch camera.');
    }
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
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-4">
          <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
            <div className="relative w-full flex justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-h-[80vh] rounded-xl object-contain"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              {/* Camera Guides Overlay */}
              {enableCameraGuides && (
                <CameraGuides
                  videoRef={videoRef}
                  countryCode={countryCode}
                  isActive={showCamera}
                  onConditionsChange={setCameraConditions}
                  faceData={liveFaceData}
                  mirror={facingMode === 'user'}
                />
              )}
              {/* Switch Camera Button */}
              <button
                onClick={switchCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
              >
                🔄
              </button>
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
