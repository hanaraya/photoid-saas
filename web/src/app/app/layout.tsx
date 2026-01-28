import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Passport Photo | SafePassportPic',
  description:
    'Make compliant passport and visa photos in 60 seconds. AI-powered face detection, automatic background removal, 20+ country standards. 100% private — photos never leave your device. Only $4.99.',
  keywords: [
    'passport photo maker',
    'create passport photo',
    'make passport photo online',
    'DIY passport photo',
    'passport photo app',
    'visa photo maker',
    'ID photo creator',
    'passport photo editor',
    'passport photo tool',
    'instant passport photo',
  ],
  openGraph: {
    title: 'Create Your Passport Photo | SafePassportPic',
    description:
      'Make compliant passport photos in 60 seconds. AI-powered, 100% private — photos never leave your device.',
    url: 'https://safepassportpic.com/app',
    siteName: 'SafePassportPic',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SafePassportPic - Create Passport Photos Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Your Passport Photo | SafePassportPic',
    description:
      'Make compliant passport photos in 60 seconds. AI-powered, 100% private.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://safepassportpic.com/app',
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
