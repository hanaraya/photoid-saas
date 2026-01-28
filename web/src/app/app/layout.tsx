import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Passport Photo — Free Preview | SafePassportPic',
  description:
    'Create your passport photo now. Snap a selfie, AI removes the background, get a compliant 2x2 photo in 60 seconds. 100% private — processed in your browser.',
  keywords: [
    'passport photo maker',
    'create passport photo',
    'passport photo app',
    'passport photo online',
    'free passport photo preview',
  ],
  openGraph: {
    title: 'Create Passport Photo — Free Preview | SafePassportPic',
    description:
      'Create your passport photo in 60 seconds. AI-powered, 100% private.',
    type: 'website',
    url: 'https://safepassportpic.com/app',
    images: [
      {
        url: 'https://safepassportpic.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SafePassportPic - Create passport photos instantly',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Passport Photo — Free Preview',
    description:
      'Create your passport photo in 60 seconds. 100% private.',
    images: ['https://safepassportpic.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/app',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
