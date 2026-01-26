import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'Refund Policy | SafePassportPic',
  description: 'Refund policy for SafePassportPic passport photo service',
};

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg">
            <strong className="text-foreground">Last updated:</strong> January
            2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              30-Day Money-Back Guarantee
            </h2>
            <p>
              We stand behind the quality of our passport photos. If your photo
              is rejected by a government office for technical reasons related
              to our processing, we will provide a{' '}
              <strong className="text-foreground">
                full refund within 30 days
              </strong>{' '}
              of purchase.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Eligible for Refund
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Photo rejected due to technical specifications (size,
                dimensions, background)
              </li>
              <li>Technical issues preventing download of purchased photos</li>
              <li>Duplicate charges or billing errors</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Not Eligible for Refund
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Photo rejected due to subject-related issues (expression,
                glasses, head covering not meeting requirements)
              </li>
              <li>User error in photo selection or printing</li>
              <li>Change of mind after successful download</li>
              <li>Requests made more than 30 days after purchase</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              How to Request a Refund
            </h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Email us at{' '}
                <strong className="text-foreground">refunds@safepassportpic.com</strong>
              </li>
              <li>Include your payment confirmation or transaction ID</li>
              <li>
                Provide the rejection notice from the government office (if
                applicable)
              </li>
              <li>We will process your refund within 5-7 business days</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Free Corrections
            </h2>
            <p>
              Before requesting a refund, please note that you can create
              unlimited new photos with your purchase. If your first attempt
              doesn&apos;t work out, try uploading a different photo or
              adjusting the crop — it&apos;s included at no extra charge.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p>
              For refund requests or questions, please contact us at
              refunds@safepassportpic.com
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
