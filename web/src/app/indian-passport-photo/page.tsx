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
  title: 'Indian Passport Photo Online — 2x2 Inch (51x51mm) Compliant in 60 Seconds | SafePassportPic',
  description:
    'Create a compliant Indian passport photo online in 60 seconds. Meet all 2×2 inch (51×51mm) requirements: white background, 70-80% face coverage. 100% private — $4.99 one-time.',
  keywords: [
    'Indian passport photo online',
    'Indian passport photo requirements',
    '2x2 inch passport photo India',
    '51x51mm passport photo',
    'Indian passport photo size',
    'India passport photo app',
    'Indian passport photo background',
    'OCI card photo',
    'Indian visa photo',
  ],
  openGraph: {
    title: 'Indian Passport Photo Online — 2x2 Inch Compliant in 60 Seconds',
    description:
      'Create a compliant Indian passport photo instantly. AI-powered, 100% private, processed in your browser.',
    type: 'website',
    url: 'https://safepassportpic.com/indian-passport-photo',
    images: [
      {
        url: 'https://safepassportpic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Indian Passport Photo Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indian Passport Photo Online — 2x2 Inch Compliant in 60 Seconds',
    description: 'Create a compliant Indian passport photo instantly. AI-powered, 100% private.',
    images: ['https://safepassportpic.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/indian-passport-photo',
  },
};

const requirements = [
  {
    icon: '📐',
    title: '2×2 Inch (51×51mm) Size',
    description: 'Standard Indian passport photo dimensions — same as US passport size',
  },
  {
    icon: '⬜',
    title: 'Plain White Background',
    description: 'White or off-white background only, no patterns or shadows',
  },
  {
    icon: '👤',
    title: '70-80% Face Coverage',
    description: 'Your face should take up 70-80% of the photo frame, chin to crown visible',
  },
  {
    icon: '👁️',
    title: 'Both Ears Visible',
    description: 'Full front-face view with both ears clearly visible, neutral expression',
  },
  {
    icon: '🚫',
    title: 'No Glasses',
    description: 'Remove glasses completely — not allowed in Indian passport photos',
  },
  {
    icon: '💡',
    title: 'No Shadows',
    description: 'Even lighting with no shadows on face or background',
  },
];

const faqs = [
  {
    question: 'What are the official Indian passport photo requirements?',
    answer:
      'Indian passport photos must be 2×2 inches (51×51mm) in size, in colour, with a plain white or off-white background. Your face should cover 70-80% of the photo with both ears visible. Eyes must be open and looking directly at the camera. The photo must be recent (taken within the last 3 months).',
  },
  {
    question: 'Can I wear glasses in my Indian passport photo?',
    answer:
      'No. Glasses are not allowed in Indian passport photos. You must remove all eyewear, including prescription glasses, before taking the photo.',
  },
  {
    question: 'Is the Indian passport photo size the same as US?',
    answer:
      'Yes! Both Indian and US passport photos are 2×2 inches (51×51mm). SafePassportPic automatically creates photos in this format that work for both countries.',
  },
  {
    question: 'Can I take an Indian passport photo with my phone?',
    answer:
      'Yes! You can take an Indian passport photo with any smartphone camera. SafePassportPic works directly in your browser — snap a selfie or upload an existing photo, and our AI will automatically crop, resize to 2×2 inches, and add a white background.',
  },
  {
    question: 'Can I use the same photo for OCI and Indian passport?',
    answer:
      'Yes, OCI (Overseas Citizen of India) card photos have the same requirements as Indian passport photos — 2×2 inches with white background. Your SafePassportPic photo works for both applications.',
  },
  {
    question: 'What if my Indian passport photo gets rejected?',
    answer:
      'SafePassportPic includes a compliance checker that validates your photo against official Indian government specifications. If your photo is somehow rejected, we offer a 30-day money-back guarantee.',
  },
  {
    question: 'Can I smile in my Indian passport photo?',
    answer:
      'You should have a neutral expression with your mouth closed. Natural, relaxed expressions are acceptable, but avoid smiling or exaggerated expressions.',
  },
  {
    question: 'Where can I print my Indian passport photo?',
    answer:
      'You\'ll receive a printable sheet with multiple passport photos. You can print this at any photo shop, Costco, Walgreens, CVS, or office supply store. Most cost less than $0.50 in the US or ₹10-20 in India.',
  },
  {
    question: 'Do I need to show both ears in my Indian passport photo?',
    answer:
      'Yes, both ears must be clearly visible in the photo. Pull back any hair covering your ears. This is a strict requirement for Indian passports.',
  },
];

// JSON-LD for the Indian Passport Photo page
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://safepassportpic.com/indian-passport-photo',
      name: 'Indian Passport Photo Online — 2x2 Inch Compliant in 60 Seconds',
      description:
        'Create a compliant Indian passport photo online in 60 seconds. Meet all 2×2 inch requirements.',
      url: 'https://safepassportpic.com/indian-passport-photo',
      isPartOf: {
        '@id': 'https://safepassportpic.com/#website',
      },
    },
    {
      '@type': 'HowTo',
      name: 'How to Create an Indian Passport Photo Online',
      description:
        'Create a compliant Indian passport photo in 60 seconds using SafePassportPic',
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
          text: 'Our AI automatically removes the background, crops to 2×2 inches, and validates against Indian requirements.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Download & print',
          text: 'Download your compliant photo and print at any photo shop for less than ₹20.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://safepassportpic.com/indian-passport-photo#faq',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    },
    {
      '@type': 'Product',
      '@id': 'https://safepassportpic.com/indian-passport-photo#product',
      name: 'Indian Passport Photo Service',
      description: 'Create a compliant 2×2 inch Indian passport photo online in 60 seconds. AI-powered background removal, instant compliance checking, and print-ready download.',
      brand: {
        '@type': 'Brand',
        name: 'SafePassportPic',
      },
      offers: {
        '@type': 'Offer',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://safepassportpic.com/indian-passport-photo',
        priceValidUntil: '2026-12-31',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '150',
        bestRating: '5',
        worstRating: '1',
      },
    },
  ],
};

