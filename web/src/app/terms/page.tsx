import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | SafePassportPic',
  description:
    'Terms of service for SafePassportPic. Simple terms for a simple service — create passport photos privately in your browser.',
  openGraph: {
    title: 'Terms of Service | SafePassportPic',
    description: 'Simple terms for a simple service — create passport photos privately.',
    type: 'website',
    url: 'https://safepassportpic.com/terms',
  },
  alternates: {
    canonical: 'https://safepassportpic.com/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            <strong className="text-foreground">Last updated:</strong> January
            2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              1. Service Description
            </h2>
            <p>
              SafePassportPic provides a browser-based tool for creating passport and
              visa photos that meet official government specifications. Our
              service processes your photos entirely on your device — no images
              are uploaded to our servers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              2. Acceptance of Terms
            </h2>
            <p>
              By accessing or using SafePassportPic, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, please do
              not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              3. User Responsibilities
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You are responsible for ensuring your photo meets all
                requirements for your intended use
              </li>
              <li>
                You must use a recent photo that accurately represents your
                current appearance
              </li>
              <li>
                You are responsible for verifying the final output meets
                official specifications before printing
              </li>
              <li>
                You must not use this service for fraudulent or illegal purposes
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              4. Payment and Pricing
            </h2>
            <p>
              Access to watermark-free downloads requires a one-time payment.
              Prices are displayed in USD and include all applicable taxes.
              Payment is processed securely through Stripe.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              5. Disclaimer
            </h2>
            <p>
              While we strive to meet official photo specifications, SafePassportPic
              does not guarantee that photos will be accepted by any government
              agency. Photo requirements may change, and acceptance is
              ultimately at the discretion of the reviewing authority.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              6. Limitation of Liability
            </h2>
            <p>
              SafePassportPic is provided &quot;as is&quot; without warranties of any
              kind. We are not liable for any damages arising from the use of
              our service, including but not limited to rejected photo
              applications or delays in document processing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              7. Contact
            </h2>
            <p>
              For questions about these terms, please contact us at
              legal@safepassportpic.com
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
