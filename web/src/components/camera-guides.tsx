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
  const animationFrameRef = useRef<number>(0);
  const lastAnalysisRef = useRef<number>(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
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
  
  // Calculate oval dimensions based on country
  const oval = useMemo<OvalDimensions>(() => {
    return calculateOvalDimensions(countryCode, dimensions.width, dimensions.height);
  }, [countryCode, dimensions.width, dimensions.height]);
  
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
    
    // Update dimensions if video size changed
    if (video.videoWidth !== dimensions.width || video.videoHeight !== dimensions.height) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setDimensions({ width: video.videoWidth, height: video.videoHeight });
      }
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
  }, [videoRef, countryCode, dimensions, externalFaceData, onConditionsChange, enableCountdown, countdown, onAutoCapture]);
  
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
  
  // Generate guidance message
  let guidanceMessage = 'Position your face in the oval';
  if (!position.faceDetected) {
    guidanceMessage = 'Position your face in the oval';
  } else if (!position.isCentered) {
    if (position.direction !== 'center') {
      guidanceMessage = `Move ${position.direction === 'left' ? 'right' : 'left'}`;
    } else if (position.verticalDirection !== 'center') {
      guidanceMessage = `Move ${position.verticalDirection === 'up' ? 'down' : 'up'}`;
    }
  } else if (!distance.isGood) {
    guidanceMessage = distance.message;
  } else if (!tilt.isLevel && tilt.eyesDetected) {
    guidanceMessage = `Tilt head ${tilt.direction === 'left' ? 'right' : 'left'}`;
  } else if (!brightness.isGood) {
    guidanceMessage = brightness.message;
  } else {
    guidanceMessage = 'Perfect! Hold still...';
  }
  
  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      aria-label="Face positioning guide"
    >
      {/* Hidden canvas for video frame analysis */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Face positioning oval */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid slice"
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
      
      {/* Status indicators */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 text-sm">
        {/* Distance indicator */}
        <div 
          data-testid="distance-indicator"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
            distance.isGood 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          <span>{distance.isGood ? '✓' : '○'}</span>
          <span>{distance.status === 'too-close' ? 'Too close' : distance.status === 'too-far' ? 'Too far' : 'Distance OK'}</span>
        </div>
        
        {/* Lighting indicator */}
        <div 
          data-testid="lighting-indicator"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
            brightness.isGood 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-yellow-500/20 text-yellow-300'
          }`}
        >
          <span>{brightness.icon}</span>
          <span>{brightness.status === 'good' ? 'Lighting OK' : brightness.message}</span>
        </div>
        
        {/* Tilt indicator */}
        <div 
          data-testid="tilt-indicator"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
            tilt.isLevel || !tilt.eyesDetected
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          <span>{tilt.isLevel ? '⬛' : tilt.direction === 'left' ? '↙️' : '↘️'}</span>
          <span>{tilt.isLevel ? 'Level' : `Tilted ${tilt.direction}`}</span>
        </div>
      </div>
      
      {/* Guidance message */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
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
