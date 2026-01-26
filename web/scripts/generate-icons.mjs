import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Create a simple, professional icon: Shield with camera
// Using SVG to create the base icon
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="#2563eb"/>
  
  <!-- Shield shape -->
  <path d="M256 80 L400 140 L400 280 C400 380 256 440 256 440 C256 440 112 380 112 280 L112 140 Z" 
        fill="#ffffff" opacity="0.95"/>
  
  <!-- Camera icon inside shield -->
  <rect x="176" y="200" width="160" height="120" rx="16" fill="#2563eb"/>
  <circle cx="256" cy="260" r="36" fill="#ffffff"/>
  <circle cx="256" cy="260" r="24" fill="#2563eb"/>
  <rect x="296" y="212" width="28" height="16" rx="4" fill="#1d4ed8"/>
  
  <!-- Checkmark badge -->
  <circle cx="360" cy="160" r="44" fill="#22c55e"/>
  <path d="M340 160 L355 175 L385 145" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// Create OG image SVG (1200x630)
const createOGImageSVG = () => `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient background -->
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Icon -->
  <g transform="translate(100, 115) scale(0.8)">
    <circle cx="256" cy="256" r="240" fill="#ffffff" opacity="0.15"/>
    <path d="M256 80 L400 140 L400 280 C400 380 256 440 256 440 C256 440 112 380 112 280 L112 140 Z" 
          fill="#ffffff"/>
    <rect x="176" y="200" width="160" height="120" rx="16" fill="#2563eb"/>
    <circle cx="256" cy="260" r="36" fill="#ffffff"/>
    <circle cx="256" cy="260" r="24" fill="#2563eb"/>
    <rect x="296" y="212" width="28" height="16" rx="4" fill="#1d4ed8"/>
    <circle cx="360" cy="160" r="44" fill="#22c55e"/>
    <path d="M340 160 L355 175 L385 145" stroke="#ffffff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  
  <!-- Text -->
  <text x="580" y="260" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="#ffffff">SafePassportPic</text>
  <text x="580" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="36" fill="#93c5fd">Passport Photos in 60 Seconds</text>
  <text x="580" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#bfdbfe">🔒 Your photos never leave your device</text>
  
  <!-- Features -->
  <text x="580" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#ffffff">✓ Privacy-First  ✓ AI-Powered  ✓ Instant Results</text>
</svg>
`;

async function generateIcons() {
  console.log('🎨 Generating icons for SafePassportPic...\n');

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
  ];

  // Generate PNG icons
  for (const { name, size } of sizes) {
    const svg = createIconSVG(512); // Create at 512 and resize
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name));
    console.log(`✅ Generated ${name}`);
  }

  // Generate favicon.ico (32x32 PNG as ICO isn't directly supported)
  const svg32 = createIconSVG(512);
  await sharp(Buffer.from(svg32))
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.ico'));
  console.log('✅ Generated favicon.ico');

  // Generate OG image
  const ogSvg = createOGImageSVG();
  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .png()
    .toFile(join(publicDir, 'og-image.png'));
  console.log('✅ Generated og-image.png');

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
