# Test Fixtures

This directory contains test images for E2E testing of the passport photo app.

## Generated Test Images

Most test images are generated dynamically using SVG data URLs in `../utils/image-generator.ts`.
This approach allows:
- Consistent, reproducible tests
- No need to store large binary files
- Easy customization of test scenarios

## Image Categories

### Good Photos (Should Pass)
- `goodUSPhoto` - Properly sized US passport photo (2x2 inches)
- `goodUKPhoto` - Properly sized UK passport photo (35x45mm)

### Bad Photos (Should Fail/Warn)
- `noFace` - Image without a detectable face
- `blurryPhoto` - Out of focus image
- `tiltedFace` - Face tilted more than 8 degrees
- `coloredBackground` - Non-white background
- `headTooSmall` - Head less than 50% of frame
- `headTooLarge` - Head more than 69% of frame (US) or 76% (UK)
- `offCenter` - Face not centered horizontally
- `lowResolution` - Below minimum resolution requirements
- `grayscale` - Black and white image (not color)
- `unevenLighting` - Strong shadows on face

### Edge Cases
- `withGlasses` - Person wearing glasses (US restriction since 2016)
- `eyesClosed` - Eyes closed (should warn)
- `headCropped` - Crown or chin cut off

### Quality Issues
- `haloArtifact` - Bad background removal with visible halo
- `unnaturalSkin` - Over-processed/unnatural skin tones

## Usage

```typescript
import { generateTestFaceDataUrl, TEST_IMAGE_CONFIGS } from '../utils/image-generator';

// Generate a good US photo
const goodUSPhoto = generateTestFaceDataUrl(TEST_IMAGE_CONFIGS.goodUSPhoto);

// Generate a custom test image
const customPhoto = generateTestFaceDataUrl({
  width: 800,
  height: 800,
  hasface: true,
  faceSize: 0.55,
  backgroundColor: '#ffffff',
});
```

## Adding Real Photos

To add real test photos for more accurate testing:

1. Place JPEG/PNG files in this directory
2. Name them descriptively (e.g., `real-good-us-passport.jpg`)
3. Update tests to use file paths instead of generated SVGs:

```typescript
import * as path from 'path';

const testImagePath = path.join(__dirname, '../fixtures/real-good-us-passport.jpg');
await page.setInputFiles('input[type="file"]', testImagePath);
```

## Privacy Note

Do NOT commit real photos of identifiable individuals to this repository.
Use the synthetic generated images for automated testing.
