/**
 * Test Fixture Generator for Passport Photo Testing
 *
 * Generates test images with specific characteristics:
 * - Good quality photos that should pass
 * - Bad quality photos that should fail
 * - Edge cases (glasses, head coverings, etc.)
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const FIXTURE_DIR = path.join(__dirname, '../fixtures/quality-tests');

export interface TestFixtureConfig {
  name: string;
  width: number;
  height: number;
  shouldPass: boolean;
  description: string;
  characteristics: {
    hasWhiteBackground: boolean;
    isBlurry?: boolean;
    hasManipulationArtifacts?: boolean;
    hasUnaturalColors?: boolean;
    facePositionOffset?: { x: number; y: number }; // offset from center
    headSizeRatio?: number; // as fraction of frame height
    hasShadows?: boolean;
    hasHalo?: boolean;
    isOverexposed?: boolean;
    isUnderexposed?: boolean;
    hasExcessiveMargins?: boolean;
    isLowResolution?: boolean;
  };
}

// Predefined test configurations
export const TEST_FIXTURES: TestFixtureConfig[] = [
  // SHOULD PASS
  {
    name: 'good-centered-face',
    width: 600,
    height: 600,
    shouldPass: true,
    description: 'Well-centered face with proper proportions',
    characteristics: {
      hasWhiteBackground: true,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'good-uk-standard',
    width: 413, // 35mm at 300 DPI
    height: 531, // 45mm at 300 DPI
    shouldPass: true,
    description: 'UK/EU standard dimensions',
    characteristics: {
      hasWhiteBackground: true,
      headSizeRatio: 0.7,
    },
  },
  {
    name: 'good-canada-standard',
    width: 591, // 50mm at 300 DPI
    height: 827, // 70mm at 300 DPI
    shouldPass: true,
    description: 'Canada standard dimensions',
    characteristics: {
      hasWhiteBackground: true,
      headSizeRatio: 0.48,
    },
  },

  // SHOULD FAIL
  {
    name: 'bad-blurry',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Blurry out-of-focus photo',
    characteristics: {
      hasWhiteBackground: true,
      isBlurry: true,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-off-center',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Face not centered in frame',
    characteristics: {
      hasWhiteBackground: true,
      facePositionOffset: { x: 100, y: 50 },
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-head-too-small',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Head too small in frame',
    characteristics: {
      hasWhiteBackground: true,
      headSizeRatio: 0.3,
      hasExcessiveMargins: true,
    },
  },
  {
    name: 'bad-head-too-large',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Head too large in frame',
    characteristics: {
      hasWhiteBackground: true,
      headSizeRatio: 0.85,
    },
  },
  {
    name: 'bad-dark-background',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Non-white background',
    characteristics: {
      hasWhiteBackground: false,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-overexposed',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Overexposed photo',
    characteristics: {
      hasWhiteBackground: true,
      isOverexposed: true,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-underexposed',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Underexposed photo',
    characteristics: {
      hasWhiteBackground: true,
      isUnderexposed: true,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-halo-artifact',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Background removal halo artifact',
    characteristics: {
      hasWhiteBackground: true,
      hasHalo: true,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-unnatural-colors',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Unnatural/oversaturated colors',
    characteristics: {
      hasWhiteBackground: true,
      hasUnaturalColors: true,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-low-resolution',
    width: 200,
    height: 200,
    shouldPass: false,
    description: 'Resolution too low for print',
    characteristics: {
      hasWhiteBackground: true,
      isLowResolution: true,
      headSizeRatio: 0.6,
    },
  },
  {
    name: 'bad-shadows',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Shadows on face',
    characteristics: {
      hasWhiteBackground: true,
      hasShadows: true,
      headSizeRatio: 0.6,
    },
  },
];

/**
 * Generate a simulated face region (oval shape with skin-like colors)
 */
