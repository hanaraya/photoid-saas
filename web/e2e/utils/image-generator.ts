/**
 * Test image generation utilities
 * Creates synthetic test images for E2E testing
 */

import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// For browser-based tests, we'll use data URLs and Canvas API
export interface TestImageConfig {
  width: number;
  height: number;
  hasface: boolean;
  facePositionX?: number; // 0-1 (0.5 = center)
  facePositionY?: number; // 0-1 (0.35 = typical)
  faceSize?: number; // Relative to frame height
  backgroundColor?: string;
  isBlurry?: boolean;
  isTilted?: boolean;
  tiltAngle?: number;
  hasGlasses?: boolean;
  eyesClosed?: boolean;
  hasHalo?: boolean; // Bad background removal artifact
  hasUnnatualSkin?: boolean;
  isGrayscale?: boolean;
  hasUnevenLighting?: boolean;
  lowResolution?: boolean;
  headCropped?: boolean; // Crown or chin cut off
}

/**
 * Generate a simple test face image using Canvas
 * This creates a stylized face placeholder for testing
 */
export function generateTestFaceDataUrl(config: TestImageConfig): string {
  // Create a base64 SVG that represents a face
  // This will be converted to a proper image in browser tests
  const width = config.lowResolution ? 300 : (config.width || 800);
  const height = config.lowResolution ? 300 : (config.height || 800);
  
  const bgColor = config.backgroundColor || '#87CEEB'; // Sky blue default
  const skinColor = config.hasUnnatualSkin ? '#FF69B4' : '#F5D0C5'; // Pink if unnatural
  
  const faceCenterX = (config.facePositionX ?? 0.5) * width;
  const faceCenterY = (config.facePositionY ?? 0.35) * height;
  const faceWidth = (config.faceSize ?? 0.4) * height * 0.7;
  const faceHeight = (config.faceSize ?? 0.4) * height;
  
  // Apply tilt transformation
  const tilt = config.isTilted ? (config.tiltAngle || 15) : 0;
  const tiltTransform = `rotate(${tilt} ${faceCenterX} ${faceCenterY})`;
  
  // Blur filter
  const blurFilter = config.isBlurry ? 'filter="url(#blur)"' : '';
  
  // Grayscale filter
  const grayscaleFilter = config.isGrayscale ? 'filter: grayscale(100%);' : '';
  
  // Eye positions
  const eyeY = faceCenterY - faceHeight * 0.1;
  const leftEyeX = faceCenterX - faceWidth * 0.25;
  const rightEyeX = faceCenterX + faceWidth * 0.25;
  
  // Create SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="${grayscaleFilter}">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="${config.isBlurry ? 5 : 0}" />
        </filter>
        ${config.hasHalo ? `
        <filter id="halo">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        ` : ''}
      </defs>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="${bgColor}" />
      
      ${config.hasUnevenLighting ? `
      <!-- Shadow overlay for uneven lighting -->
      <rect x="0" y="0" width="${width/2}" height="${height}" fill="rgba(0,0,0,0.3)" />
      ` : ''}
      
      <!-- Face group -->
      <g transform="${tiltTransform}" ${blurFilter} ${config.hasHalo ? 'filter="url(#halo)"' : ''}>
        <!-- Hair (top of head) -->
        ${!config.headCropped ? `
        <ellipse 
          cx="${faceCenterX}" 
          cy="${faceCenterY - faceHeight * 0.4}" 
          rx="${faceWidth * 0.6}" 
          ry="${faceHeight * 0.25}" 
          fill="#4A3728" 
        />
        ` : ''}
        
        <!-- Face -->
        <ellipse 
          cx="${faceCenterX}" 
          cy="${faceCenterY}" 
          rx="${faceWidth * 0.5}" 
          ry="${faceHeight * 0.5}" 
          fill="${skinColor}" 
        />
        
        <!-- Eyes -->
        <ellipse cx="${leftEyeX}" cy="${eyeY}" rx="${faceWidth * 0.08}" ry="${faceHeight * 0.04}" fill="white" />
        <ellipse cx="${rightEyeX}" cy="${eyeY}" rx="${faceWidth * 0.08}" ry="${faceHeight * 0.04}" fill="white" />
        
        <!-- Pupils (closed if specified) -->
        ${config.eyesClosed ? `
        <line x1="${leftEyeX - faceWidth * 0.06}" y1="${eyeY}" x2="${leftEyeX + faceWidth * 0.06}" y2="${eyeY}" stroke="#4A3728" stroke-width="2" />
        <line x1="${rightEyeX - faceWidth * 0.06}" y1="${eyeY}" x2="${rightEyeX + faceWidth * 0.06}" y2="${eyeY}" stroke="#4A3728" stroke-width="2" />
        ` : `
        <circle cx="${leftEyeX}" cy="${eyeY}" r="${faceWidth * 0.03}" fill="#4A3728" />
        <circle cx="${rightEyeX}" cy="${eyeY}" r="${faceWidth * 0.03}" fill="#4A3728" />
        `}
        
        <!-- Glasses (if specified) -->
        ${config.hasGlasses ? `
        <circle cx="${leftEyeX}" cy="${eyeY}" r="${faceWidth * 0.12}" fill="none" stroke="#333" stroke-width="2" />
        <circle cx="${rightEyeX}" cy="${eyeY}" r="${faceWidth * 0.12}" fill="none" stroke="#333" stroke-width="2" />
        <line x1="${leftEyeX + faceWidth * 0.12}" y1="${eyeY}" x2="${rightEyeX - faceWidth * 0.12}" y2="${eyeY}" stroke="#333" stroke-width="2" />
        ` : ''}
        
        <!-- Nose -->
        <path d="M ${faceCenterX} ${faceCenterY - faceHeight * 0.05} 
                 L ${faceCenterX - faceWidth * 0.05} ${faceCenterY + faceHeight * 0.1} 
                 L ${faceCenterX + faceWidth * 0.05} ${faceCenterY + faceHeight * 0.1}" 
              fill="none" stroke="${skinColor}" stroke-width="2" opacity="0.5" />
        
        <!-- Mouth -->
        <path d="M ${faceCenterX - faceWidth * 0.12} ${faceCenterY + faceHeight * 0.25} 
                 Q ${faceCenterX} ${faceCenterY + faceHeight * 0.28} 
                   ${faceCenterX + faceWidth * 0.12} ${faceCenterY + faceHeight * 0.25}" 
              fill="none" stroke="#CC8888" stroke-width="2" />
        
        <!-- Neck -->
        <rect 
          x="${faceCenterX - faceWidth * 0.15}" 
          y="${faceCenterY + faceHeight * 0.45}" 
          width="${faceWidth * 0.3}" 
          height="${faceHeight * 0.3}" 
          fill="${skinColor}" 
        />
        
        <!-- Shoulders -->
        <ellipse 
          cx="${faceCenterX}" 
          cy="${faceCenterY + faceHeight * 0.8}" 
          rx="${faceWidth * 0.7}" 
          ry="${faceHeight * 0.2}" 
          fill="#2C3E50" 
        />
      </g>
    </svg>
  `;
  
  // Convert SVG to data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate test image configurations for different scenarios
 */
export const TEST_IMAGE_CONFIGS = {
  // Good photos that should PASS
  goodUSPhoto: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55, // ~55% head height for US
    backgroundColor: '#FFFFFF',
  } as TestImageConfig,
  
  goodUKPhoto: {
    width: 700,
    height: 900,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.35,
    faceSize: 0.72, // ~72% head height for UK
    backgroundColor: '#FFFFFF',
  } as TestImageConfig,
  
  // Bad photos that should FAIL
  noFace: {
    width: 800,
    height: 800,
    hasface: false,
    backgroundColor: '#87CEEB',
  } as TestImageConfig,
  
  blurryPhoto: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    isBlurry: true,
  } as TestImageConfig,
  
  tiltedFace: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    isTilted: true,
    tiltAngle: 15,
  } as TestImageConfig,
  
  coloredBackground: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#4169E1', // Royal blue
  } as TestImageConfig,
  
  headTooSmall: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.4,
    faceSize: 0.35, // Too small for passport
    backgroundColor: '#FFFFFF',
  } as TestImageConfig,
  
  headTooLarge: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.4,
    faceSize: 0.85, // Too large
    backgroundColor: '#FFFFFF',
  } as TestImageConfig,
  
  offCenter: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.3, // Off to the left
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
  } as TestImageConfig,
  
  withGlasses: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    hasGlasses: true,
  } as TestImageConfig,
  
  eyesClosed: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    eyesClosed: true,
  } as TestImageConfig,
  
  lowResolution: {
    width: 300,
    height: 300,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    lowResolution: true,
  } as TestImageConfig,
  
  grayscale: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    isGrayscale: true,
  } as TestImageConfig,
  
  unevenLighting: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    hasUnevenLighting: true,
  } as TestImageConfig,
  
  haloArtifact: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    hasHalo: true,
  } as TestImageConfig,
  
  unnaturalSkin: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.38,
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    hasUnnatualSkin: true,
  } as TestImageConfig,
  
  headCropped: {
    width: 800,
    height: 800,
    hasface: true,
    facePositionX: 0.5,
    facePositionY: 0.15, // Very close to top, crown will be cropped
    faceSize: 0.55,
    backgroundColor: '#FFFFFF',
    headCropped: true,
  } as TestImageConfig,
};

export type TestImageType = keyof typeof TEST_IMAGE_CONFIGS;
