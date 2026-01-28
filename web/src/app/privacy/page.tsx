import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Privacy Policy | SafePassportPic',
  description: 'Privacy policy for SafePassportPic passport photo service',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            <strong className="text-foreground">Last updated:</strong> January
            2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Our Privacy Promise
            </h2>
            <p>
              SafePassportPic is designed with privacy as a core principle.{' '}
              <strong className="text-foreground">
                Your photos never leave your device.
              </strong>{' '}
              All image processing happens entirely in your browser using
              client-side technology.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              What We Don&apos;t Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We do NOT upload, store, or transmit your photos to any server
              </li>
              <li>We do NOT use facial recognition or biometric data</li>
              <li>We do NOT track your photo editing activities</li>
              <li>We do NOT sell or share any personal data</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              What We Do Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">
                  Payment Information:
                </strong>{' '}
                When you make a purchase, payment is processed securely by
                Stripe. We receive confirmation of payment but do not store your
                card details.
              </li>
              <li>
                <strong className="text-foreground">Basic Analytics:</strong> We
                may collect anonymous usage statistics (page views, button
                clicks) to improve our service. This data cannot be used to
                identify you.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              How It Works
            </h2>
            <p>
              When you take or select a photo, it is processed entirely within your web
              browser using WebAssembly and JavaScript. The face detection,
              background removal, and photo formatting all happen on your
              device. The processed photo is temporarily stored in your
              browser&apos;s session storage only to survive the payment
              redirect, then immediately cleared.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p>
              If you have questions about this privacy policy, please contact us
              at privacy@safepassportpic.com
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
