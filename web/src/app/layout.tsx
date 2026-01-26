import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
