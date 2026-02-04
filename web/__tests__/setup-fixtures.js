/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Test Fixtures Setup Script
 *
 * Run this before E2E tests to generate all test fixtures.
 *
 * Usage: node __tests__/setup-fixtures.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const FIXTURE_DIR = path.join(__dirname, 'fixtures/quality-tests');

// Test fixture configurations
const TEST_FIXTURES = [
  // SHOULD PASS
  {
    name: 'good-centered-face',
    width: 600,
    height: 600,
    shouldPass: true,
    description: 'Well-centered face with proper proportions',
    hasWhiteBackground: true,
    headSizeRatio: 0.6,
  },
  {
    name: 'good-uk-standard',
    width: 413,
    height: 531,
    shouldPass: true,
    description: 'UK/EU standard dimensions',
    hasWhiteBackground: true,
    headSizeRatio: 0.7,
  },
  {
    name: 'good-canada-standard',
    width: 591,
    height: 827,
    shouldPass: true,
    description: 'Canada standard dimensions',
    hasWhiteBackground: true,
    headSizeRatio: 0.48,
  },

  // SHOULD FAIL
  {
    name: 'bad-blurry',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Blurry out-of-focus photo',
    hasWhiteBackground: true,
    isBlurry: true,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-off-center',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Face not centered in frame',
    hasWhiteBackground: true,
    faceOffsetX: 100,
    faceOffsetY: 50,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-head-too-small',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Head too small in frame',
    hasWhiteBackground: true,
    headSizeRatio: 0.3,
  },
  {
    name: 'bad-head-too-large',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Head too large in frame',
    hasWhiteBackground: true,
    headSizeRatio: 0.85,
  },
  {
    name: 'bad-dark-background',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Non-white background',
    hasWhiteBackground: false,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-overexposed',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Overexposed photo',
    hasWhiteBackground: true,
    isOverexposed: true,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-underexposed',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Underexposed photo',
    hasWhiteBackground: true,
    isUnderexposed: true,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-halo-artifact',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Background removal halo artifact',
    hasWhiteBackground: true,
    hasHalo: true,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-unnatural-colors',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Unnatural/oversaturated colors',
    hasWhiteBackground: true,
    hasUnaturalColors: true,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-low-resolution',
    width: 200,
    height: 200,
    shouldPass: false,
    description: 'Resolution too low for print',
    hasWhiteBackground: true,
    headSizeRatio: 0.6,
  },
  {
    name: 'bad-shadows',
    width: 600,
    height: 600,
    shouldPass: false,
    description: 'Shadows on face',
    hasWhiteBackground: true,
    hasShadows: true,
    headSizeRatio: 0.6,
  },
];

/**
 * Generate a test fixture image
 */
