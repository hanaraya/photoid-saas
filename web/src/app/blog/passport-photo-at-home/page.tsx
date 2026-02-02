import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'How to Take a Perfect Passport Photo at Home (2026 Guide) | SafePassportPic',
  description:
    'Learn how to take a passport photo at home with your smartphone. Free guide covers lighting, background, positioning & official requirements. Save $15+ today!',
  keywords: [
    'passport photo at home',
    'DIY passport photo',
    'take passport photo with phone',
    'how to take passport photo',
    'passport photo tips',
    'smartphone passport photo',
    'passport photo guide 2026',
    'home passport photo',
    'passport photo requirements',
  ],
  authors: [{ name: 'SafePassportPic' }],
  openGraph: {
    title: 'How to Take a Perfect Passport Photo at Home (2026 Guide)',
    description:
      'Learn how to take a passport photo at home with your smartphone. Complete guide with lighting, background, and positioning tips.',
    type: 'article',
    url: 'https://safepassportpic.com/blog/passport-photo-at-home',
    publishedTime: '2026-02-02',
    images: [
      {
        url: 'https://safepassportpic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'How to Take a Passport Photo at Home Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Take a Perfect Passport Photo at Home (2026 Guide)',
    description: 'Complete guide to taking passport photos at home with your phone. Save $15+ today!',
    images: ['https://safepassportpic.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/blog/passport-photo-at-home',
  },
};

// JSON-LD structured data
const blogPostJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'How to Take a Perfect Passport Photo at Home (2026 Guide)',
  description:
    'Learn how to take a passport photo at home with your smartphone. Complete guide covers lighting, background, positioning, and official requirements.',
  image: 'https://safepassportpic.com/og-image.png',
  datePublished: '2026-02-02',
  dateModified: '2026-02-02',
  author: {
    '@type': 'Organization',
    name: 'SafePassportPic',
    url: 'https://safepassportpic.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'SafePassportPic',
    logo: {
      '@type': 'ImageObject',
      url: 'https://safepassportpic.com/icon-512.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://safepassportpic.com/blog/passport-photo-at-home',
  },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Take a Passport Photo at Home',
  description: 'A step-by-step guide to taking a compliant passport photo using your smartphone.',
  totalTime: 'PT10M',
  estimatedCost: {
    '@type': 'MonetaryAmount',
    currency: 'USD',
    value: '0',
  },
  supply: [
    { '@type': 'HowToSupply', name: 'Smartphone with camera' },
    { '@type': 'HowToSupply', name: 'Plain white or off-white background' },
    { '@type': 'HowToSupply', name: 'Natural light source (window)' },
  ],
  tool: [
    { '@type': 'HowToTool', name: 'Tripod or stable surface (optional)' },
    { '@type': 'HowToTool', name: 'SafePassportPic app for formatting' },
  ],
  step: [
    {
      '@type': 'HowToStep',
      name: 'Set Up Your Background',
      text: 'Find a plain white or off-white wall. Remove any pictures or decorations from the frame.',
      position: 1,
    },
    {
      '@type': 'HowToStep',
      name: 'Position Your Lighting',
      text: 'Face a window for natural daylight. Midday works best for even lighting.',
      position: 2,
    },
    {
      '@type': 'HowToStep',
      name: 'Set Up Your Camera',
      text: 'Place your phone 4-6 feet away at eye level. Use the rear camera for better quality.',
      position: 3,
    },
    {
      '@type': 'HowToStep',
      name: 'Position Yourself Correctly',
      text: 'Face the camera directly with shoulders square, chin level, and neutral expression.',
      position: 4,
    },
    {
      '@type': 'HowToStep',
      name: 'Take Multiple Photos',
      text: 'Take 10-15 photos and select the best one with even lighting and proper positioning.',
      position: 5,
    },
    {
      '@type': 'HowToStep',
      name: 'Format Your Photo',
      text: 'Use SafePassportPic to automatically crop, size, and validate your photo to official specifications.',
      position: 6,
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Can I take a passport photo with my iPhone or Android phone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! Any modern smartphone with a camera of 5 megapixels or higher can take an acceptable passport photo. Both iPhone and Android phones work perfectly. The key is proper lighting and positioning rather than camera quality. Most phones made after 2018 exceed the minimum requirements for passport photo resolution.',
      },
    },
    {
      '@type': 'Question',
      name: 'What if my walls aren\'t white?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You have several options: hang a plain white bedsheet against a wall or door, use a large piece of white poster board from any craft store, or use a white foam board. Alternatively, apps like SafePassportPic can automatically remove and replace your background with compliant white, saving you the hassle of finding a white backdrop.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I smile in my passport photo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A neutral expression is officially required for US passport photos. This means a natural, relaxed face with your mouth closed. A very slight, natural smile is sometimes acceptable, but avoid showing teeth or having an exaggerated expression. The goal is a natural look that clearly shows your facial features.',
      },
    },
    {
      '@type': 'Question',
      name: 'How recent does a passport photo need to be?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your passport photo must have been taken within the last 6 months. It should accurately represent your current appearance. If you\'ve significantly changed your hairstyle, grown or shaved facial hair, or had any changes that affect your appearance, you should take a new photo.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I wear makeup in my passport photo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, you can wear makeup in your passport photo as long as it doesn\'t significantly alter your appearance or obscure your facial features. Natural, everyday makeup is fine. Avoid heavy contouring, dramatic false lashes, or theatrical makeup that changes how you look. Your photo should represent how you typically appear.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why are glasses not allowed in passport photos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Since November 2016, the US State Department has prohibited glasses in passport photos. This rule was implemented because glasses can cause glare, shadows, and reflections that interfere with facial recognition technology. Even non-prescription glasses are not allowed. The only exception is if you have a signed medical statement.',
      },
    },
    {
      '@type': 'Question',
      name: 'What size should a US passport photo be?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A US passport photo must be exactly 2x2 inches (51x51mm). The head must be between 1 inch and 1-3/8 inches (25-35mm) from the bottom of the chin to the top of the head. The photo must be printed at 300 DPI minimum for clarity. SafePassportPic automatically sizes and crops your photo to meet these exact specifications.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much can I save by taking a passport photo at home?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Taking a passport photo at home can save you $10-15 compared to in-store options. CVS, Walgreens, and similar stores typically charge $14.99-$16.99 for passport photos. By taking your own photo and printing at home or at a drugstore kiosk, your total cost is under $2. Using SafePassportPic adds just $4.99 for professional formatting and compliance checking.',
      },
    },
  ],
};

