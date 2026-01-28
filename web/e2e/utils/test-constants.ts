/**
 * Test constants for passport photo E2E tests
 * US and UK passport specifications
 */

export const US_PASSPORT_SPEC = {
  id: 'us',
  name: 'US Passport',
  width: 2, // inches
  height: 2, // inches
  unit: 'in',
  headMinInches: 1, // 50% of 2 inches
  headMaxInches: 1.375, // 68.75% of 2 inches
  headMinPercent: 50,
  headMaxPercent: 69,
  eyeFromBottomInches: 1.25, // between 1 1/8" and 1 3/8" from bottom
  eyeFromBottomMin: 1.125,
  eyeFromBottomMax: 1.375,
  dpi: 300,
  pixelWidth: 600, // 2 * 300
  pixelHeight: 600, // 2 * 300
  bgColor: '#ffffff',
};

export const UK_PASSPORT_SPEC = {
  id: 'uk',
  name: 'UK Passport',
  width: 35, // mm
  height: 45, // mm
  unit: 'mm',
  headMinMm: 29,
  headMaxMm: 34,
  headMinPercent: 64, // 29/45 = ~64%
  headMaxPercent: 76, // 34/45 = ~76%
  eyeFromBottomMm: 30,
  dpi: 300,
  pixelWidth: 413, // 35mm at 300dpi
  pixelHeight: 531, // 45mm at 300dpi
  bgColor: '#ffffff',
};

export const COMPLIANCE_THRESHOLDS = {
  // Background whiteness
  bgWhiteMinRgb: 240,
  
  // Blur detection (Laplacian variance)
  blurThreshold: 100,
  
  // Face tilt threshold (degrees)
  tiltThreshold: 8,
  
  // Face centering tolerance (% of frame width)
  centeringTolerance: 5,
  
  // Minimum resolution
  minResolution: 600,
  
  // Lighting evenness score (0-100)
  lightingMinScore: 60,
};

export const STRIPE_TEST = {
  cardNumber: '4242424242424242',
  expiry: '12/28',
  cvc: '123',
  zip: '10001',
};

export const SELECTORS = {
  // Landing page
  photoTypeSelector: '[data-testid="country-selector"]',
  uploadArea: '[data-testid="upload-area"]',
  fileInput: 'input[type="file"]',
  takePhotoBtn: 'button:has-text("Take Photo")',
  selectPhotoBtn: 'button:has-text("Select Photo")',
  
  // Editor
  previewCanvas: '[data-testid="preview-canvas"]',
  complianceChecker: '[data-testid="compliance-checker"]',
  removeBgButton: 'button:has-text("Remove Background")',
  generateButton: 'button:has-text("Generate")',
  zoomSlider: '[data-testid="zoom-slider"]',
  brightnessSlider: '[data-testid="brightness-slider"]',
  
  // Compliance checks
  compliancePass: '.text-green-500:has-text("✓")',
  complianceFail: '.text-red-500:has-text("✗")',
  complianceWarn: '.text-yellow-500:has-text("!")',
  
  // Output
  downloadSheetBtn: 'button:has-text("Download Sheet")',
  downloadSingleBtn: 'button:has-text("Download Single")',
  printBtn: 'button:has-text("Print")',
  paymentBtn: 'button:has-text("Pay")',
  
  // Camera
  cameraModal: '[data-testid="camera-modal"]',
  captureBtn: 'button:has-text("Capture")',
  cancelBtn: 'button:has-text("Cancel")',
};
