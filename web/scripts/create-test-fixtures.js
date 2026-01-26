const fs = require('fs');
const path = require('path');

const fixturesDir = path.join(__dirname, '../__tests__/fixtures');

// Create fixtures directory if it doesn't exist
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Create test image files (placeholder data)
const testImages = [
  {
    name: 'valid-portrait.jpg',
    width: 1000,
    height: 1200,
    description: 'Valid portrait photo with face',
  },
  {
    name: 'landscape-no-face.jpg',
    width: 1200,
    height: 800,
    description: 'Landscape photo without face',
  },
  {
    name: 'multiple-faces.jpg',
    width: 1000,
    height: 800,
    description: 'Photo with multiple faces',
  },
  {
    name: 'low-resolution.jpg',
    width: 300,
    height: 400,
    description: 'Low resolution photo',
  },
  {
    name: 'large-photo.jpg',
    width: 4000,
    height: 6000,
    description: 'Large high-resolution photo',
  },
];

// Create minimal JPEG file headers for test files
function createTestJpegFile(width, height) {
  // JPEG SOI marker
  const soi = Buffer.from([0xff, 0xd8]);

  // JPEG SOF0 marker (simplified)
  const sof0 = Buffer.from([
    0xff,
    0xc0, // SOF0 marker
    0x00,
    0x11, // Length
    0x08, // Precision
    (height >> 8) & 0xff,
    height & 0xff, // Height
    (width >> 8) & 0xff,
    width & 0xff, // Width
    0x03, // Number of components
    // Component data (simplified)
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x01,
    0x03,
    0x11,
    0x01,
  ]);

  // JPEG EOI marker
  const eoi = Buffer.from([0xff, 0xd9]);

  return Buffer.concat([soi, sof0, eoi]);
}

// Create corrupted file
function createCorruptedFile() {
  return Buffer.from('This is not a valid image file', 'utf-8');
}

// Generate test files
testImages.forEach((image) => {
  const filePath = path.join(fixturesDir, image.name);
  const imageData = createTestJpegFile(image.width, image.height);

  fs.writeFileSync(filePath, imageData);
  console.log(
    `Created test fixture: ${image.name} (${image.width}x${image.height})`
  );
});

// Create corrupted image
const corruptedPath = path.join(fixturesDir, 'corrupted.jpg');
fs.writeFileSync(corruptedPath, createCorruptedFile());
console.log('Created corrupted test fixture: corrupted.jpg');

// Create README for fixtures
const readmePath = path.join(fixturesDir, 'README.md');
const readmeContent = `# Test Fixtures

This directory contains test image files for the test suite.

## Files:

${testImages.map((img) => `- **${img.name}**: ${img.description} (${img.width}x${img.height})`).join('\n')}
- **corrupted.jpg**: Invalid/corrupted image file for error testing

## Usage:

These files are used in:
- E2E tests for file upload scenarios
- Integration tests for image processing
- Unit tests for edge case handling

## Note:

These are minimal test files, not actual photographs. They contain just enough JPEG structure to be recognized as image files by most browsers and libraries.
`;

fs.writeFileSync(readmePath, readmeContent);
console.log('Created fixtures README.md');

console.log('\n✅ All test fixtures created successfully!');
console.log(`Location: ${fixturesDir}`);