export default function IndianPassportPhotoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbSchema items={BREADCRUMBS.indianPassport} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                🇮🇳 Official Indian Requirements
              </span>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Indian Passport Photo — Online in 60 Seconds
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Create a compliant 2×2 inch (51×51mm) Indian passport photo from your phone. AI-powered,
                100% private, meets all government requirements.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/app?country=india"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  Create Indian Passport Photo — $4.99
                </Link>
                <a
                  href="#requirements"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium hover:bg-accent transition-colors"
                >
                  View Requirements
                </a>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                ✅ 30-day money-back guarantee • 🔒 Photos never leave your device • Works for OCI too
              </p>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section id="requirements" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Indian Passport Photo Requirements
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Your photo must meet these official specifications
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-3">{req.icon}</div>
                  <h3 className="font-semibold text-lg">{req.title}</h3>
                  <p className="mt-2 text-muted-foreground">{req.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-24 bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get your Indian passport photo in 3 simple steps
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg">Snap a Selfie</h3>
                <p className="mt-2 text-muted-foreground">
                  Use your phone camera or upload an existing photo. Make sure both ears are visible!
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg">AI Does the Work</h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI removes the background, crops to 2×2 inches, and validates compliance.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg">Download & Print</h3>
                <p className="mt-2 text-muted-foreground">
                  Download your print-ready sheet and print anywhere for under ₹20.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/app?country=india"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create Your Indian Passport Photo Now
              </Link>
            </div>
          </div>
        </section>

        {/* OCI Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl bg-primary/5 p-8 sm:p-12">
              <div className="grid gap-8 sm:grid-cols-2 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    Also Works for OCI Card Applications
                  </h2>
                  <p className="mt-4 text-lg text-muted-foreground">
                    Overseas Citizen of India (OCI) cards require the same 2×2 inch photo specifications 
                    as Indian passports. One photo from SafePassportPic works for both applications.
                  </p>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-center gap-3">
                      <span className="text-green-600">✓</span>
                      <span>Same 2×2 inch dimensions</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-green-600">✓</span>
                      <span>White background required</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-green-600">✓</span>
                      <span>Both ears visible</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="text-green-600">✓</span>
                      <span>No glasses allowed</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <Link
                    href="/app?country=india"
                    className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    Create OCI Photo — $4.99
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Price Comparison */}
        <section className="py-16 sm:py-24 bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Save Money vs Photo Studios
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Compare prices for Indian passport photos
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-semibold">Service</th>
                    <th className="text-left py-4 px-4 font-semibold">Price</th>
                    <th className="text-left py-4 px-4 font-semibold">Time</th>
                    <th className="text-left py-4 px-4 font-semibold">Privacy</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-primary/5">
                    <td className="py-4 px-4 font-semibold">SafePassportPic</td>
                    <td className="py-4 px-4 text-green-600 font-semibold">$4.99 (~₹415)</td>
                    <td className="py-4 px-4">60 seconds</td>
                    <td className="py-4 px-4">✅ 100% private</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Photo Studio (India)</td>
                    <td className="py-4 px-4">₹100-300</td>
                    <td className="py-4 px-4">15-30 minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">CVS (USA)</td>
                    <td className="py-4 px-4">$16.99</td>
                    <td className="py-4 px-4">10+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Walgreens (USA)</td>
                    <td className="py-4 px-4">$16.99</td>
                    <td className="py-4 px-4">10+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">PhotoAid (Online)</td>
                    <td className="py-4 px-4">$6.95-16.99</td>
                    <td className="py-4 px-4">5+ minutes</td>
                    <td className="py-4 px-4">⚠️ Uploads to server</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about Indian passport photos
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
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

        {/* CTA Section */}
        <section className="py-16 sm:py-24 bg-muted/50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Create Your Indian Passport Photo?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands who&apos;ve saved time and money with SafePassportPic
            </p>
            <div className="mt-10">
              <Link
                href="/app?country=india"
                className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-10 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create Indian Passport Photo — $4.99
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✅ 30-day money-back guarantee • 🔒 Photos never leave your device • 🇮🇳 Works for Passport & OCI
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
