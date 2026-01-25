export interface PhotoStandard {
  id: string;
  name: string;
  country: string;
  flag: string;
  w: number;
  h: number;
  unit: 'in' | 'mm';
  headMin: number;
  headMax: number;
  eyeFromBottom: number;
  bgColor: string;
  description: string;
}

export const DPI = 300;
export const SHEET_W_IN = 6;
export const SHEET_H_IN = 4;

export const STANDARDS: Record<string, PhotoStandard> = {
  us: {
    id: 'us',
    name: 'US Passport',
    country: 'United States',
    flag: '🇺🇸',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.25,
    bgColor: '#ffffff',
    description: '2×2 inches, white background',
  },
  us_visa: {
    id: 'us_visa',
    name: 'US Visa',
    country: 'United States',
    flag: '🇺🇸',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.25,
    bgColor: '#ffffff',
    description: '2×2 inches, white background',
  },
  us_drivers: {
    id: 'us_drivers',
    name: 'US Driver\'s License',
    country: 'United States',
    flag: '🇺🇸',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.18,
    bgColor: '#ffffff',
    description: '2×2 inches, white/light background',
  },
  green_card: {
    id: 'green_card',
    name: 'Green Card',
    country: 'United States',
    flag: '🇺🇸',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.25,
    bgColor: '#ffffff',
    description: '2×2 inches, white background',
  },
  eu: {
    id: 'eu',
    name: 'EU/Schengen Passport',
    country: 'European Union',
    flag: '🇪🇺',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, light background',
  },
  schengen_visa: {
    id: 'schengen_visa',
    name: 'Schengen Visa',
    country: 'Schengen Area',
    flag: '🇪🇺',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, white/light grey background',
  },
  uk: {
    id: 'uk',
    name: 'UK Passport',
    country: 'United Kingdom',
    flag: '🇬🇧',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 29,
    headMax: 34,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, plain cream/grey background',
  },
  uk_visa: {
    id: 'uk_visa',
    name: 'UK Visa',
    country: 'United Kingdom',
    flag: '🇬🇧',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 29,
    headMax: 34,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, white background',
  },
  india: {
    id: 'india',
    name: 'India Passport',
    country: 'India',
    flag: '🇮🇳',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.25,
    bgColor: '#ffffff',
    description: '2×2 inches (51×51 mm), white background',
  },
  india_visa: {
    id: 'india_visa',
    name: 'India Visa',
    country: 'India',
    flag: '🇮🇳',
    w: 2,
    h: 2,
    unit: 'in',
    headMin: 1,
    headMax: 1.375,
    eyeFromBottom: 1.25,
    bgColor: '#ffffff',
    description: '2×2 inches, white background',
  },
  canada: {
    id: 'canada',
    name: 'Canada Passport',
    country: 'Canada',
    flag: '🇨🇦',
    w: 50,
    h: 70,
    unit: 'mm',
    headMin: 31,
    headMax: 36,
    eyeFromBottom: 42,
    bgColor: '#ffffff',
    description: '50×70 mm, white/light background',
  },
  australia: {
    id: 'australia',
    name: 'Australia Passport',
    country: 'Australia',
    flag: '🇦🇺',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, plain light background',
  },
  china: {
    id: 'china',
    name: 'China Passport',
    country: 'China',
    flag: '🇨🇳',
    w: 33,
    h: 48,
    unit: 'mm',
    headMin: 28,
    headMax: 33,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '33×48 mm, white background',
  },
  china_visa: {
    id: 'china_visa',
    name: 'China Visa',
    country: 'China',
    flag: '🇨🇳',
    w: 33,
    h: 48,
    unit: 'mm',
    headMin: 28,
    headMax: 33,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '33×48 mm, white background',
  },
  japan: {
    id: 'japan',
    name: 'Japan Passport',
    country: 'Japan',
    flag: '🇯🇵',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, plain background (white/blue/grey)',
  },
  south_korea: {
    id: 'south_korea',
    name: 'South Korea Passport',
    country: 'South Korea',
    flag: '🇰🇷',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, white background',
  },
  germany: {
    id: 'germany',
    name: 'Germany Passport',
    country: 'Germany',
    flag: '🇩🇪',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, light grey/white background',
  },
  france: {
    id: 'france',
    name: 'France Passport',
    country: 'France',
    flag: '🇫🇷',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, light/uniform background',
  },
  brazil: {
    id: 'brazil',
    name: 'Brazil Passport',
    country: 'Brazil',
    flag: '🇧🇷',
    w: 50,
    h: 70,
    unit: 'mm',
    headMin: 31,
    headMax: 36,
    eyeFromBottom: 42,
    bgColor: '#ffffff',
    description: '50×70 mm, white background',
  },
  mexico: {
    id: 'mexico',
    name: 'Mexico Passport',
    country: 'Mexico',
    flag: '🇲🇽',
    w: 35,
    h: 45,
    unit: 'mm',
    headMin: 32,
    headMax: 36,
    eyeFromBottom: 30,
    bgColor: '#ffffff',
    description: '35×45 mm, white background',
  },
};

export interface SpecPx {
  w: number;
  h: number;
  headMin: number;
  headMax: number;
  headTarget: number;
  eyeFromBottom: number;
}

export function specToPx(spec: PhotoStandard): SpecPx {
  const scale = spec.unit === 'mm' ? DPI / 25.4 : DPI;
  return {
    w: Math.round(spec.w * scale),
    h: Math.round(spec.h * scale),
    headMin: Math.round(spec.headMin * scale),
    headMax: Math.round(spec.headMax * scale),
    headTarget: Math.round(((spec.headMin + spec.headMax) / 2) * scale),
    eyeFromBottom: Math.round(spec.eyeFromBottom * scale),
  };
}

export function getStandardsList(): PhotoStandard[] {
  return Object.values(STANDARDS);
}

export function getGroupedStandards(): Record<string, PhotoStandard[]> {
  const groups: Record<string, PhotoStandard[]> = {
    'Popular': [],
    'Americas': [],
    'Europe': [],
    'Asia Pacific': [],
    'Visas': [],
    'Other IDs': [],
  };

  const popular = ['us', 'uk', 'eu', 'canada', 'india', 'australia'];
  const americas = ['us', 'canada', 'brazil', 'mexico'];
  const europe = ['eu', 'uk', 'germany', 'france'];
  const asia = ['india', 'china', 'japan', 'south_korea', 'australia'];
  const visas = ['us_visa', 'schengen_visa', 'uk_visa', 'india_visa', 'china_visa'];
  const otherIds = ['us_drivers', 'green_card'];

  popular.forEach(id => { if (STANDARDS[id]) groups['Popular'].push(STANDARDS[id]); });
  americas.forEach(id => { if (STANDARDS[id]) groups['Americas'].push(STANDARDS[id]); });
  europe.forEach(id => { if (STANDARDS[id]) groups['Europe'].push(STANDARDS[id]); });
  asia.forEach(id => { if (STANDARDS[id]) groups['Asia Pacific'].push(STANDARDS[id]); });
  visas.forEach(id => { if (STANDARDS[id]) groups['Visas'].push(STANDARDS[id]); });
  otherIds.forEach(id => { if (STANDARDS[id]) groups['Other IDs'].push(STANDARDS[id]); });

  return groups;
}
