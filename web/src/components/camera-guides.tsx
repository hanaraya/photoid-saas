'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  calculateOvalDimensions,
  analyzeFacePosition,
  analyzeDistance,
  analyzeBrightness,
  analyzeHeadTilt,
  checkAllConditions,
  FacePositionResult,
  DistanceResult,
  BrightnessResult,
  HeadTiltResult,
  CameraConditions,
  OvalDimensions,
} from '@/lib/camera-analysis';

export interface CameraGuidesProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  countryCode: string;
  isActive: boolean;
  onConditionsChange?: (conditions: CameraConditions) => void;
  onAutoCapture?: () => void;
  enableCountdown?: boolean;
  faceData?: {
    x: number;
    y: number;
    w: number;
    h: number;
    leftEye?: { x: number; y: number } | null;
    rightEye?: { x: number; y: number } | null;
  } | null;
}

interface AnalysisState {
  position: FacePositionResult;
  distance: DistanceResult;
  brightness: BrightnessResult;
  tilt: HeadTiltResult;
  conditions: CameraConditions;
}

const ANALYSIS_INTERVAL_MS = 100; // ~10fps

export function CameraGuides({
  videoRef,
  countryCode,
  isActive,
  onConditionsChange,
  onAutoCapture,
  enableCountdown = false,
  faceData: externalFaceData,
}: CameraGuidesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastAnalysisRef = useRef<number>(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  // Video source dimensions (raw pixels)
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  // Actual rendered dimensions on screen (accounting for object-fit)
  const [renderDimensions, setRenderDimensions] = useState({ 
    width: 640, 
    height: 480,
    offsetX: 0,
    offsetY: 0 
  });
  const [analysisState, setAnalysisState] = useState<AnalysisState>(() => {
    const defaultPosition: FacePositionResult = {
      isCentered: false,
      faceDetected: false,
      horizontalOffset: 0,
      verticalOffset: 0,
      direction: 'center',
      verticalDirection: 'center',
      overlapPercent: 0,
    };
    const defaultDistance: DistanceResult = {
      status: 'too-far',
      isGood: false,
      message: 'Position your face in the oval',
      percentFromTarget: 0,
    };
    const defaultBrightness: BrightnessResult = {
      status: 'good',
      isGood: true,
      icon: '☀️',
      message: 'Checking lighting...',
      score: 50,
    };
    const defaultTilt: HeadTiltResult = {
      isLevel: true,
      eyesDetected: false,
      tiltAngle: 0,
      direction: 'level',
    };
    return {
      position: defaultPosition,
      distance: defaultDistance,
      brightness: defaultBrightness,
      tilt: defaultTilt,
      conditions: checkAllConditions(defaultPosition, defaultDistance, defaultBrightness, defaultTilt),
    };
  });
  
  // Reset state when camera becomes active (handles "start over" case)
  useEffect(() => {
    if (isActive) {
      const defaultPosition: FacePositionResult = {
        isCentered: false,
        faceDetected: false,
        horizontalOffset: 0,
        verticalOffset: 0,
        direction: 'center',
        verticalDirection: 'center',
        overlapPercent: 0,
      };
      const defaultDistance: DistanceResult = {
        status: 'too-far',
        isGood: false,
        message: 'Position your face in the oval',
        percentFromTarget: 0,
      };
      const defaultBrightness: BrightnessResult = {
        status: 'good',
        isGood: true,
        icon: '☀️',
        message: 'Checking lighting...',
        score: 50,
      };
      const defaultTilt: HeadTiltResult = {
        isLevel: true,
        eyesDetected: false,
        tiltAngle: 0,
        direction: 'level',
      };
      setAnalysisState({
        position: defaultPosition,
        distance: defaultDistance,
        brightness: defaultBrightness,
        tilt: defaultTilt,
        conditions: checkAllConditions(defaultPosition, defaultDistance, defaultBrightness, defaultTilt),
      });
      setCountdown(null);
    }
  }, [isActive]);

  // Calculate oval dimensions based on country and RENDERED dimensions
  // This ensures the oval matches what the user actually sees on screen
  const oval = useMemo<OvalDimensions>(() => {
    return calculateOvalDimensions(countryCode, renderDimensions.width, renderDimensions.height);
  }, [countryCode, renderDimensions.width, renderDimensions.height]);
  
  // Main analysis loop
  const runAnalysis = useCallback(() => {
    const now = Date.now();
    if (now - lastAnalysisRef.current < ANALYSIS_INTERVAL_MS) {
      animationFrameRef.current = requestAnimationFrame(runAnalysis);
      return;
    }
    lastAnalysisRef.current = now;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(runAnalysis);
      return;
    }
    
    // Update video source dimensions
    if (video.videoWidth !== videoDimensions.width || video.videoHeight !== videoDimensions.height) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setVideoDimensions({ width: video.videoWidth, height: video.videoHeight });
      }
    }
    
    // Calculate actual rendered dimensions (accounting for object-fit: contain)
    const videoRect = video.getBoundingClientRect();
    const videoAspect = video.videoWidth / video.videoHeight;
    const containerAspect = videoRect.width / videoRect.height;
    
    let renderW, renderH, offsetX, offsetY;
    
    if (videoAspect > containerAspect) {
      // Video is wider than container - letterboxed top/bottom
      renderW = videoRect.width;
      renderH = videoRect.width / videoAspect;
      offsetX = 0;
      offsetY = (videoRect.height - renderH) / 2;
    } else {
      // Video is taller than container - pillarboxed left/right
      renderH = videoRect.height;
      renderW = videoRect.height * videoAspect;
      offsetX = (videoRect.width - renderW) / 2;
      offsetY = 0;
    }
    
    // Update render dimensions if changed significantly
    if (Math.abs(renderW - renderDimensions.width) > 5 || 
        Math.abs(renderH - renderDimensions.height) > 5) {
      setRenderDimensions({ 
        width: renderW, 
        height: renderH, 
        offsetX, 
        offsetY 
      });
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animationFrameRef.current = requestAnimationFrame(runAnalysis);
      return;
    }
    
    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas for analysis
    ctx.drawImage(video, 0, 0);
    
    // Analyze brightness from center region
    const centerX = Math.round(video.videoWidth * 0.25);
    const centerY = Math.round(video.videoHeight * 0.15);
    const regionW = Math.round(video.videoWidth * 0.5);
    const regionH = Math.round(video.videoHeight * 0.7);
    const imageData = ctx.getImageData(centerX, centerY, regionW, regionH);
    const brightness = analyzeBrightness(imageData);
    
    // Use external face data if provided
    const faceData = externalFaceData || null;
    
    // Analyze face position
    const position = analyzeFacePosition(faceData, video.videoWidth, video.videoHeight);
    
    // Analyze distance
    const faceHeight = faceData?.h || 0;
    const distance = analyzeDistance(faceHeight, video.videoHeight, countryCode);
    
    // Analyze tilt
    const tilt = analyzeHeadTilt(
      faceData?.leftEye || null,
      faceData?.rightEye || null
    );
    
    // Check all conditions
    const conditions = checkAllConditions(position, distance, brightness, tilt);
    
    setAnalysisState({ position, distance, brightness, tilt, conditions });
    
    // Notify parent
    onConditionsChange?.(conditions);
    
    // Handle countdown
    if (enableCountdown && conditions.allGood && countdown === null) {
      // Start countdown
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            if (prev === 1) {
              onAutoCapture?.();
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!conditions.allGood && countdown !== null) {
      // Cancel countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      setCountdown(null);
    }
    
    animationFrameRef.current = requestAnimationFrame(runAnalysis);
  }, [videoRef, countryCode, videoDimensions, renderDimensions, externalFaceData, onConditionsChange, enableCountdown, countdown, onAutoCapture]);
  
  // Start/stop analysis loop
  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(animationFrameRef.current);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    
    animationFrameRef.current = requestAnimationFrame(runAnalysis);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [isActive, runAnalysis]);
  
  if (!isActive) {
    return null;
  }
  
  const { position, distance, brightness, tilt, conditions } = analysisState;
  
  // Determine oval color
  const ovalStatus = conditions.allGood ? 'good' : 'warning';
  const ovalColor = ovalStatus === 'good' ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.4)';
  const ovalBorderColor = ovalStatus === 'good' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  
  // Generate guidance message - suggest zoom when face size is off
  let guidanceMessage = 'Position your face in the oval';
  let guidanceSubtext = '';
  
  if (!position.faceDetected) {
    guidanceMessage = 'Position your face in the oval';
  } else if (!position.isCentered) {
    if (position.direction !== 'center') {
      guidanceMessage = `Move ${position.direction === 'left' ? 'right' : 'left'}`;
    } else if (position.verticalDirection !== 'center') {
      guidanceMessage = `Move ${position.verticalDirection === 'up' ? 'down' : 'up'}`;
    }
  } else if (!distance.isGood) {
    // Suggest zoom instead of physical movement
    if (distance.status === 'too-far') {
      guidanceMessage = 'Pinch to zoom in';
      guidanceSubtext = 'or move closer';
    } else {
      guidanceMessage = 'Pinch to zoom out';
      guidanceSubtext = 'or move back';
    }
  } else if (!tilt.isLevel && tilt.eyesDetected) {
    guidanceMessage = `Tilt head ${tilt.direction === 'left' ? 'right' : 'left'}`;
  } else if (!brightness.isGood) {
    guidanceMessage = brightness.message;
  } else {
    guidanceMessage = 'Perfect! Hold still...';
  }
  
  return (
    <div 
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      aria-label="Face positioning guide"
    >
      {/* Hidden canvas for video frame analysis */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Face positioning oval - positioned to match actual video render area */}
      <svg
        className="absolute"
        style={{
          left: `${renderDimensions.offsetX}px`,
          top: `${renderDimensions.offsetY}px`,
          width: `${renderDimensions.width}px`,
          height: `${renderDimensions.height}px`,
          transform: 'scaleX(-1)', // Mirror to match video
        }}
        viewBox={`0 0 ${renderDimensions.width} ${renderDimensions.height}`}
        preserveAspectRatio="none"
      >
        {/* Semi-transparent overlay with cutout */}
        <defs>
          <mask id="oval-mask">
            <rect width="100%" height="100%" fill="white" />
            <ellipse
              cx={oval.centerX}
              cy={oval.centerY}
              rx={oval.width / 2}
              ry={oval.height / 2}
              fill="black"
            />
          </mask>
        </defs>
        
        {/* Dark overlay */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#oval-mask)"
        />
        
        {/* Oval border */}
        <ellipse
          data-testid="face-oval"
          data-country={countryCode}
          data-status={ovalStatus}
          cx={oval.centerX}
          cy={oval.centerY}
          rx={oval.width / 2}
          ry={oval.height / 2}
          fill="transparent"
          stroke={ovalBorderColor}
          strokeWidth="3"
          strokeDasharray={ovalStatus === 'good' ? 'none' : '10 5'}
        />
        
        {/* Min/Max height guides (subtle) */}
        <ellipse
          cx={oval.centerX}
          cy={oval.centerY}
          rx={(oval.minHeight * 0.75) / 2}
          ry={oval.minHeight / 2}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          strokeDasharray="5 10"
        />
        <ellipse
          cx={oval.centerX}
          cy={oval.centerY}
          rx={(oval.maxHeight * 0.75) / 2}
          ry={oval.maxHeight / 2}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          strokeDasharray="5 10"
        />
      </svg>
      
      {/* Status indicators - positioned ABOVE guidance message at bottom */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1.5 text-xs max-w-[95%]">
        {/* Only show problem indicators */}
        
        {/* Waiting for face */}
        {!position.faceDetected && (
          <div 
            data-testid="distance-indicator"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm bg-white/20 text-white/80"
          >
            <span>◌</span>
            <span>Looking for face...</span>
          </div>
        )}
        
        {/* Distance issue */}
        {position.faceDetected && !distance.isGood && (
          <div 
            data-testid="distance-indicator"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm bg-amber-500/30 text-amber-200"
          >
            <span>↕</span>
            <span>{distance.status === 'too-close' ? 'Move back' : 'Move closer'}</span>
          </div>
        )}
        
        {/* Lighting issue */}
        {!brightness.isGood && (
          <div 
            data-testid="lighting-indicator"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm bg-amber-500/30 text-amber-200"
          >
            <span>{brightness.icon}</span>
            <span>{brightness.status === 'too-dark' ? 'Too dark' : 'Too bright'}</span>
          </div>
        )}
        
        {/* Tilt issue */}
        {tilt.eyesDetected && !tilt.isLevel && (
          <div 
            data-testid="tilt-indicator"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm bg-amber-500/30 text-amber-200"
          >
            <span>↺</span>
            <span>Straighten head</span>
          </div>
        )}
        
        {/* All good */}
        {conditions.allGood && (
          <div 
            data-testid="all-good-indicator"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm bg-green-500/40 text-green-200"
          >
            <span>✓</span>
            <span>Perfect!</span>
          </div>
        )}
      </div>
      
      {/* Guidance message */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        role="status"
        aria-live="polite"
      >
        <div 
          data-testid="guidance-message"
          className={`px-4 py-2 rounded-full backdrop-blur-sm text-lg font-medium ${
            conditions.allGood 
              ? 'bg-green-500/30 text-green-200' 
              : 'bg-white/20 text-white'
          }`}
        >
          {guidanceMessage}
        </div>
        {guidanceSubtext && (
          <div className="text-xs text-white/60 mt-1">
            {guidanceSubtext}
          </div>
        )}
      </div>
      
      {/* Countdown overlay */}
      {countdown !== null && (
        <div 
          data-testid="capture-countdown"
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="text-8xl font-bold text-white drop-shadow-lg animate-pulse">
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
}

export type { CameraConditions };
