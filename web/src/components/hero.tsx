import Link from 'next/link';
import { TrustBadgesInline } from '@/components/trust-signals';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Trust badges */}
          <div className="mb-6">
            <TrustBadgesInline />
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Passport Photos in <span className="text-primary">60 Seconds</span>
            <br />
            <span className="text-muted-foreground">— From Your Phone</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Snap a selfie, AI handles the rest. Background removal, face
            positioning, compliance checks — all processed on{' '}
            <strong className="text-foreground">your device</strong>. Your
            photos never leave your phone.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex h-14 items-center justify-center rounded-lg bg-orange-500 px-10 text-lg font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5"
            >
              Create Passport Photo — $4.99
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center rounded-lg border border-border px-8 text-base font-semibold transition-colors hover:bg-secondary"
            >
              See How It Works
            </a>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Only <strong className="text-foreground">$4.99</strong> for digital
            download · No subscription ·{' '}
            <Link href="/us-passport-photo" className="underline hover:text-primary">
              US Requirements Guide
            </Link>
          </p>

          {/* Country flags */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              '🇺🇸',
              '🇬🇧',
              '🇪🇺',
              '🇨🇦',
              '🇮🇳',
              '🇦🇺',
              '🇨🇳',
              '🇯🇵',
              '🇰🇷',
              '🇩🇪',
              '🇫🇷',
              '🇧🇷',
              '🇲🇽',
            ].map((flag) => (
              <span
                key={flag}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-lg border border-border"
              >
                {flag}
              </span>
            ))}
            <span className="inline-flex h-10 items-center justify-center rounded-full bg-card px-3 text-sm text-muted-foreground border border-border">
              +20 countries
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
