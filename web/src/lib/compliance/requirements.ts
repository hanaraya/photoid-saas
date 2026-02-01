/**
 * Country-specific passport photo requirements
 * Based on official government specifications
 */

import { CountryCode, CountryRequirements } from './types';

// US State Department Requirements
// https://travel.state.gov/content/travel/en/passports/how-apply/photos.html
const US_REQUIREMENTS: CountryRequirements = {
  code: 'US',
  name: 'United States',
  dimensions: {
    widthMm: 51, // 2 inches
    heightMm: 51, // 2 inches
    widthPixelsMin: 600,
    widthPixelsMax: 1200,
    heightPixelsMin: 600,
    heightPixelsMax: 1200,
  },
  headSize: {
    minMm: 25, // 1 inch
    maxMm: 35, // 1-3/8 inches
    minPercent: 50, // 50% of photo height
    maxPercent: 69, // 69% of photo height
  },
  eyePosition: {
    minFromBottomMm: 28, // 1-1/8 inches
    maxFromBottomMm: 35, // 1-3/8 inches
    minFromBottomPercent: 56,
    maxFromBottomPercent: 69,
  },
  background: {
    allowedColors: ['#FFFFFF', '#F5F5F5', '#FAFAFA'], // white to off-white
    colorTolerance: 20,
    uniformityThreshold: 0.95,
  },
  allowGlasses: false, // No glasses since 2016
  allowSmile: false, // Neutral expression required
  allowHeadwear: false, // Except religious
};

// UK Passport Office Requirements
const UK_REQUIREMENTS: CountryRequirements = {
  code: 'UK',
  name: 'United Kingdom',
  dimensions: {
    widthMm: 35,
    heightMm: 45,
    widthPixelsMin: 600,
    widthPixelsMax: 1200,
    heightPixelsMin: 750,
    heightPixelsMax: 1500,
  },
  headSize: {
    minMm: 29,
    maxMm: 34,
    minPercent: 64,
    maxPercent: 76,
  },
  eyePosition: {
    minFromBottomMm: 29,
    maxFromBottomMm: 34,
    minFromBottomPercent: 64,
    maxFromBottomPercent: 76,
  },
  background: {
    allowedColors: ['#E0E0E0', '#D3D3D3', '#C0C0C0'], // light grey
    colorTolerance: 25,
    uniformityThreshold: 0.92,
  },
  allowGlasses: false,
  allowSmile: false,
  allowHeadwear: false,
};

// Canada Requirements
const CA_REQUIREMENTS: CountryRequirements = {
  code: 'CA',
  name: 'Canada',
  dimensions: {
    widthMm: 50,
    heightMm: 70,
    widthPixelsMin: 600,
    widthPixelsMax: 1200,
    heightPixelsMin: 840,
    heightPixelsMax: 1680,
  },
  headSize: {
    minMm: 31,
    maxMm: 36,
    minPercent: 44,
    maxPercent: 51,
  },
  eyePosition: {
    minFromBottomMm: 35,
    maxFromBottomMm: 44,
    minFromBottomPercent: 50,
    maxFromBottomPercent: 63,
  },
  background: {
    allowedColors: ['#FFFFFF', '#F5F5F5'],
    colorTolerance: 15,
    uniformityThreshold: 0.95,
  },
  allowGlasses: false,
  allowSmile: false,
  allowHeadwear: false,
};

// India Requirements
const IN_REQUIREMENTS: CountryRequirements = {
  code: 'IN',
  name: 'India',
  dimensions: {
    widthMm: 51, // 2 inches (same as US)
    heightMm: 51,
    widthPixelsMin: 600,
    widthPixelsMax: 1200,
    heightPixelsMin: 600,
    heightPixelsMax: 1200,
  },
  headSize: {
    minMm: 25,
    maxMm: 35,
    minPercent: 50,
    maxPercent: 70,
  },
  eyePosition: {
    minFromBottomMm: 28,
    maxFromBottomMm: 35,
    minFromBottomPercent: 55,
    maxFromBottomPercent: 70,
  },
  background: {
    allowedColors: ['#FFFFFF'],
    colorTolerance: 10,
    uniformityThreshold: 0.98,
  },
  allowGlasses: false,
  allowSmile: false,
  allowHeadwear: false,
};

// EU Schengen Requirements
const EU_REQUIREMENTS: CountryRequirements = {
  code: 'EU',
  name: 'European Union (Schengen)',
  dimensions: {
    widthMm: 35,
    heightMm: 45,
    widthPixelsMin: 600,
    widthPixelsMax: 1200,
    heightPixelsMin: 750,
    heightPixelsMax: 1500,
  },
  headSize: {
    minMm: 32,
    maxMm: 36,
    minPercent: 70,
    maxPercent: 80,
  },
  eyePosition: {
    minFromBottomMm: 29,
    maxFromBottomMm: 34,
    minFromBottomPercent: 64,
    maxFromBottomPercent: 76,
  },
  background: {
    allowedColors: ['#E8E8E8', '#D8D8D8'], // light grey
    colorTolerance: 20,
    uniformityThreshold: 0.93,
  },
  allowGlasses: false,
  allowSmile: false,
  allowHeadwear: false,
};

// Australia Requirements
const AU_REQUIREMENTS: CountryRequirements = {
  code: 'AU',
  name: 'Australia',
  dimensions: {
    widthMm: 35,
    heightMm: 45,
    widthPixelsMin: 600,
    widthPixelsMax: 1200,
    heightPixelsMin: 750,
    heightPixelsMax: 1500,
  },
  headSize: {
    minMm: 32,
    maxMm: 36,
    minPercent: 70,
    maxPercent: 80,
  },
  eyePosition: {
    minFromBottomMm: 30,
    maxFromBottomMm: 36,
    minFromBottomPercent: 66,
    maxFromBottomPercent: 80,
  },
  background: {
    allowedColors: ['#FFFFFF', '#F8F8F8'],
    colorTolerance: 15,
    uniformityThreshold: 0.95,
  },
  allowGlasses: false,
  allowSmile: false,
  allowHeadwear: false,
};

// Export all requirements
export const COUNTRY_REQUIREMENTS: Record<CountryCode, CountryRequirements> = {
  US: US_REQUIREMENTS,
  UK: UK_REQUIREMENTS,
  CA: CA_REQUIREMENTS,
  IN: IN_REQUIREMENTS,
  EU: EU_REQUIREMENTS,
  AU: AU_REQUIREMENTS,
};

export const getRequirements = (country: CountryCode): CountryRequirements => {
  return COUNTRY_REQUIREMENTS[country];
};

export const getSupportedCountries = (): CountryCode[] => {
  return Object.keys(COUNTRY_REQUIREMENTS) as CountryCode[];
};

export const DEFAULT_COUNTRY: CountryCode = 'US';
