import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One price, everything included. No subscriptions.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <Card className="relative border-primary/50 shadow-lg shadow-primary/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Best Value
              </span>
            </div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Digital Download</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$4.99</span>
                <span className="text-muted-foreground ml-1">one-time</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                {[
                  'Single passport photo (high-res)',
                  '4×6 printable sheet (multiple photos)',
                  'Background removal to white',
                  'AI face detection & positioning',
                  'Compliance check for your country',
                  '20+ country standards supported',
                  '100% private — never leaves your device',
                  'Instant download — no waiting',
                ].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/app"
                className="mt-4 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started →
              </Link>

              <p className="text-center text-xs text-muted-foreground">
                30-day money-back guarantee · Secure payment via Stripe
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
