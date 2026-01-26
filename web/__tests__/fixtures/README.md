# Test Fixtures

This directory contains test image files for the test suite.

## Files:

- **valid-portrait.jpg**: Valid portrait photo with face (1000x1200)
- **landscape-no-face.jpg**: Landscape photo without face (1200x800)
- **multiple-faces.jpg**: Photo with multiple faces (1000x800)
- **low-resolution.jpg**: Low resolution photo (300x400)
- **large-photo.jpg**: Large high-resolution photo (4000x6000)
- **corrupted.jpg**: Invalid/corrupted image file for error testing

## Usage:

These files are used in:

- E2E tests for file upload scenarios
- Integration tests for image processing
- Unit tests for edge case handling

## Note:

These are minimal test files, not actual photographs. They contain just enough JPEG structure to be recognized as image files by most browsers and libraries.
