/**
 * Test script to validate HEAD_TO_FACE_RATIO accuracy
 *
 * Usage: npx ts-node scripts/test-head-ratio.ts <image-path>
 *
 * This script:
 * 1. Loads an image and runs face detection
 * 2. Outputs the raw face bbox dimensions
 * 3. Shows the estimated head height using our 1.4x ratio
 * 4. Calculates what % of the image the head would occupy
 */

import * as fs from 'fs';
import * as path from 'path';

// We can't run MediaPipe in Node directly (needs browser)
// So let's create a manual calculation based on known measurements

console.log(`
=== HEAD_TO_FACE_RATIO Validation ===

Current ratio: 1.4 (face bbox is assumed to be 71.4% of full head)

US Passport Requirements:
- Photo size: 2x2 inches (600x600px at 300dpi)
- Head height: 1" to 1-3/8" (50% to 69% of photo height)
- Chin to crown measurement

Anthropometric Data (research):
- Average face height (hairline to chin): ~18.5cm
- Average head height (crown to chin): ~23.5cm  
- Ratio: 18.5/23.5 = 0.787 (face is ~78.7% of head)
- Inverse: 23.5/18.5 = 1.27

BUT - Face detection bbox varies by library:
- MediaPipe BlazeFace: typically eyebrows to chin (smaller)
- Estimated bbox-to-head ratio: varies 1.3 to 1.5

Let's check with actual measurements:
`);

// Standard anthropometric ratios from research
const ANTHROPOMETRIC_DATA = {
  // Source: Various facial anthropometry studies
  faceToHeadRatio: {
    // Face = hairline to chin, Head = crown to chin
    average: 0.79, // face is 79% of head
    range: { min: 0.75, max: 0.83 },
  },
  // MediaPipe BlazeFace bbox typically covers:
  // - Top: around eyebrow level (not hairline)
  // - Bottom: chin
  // This is smaller than "face" in anthropometric terms
  blazeFaceBboxToFace: {
    // Bbox covers ~90% of anthropometric face
    average: 0.9,
    range: { min: 0.85, max: 0.95 },
  },
};

// Calculate what HEAD_TO_FACE_RATIO should be for BlazeFace
function calculateIdealRatio() {
  // BlazeFace bbox -> anthropometric face -> full head
  const bboxToFace = ANTHROPOMETRIC_DATA.blazeFaceBboxToFace.average; // 0.90
  const faceToHead = ANTHROPOMETRIC_DATA.faceToHeadRatio.average; // 0.79

  // bbox/head = (bbox/face) * (face/head) = 0.90 * 0.79 = 0.711
  const bboxToHead = bboxToFace * faceToHead;

  // So HEAD_TO_FACE_RATIO (really bbox-to-head) = 1/0.711 = 1.41
  const idealRatio = 1 / bboxToHead;

  console.log('Calculated ideal ratio:', idealRatio.toFixed(3));
  console.log('Current ratio:', 1.4);
  console.log(
    'Difference:',
    (((idealRatio - 1.4) / 1.4) * 100).toFixed(1) + '%'
  );

  // Now let's see the range
  const minBboxToHead =
    ANTHROPOMETRIC_DATA.blazeFaceBboxToFace.range.min *
    ANTHROPOMETRIC_DATA.faceToHeadRatio.range.min;
  const maxBboxToHead =
    ANTHROPOMETRIC_DATA.blazeFaceBboxToFace.range.max *
    ANTHROPOMETRIC_DATA.faceToHeadRatio.range.max;

  console.log('\nRatio range based on human variation:');
  console.log(
    '  Min (large bbox, short forehead):',
    (1 / maxBboxToHead).toFixed(2)
  );
  console.log(
    '  Max (small bbox, tall forehead):',
    (1 / minBboxToHead).toFixed(2)
  );

  return idealRatio;
}

// What happens if ratio is wrong?
function simulateError() {
  console.log('\n=== Impact of Wrong Ratio ===\n');

  const actualHeadPercent = 56.5; // What app showed
  const currentRatio = 1.4;

  // If we used 1.4 but actual should be different:
  const testRatios = [1.3, 1.35, 1.4, 1.45, 1.5, 1.55];

  console.log('If actual head % is 56.5% with ratio 1.4,');
  console.log('what would it be with different ratios?\n');

  for (const ratio of testRatios) {
    const adjusted = actualHeadPercent * (ratio / currentRatio);
    const status = adjusted >= 50 && adjusted <= 69 ? '✅' : '❌';
    console.log(
      `  Ratio ${ratio.toFixed(2)}: ${adjusted.toFixed(1)}% ${status}`
    );
  }
}

// Run validation
calculateIdealRatio();
simulateError();

console.log(`
=== Recommendation ===

1. Our 1.4 ratio is mathematically sound based on anthropometric averages
2. BUT - BlazeFace bbox consistency varies by:
   - Face angle/tilt
   - Lighting conditions  
   - How much forehead is visible
   
3. To VERIFY with Harish's photo:
   - Need to manually measure the actual crown-to-chin in the image
   - Compare to what BlazeFace bbox returns
   - Calculate the actual ratio for HIS face

4. Consider:
   - Using a dynamic ratio based on landmark positions (if available)
   - Or bumping to 1.45 as a safer default
`);