function generateFaceOval(
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  faceWidth: number,
  faceHeight: number,
  config: TestFixtureConfig
): Buffer {
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);

  // Background color
  let bgR = 255,
    bgG = 255,
    bgB = 255;
  if (!config.characteristics.hasWhiteBackground) {
    bgR = 200;
    bgG = 200;
    bgB = 220; // Light blue-grey
  }

  // Fill background
  for (let i = 0; i < pixels.length; i += channels) {
    pixels[i] = bgR;
    pixels[i + 1] = bgG;
    pixels[i + 2] = bgB;
  }

  // Draw face oval
  const skinR = config.characteristics.hasUnaturalColors ? 255 : 220;
  const skinG = config.characteristics.hasUnaturalColors ? 150 : 180;
  const skinB = config.characteristics.hasUnaturalColors ? 50 : 160;

  // Apply exposure adjustments
  let brightnessOffset = 0;
  if (config.characteristics.isOverexposed) brightnessOffset = 80;
  if (config.characteristics.isUnderexposed) brightnessOffset = -80;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Check if point is inside face oval
      const dx = (x - centerX) / (faceWidth / 2);
      const dy = (y - centerY) / (faceHeight / 2);
      const dist = dx * dx + dy * dy;

      if (dist <= 1) {
        const idx = (y * width + x) * channels;

        // Add some variation for realism
        const variation = Math.sin(x * 0.1) * 5 + Math.cos(y * 0.1) * 5;

        // Add shadow if configured
        let shadowFactor = 1;
        if (config.characteristics.hasShadows && x < centerX) {
          shadowFactor = 0.7 + (x / centerX) * 0.3;
        }

        pixels[idx] = Math.min(
          255,
          Math.max(0, (skinR + variation + brightnessOffset) * shadowFactor)
        );
        pixels[idx + 1] = Math.min(
          255,
          Math.max(0, (skinG + variation + brightnessOffset) * shadowFactor)
        );
        pixels[idx + 2] = Math.min(
          255,
          Math.max(0, (skinB + variation + brightnessOffset) * shadowFactor)
        );

        // Add halo effect if configured
        if (config.characteristics.hasHalo && dist > 0.85) {
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
        }
      }
    }
  }

  // Draw eyes (dark spots)
  const eyeY = centerY - faceHeight * 0.1;
  const eyeSpacing = faceWidth * 0.2;
  const eyeRadius = faceWidth * 0.05;

  for (const eyeX of [centerX - eyeSpacing, centerX + eyeSpacing]) {
    for (
      let y = Math.floor(eyeY - eyeRadius);
      y < Math.ceil(eyeY + eyeRadius);
      y++
    ) {
      for (
        let x = Math.floor(eyeX - eyeRadius);
        x < Math.ceil(eyeX + eyeRadius);
        x++
      ) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const dx = x - eyeX;
          const dy = y - eyeY;
          if (dx * dx + dy * dy <= eyeRadius * eyeRadius) {
            const idx = (y * width + x) * channels;
            pixels[idx] = Math.max(0, 50 + brightnessOffset);
            pixels[idx + 1] = Math.max(0, 40 + brightnessOffset);
            pixels[idx + 2] = Math.max(0, 35 + brightnessOffset);
          }
        }
      }
    }
  }

  // Draw hair (darker area above face)
  const hairTop = centerY - faceHeight * 0.7;
  const hairBottom = centerY - faceHeight * 0.3;

  for (
    let y = Math.max(0, Math.floor(hairTop));
    y < Math.min(height, hairBottom);
    y++
  ) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / (faceWidth * 0.6);
      const dy = (y - hairTop) / (hairBottom - hairTop);

      if (dx * dx + dy * 0.3 <= 1) {
        const idx = (y * width + x) * channels;
        pixels[idx] = Math.max(0, 60 + brightnessOffset);
        pixels[idx + 1] = Math.max(0, 50 + brightnessOffset);
        pixels[idx + 2] = Math.max(0, 45 + brightnessOffset);
      }
    }
  }

  return pixels;
}

/**
 * Generate a test fixture image
 */
export async function generateTestFixture(
  config: TestFixtureConfig
): Promise<Buffer> {
  const { width, height, characteristics } = config;

  // Calculate face position and size
  const offsetX = characteristics.facePositionOffset?.x || 0;
  const offsetY = characteristics.facePositionOffset?.y || 0;
  const centerX = width / 2 + offsetX;
  const centerY = height * 0.45 + offsetY;

  const headRatio = characteristics.headSizeRatio || 0.6;
  const faceHeight = height * headRatio * 0.8; // Face is about 80% of head
  const faceWidth = faceHeight * 0.75; // Face aspect ratio

  // Generate the base image
  const pixels = generateFaceOval(
    width,
    height,
    centerX,
    centerY,
    faceWidth,
    faceHeight,
    config
  );

  // Create sharp image
  let image = sharp(pixels, {
    raw: {
      width,
      height,
      channels: 3,
    },
  });

  // Apply blur if configured
  if (characteristics.isBlurry) {
    image = image.blur(10);
  }

  // Convert to JPEG
  const buffer = await image.jpeg({ quality: 90 }).toBuffer();

  return buffer;
}

/**
 * Generate all test fixtures and save to disk
 */
export async function generateAllFixtures(): Promise<void> {
  // Ensure fixture directory exists
  if (!fs.existsSync(FIXTURE_DIR)) {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
  }

  console.log('Generating test fixtures...');

  for (const config of TEST_FIXTURES) {
    const buffer = await generateTestFixture(config);
    const filePath = path.join(FIXTURE_DIR, `${config.name}.jpg`);
    fs.writeFileSync(filePath, buffer);
    console.log(
      `  ✓ ${config.name} (${config.shouldPass ? 'SHOULD PASS' : 'SHOULD FAIL'})`
    );
  }

  // Also generate a manifest file
  const manifest = TEST_FIXTURES.map((f) => ({
    name: f.name,
    file: `${f.name}.jpg`,
    shouldPass: f.shouldPass,
    description: f.description,
  }));

  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\nGenerated ${TEST_FIXTURES.length} fixtures in ${FIXTURE_DIR}`);
}

/**
 * Get fixture path by name
 */
export function getFixturePath(name: string): string {
  return path.join(FIXTURE_DIR, `${name}.jpg`);
}

/**
 * Get all fixtures that should pass
 */
export function getPassingFixtures(): TestFixtureConfig[] {
  return TEST_FIXTURES.filter((f) => f.shouldPass);
}

/**
 * Get all fixtures that should fail
 */
export function getFailingFixtures(): TestFixtureConfig[] {
  return TEST_FIXTURES.filter((f) => !f.shouldPass);
}

// Run if executed directly
if (require.main === module) {
  generateAllFixtures().catch(console.error);
}
