'use client';

import { useRef, useState, useEffect } from 'react';
import { CameraGuides } from '@/components/camera-guides';
import {
  analyzeFacePosition,
  analyzeDistance,
  analyzeHeadTilt,
  checkAllConditions,
} from '@/lib/camera-analysis';

// Component to show direct analysis results
function AnalysisResults({ faceData, country }: { faceData: { x: number; y: number; w: number; h: number; leftEye?: { x: number; y: number }; rightEye?: { x: number; y: number } }; country: string }) {
  const frameWidth = 640;
  const frameHeight = 480;
  
  const position = analyzeFacePosition(faceData, frameWidth, frameHeight);
  const distance = analyzeDistance(faceData.h, frameHeight, country);
  const tilt = analyzeHeadTilt(faceData.leftEye || null, faceData.rightEye || null);
  const mockBrightness = { status: 'good' as const, isGood: true, icon: '☀️', message: 'Good lighting', score: 75 };
  const conditions = checkAllConditions(position, distance, mockBrightness, tilt);
  
  return (
    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-lg font-bold mb-3">Direct Analysis Results</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Position:</strong>
          <ul className="ml-4">
            <li>Centered: {position.isCentered ? '✅' : '❌'} ({position.direction})</li>
            <li>Face detected: {position.faceDetected ? '✅' : '❌'}</li>
            <li>Overlap: {position.overlapPercent.toFixed(0)}%</li>
          </ul>
        </div>
        <div>
          <strong>Distance:</strong>
          <ul className="ml-4">
            <li>Status: {distance.status === 'good' ? '✅' : '❌'} {distance.status}</li>
            <li>Message: {distance.message}</li>
            <li>Face height: {faceData.h}px ({((faceData.h / frameHeight) * 100).toFixed(0)}% of frame)</li>
          </ul>
        </div>
        <div>
          <strong>Tilt:</strong>
          <ul className="ml-4">
            <li>Level: {tilt.isLevel ? '✅' : '❌'} ({tilt.direction})</li>
            <li>Angle: {tilt.tiltAngle.toFixed(1)}°</li>
          </ul>
        </div>
        <div>
          <strong>Overall:</strong>
          <ul className="ml-4">
            <li>Ready: {conditions.allGood ? '✅ Yes' : '❌ No'}</li>
            <li>Issues: {conditions.issues.length === 0 ? 'None' : conditions.issues.join(', ')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Test page to visually verify CameraGuides component
 * This simulates different face positions and conditions
 */
export default function TestCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scenario, setScenario] = useState<'centered' | 'left' | 'right' | 'close' | 'far' | 'tilted'>('centered');
  const [country, setCountry] = useState('us');

  // Mock face data for different scenarios
  // Face height for "good" positioning should be ~50-69% of frame height (480px)
  // So good face height = 240-331px, we use ~288px (60%)
  const mockFaceData = {
    centered: { x: 220, y: 96, w: 200, h: 288, leftEye: { x: 270, y: 180 }, rightEye: { x: 370, y: 180 } },
    left: { x: 50, y: 96, w: 200, h: 288, leftEye: { x: 100, y: 180 }, rightEye: { x: 200, y: 180 } },
    right: { x: 390, y: 96, w: 200, h: 288, leftEye: { x: 440, y: 180 }, rightEye: { x: 540, y: 180 } },
    close: { x: 120, y: 20, w: 400, h: 440, leftEye: { x: 220, y: 150 }, rightEye: { x: 420, y: 150 } }, // Too big
    far: { x: 270, y: 180, w: 100, h: 120, leftEye: { x: 295, y: 210 }, rightEye: { x: 345, y: 210 } }, // Too small
    tilted: { x: 220, y: 96, w: 200, h: 288, leftEye: { x: 270, y: 160 }, rightEye: { x: 370, y: 200 } }, // 20px tilt
  };

  // Setup mock video with dimensions
  useEffect(() => {
    if (videoRef.current) {
      // Set video dimensions for the component to read
      Object.defineProperty(videoRef.current, 'videoWidth', { value: 640, writable: true });
      Object.defineProperty(videoRef.current, 'videoHeight', { value: 480, writable: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Camera Guides Test</h1>
      
      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm mb-1">Scenario:</label>
          <select 
            value={scenario} 
            onChange={(e) => setScenario(e.target.value as typeof scenario)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
          >
            <option value="centered">✅ Centered (Good)</option>
            <option value="left">⬅️ Too Far Left</option>
            <option value="right">➡️ Too Far Right</option>
            <option value="close">🔍 Too Close</option>
            <option value="far">🔭 Too Far</option>
            <option value="tilted">↗️ Tilted Head</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Country:</label>
          <select 
            value={country} 
            onChange={(e) => setCountry(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
          >
            <option value="us">🇺🇸 US (50-69%)</option>
            <option value="uk">🇬🇧 UK (64-75.5%)</option>
            <option value="eu">🇪🇺 EU (71-80%)</option>
            <option value="canada">🇨🇦 Canada (44-51%)</option>
            <option value="india">🇮🇳 India (50-69%)</option>
          </select>
        </div>
      </div>

      {/* Camera Preview Simulation */}
      <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ width: 640, height: 480 }}>
        {/* Hidden video element for component */}
        <video 
          ref={videoRef} 
          className="hidden"
          width={640}
          height={480}
        />
        <canvas ref={canvasRef} className="hidden" width={640} height={480} />
        
        {/* Simulated video background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800" />
        
        {/* Simulated face box (for reference) */}
        <div 
          className="absolute border-2 border-yellow-500/50 bg-yellow-500/10"
          style={{
            left: mockFaceData[scenario].x,
            top: mockFaceData[scenario].y,
            width: mockFaceData[scenario].w,
            height: mockFaceData[scenario].h,
          }}
        >
          <span className="absolute -top-5 left-0 text-xs text-yellow-500">Face ({mockFaceData[scenario].h}px)</span>
        </div>

        {/* Camera Guides Overlay */}
        <CameraGuides
          videoRef={videoRef}
          countryCode={country}
          isActive={true}
          faceData={mockFaceData[scenario]}
          enableCountdown={false}
          onConditionsChange={(conditions) => {
            console.log('Conditions:', conditions);
          }}
        />
      </div>
      
      {/* Direct Analysis Results */}
      <AnalysisResults faceData={mockFaceData[scenario]} country={country} />

      {/* Legend */}
      <div className="mt-6 text-sm text-gray-400">
        <p><strong>Legend:</strong></p>
        <ul className="list-disc list-inside mt-2">
          <li><span className="text-green-500">Green oval</span> = Face properly positioned</li>
          <li><span className="text-red-500">Red oval</span> = Face needs adjustment</li>
          <li><span className="text-yellow-500">Yellow box</span> = Simulated face detection area</li>
        </ul>
      </div>
    </div>
  );
}