export default function PassportPhotoAtHomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="flex-1">
        <article className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            {/* Header */}
            <header className="mb-12">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <Link
                  href="/blog"
                  className="hover:text-primary transition-colors"
                >
                  ← Back to Blog
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500">
                  How-To Guide
                </span>
                <time dateTime="2026-02-02">February 2, 2026</time>
                <span>•</span>
                <span>12 min read</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                How to Take a Perfect Passport Photo at Home (2026 Guide)
              </h1>
              <p className="mt-6 text-xl text-muted-foreground">
                Why pay $15-20 at CVS when you can take a perfect passport photo at home in 
                under 10 minutes? This complete guide shows you exactly how to use your 
                smartphone to create compliant passport photos that won&apos;t get rejected.
              </p>
            </header>

            {/* Table of Contents */}
            <nav className="mb-12 rounded-xl bg-card border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">📋 What You&apos;ll Learn</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <a href="#equipment" className="hover:text-primary transition-colors">Equipment needed (just a smartphone!)</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <a href="#requirements" className="hover:text-primary transition-colors">Official US passport photo requirements</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <a href="#step-by-step" className="hover:text-primary transition-colors">Step-by-step photo guide</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <a href="#mistakes" className="hover:text-primary transition-colors">7 common mistakes to avoid</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <a href="#formatting" className="hover:text-primary transition-colors">How to format your photo correctly</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <a href="#printing" className="hover:text-primary transition-colors">Where to print (and save money)</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">→</span>
                  <a href="#faq" className="hover:text-primary transition-colors">Frequently asked questions</a>
                </li>
              </ul>
            </nav>

            {/* Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              
              {/* Introduction */}
              <section className="mb-12">
                <p className="text-muted-foreground mb-4">
                  Getting a passport photo shouldn&apos;t be expensive or complicated. Yet every year, 
                  millions of people pay $15-20 at drugstores, wait in line, and sometimes still 
                  end up with photos that get rejected.
                </p>
                <p className="text-muted-foreground mb-4">
                  Here&apos;s the truth: <strong>you can take a perfect passport photo at home with 
                  nothing more than your smartphone</strong>. No special equipment needed. No 
                  professional photography skills required.
                </p>
                <p className="text-muted-foreground mb-4">
                  In this guide, we&apos;ll walk you through everything you need to know to take a 
                  DIY passport photo that meets all official US State Department requirements. 
                  Whether you&apos;re renewing your passport, applying for the first time, or need 
                  photos for your family, you&apos;ll save time and money while getting professional-quality 
                  results.
                </p>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 text-sm">
                  <strong className="text-primary">💡 Quick Tip:</strong> Over 200,000 passport 
                  applications are delayed or rejected each year due to photo issues. Following 
                  this guide will help you avoid becoming part of that statistic.
                </div>
              </section>

              {/* Section 1: Equipment */}
              <section id="equipment" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  Equipment for Taking Passport Photos at Home
                </h2>
                <p className="text-muted-foreground mb-4">
                  The good news? You probably already have everything you need. Taking a passport 
                  photo at home requires minimal equipment—here&apos;s your complete checklist:
                </p>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">Essential (Required)</h3>
                <ul className="space-y-3 text-muted-foreground mb-6">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <strong>Smartphone with a decent camera</strong> — Any modern smartphone 
                      (iPhone 8 or newer, or similar Android) works perfectly. The rear camera 
                      typically produces better results than the front camera, but either can work.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🏠</span>
                    <div>
                      <strong>Plain white or off-white background</strong> — A blank wall works 
                      great. Alternatives include a white bedsheet, poster board, or foam board 
                      from any craft store (usually under $5).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <strong>Good lighting</strong> — Natural daylight from a window is ideal 
                      and free. We&apos;ll cover lighting setup in detail below.
                    </div>
                  </li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Helpful (Optional)</h3>
                <ul className="space-y-3 text-muted-foreground mb-6">
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">📐</span>
                    <div>
                      <strong>Tripod or stable surface</strong> — Helps keep the camera steady 
                      and at the right height. A stack of books or a shelf works in a pinch.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <strong>Timer or remote shutter</strong> — If you&apos;re taking your own 
                      photo, your phone&apos;s built-in timer (usually 3 or 10 seconds) works great.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-2xl">🪞</span>
                    <div>
                      <strong>Mirror nearby</strong> — Helpful for checking your positioning 
                      and expression before each shot.
                    </div>
                  </li>
                </ul>

                <div className="rounded-lg bg-card border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Pro tip:</strong> You don&apos;t need 
                    expensive equipment. A $0 setup with natural window light and a blank wall 
                    can produce results identical to a professional photo studio. The key is 
                    technique, not gear.
                  </p>
                </div>
              </section>

              {/* Section 2: Requirements */}
              <section id="requirements" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  US Passport Photo Requirements 2026
                </h2>
                <p className="text-muted-foreground mb-4">
                  Before you start taking photos, it&apos;s important to understand the official 
                  requirements. The US State Department has specific rules—and they reject photos 
                  that don&apos;t comply. Here&apos;s everything your passport photo must meet:
                </p>

                <div className="space-y-4">
                  <div className="rounded-lg bg-card border border-border p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-primary">📏</span> Size Requirements
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Photo must be <strong>2 x 2 inches</strong> (51 x 51 mm)</li>
                      <li>• Head must be <strong>1 to 1-3/8 inches</strong> (25-35 mm) from chin to top of head</li>
                      <li>• Your head should fill about <strong>50-70%</strong> of the frame</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-primary">🎨</span> Background Requirements
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Must be <strong>plain white or off-white</strong></li>
                      <li>• No patterns, shadows, or objects visible</li>
                      <li>• Solid, uniform color throughout</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-primary">😐</span> Expression &amp; Position
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Neutral expression</strong> — mouth closed, natural look</li>
                      <li>• <strong>Eyes open</strong> and clearly visible</li>
                      <li>• Looking <strong>directly at the camera</strong></li>
                      <li>• Face <strong>centered</strong> and facing forward</li>
                      <li>• Both ears should be visible (if possible)</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-primary">👓</span> Glasses &amp; Accessories
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>NO glasses</strong> allowed (rule since 2016)</li>
                      <li>• No sunglasses, tinted glasses, or photo-reactive lenses</li>
                      <li>• <strong>No hats or head coverings</strong> (except for religious reasons)</li>
                      <li>• No headphones, wireless earbuds, or hair accessories that obscure your face</li>
                    </ul>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="text-primary">📅</span> Recency
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Photo must be taken within the <strong>last 6 months</strong></li>
                      <li>• Must reflect your current appearance</li>
                    </ul>
                  </div>
                </div>

                <p className="text-muted-foreground mt-6">
                  <strong>Official source:</strong> These requirements are based on the{' '}
                  <a 
                    href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    US Department of State passport photo guidelines
                  </a>.
                </p>
              </section>

              {/* Section 3: Step-by-Step Guide */}
              <section id="step-by-step" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  How to Take Your Passport Photo: Step-by-Step
                </h2>
                <p className="text-muted-foreground mb-6">
                  Now let&apos;s get into the actual process. Follow these steps to take a 
                  passport photo that meets all requirements.
                </p>

                {/* Step 1 */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</span>
                    Set Up Your Background
                  </h3>
                  <div className="ml-11">
                    <p className="text-muted-foreground mb-3">
                      Your background is one of the most common reasons for passport photo rejection. 
                      Here&apos;s how to get it right:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• <strong>Find a plain white or off-white wall</strong> — A hallway or bathroom wall often works best</li>
                      <li>• <strong>Remove any pictures, mirrors, or decorations</strong> from the area that will be in your frame</li>
                      <li>• <strong>Stand 2-3 feet away from the wall</strong> — This helps prevent shadows from falling on the background</li>
                      <li>• <strong>Alternative:</strong> If you don&apos;t have a white wall, hang a plain white bedsheet or tape up a large piece of white poster board</li>
                    </ul>
                    <div className="mt-4 rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm">
                      <strong>No white background?</strong> SafePassportPic can automatically remove 
                      your background and replace it with compliant white—so you can take your photo 
                      anywhere.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</span>
                    Optimize Your Lighting
                  </h3>
                  <div className="ml-11">
                    <p className="text-muted-foreground mb-3">
                      Lighting is crucial for a professional-looking passport photo. Shadows and 
                      uneven lighting are major causes of rejection.
                    </p>
                    
                    <h4 className="font-semibold mt-4 mb-2">Best option: Natural daylight</h4>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li>• <strong>Face a window</strong> — Position yourself so natural light falls evenly on your face</li>
                      <li>• <strong>Best time:</strong> Late morning or early afternoon when light is bright but not harsh</li>
                      <li>• <strong>Avoid direct sunlight</strong> — This creates harsh shadows. Indirect light or overcast days work best</li>
                      <li>• <strong>Check for shadows</strong> — Look at both sides of your face. They should be evenly lit</li>
                    </ul>

                    <h4 className="font-semibold mt-4 mb-2">Alternative: Artificial lighting</h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Use <strong>two lamps placed on either side</strong> of your face, roughly 45 degrees from center</li>
                      <li>• <strong>Ring lights</strong> work great for even, shadow-free illumination</li>
                      <li>• Avoid overhead lights only—they create unflattering shadows under your eyes and nose</li>
                    </ul>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</span>
                    Position Your Camera
                  </h3>
                  <div className="ml-11">
                    <p className="text-muted-foreground mb-3">
                      Camera positioning affects both composition and image quality.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• <strong>Distance:</strong> Place your phone <strong>4-6 feet away</strong> from you</li>
                      <li>• <strong>Height:</strong> Camera should be at <strong>eye level</strong>—not looking up or down at you</li>
                      <li>• <strong>Camera choice:</strong> Use the <strong>rear camera</strong> for better quality (if you have help). The front camera works too, especially with a mirror for positioning</li>
                      <li>• <strong>Stability:</strong> Use a tripod, prop your phone on a shelf, or ask someone to hold it steady</li>
                      <li>• <strong>Timer:</strong> Set a 3-10 second timer so you have time to get into position</li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">4</span>
                    Position Yourself Correctly
                  </h3>
                  <div className="ml-11">
                    <p className="text-muted-foreground mb-3">
                      Your positioning is critical for compliance. Here&apos;s exactly how to stand:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• <strong>Face the camera directly</strong> — Head straight, not tilted or turned</li>
                      <li>• <strong>Shoulders square</strong> — Both shoulders should be in frame at the same level</li>
                      <li>• <strong>Chin level</strong> — Not tilted up or down. Imagine a string pulling the top of your head straight up</li>
                      <li>• <strong>Neutral expression</strong> — Relax your face, keep your mouth closed. A very slight smile is okay, but no teeth showing</li>
                      <li>• <strong>Eyes open and looking at the camera</strong> — Direct eye contact with the lens</li>
                      <li>• <strong>Hair away from face</strong> — Both eyes should be clearly visible, ideally both ears too</li>
                    </ul>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 flex items-center gap-3">
                    <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">5</span>
                    Take Multiple Shots
                  </h3>
                  <div className="ml-11">
                    <p className="text-muted-foreground mb-3">
                      Don&apos;t settle for the first photo. Taking multiple shots gives you options.
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li>• <strong>Take 10-15 photos</strong> with slight variations</li>
                      <li>• Adjust your position slightly between shots</li>
                      <li>• Try small changes to your expression</li>
                    </ul>
                    
                    <p className="text-muted-foreground mb-3">
                      <strong>Review each photo for:</strong>
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>✅ Eyes open and looking at camera?</li>
                      <li>✅ Face centered and straight?</li>
                      <li>✅ No shadows on face or background?</li>
                      <li>✅ Background clean and white?</li>
                      <li>✅ Expression neutral and natural?</li>
                      <li>✅ Photo in focus and not blurry?</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 4: Common Mistakes */}
              <section id="mistakes" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  7 Passport Photo Mistakes That Get Applications Rejected
                </h2>
                <p className="text-muted-foreground mb-6">
                  Even small errors can cause your passport application to be delayed or rejected. 
                  Here are the most common mistakes and how to avoid them:
                </p>

                <div className="space-y-4">
                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <h3 className="font-semibold mb-2 text-red-400">
                      ❌ Mistake #1: Shadows on Your Face
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Shadows obscure facial features and can cause rejection. <strong>Fix it:</strong> Face 
                      a window for even, natural lighting. Make sure light hits both sides of your face equally.
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <h3 className="font-semibold mb-2 text-red-400">
                      ❌ Mistake #2: Wrong Background Color
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cream, gray, or patterned backgrounds are not acceptable. <strong>Fix it:</strong> Use 
                      a plain white or off-white wall. If needed, hang a white sheet or use background 
                      removal software.
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <h3 className="font-semibold mb-2 text-red-400">
                      ❌ Mistake #3: Wearing Glasses
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Since 2016, glasses are not allowed in US passport photos—period. <strong>Fix it:</strong> Always 
                      remove your glasses, including clear/non-prescription glasses.
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <h3 className="font-semibold mb-2 text-red-400">
                      ❌ Mistake #4: Wrong Size or Cropping
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Photos must be exactly 2x2 inches with proper head size. <strong>Fix it:</strong> Use 
                      a passport photo tool like SafePassportPic that automatically sizes and crops correctly.
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <h3 className="font-semibold mb-2 text-red-400">
                      ❌ Mistake #5: Using an Old Photo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Photos must be taken within the last 6 months. <strong>Fix it:</strong> Take a new 
                      photo if your appearance has changed or if your previous photo is more than 6 months old.
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <h3 className="font-semibold mb-2 text-red-400">
                      ❌ Mistake #6: Smiling Too Big
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A big smile with teeth showing will be rejected. <strong>Fix it:</strong> Keep a 
                      neutral, natural expression. A very slight smile is okay, but no teeth.
                    </p>
                  </div>

                  <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4">
                    <h3 className="font-semibold mb-2 text-red-400">
                      ❌ Mistake #7: Not Looking at the Camera
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your eyes must be open and looking directly at the lens. <strong>Fix it:</strong> Focus 
                      on the camera lens (not the screen) when taking your photo. Use a tripod and timer 
                      so you can look directly at the lens.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 5: Formatting */}
              <section id="formatting" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  How to Format Your Passport Photo Correctly
                </h2>
                <p className="text-muted-foreground mb-4">
                  Once you&apos;ve taken a good photo, you need to format it correctly. This is 
                  often the trickiest part of DIY passport photos, but it doesn&apos;t have to be.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Manual Requirements:</h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• <strong>Crop to 2x2 inches</strong> with your head properly centered</li>
                  <li>• <strong>Head size:</strong> 1 to 1-3/8 inches from chin to top of head</li>
                  <li>• <strong>Resolution:</strong> 300 DPI minimum for print</li>
                  <li>• <strong>For online applications:</strong> 600x600 to 1200x1200 pixels, JPEG format, under 240KB</li>
                  <li>• <strong>Background:</strong> Pure white with no shadows</li>
                </ul>

                <div className="rounded-xl bg-card border-2 border-primary p-6">
                  <h3 className="text-xl font-bold mb-3">
                    Skip the Hassle—Use SafePassportPic
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Formatting passport photos manually is tedious and error-prone. SafePassportPic 
                    automatically handles all the technical requirements in seconds:
                  </p>
                  <ul className="space-y-2 text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> AI-powered face detection and cropping
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Automatic background removal &amp; replacement
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Precise 2x2 inch sizing with correct head placement
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> Compliance validation for US, UK, Canada &amp; more
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span> 100% private—your photo never leaves your device
                    </li>
                  </ul>
                  <Link
                    href="/app"
                    className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Create My Passport Photo →
                  </Link>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Just $4.99 • 30-day money-back guarantee
                  </p>
                </div>
              </section>

              {/* Section 6: Printing */}
              <section id="printing" className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  Where to Print Your Passport Photo
                </h2>
                <p className="text-muted-foreground mb-4">
                  Once your photo is properly formatted, you need to print it. Here are your options:
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Option 1: Print at Home</h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• Use <strong>matte or glossy photo paper</strong></li>
                  <li>• Set printer to <strong>highest quality</strong> and 300 DPI</li>
                  <li>• Print a <strong>4x6 template</strong> with multiple 2x2 photos (our tool creates this for you)</li>
                  <li>• Cost: Under $0.50 per sheet</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Option 2: Drugstore Self-Service</h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• <strong>CVS, Walgreens, Walmart</strong> have photo kiosks</li>
                  <li>• Upload your formatted image and print a 4x6</li>
                  <li>• Cost: $0.35-0.50 for a 4x6 print</li>
                  <li>• Usually ready in minutes</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Option 3: Online Printing</h3>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>• <strong>Shutterfly, Snapfish, Amazon Photos</strong></li>
                  <li>• Order 4x6 prints with your passport photos</li>
                  <li>• Cost: $0.15-0.30 per print + shipping</li>
                  <li>• Takes a few days to arrive</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">💰 Cost Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-3 px-4 text-left font-semibold">Option</th>
                        <th className="py-3 px-4 text-right font-semibold">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">CVS/Walgreens in-store service</td>
                        <td className="py-3 px-4 text-right">$14.99 - $16.99</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">DIY at home (print yourself)</td>
                        <td className="py-3 px-4 text-right">~$0.50</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-4">SafePassportPic + drugstore 4x6 print</td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">$5.49 total</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Our recommendation:</strong> Use SafePassportPic to format your photo, 
                  then print a 4x6 at any drugstore. You&apos;ll get multiple passport photos 
                  on one print for under $6 total—saving $10+ compared to in-store services.
                </p>
              </section>

              {/* Section 7: FAQ */}
              <section id="faq" className="mb-12">
                <h2 className="text-2xl font-bold mb-6">
                  Frequently Asked Questions
                </h2>
                
                <div className="space-y-6">
                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      Can I take a passport photo with my iPhone or Android phone?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Yes! Any modern smartphone with a camera of 5 megapixels or higher can take 
                      an acceptable passport photo. Both iPhone and Android phones work perfectly. 
                      The key is proper lighting and positioning rather than camera quality. Most 
                      phones made after 2018 exceed the minimum requirements for passport photo resolution.
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      What if my walls aren&apos;t white?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      You have several options: hang a plain white bedsheet against a wall or door, 
                      use a large piece of white poster board from any craft store, or use a white 
                      foam board. Alternatively, apps like SafePassportPic can automatically remove 
                      and replace your background with compliant white, saving you the hassle of 
                      finding a white backdrop.
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      Can I smile in my passport photo?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      A neutral expression is officially required for US passport photos. This means 
                      a natural, relaxed face with your mouth closed. A very slight, natural smile 
                      is sometimes acceptable, but avoid showing teeth or having an exaggerated 
                      expression. The goal is a natural look that clearly shows your facial features.
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      How recent does a passport photo need to be?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Your passport photo must have been taken within the last 6 months. It should 
                      accurately represent your current appearance. If you&apos;ve significantly 
                      changed your hairstyle, grown or shaved facial hair, or had any changes that 
                      affect your appearance, you should take a new photo.
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      Can I wear makeup in my passport photo?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Yes, you can wear makeup in your passport photo as long as it doesn&apos;t 
                      significantly alter your appearance or obscure your facial features. Natural, 
                      everyday makeup is fine. Avoid heavy contouring, dramatic false lashes, or 
                      theatrical makeup that changes how you look.
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      Why are glasses not allowed in passport photos?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Since November 2016, the US State Department has prohibited glasses in passport 
                      photos. This rule was implemented because glasses can cause glare, shadows, 
                      and reflections that interfere with facial recognition technology. Even 
                      non-prescription glasses are not allowed. The only exception is if you have 
                      a signed medical statement.
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      What size should a US passport photo be?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      A US passport photo must be exactly 2x2 inches (51x51mm). The head must be 
                      between 1 inch and 1-3/8 inches (25-35mm) from the bottom of the chin to 
                      the top of the head. The photo must be printed at 300 DPI minimum for 
                      clarity. SafePassportPic automatically sizes and crops your photo to meet 
                      these exact specifications.
                    </p>
                  </div>

                  <div className="rounded-lg bg-card border border-border p-5">
                    <h3 className="font-semibold mb-2">
                      How much can I save by taking a passport photo at home?
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Taking a passport photo at home can save you $10-15 compared to in-store 
                      options. CVS, Walgreens, and similar stores typically charge $14.99-$16.99 
                      for passport photos. By taking your own photo and printing at home or at 
                      a drugstore kiosk, your total cost is under $2. Using SafePassportPic adds 
                      just $4.99 for professional formatting and compliance checking.
                    </p>
                  </div>
                </div>
              </section>

              {/* Conclusion */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  Start Taking Your Passport Photo Today
                </h2>
                <p className="text-muted-foreground mb-4">
                  Taking a passport photo at home is easier than you might think. With just your 
                  smartphone, good lighting, and a white background, you can create a compliant 
                  photo in under 10 minutes.
                </p>
                <p className="text-muted-foreground mb-4">
                  <strong>Here&apos;s a quick recap:</strong>
                </p>
                <ul className="space-y-2 text-muted-foreground mb-6">
                  <li>✅ Use natural light from a window for best results</li>
                  <li>✅ Stand against a plain white or off-white background</li>
                  <li>✅ Position your camera at eye level, 4-6 feet away</li>
                  <li>✅ Keep a neutral expression with eyes open</li>
                  <li>✅ Take multiple shots and pick the best one</li>
                  <li>✅ Use SafePassportPic to format and validate your photo</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  You&apos;ll save money (at least $10-15), skip the trip to the drugstore, and 
                  have full control over your photo. No more awkward poses in front of strangers 
                  or waiting in line.
                </p>
              </section>

              {/* Final CTA */}
              <section className="rounded-xl bg-card border border-border p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Ready to Create Your Passport Photo?
                </h2>
                <p className="text-muted-foreground mb-6">
                  SafePassportPic makes it easy: upload your photo, and our AI automatically 
                  crops, sizes, removes the background, and validates compliance. 100% private—your 
                  photo never leaves your device.
                </p>
                <Link
                  href="/app"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create My Passport Photo
                </Link>
                <p className="mt-4 text-xs text-muted-foreground">
                  Just $4.99 • Works on any device • 30-day money-back guarantee
                </p>
              </section>
            </div>
          </div>
        </article>

        {/* Related Content */}
        <section className="py-16 bg-card/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-xl font-bold mb-6">Related Guides</h2>
            <div className="grid gap-4">
              <Link
                href="/us-passport-photo"
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  US Passport Photo Requirements — Complete Guide
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Everything you need to know about 2×2 inch US passport photos
                </p>
              </Link>
              <Link
                href="/blog/passport-photo-privacy"
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Why Your Passport Photo App Might Be a Privacy Nightmare
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Most apps upload your biometric data to servers. Learn the risks.
                </p>
              </Link>
              <Link
                href="/app"
                className="group rounded-lg border border-primary/50 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
              >
                <h3 className="font-semibold text-primary">
                  Create Your Passport Photo Now →
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-powered, privacy-first. Your photo never leaves your device.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
