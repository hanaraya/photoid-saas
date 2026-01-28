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
  title: 'Canadian Passport Photo Online — 50x70mm Compliant in 60 Seconds | SafePassportPic',
  description:
    'Create a compliant Canadian passport photo online in 60 seconds. Meet all 50×70mm IRCC requirements: white background, 31-36mm head height. 100% private — $4.99 one-time.',
  keywords: [
    'Canadian passport photo online',
    'Canadian passport photo requirements',
    '50x70mm passport photo',
    'Canadian passport photo size',
    'Canada passport photo app',
    'Canadian passport photo background',
    'IRCC passport photo',
    'Canada passport photo head size',
  ],
  openGraph: {
    title: 'Canadian Passport Photo Online — 50x70mm Compliant in 60 Seconds',
    description:
      'Create a compliant Canadian passport photo instantly. AI-powered, 100% private, processed in your browser.',
    type: 'website',
    url: 'https://safepassportpic.com/canadian-passport-photo',
    images: [
      {
        url: 'https://safepassportpic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Canadian Passport Photo Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canadian Passport Photo Online — 50x70mm Compliant in 60 Seconds',
    description: 'Create a compliant Canadian passport photo instantly. AI-powered, 100% private.',
    images: ['https://safepassportpic.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/canadian-passport-photo',
  },
};

const requirements = [
  {
    icon: '📐',
    title: '50×70mm Size',
    description: 'Standard Canadian passport photo dimensions (approximately 2×2.75 inches)',
  },
  {
    icon: '⬜',
    title: 'White Background',
    description: 'Plain white or light-coloured background with no patterns or shadows',
  },
  {
    icon: '👤',
    title: '31-36mm Head Height',
    description: 'Your head (chin to crown) must be between 31mm and 36mm in the photo',
  },
  {
    icon: '👁️',
    title: 'Neutral Expression',
    description: 'Look directly at camera with neutral expression, mouth closed',
  },
  {
    icon: '🚫',
    title: 'No Glasses',
    description: 'Remove all glasses — this is required for Canadian passports since 2021',
  },
  {
    icon: '💡',
    title: 'Even Lighting',
    description: 'No shadows on face or background, natural skin tone',
  },
];

const faqs = [
  {
    question: 'What are the official Canadian passport photo requirements?',
    answer:
      'Canadian passport photos must be 50×70mm (2×2.75 inches), in colour, with a plain white or light-coloured background. Your head must be 31-36mm from chin to crown. Eyes must be open and looking directly at the camera. The photo must be recent (taken within the last 6 months) and show your current appearance.',
  },
  {
    question: 'Can I wear glasses in my Canadian passport photo?',
    answer:
      'No. As of 2021, glasses are not allowed in Canadian passport photos, even if you normally wear prescription glasses. You must remove all eyewear for the photo.',
  },
  {
    question: 'Can I take a Canadian passport photo with my phone?',
    answer:
      'Yes! You can take a Canadian passport photo with any smartphone camera. SafePassportPic works directly in your browser — snap a selfie or upload an existing photo, and our AI will automatically crop, resize to 50×70mm, and add the correct background.',
  },
  {
    question: 'What background colour is accepted for Canadian passport photos?',
    answer:
      'Canadian passport photos require a plain white or light-coloured background. SafePassportPic automatically creates a clean white background that meets IRCC requirements.',
  },
  {
    question: 'What if my Canadian passport photo gets rejected?',
    answer:
      'SafePassportPic includes a compliance checker that validates your photo against official IRCC specifications. If your photo is somehow rejected, we offer a 30-day money-back guarantee.',
  },
  {
    question: 'Can I smile in my Canadian passport photo?',
    answer:
      'You should have a neutral expression with your mouth closed. A natural, relaxed expression is acceptable, but avoid smiling or any exaggerated expressions.',
  },
  {
    question: 'Where can I print my Canadian passport photo?',
    answer:
      'You\'ll receive a printable sheet with multiple passport photos. You can print this at Shoppers Drug Mart, Walmart, Costco, London Drugs, or any photo printing service. Most cost less than $1 CAD.',
  },
  {
    question: 'Do I need a guarantor signature on my Canadian passport photo?',
    answer:
      'For adult passport renewals, you typically don\'t need a guarantor signature on the photo. For first-time applicants or children, one photo may need to be signed by your guarantor on the back. Check the specific IRCC requirements for your application type.',
  },
];

// JSON-LD for the Canadian Passport Photo page
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://safepassportpic.com/canadian-passport-photo',
      name: 'Canadian Passport Photo Online — 50x70mm Compliant in 60 Seconds',
      description:
        'Create a compliant Canadian passport photo online in 60 seconds. Meet all 50×70mm requirements.',
      url: 'https://safepassportpic.com/canadian-passport-photo',
      isPartOf: {
        '@id': 'https://safepassportpic.com/#website',
      },
    },
    {
      '@type': 'HowTo',
      name: 'How to Create a Canadian Passport Photo Online',
      description:
        'Create a compliant Canadian passport photo in 60 seconds using SafePassportPic',
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
          text: 'Our AI automatically removes the background, crops to 50×70mm, and validates against Canadian requirements.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Download & print',
          text: 'Download your compliant photo and print at any photo shop for less than $1 CAD.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://safepassportpic.com/canadian-passport-photo#faq',
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
      '@id': 'https://safepassportpic.com/canadian-passport-photo#product',
      name: 'Canadian Passport Photo Service',
      description: 'Create a compliant 50×70mm Canadian passport photo online in 60 seconds. AI-powered background removal, instant compliance checking, and print-ready download.',
      brand: {
        '@type': 'Brand',
        name: 'SafePassportPic',
      },
      offers: {
        '@type': 'Offer',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://safepassportpic.com/canadian-passport-photo',
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

export default function CanadianPassportPhotoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbSchema items={BREADCRUMBS.canadianPassport} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                🇨🇦 Official Canadian Requirements
              </span>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Canadian Passport Photo — Online in 60 Seconds
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Create a compliant 50×70mm Canadian passport photo from your phone. AI-powered,
                100% private, meets all IRCC requirements.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/app?country=canada"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  Create Canadian Passport Photo — $4.99
                </Link>
                <a
                  href="#requirements"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium hover:bg-accent transition-colors"
                >
                  View Requirements
                </a>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                ✅ 30-day money-back guarantee • 🔒 Photos never leave your device
              </p>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section id="requirements" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Canadian Passport Photo Requirements
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Your photo must meet these IRCC specifications
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
                Get your Canadian passport photo in 3 simple steps
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg">Snap a Selfie</h3>
                <p className="mt-2 text-muted-foreground">
                  Use your phone camera or upload an existing photo. Good lighting helps!
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg">AI Does the Work</h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI removes the background, crops to 50×70mm, and validates compliance.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg">Download & Print</h3>
                <p className="mt-2 text-muted-foreground">
                  Download your print-ready sheet and print at any photo shop for under $1 CAD.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/app?country=canada"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create Your Canadian Passport Photo Now
              </Link>
            </div>
          </div>
        </section>

        {/* Price Comparison */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Save Money vs In-Store
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Compare prices for Canadian passport photos
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
                    <td className="py-4 px-4 text-green-600 font-semibold">$4.99 USD (~$7 CAD)</td>
                    <td className="py-4 px-4">60 seconds</td>
                    <td className="py-4 px-4">✅ 100% private</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Shoppers Drug Mart</td>
                    <td className="py-4 px-4">$16.99 CAD</td>
                    <td className="py-4 px-4">10-15 minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Walmart Canada</td>
                    <td className="py-4 px-4">$12.97 CAD</td>
                    <td className="py-4 px-4">15+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Costco Canada</td>
                    <td className="py-4 px-4">$6.99 CAD</td>
                    <td className="py-4 px-4">10+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">London Drugs</td>
                    <td className="py-4 px-4">$14.99 CAD</td>
                    <td className="py-4 px-4">10+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 sm:py-24 bg-muted/50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Everything you need to know about Canadian passport photos
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
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Create Your Canadian Passport Photo?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands who&apos;ve saved time and money with SafePassportPic
            </p>
            <div className="mt-10">
              <Link
                href="/app?country=canada"
                className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-10 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create Canadian Passport Photo — $4.99
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✅ 30-day money-back guarantee • 🔒 Photos never leave your device • 🇨🇦 IRCC compliant
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
