import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const GA_MEASUREMENT_ID = 'G-1ESL6FDEF9';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://safepassportpic.com'
  ),
  title: 'SafePassportPic — Passport Photos in 60 Seconds',
  description:
    'Create compliant passport and visa photos instantly from your phone. 100% private — processed entirely in your browser. 20+ country standards. $4.99 one-time.',
  keywords: [
    'passport photo',
    'visa photo',
    'ID photo',
    'passport photo maker',
    'passport photo online',
    'photo for passport',
    'passport picture',
    'visa application photo',
    'government ID photo',
  ],
  authors: [{ name: 'SafePassportPic' }],
  creator: 'SafePassportPic',
  publisher: 'SafePassportPic',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'SafePassportPic — Passport Photos in 60 Seconds',
    description:
      'Create compliant passport photos instantly. 100% private, processed in your browser.',
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://safepassportpic.com',
    siteName: 'SafePassportPic',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SafePassportPic - Create passport photos instantly',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SafePassportPic — Passport Photos in 60 Seconds',
    description:
      'Create compliant passport photos instantly. 100% private, processed in your browser.',
    images: ['/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

// JSON-LD structured data for SEO
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://safepassportpic.com/#app',
      name: 'SafePassportPic',
      description:
        'Create compliant passport and visa photos instantly from your phone. 100% private — processed entirely in your browser.',
      url: 'https://safepassportpic.com',
      applicationCategory: 'PhotographyApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript, WebAssembly support',
      offers: {
        '@type': 'Offer',
        price: '4.99',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        ratingCount: '127',
        bestRating: '5',
        worstRating: '1',
      },
      featureList: [
        '100% private - photos never leave your device',
        'AI-powered face detection and background removal',
        '20+ country passport standards supported',
        'Real-time camera guides with face positioning overlay',
        'Visual compliance measurement overlay showing head size, eye position, margins',
        'Smart retake suggestions when photo needs improvement',
        'Instant compliance checking against government specifications',
        'Print-ready 4x6 photo sheets',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://safepassportpic.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Are my photos private and secure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, 100%. All photo processing happens entirely in your browser using AI models that run on your device. Your photos are never uploaded to our servers or any third party.',
          },
        },
        {
          '@type': 'Question',
          name: 'What countries are supported?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We support 20+ country standards including US, UK, EU/Schengen, Canada, Australia, India, China, and more. Each standard has the correct dimensions and requirements.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I use my phone camera?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Absolutely! You can either upload an existing photo or take one directly with your phone camera. For best results, use good lighting and a plain background.',
          },
        },
        {
          '@type': 'Question',
          name: 'What if my photo gets rejected?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We offer a 30-day money-back guarantee. If your photo is rejected by the government agency, contact us for a full refund.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I know if my photo meets requirements?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our app shows a real-time compliance overlay that measures head size, eye position, and margins against official specifications. You\'ll see green checkmarks when everything passes. If something needs fixing, you get smart suggestions on exactly what to improve.',
          },
        },
      ],
    },
    {
      '@type': 'Organization',
      '@id': 'https://safepassportpic.com/#organization',
      name: 'SafePassportPic',
      url: 'https://safepassportpic.com',
      logo: 'https://safepassportpic.com/icon-512.png',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
