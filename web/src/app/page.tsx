import { Header } from '@/components/header';
import { Hero } from '@/components/hero';
import { PricingSection } from '@/components/pricing-section';
import { FAQ } from '@/components/faq';
import { Footer } from '@/components/footer';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <Hero />

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-card/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Three simple steps. No app downloads needed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  icon: '📸',
                  title: 'Upload or Snap',
                  description:
                    'Take a photo with your phone camera or upload an existing one. Any well-lit photo works.',
                },
                {
                  step: '2',
                  icon: '🤖',
                  title: 'AI Does the Magic',
                  description:
                    'Face detection positions your photo perfectly. Background removal creates a clean white background. All on your device.',
                },
                {
                  step: '3',
                  icon: '📥',
                  title: 'Download & Print',
                  description:
                    'Get a single passport photo and a 4×6 printable sheet. Take it to any photo printer — done!',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    {item.icon}
                  </div>
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Your Photos Never Leave Your Device
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Unlike other passport photo services, we process everything
                  directly in your browser. No uploads, no cloud processing, no
                  data collection.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'AI face detection runs locally via MediaPipe',
                    'Background removal happens in your browser',
                    'Zero photos transmitted to any server',
                    'No accounts or sign-ups required',
                    'Only payment goes through Stripe (secured)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="rounded-2xl bg-card border border-border p-8 text-center max-w-sm">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold">100% Client-Side</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    All AI models run directly in your browser using WebAssembly
                    and WebGPU. We couldn&apos;t see your photos even if we
                    wanted to.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        <PricingSection />

        <Separator />

        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
