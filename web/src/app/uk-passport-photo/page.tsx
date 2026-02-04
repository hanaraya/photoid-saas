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
    'UK Passport Photo Online — 35x45mm Compliant in 60 Seconds | SafePassportPic',
  description:
    'Create a compliant UK passport photo online in 60 seconds. Meet all 35×45mm requirements: plain background, 29-34mm head height. 100% private — $4.99 one-time.',
  keywords: [
    'UK passport photo online',
    'UK passport photo requirements',
    '35x45mm passport photo',
    'UK passport photo size',
    'British passport photo',
    'UK passport photo app',
    'UK passport photo background',
    'UK passport photo head size',
  ],
  openGraph: {
    title: 'UK Passport Photo Online — 35x45mm Compliant in 60 Seconds',
    description:
      'Create a compliant UK passport photo instantly. AI-powered, 100% private, processed in your browser.',
    type: 'website',
    url: 'https://safepassportpic.com/uk-passport-photo',
    images: [
      {
        url: 'https://safepassportpic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UK Passport Photo Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UK Passport Photo Online — 35x45mm Compliant in 60 Seconds',
    description:
      'Create a compliant UK passport photo instantly. AI-powered, 100% private.',
    images: ['https://safepassportpic.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/uk-passport-photo',
  },
};

const requirements = [
  {
    icon: '📐',
    title: '35×45mm Size',
    description:
      'Standard UK passport photo dimensions (approximately 1.4×1.8 inches)',
  },
  {
    icon: '⬜',
    title: 'Plain Light Background',
    description:
      'Plain cream or light grey background with no patterns or shadows',
  },
  {
    icon: '👤',
    title: '29-34mm Head Height',
    description:
      'Your head (chin to crown) must be between 29mm and 34mm in the photo',
  },
  {
    icon: '👁️',
    title: 'Eyes Open & Visible',
    description:
      'Look directly at camera with neutral expression, mouth closed',
  },
  {
    icon: '🚫',
    title: 'No Glasses (Usually)',
    description:
      'Remove glasses unless you have a prescription that requires them',
  },
  {
    icon: '💡',
    title: 'Even Lighting',
    description: 'No shadows on face or background, natural skin tone',
  },
];

const faqs = [
  {
    question: 'What are the official UK passport photo requirements?',
    answer:
      'UK passport photos must be 35×45mm, in colour, with a plain cream or light grey background. Your head must be 29-34mm from chin to crown (64-76% of photo height). Eyes must be open and looking directly at the camera. The photo must be recent (taken within the last month) and show your current appearance.',
  },
  {
    question: 'Can I use a white background for UK passport photos?',
    answer:
      'While the UK officially specifies cream or light grey, a plain white background is generally accepted. SafePassportPic automatically creates a clean white background that meets UK requirements.',
  },
  {
    question: 'Can I take a UK passport photo with my phone?',
    answer:
      'Yes! You can take a UK passport photo with any smartphone camera. SafePassportPic works directly in your browser — snap a selfie or upload an existing photo, and our AI will automatically crop, resize, and add the correct background.',
  },
  {
    question: 'Do I need to remove my glasses for a UK passport photo?',
    answer:
      'You should remove your glasses unless you have a prescription requiring you to wear them at all times. If you must wear glasses, ensure there is no glare on the lenses and your eyes are clearly visible.',
  },
  {
    question: 'What if my UK passport photo gets rejected?',
    answer:
      'SafePassportPic includes a compliance checker that validates your photo against official UK government specifications. If your photo is somehow rejected, we offer a 30-day money-back guarantee.',
  },
  {
    question: 'Can I smile in my UK passport photo?',
    answer:
      'You should have a neutral expression with your mouth closed. A natural, relaxed expression is fine, but avoid broad smiles or exaggerated expressions.',
  },
  {
    question: 'Where can I print my UK passport photo?',
    answer:
      "You'll receive a 6×4 inch (15×10cm) printable sheet with multiple passport photos. You can print this at Boots, Snappy Snaps, Tesco, Asda, or any photo printing service. Most cost less than £0.50.",
  },
];

// JSON-LD for the UK Passport Photo page
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://safepassportpic.com/uk-passport-photo',
      name: 'UK Passport Photo Online — 35x45mm Compliant in 60 Seconds',
      description:
        'Create a compliant UK passport photo online in 60 seconds. Meet all 35×45mm requirements.',
      url: 'https://safepassportpic.com/uk-passport-photo',
      isPartOf: {
        '@id': 'https://safepassportpic.com/#website',
      },
    },
    {
      '@type': 'HowTo',
      name: 'How to Create a UK Passport Photo Online',
      description:
        'Create a compliant UK passport photo in 60 seconds using SafePassportPic',
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
          text: 'Our AI automatically removes the background, crops to 35×45mm, and validates against UK requirements.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Download & print',
          text: 'Download your compliant photo and print at any photo shop for less than £0.50.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://safepassportpic.com/uk-passport-photo#faq',
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
      '@id': 'https://safepassportpic.com/uk-passport-photo#product',
      name: 'UK Passport Photo Service',
      description:
        'Create a compliant 35×45mm UK passport photo online in 60 seconds. AI-powered background removal, instant compliance checking, and print-ready download.',
      brand: {
        '@type': 'Brand',
        name: 'SafePassportPic',
      },
      offers: {
        '@type': 'Offer',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://safepassportpic.com/uk-passport-photo',
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

export default function UKPassportPhotoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbSchema items={BREADCRUMBS.ukPassport} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                🇬🇧 Official UK Requirements
              </span>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                UK Passport Photo — Online in 60 Seconds
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
                Create a compliant 35×45mm UK passport photo from your phone.
                AI-powered, 100% private, meets all HMPO requirements.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/app?country=uk"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  Create UK Passport Photo — $4.99
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
                UK Passport Photo Requirements
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Your photo must meet these HMPO specifications
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

        {/* How It Works Section */}
        <section className="py-16 sm:py-24 bg-muted/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Get your UK passport photo in 3 simple steps
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
                  Our AI removes the background, crops to 35×45mm, and validates
                  compliance.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg">Download & Print</h3>
                <p className="mt-2 text-muted-foreground">
                  Download your print-ready sheet and print at any photo shop
                  for under £0.50.
                </p>
              </div>
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/app?country=uk"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create Your UK Passport Photo Now
              </Link>
            </div>
          </div>
        </section>

        {/* Price Comparison */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Save Money vs High Street
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Compare prices for UK passport photos
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
                      $4.99 (~£4)
                    </td>
                    <td className="py-4 px-4">60 seconds</td>
                    <td className="py-4 px-4">✅ 100% private</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Boots</td>
                    <td className="py-4 px-4">£6.99</td>
                    <td className="py-4 px-4">5-10 minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Snappy Snaps</td>
                    <td className="py-4 px-4">£9.99+</td>
                    <td className="py-4 px-4">10+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Post Office</td>
                    <td className="py-4 px-4">£12.99</td>
                    <td className="py-4 px-4">15+ minutes</td>
                    <td className="py-4 px-4">In-store</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-4">Max Spielmann</td>
                    <td className="py-4 px-4">£8.99</td>
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
                Everything you need to know about UK passport photos
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
              Ready to Create Your UK Passport Photo?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands who&apos;ve saved time and money with
              SafePassportPic
            </p>
            <div className="mt-10">
              <Link
                href="/app?country=uk"
                className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-10 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Create UK Passport Photo — $4.99
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              ✅ 30-day money-back guarantee • 🔒 Photos never leave your device
              • 🇬🇧 HMPO compliant
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
