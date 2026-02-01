/**
 * Passport Photo Compliance Verification System
 * 
 * Independent module for verifying passport photos meet official requirements.
 * 
 * Usage:
 * ```typescript
 * import { verifyPassportPhoto, PassportPhotoComplianceChecker } from '@/lib/compliance';
 * 
 * // Quick verification with defaults (US)
 * const result = verifyPassportPhoto(imageAnalysis);
 * 
 * // Or with specific country
 * const result = verifyPassportPhoto(imageAnalysis, 'UK');
 * 
 * // Or use the class for more control
 * const checker = new PassportPhotoComplianceChecker('CA');
 * const result = checker.verify(imageAnalysis);
 * 
 * if (result.isCompliant) {
 *   console.log('Photo is compliant!');
 * } else {
 *   console.log('Issues:', result.criticalFailures);
 *   console.log('Recommendations:', result.recommendations);
 * }
 * ```
 */

// Types
export * from './types';

// Requirements by country
export {
  COUNTRY_REQUIREMENTS,
  getRequirements,
  getSupportedCountries,
  DEFAULT_COUNTRY,
} from './requirements';

// Main checker
export {
  PassportPhotoComplianceChecker,
  verifyPassportPhoto,
} from './checker';

// Image analyzer
export {
  analyzeImage,
  convertFaceApiResult,
  convertMediaPipeResult,
} from './analyzer';
