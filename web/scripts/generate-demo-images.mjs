#!/usr/bin/env node
/**
 * Generate "after" demo images with background removed
 * Uses @imgly/background-removal (same as the app)
 */

import { removeBackground } from '@imgly/background-removal';
import sharp from 'sharp';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoDir = join(__dirname, '..', 'public', 'demo');

async function processImage(inputFile, outputFile) {
  console.log(`Processing ${inputFile}...`);

  // Read the input image
  const inputPath = join(demoDir, inputFile);
  const imageBuffer = await readFile(inputPath);

  // Create blob from buffer
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

  // Remove background using @imgly/background-removal
  console.log('  Removing background...');
  const resultBlob = await removeBackground(blob, {
    progress: (key, current, total) => {
      if (key === 'compute:inference') {
        process.stdout.write(
          `\r  Progress: ${Math.round((current / total) * 100)}%`
        );
      }
    },
  });
  console.log('\n  Background removed');

  // Convert blob to buffer
  const arrayBuffer = await resultBlob.arrayBuffer();
  const pngBuffer = Buffer.from(arrayBuffer);

  // Use sharp to composite onto white background
  console.log('  Compositing on white background...');
  const image = sharp(pngBuffer);
  const metadata = await image.metadata();

  // Create white background and composite the transparent image on top
  const result = await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: pngBuffer }])
    .png()
    .toBuffer();

  // Save the result
  const outputPath = join(demoDir, outputFile);
  await writeFile(outputPath, result);
  console.log(`  Saved to ${outputFile}`);
}

async function main() {
  console.log('Generating demo "after" images...\n');

  // Process all 4 images
  for (let i = 1; i <= 4; i++) {
    try {
      await processImage(`before-${i}.jpg`, `after-${i}.png`);
      console.log('');
    } catch (error) {
      console.error(`Error processing before-${i}.jpg:`, error.message);
    }
  }

  console.log('Done!');
}

main().catch(console.error);
