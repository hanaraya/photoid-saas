import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BreadcrumbSchema } from '@/components/breadcrumb-schema';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const breadcrumbs = [
  { name: 'Home', url: 'https://safepassportpic.com' },
  {
    name: 'Green Card Photo',
    url: 'https://safepassportpic.com/green-card-photo',
  },
];

export const metadata: Metadata = {
  title:
    'Green Card Photo Online — USCIS 2x2 Compliant in 60 Seconds | SafePassportPic',
  description:
    'Create a compliant Green Card photo online in 60 seconds. Meet all USCIS 2×2 inch requirements for I-485, I-130, I-765, and other immigration forms. 100% private — $4.99 one-time.',
  keywords: [
    'green card photo online',
    'USCIS photo requirements',
    'immigration photo',
    '2x2 photo for green card',
    'I-485 photo',
    'I-130 photo',
    'I-765 photo',
    'EAD photo',
    'green card photo app',
    'USCIS compliant photo',
  ],
  openGraph: {
    title: 'Green Card Photo Online — USCIS 2x2 Compliant in 60 Seconds',
    description:
      'Create a compliant Green Card photo instantly. AI-powered, 100% private, processed in your browser.',
    type: 'website',
    url: 'https://safepassportpic.com/green-card-photo',
    images: [
      {
        url: 'https://safepassportpic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Green Card Photo Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Green Card Photo Online — USCIS 2x2 Compliant in 60 Seconds',
    description:
      'Create a compliant Green Card photo instantly. AI-powered, 100% private.',
    images: ['https://safepassportpic.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/green-card-photo',
  },
};

const requirements = [
  {
    icon: '📐',
    title: '2×2 Inch (51×51mm) Size',
    description: 'Standard USCIS photo dimensions — same as US passport photos',
  },
  {
    icon: '⬜',
    title: 'Plain White Background',
    description:
      'White or off-white background only, no patterns, shadows, or other objects',
  },
  {
    icon: '👤',
    title: '1-1⅜ Inch Head Height',
    description:
      'Your head (chin to top of hair) must be 1 to 1⅜ inches in the photo',
  },
  {
    icon: '👁️',
    title: 'Eyes Open, Forward Facing',
    description:
      'Look directly at camera with neutral expression, both eyes visible',
  },
  {
    icon: '🚫',
    title: 'No Glasses',
    description:
      'Remove all glasses — USCIS no longer allows glasses in photos since 2016',
  },
  {
    icon: '📅',
    title: 'Recent Photo',
    description:
      'Must be taken within the last 6 months and reflect your current appearance',
  },
];

const formTypes = [
  { form: 'I-485', name: 'Adjustment of Status', photos: '2 photos' },
  { form: 'I-130', name: 'Petition for Alien Relative', photos: '2 photos' },
  { form: 'I-765', name: 'EAD (Work Permit)', photos: '2 photos' },
  { form: 'I-131', name: 'Travel Document', photos: '2 photos' },
  { form: 'I-90', name: 'Green Card Renewal', photos: '2 photos' },
  { form: 'N-400', name: 'Citizenship Application', photos: '2 photos' },
];

const faqs = [
  {
    question:
      'What are the USCIS photo requirements for Green Card applications?',
    answer:
      'USCIS requires 2×2 inch (51×51mm) photos with a plain white background. Your head must be 1 to 1⅜ inches from chin to top of hair. Eyes must be open and looking directly at camera. No glasses allowed. Photos must be in color and taken within the last 6 months.',
  },
  {
    question: 'Can I use the same photo for passport and Green Card?',
    answer:
      'Yes! US passport and Green Card (USCIS) photos have the same requirements — 2×2 inches with white background. Your SafePassportPic photo works for both applications.',
  },
  {
    question: 'How many photos do I need for my Green Card application?',
    answer:
      "Most USCIS forms require 2 identical photos. SafePassportPic provides a printable sheet with multiple photos, so you'll have plenty for your application.",
  },
  {
    question: 'Can I wear glasses in my Green Card photo?',
    answer:
      'No. Since November 2016, USCIS no longer allows glasses in immigration photos. You must remove all eyewear, including prescription glasses.',
  },
  {
    question: 'Can I take a Green Card photo with my phone?',
    answer:
      'Yes! You can take a Green Card photo with any smartphone camera. SafePassportPic works directly in your browser — snap a selfie or upload an existing photo, and our AI will automatically crop, resize, and add a white background.',
  },
  {
    question: 'What if my Green Card photo gets rejected?',
    answer:
      'SafePassportPic includes a compliance checker that validates your photo against official USCIS specifications. If your photo is somehow rejected, we offer a 30-day money-back guarantee.',
  },
  {
    question: 'Can I smile in my Green Card photo?',
    answer:
      'You should have a neutral expression with your mouth closed. A natural, relaxed expression is acceptable, but avoid smiling or exaggerated expressions.',
  },
  {
    question: 'Where can I print my Green Card photo?',
    answer:
      "You'll receive a 4×6 inch printable sheet with multiple photos. You can print this at CVS, Walgreens, Costco, Walmart, or any photo printing service. Most cost less than $0.50.",
  },
  {
    question: 'What forms require USCIS photos?',
    answer:
      'Common forms requiring photos include: I-485 (Adjustment of Status), I-130 (Petition for Alien Relative), I-765 (EAD/Work Permit), I-131 (Travel Document), I-90 (Green Card Renewal), and N-400 (Citizenship). All use the same 2×2 inch format.',
  },
];

// JSON-LD for the Green Card Photo page
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://safepassportpic.com/green-card-photo',
      name: 'Green Card Photo Online — USCIS 2x2 Compliant in 60 Seconds',
      description:
        'Create a compliant Green Card photo online in 60 seconds. Meet all USCIS 2×2 inch requirements.',
      url: 'https://safepassportpic.com/green-card-photo',
      isPartOf: {
        '@id': 'https://safepassportpic.com/#website',
      },
    },
    {
      '@type': 'HowTo',
      name: 'How to Create a Green Card Photo Online',
      description:
        'Create a compliant USCIS Green Card photo in 60 seconds using SafePassportPic',
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
          text: 'Our AI automatically removes the background, crops to 2×2 inches, and validates against USCIS requirements.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Download & print',
          text: 'Download your compliant photo and print at any photo shop for less than $0.50.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://safepassportpic.com/green-card-photo#faq',
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
      '@id': 'https://safepassportpic.com/green-card-photo#product',
      name: 'Green Card Photo Service',
      description:
        'Create a compliant 2×2 inch USCIS Green Card photo online in 60 seconds. AI-powered background removal, instant compliance checking, and print-ready download.',
      brand: {
        '@type': 'Brand',
        name: 'SafePassportPic',
      },
      offers: {
        '@type': 'Offer',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://safepassportpic.com/green-card-photo',
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

export default function GreenCardPhotoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbSchema items={breadcrumbs} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                🇺🇸 Official USCIS Requirements
              </span>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Green Card Photo — Online in 60 Seconds
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Create a compliant 2×2 inch USCIS photo from your phone. Works
                for I-485, I-130, I-765, and all immigration forms. AI-powered,
                100% private.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/app?country=us"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  Create Green Card Photo — $4.99
                </Link>
                <a
                  href="#requirements"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium hover:bg-accent transition-colors"
                >
                  View Requirements
                </a>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                ✅ 30-day money-back guarantee • 🔒 Photos never leave your
                device
              </p>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section id="requirements" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                USCIS Photo Requirements
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
                  <p className="mt-2 text-muted-foreground">
                    {req.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Supported Forms Section */}
        <section className="py-16 sm:py-24 bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Works for All Immigration Forms
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                One photo format for every USCIS application
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {formTypes.map((form, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-semibold text-primary">
                      {form.form}
                    </span>
                    <p className="text-sm text-muted-foreground">{form.name}</p>
                  </div>
                  <span className="text-sm bg-primary/10 px-2 py-1 rounded">
                    {form.photos}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get your Green Card photo in 3 simple steps
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg">Snap a Selfie</h3>
                <p className="mt-2 text-muted-foreground">
                  Use your phone camera or upload an existing photo. Good
                  lighting helps!
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg">AI Does the Work</h3>
                <p className="mt-2 text-muted-foreground">
                  Our AI removes the background, crops to 2×2 inches, and
                  validates USCIS compliance.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg">Download & Print</h3>
                <p className="mt-2 text-muted-foreground">
                  Download your print-ready sheet and print at any photo shop
                  for under $0.50.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/app?country=us"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create Your Green Card Photo Now
              </Link>
            </div>
          </div>
        </section>

        {/* Price Comparison */}
        <section className="py-16 sm:py-24 bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Save Money vs Retail
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Compare prices for Green Card photos
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4 font-semibold">
                      Service
                    </th>
                    <th className="text-left py-4 px-4 font-semibold">Price</th>
                    <th className="text-left py-4 px-4 font-semibold">Time</th>
                    <th className="text-left py-4 px-4 font-semibold">
                      Privacy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-primary/5">
                    <td className="py-4 px-4 font-semibold">SafePassportPic</td>
                    <td className="py-4 px-4 text-green-600 font-semibold">
                      $4.99
                    </td>
                    <td className="py-4 px-4">60 seconds</td>
                    <td className="py-4 px-4">✅ 100% private</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">CVS</td>
                    <td className="py-4 px-4">$16.99</td>
                    <td className="py-4 px-4">10+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Walgreens</td>
                    <td className="py-4 px-4">$16.99</td>
                    <td className="py-4 px-4">10+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">USPS</td>
                    <td className="py-4 px-4">$15.00</td>
                    <td className="py-4 px-4">15+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Immigration Attorney</td>
                    <td className="py-4 px-4">$25-50</td>
                    <td className="py-4 px-4">During appointment</td>
                    <td className="py-4 px-4">In-office</td>
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
                Everything you need to know about Green Card photos
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
              Ready to Create Your Green Card Photo?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands who&apos;ve saved time and money with
              SafePassportPic
            </p>
            <div className="mt-10">
              <Link
                href="/app?country=us"
                className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-10 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create Green Card Photo — $4.99
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✅ 30-day money-back guarantee • 🔒 Photos never leave your device
              • 🇺🇸 USCIS compliant
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