async function generateFixture(config) {
  const { width, height } = config;
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);

  // Background color
  let bgR = 255,
    bgG = 255,
    bgB = 255;
  if (!config.hasWhiteBackground) {
    bgR = 200;
    bgG = 200;
    bgB = 220;
  }

  // Fill background
  for (let i = 0; i < pixels.length; i += channels) {
    pixels[i] = bgR;
    pixels[i + 1] = bgG;
    pixels[i + 2] = bgB;
  }

  // Face parameters
  const offsetX = config.faceOffsetX || 0;
  const offsetY = config.faceOffsetY || 0;
  const centerX = width / 2 + offsetX;
  const centerY = height * 0.45 + offsetY;

  const headRatio = config.headSizeRatio || 0.6;
  const faceHeight = height * headRatio * 0.8;
  const faceWidth = faceHeight * 0.75;

  // Skin color
  let skinR = config.hasUnaturalColors ? 255 : 220;
  let skinG = config.hasUnaturalColors ? 150 : 180;
  let skinB = config.hasUnaturalColors ? 50 : 160;

  // Exposure adjustments
  let brightnessOffset = 0;
  if (config.isOverexposed) brightnessOffset = 80;
  if (config.isUnderexposed) brightnessOffset = -80;

  // Draw face oval
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / (faceWidth / 2);
      const dy = (y - centerY) / (faceHeight / 2);
      const dist = dx * dx + dy * dy;

      if (dist <= 1) {
        const idx = (y * width + x) * channels;

        const variation = Math.sin(x * 0.1) * 5 + Math.cos(y * 0.1) * 5;

        let shadowFactor = 1;
        if (config.hasShadows && x < centerX) {
          shadowFactor = 0.7 + (x / centerX) * 0.3;
        }

        pixels[idx] = Math.min(
          255,
          Math.max(
            0,
            Math.round((skinR + variation + brightnessOffset) * shadowFactor)
          )
        );
        pixels[idx + 1] = Math.min(
          255,
          Math.max(
            0,
            Math.round((skinG + variation + brightnessOffset) * shadowFactor)
          )
        );
        pixels[idx + 2] = Math.min(
          255,
          Math.max(
            0,
            Math.round((skinB + variation + brightnessOffset) * shadowFactor)
          )
        );

        if (config.hasHalo && dist > 0.85) {
          pixels[idx] = 255;
          pixels[idx + 1] = 255;
          pixels[idx + 2] = 255;
        }
      }
    }
  }

  // Draw eyes
  const eyeY = centerY - faceHeight * 0.1;
  const eyeSpacing = faceWidth * 0.2;
  const eyeRadius = Math.max(3, faceWidth * 0.05);

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
          const edx = x - eyeX;
          const edy = y - eyeY;
          if (edx * edx + edy * edy <= eyeRadius * eyeRadius) {
            const idx = (y * width + x) * channels;
            pixels[idx] = Math.max(0, 50 + brightnessOffset);
            pixels[idx + 1] = Math.max(0, 40 + brightnessOffset);
            pixels[idx + 2] = Math.max(0, 35 + brightnessOffset);
          }
        }
      }
    }
  }

  // Draw hair
  const hairTop = centerY - faceHeight * 0.7;
  const hairBottom = centerY - faceHeight * 0.3;

  for (
    let y = Math.max(0, Math.floor(hairTop));
    y < Math.min(height, hairBottom);
    y++
  ) {
    for (let x = 0; x < width; x++) {
      const hdx = (x - centerX) / (faceWidth * 0.6);
      const hdy = (y - hairTop) / (hairBottom - hairTop);

      if (hdx * hdx + hdy * 0.3 <= 1) {
        const idx = (y * width + x) * channels;
        pixels[idx] = Math.max(0, 60 + brightnessOffset);
        pixels[idx + 1] = Math.max(0, 50 + brightnessOffset);
        pixels[idx + 2] = Math.max(0, 45 + brightnessOffset);
      }
    }
  }

  // Create image with sharp
  let image = sharp(pixels, {
    raw: { width, height, channels },
  });

  // Apply blur if configured
  if (config.isBlurry) {
    image = image.blur(10);
  }

  return image.jpeg({ quality: 90 }).toBuffer();
}

async function main() {
  console.log('🔧 Setting up test fixtures for SafePassportPic E2E tests...\n');

  // Ensure fixture directory exists
  if (!fs.existsSync(FIXTURE_DIR)) {
    fs.mkdirSync(FIXTURE_DIR, { recursive: true });
    console.log(`📁 Created directory: ${FIXTURE_DIR}`);
  }

  console.log('📸 Generating visual quality test fixtures...\n');

  for (const config of TEST_FIXTURES) {
    try {
      const buffer = await generateFixture(config);
      const filePath = path.join(FIXTURE_DIR, `${config.name}.jpg`);
      fs.writeFileSync(filePath, buffer);
      console.log(
        `  ✓ ${config.name} (${config.shouldPass ? 'SHOULD PASS' : 'SHOULD FAIL'})`
      );
    } catch (err) {
      console.error(`  ✗ ${config.name} - Error: ${err.message}`);
    }
  }

  // Save manifest
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

  console.log(
    `\n✅ Generated ${TEST_FIXTURES.length} fixtures in ${FIXTURE_DIR}`
  );
  console.log('\nYou can now run the E2E tests with: npm run test:e2e');
}

main().catch(console.error);
