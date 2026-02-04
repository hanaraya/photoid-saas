import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BreadcrumbSchema, BREADCRUMBS } from '@/components/breadcrumb-schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const metadata: Metadata = {
  title:
    'US Passport Photo Online — 2x2 Compliant in 60 Seconds | SafePassportPic',
  description:
    'Create a compliant US passport photo online in 60 seconds. Meet all 2x2 inch requirements: white background, 50-69% head height. 100% private — $4.99 one-time.',
  keywords: [
    'US passport photo online',
    'US passport photo requirements',
    '2x2 passport photo',
    'US passport photo size',
    'passport photo maker',
    'US passport photo app',
    'passport photo white background',
    'passport photo head size',
  ],
  openGraph: {
    title: 'US Passport Photo Online — 2x2 Compliant in 60 Seconds',
    description:
      'Create a compliant US passport photo instantly. AI-powered, 100% private, processed in your browser.',
    type: 'website',
    url: 'https://safepassportpic.com/us-passport-photo',
    images: [
      {
        url: 'https://safepassportpic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'US Passport Photo Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'US Passport Photo Online — 2x2 Compliant in 60 Seconds',
    description:
      'Create a compliant US passport photo instantly. AI-powered, 100% private.',
    images: ['https://safepassportpic.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/us-passport-photo',
  },
};

const requirements = [
  {
    icon: '📐',
    title: '2×2 Inches (51×51mm)',
    description:
      'Exact square dimensions required by the US Department of State',
  },
  {
    icon: '⬜',
    title: 'White Background',
    description:
      'Plain white or off-white background with no patterns or shadows',
  },
  {
    icon: '👤',
    title: '50-69% Head Height',
    description:
      'Your head (chin to crown) must occupy 1 to 1⅜ inches of the photo',
  },
  {
    icon: '👁️',
    title: 'Eyes Open & Visible',
    description:
      'Look directly at camera with neutral expression, mouth closed',
  },
  {
    icon: '🚫',
    title: 'No Glasses',
    description:
      'Eyeglasses are not permitted in US passport photos since 2016',
  },
  {
    icon: '💡',
    title: 'Even Lighting',
    description: 'No shadows on face or background, natural skin tone',
  },
];

const faqs = [
  {
    question: 'What are the official US passport photo requirements?',
    answer:
      'US passport photos must be exactly 2×2 inches (51×51mm), in color, with a white or off-white background. Your head must be 1 to 1⅜ inches (25-35mm) from chin to crown, occupying 50-69% of the photo height. Eyes must be open and looking directly at the camera, with a neutral expression. Glasses are not allowed.',
  },
  {
    question: 'How recent does my US passport photo need to be?',
    answer:
      'US passport photos must be taken within the last 6 months and accurately represent your current appearance. If your appearance has changed significantly (weight loss, facial hair, etc.), you should take a new photo.',
  },
  {
    question: 'Can I take a US passport photo with my phone?',
    answer:
      'Yes! You can take a US passport photo with any smartphone camera. SafePassportPic works directly in your browser — just snap a selfie or select an existing photo, and our AI will automatically crop, resize, and add a white background to meet all requirements.',
  },
  {
    question: "Why can't I wear glasses in my US passport photo?",
    answer:
      "Since November 2016, the US Department of State no longer accepts passport photos with eyeglasses. This applies to all types of glasses, including prescription glasses, sunglasses, and tinted lenses. The only exception is for medical necessity with a signed doctor's statement.",
  },
  {
    question: 'What if my US passport photo gets rejected?',
    answer:
      'SafePassportPic includes a compliance checker that validates your photo against official US Department of State specifications. If your photo is somehow rejected, we offer a 30-day money-back guarantee.',
  },
  {
    question: 'Can I use a US passport photo for my visa application?',
    answer:
      'US visa photos have the same 2×2 inch requirements as passport photos. However, some countries have different visa photo requirements. SafePassportPic supports 20+ country standards — just select your destination country.',
  },
  {
    question: 'Where can I print my US passport photo?',
    answer:
      "You'll receive a 4×6 inch printable sheet with multiple passport photos arranged. You can print this at any pharmacy (CVS, Walgreens), Costco, Walmart, or online photo printing service. Most cost less than $0.50.",
  },
  {
    question: 'Is my photo data private with SafePassportPic?',
    answer:
      'Yes, 100% private. Unlike other services, SafePassportPic processes your photos entirely in your browser using AI that runs on your device. Your photos are never uploaded to any server. We physically cannot see your images.',
  },
];

// JSON-LD for the US Passport Photo page
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://safepassportpic.com/us-passport-photo',
      name: 'US Passport Photo Online — 2x2 Compliant in 60 Seconds',
      description:
        'Create a compliant US passport photo online in 60 seconds. Meet all 2x2 inch requirements.',
      url: 'https://safepassportpic.com/us-passport-photo',
      isPartOf: {
        '@id': 'https://safepassportpic.com/#website',
      },
    },
    {
      '@type': 'HowTo',
      name: 'How to Create a US Passport Photo Online',
      description:
        'Create a compliant US passport photo in 60 seconds using SafePassportPic',
      totalTime: 'PT1M',
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: '4.99',
      },
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Snap a selfie',
          text: 'Take a photo with your phone camera or select an existing well-lit photo from your device.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'AI processes your photo',
          text: 'Our AI automatically detects your face, removes the background, and crops to exact 2x2 inch US passport specifications.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Review compliance',
          text: 'Check the compliance overlay showing head size, eye position, and margins against official requirements.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Download and print',
          text: 'Download your passport photo and 4x6 printable sheet. Print at any pharmacy or photo printer.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://safepassportpic.com/us-passport-photo#faq',
      mainEntity: faqs.map((faq, index) => ({
        '@type': 'Question',
        '@id': `https://safepassportpic.com/us-passport-photo#faq-${index + 1}`,
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    {
      '@type': 'Product',
      '@id': 'https://safepassportpic.com/us-passport-photo#product',
      name: 'US Passport Photo Service',
      description:
        'Create a compliant 2x2 inch US passport photo online in 60 seconds. AI-powered background removal, instant compliance checking, and print-ready download.',
      image: 'https://safepassportpic.com/og-image.png',
      brand: {
        '@type': 'Brand',
        name: 'SafePassportPic',
      },
      offers: {
        '@type': 'Offer',
        url: 'https://safepassportpic.com/us-passport-photo',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        priceValidUntil: '2026-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '127',
        bestRating: '5',
        worstRating: '1',
      },
    },
  ],
};

export default function USPassportPhotoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbSchema items={BREADCRUMBS.usPassport} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                🇺🇸 Official US Requirements
              </span>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                US Passport Photo — Online in 60 Seconds
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Create a <strong>compliant 2×2 inch US passport photo</strong>{' '}
                instantly. AI-powered background removal, automatic face
                positioning, and real-time compliance checking — all processed
                privately in your browser.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/app"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create US Passport Photo — $4.99
                </Link>
                <a
                  href="#requirements"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-border px-8 text-base font-semibold transition-colors hover:bg-accent"
                >
                  View Requirements
                </a>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                ✓ 30-day money-back guarantee &nbsp;•&nbsp; ✓ 100% private
                &nbsp;•&nbsp; ✓ Instant download
              </p>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section id="requirements" className="py-16 bg-card/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Official US Passport Photo Requirements
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Per the US Department of State — SafePassportPic checks all of
                these automatically
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {requirements.map((req) => (
                <div
                  key={req.title}
                  className="flex flex-col p-6 rounded-xl bg-card border border-border"
                >
                  <div className="text-3xl mb-3">{req.icon}</div>
                  <h3 className="text-lg font-semibold">{req.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {req.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How to Create Your US Passport Photo
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Four simple steps — no app download required
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: '1',
                  icon: '📸',
                  title: 'Snap a Selfie',
                  description:
                    "Use your phone camera or select an existing photo. Any well-lit photo works — we'll fix the background.",
                },
                {
                  step: '2',
                  icon: '🤖',
                  title: 'AI Processing',
                  description:
                    'Face detection positions you perfectly. Background removal creates a clean white background.',
                },
                {
                  step: '3',
                  icon: '✅',
                  title: 'Compliance Check',
                  description:
                    'Real-time overlay shows head size, eye position, and margins against US specifications.',
                },
                {
                  step: '4',
                  icon: '📥',
                  title: 'Download & Print',
                  description:
                    'Get your 2×2 photo plus a 4×6 printable sheet. Take it to any CVS, Walgreens, or photo printer.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    {item.icon}
                  </div>
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Checklist */}
        <section className="py-16 bg-card/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  US Passport Photo Compliance Checklist
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Our AI validates every requirement before you download
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Photo size: Exactly 2×2 inches (51×51mm)',
                    'Head height: 1 to 1⅜ inches (25-35mm)',
                    'Head position: Centered, occupying 50-69% height',
                    'Background: Plain white, no shadows',
                    'Expression: Neutral, eyes open, mouth closed',
                    'Lighting: Even, no shadows on face',
                    'Glasses: None (removed or not worn)',
                    'Recency: Represents current appearance',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="text-green-500 mt-0.5 text-lg">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="rounded-2xl bg-card border border-border p-8 text-center max-w-sm">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold">
                    100% Client-Side Processing
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your US passport photo is processed entirely in your
                    browser. Unlike CVS or Walgreens, we never see, store, or
                    upload your biometric data to any server.
                  </p>
                  <Link
                    href="/blog/passport-photo-privacy"
                    className="inline-flex mt-4 text-sm text-primary hover:underline"
                  >
                    Learn about our privacy approach →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get Your US Passport Photo Now
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One-time payment, instant download, 30-day guarantee
            </p>
            <div className="mt-8 rounded-2xl bg-card border border-border p-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold">$4.99</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm text-left max-w-xs mx-auto">
                {[
                  'Single US passport photo (2×2 inch)',
                  '4×6 printable sheet with multiple photos',
                  'AI background removal included',
                  'Compliance check against DOS specs',
                  '30-day money-back guarantee',
                  'Instant digital download',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/app"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create My US Passport Photo
              </Link>
              <p className="mt-3 text-xs text-muted-foreground">
                Compared to $16.99 at CVS or $14.99 at Walgreens
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 bg-card/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                US Passport Photo FAQ
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about US passport photos
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to create your compliant US passport photo?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join thousands who&apos;ve created passport photos with
              SafePassportPic
            </p>
            <Link
              href="/app"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started — $4.99
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
