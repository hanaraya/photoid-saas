#!/usr/bin/env node
/**
 * Generate real before/after demo images using our actual background removal
 */
import { removeBackground } from '@imgly/background-removal';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

const DEMO_DIR = path.join(process.cwd(), 'public/demo');

const demos = [
  { name: 'before-1', label: 'Outdoor urban' },
  { name: 'before-2', label: 'Indoor wall' },
  { name: 'before-3', label: 'Outdoor nature' },
  { name: 'before-4', label: 'Studio' },
];

async function processImage(inputPath, outputPath) {
  console.log(`Processing: ${inputPath}`);

  // Read the image
  const inputBuffer = await readFile(inputPath);
  const inputBlob = new Blob([inputBuffer], { type: 'image/jpeg' });

  // Remove background
  console.log('  Removing background...');
  const resultBlob = await removeBackground(inputBlob, {
    model: 'isnet',
    output: { format: 'image/png', quality: 1.0 },
  });

  // Convert blob to buffer
  const arrayBuffer = await resultBlob.arrayBuffer();
  const pngBuffer = Buffer.from(arrayBuffer);

  // Use sharp to composite on white background and create passport-sized output
  console.log('  Creating passport photo...');
  const metadata = await sharp(pngBuffer).metadata();

  // Create white background and composite
  const result = await sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: pngBuffer, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer();

  await writeFile(outputPath, result);
  console.log(`  Saved: ${outputPath}`);
}

async function main() {
  console.log('Generating demo images with real background removal...\n');

  for (const demo of demos) {
    const inputPath = path.join(DEMO_DIR, `${demo.name}.jpg`);
    const outputPath = path.join(DEMO_DIR, `${demo.name}-after.jpg`);

    if (!existsSync(inputPath)) {
      console.log(`Skipping ${demo.name} - file not found`);
      continue;
    }

    try {
      await processImage(inputPath, outputPath);
    } catch (err) {
      console.error(`Error processing ${demo.name}:`, err.message);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
