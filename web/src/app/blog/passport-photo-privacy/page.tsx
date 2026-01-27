import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title:
    'Why Your Passport Photo App Might Be a Privacy Nightmare (And How to Stay Safe) | SafePassportPic',
  description:
    'Most passport photo apps upload your biometric face data to servers. Learn the risks and how to find a safe, private passport photo solution that processes locally.',
  keywords: [
    'passport photo privacy',
    'passport photo safe',
    'passport photo no upload',
    'passport photo data security',
    'passport photo biometric data',
    'private passport photo app',
    'passport photo GDPR',
    'face data privacy',
  ],
  authors: [{ name: 'SafePassportPic' }],
  openGraph: {
    title: 'Why Your Passport Photo App Might Be a Privacy Nightmare',
    description:
      'Most passport photo apps upload your biometric face data to servers. Learn the risks and how to stay safe.',
    type: 'article',
    url: 'https://safepassportpic.com/blog/passport-photo-privacy',
    publishedTime: '2025-01-27',
  },
  alternates: {
    canonical: 'https://safepassportpic.com/blog/passport-photo-privacy',
  },
};

// JSON-LD for the blog post
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline:
    'Why Your Passport Photo App Might Be a Privacy Nightmare (And How to Stay Safe)',
  description:
    'Most passport photo apps upload your biometric face data to servers. Learn the risks and how to find a private solution.',
  image: 'https://safepassportpic.com/og-image.png',
  datePublished: '2025-01-27',
  dateModified: '2025-01-27',
  author: {
    '@type': 'Organization',
    name: 'SafePassportPic',
    url: 'https://safepassportpic.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'SafePassportPic',
    logo: {
      '@type': 'ImageObject',
      url: 'https://safepassportpic.com/icon-512.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://safepassportpic.com/blog/passport-photo-privacy',
  },
};

export default function PassportPhotoPrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        <article className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            {/* Header */}
            <header className="mb-12">
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <Link
                  href="/blog"
                  className="hover:text-primary transition-colors"
                >
                  ← Back to Blog
                </Link>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
                  Privacy
                </span>
                <time dateTime="2025-01-27">January 27, 2025</time>
                <span>•</span>
                <span>5 min read</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Why Your Passport Photo App Might Be a Privacy Nightmare (And How
                to Stay Safe)
              </h1>
              <p className="mt-6 text-xl text-muted-foreground">
                You need a passport photo. You Google &ldquo;passport photo app,&rdquo; 
                download something, and snap a selfie. Done in 60 seconds, right? But 
                here&apos;s what you probably didn&apos;t think about: <strong>where did your 
                face data just go?</strong>
              </p>
            </header>

            {/* Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  The Hidden Cost of &ldquo;Free&rdquo; Passport Photo Apps
                </h2>
                <p className="text-muted-foreground mb-4">
                  Most passport photo apps and websites work the same way: you upload 
                  your photo, their servers process it, and you download the result. 
                  Simple and fast.
                </p>
                <p className="text-muted-foreground mb-4">
                  But here&apos;s what&apos;s happening behind the scenes: <strong>your 
                  high-resolution face photo is now sitting on someone else&apos;s 
                  server</strong>. Along with potentially millions of other faces from 
                  users worldwide.
                </p>
                <p className="text-muted-foreground">
                  This isn&apos;t just a photo — it&apos;s <em>biometric data</em>. The 
                  same type of data used for facial recognition, identity verification, 
                  and AI training datasets.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  What Can Go Wrong With Your Face Data?
                </h2>
                <div className="space-y-6">
                  <div className="rounded-lg bg-card border border-border p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <span className="text-2xl">🔓</span> Data Breaches
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Even reputable companies get hacked. In 2019, a facial recognition 
                      company leaked 3 million biometric records. Unlike passwords, 
                      <strong> you can&apos;t change your face</strong>. Once your face 
                      data is stolen, it&apos;s compromised forever.
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-card border border-border p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <span className="text-2xl">🎭</span> Identity Theft & Deepfakes
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      High-quality face photos can be used to create synthetic identities 
                      or deepfakes. Passport photos are particularly valuable because 
                      they follow strict guidelines — perfect for fraudulent documents.
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-card border border-border p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <span className="text-2xl">🤖</span> AI Training Without Consent
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Many &ldquo;free&rdquo; services monetize by selling or licensing 
                      user data. Your face could end up training facial recognition 
                      systems used for surveillance, advertising, or purposes you never 
                      agreed to.
                    </p>
                  </div>
                  
                  <div className="rounded-lg bg-card border border-border p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <span className="text-2xl">📍</span> Metadata Exposure
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Photos often contain EXIF data including GPS coordinates, device 
                      info, and timestamps. When combined with your face, this creates 
                      a detailed profile about you.
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  How SafePassportPic Is Different: 100% Client-Side Processing
                </h2>
                <p className="text-muted-foreground mb-4">
                  When we built SafePassportPic, we made a fundamental architectural 
                  decision: <strong>your photos never leave your device</strong>. Not 
                  temporarily. Not encrypted. Not at all.
                </p>
                <p className="text-muted-foreground mb-6">
                  Here&apos;s how it works:
                </p>
                
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold">WebAssembly AI Models</h4>
                      <p className="text-sm text-muted-foreground">
                        We use MediaPipe (Google&apos;s open-source AI framework) compiled 
                        to WebAssembly. This runs <em>entirely in your browser</em> — no 
                        server calls needed.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold">Browser-Based Background Removal</h4>
                      <p className="text-sm text-muted-foreground">
                        Background removal, face detection, and cropping all happen using 
                        your device&apos;s CPU/GPU. Your original photo stays in browser 
                        memory only.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold">Zero Server Uploads</h4>
                      <p className="text-sm text-muted-foreground">
                        The only network request is when you pay (via Stripe&apos;s secure 
                        checkout). Your photos? Never transmitted. We physically cannot 
                        see them.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold">No Accounts Required</h4>
                      <p className="text-sm text-muted-foreground">
                        No sign-up, no email collection, no profile. This reduces your 
                        data footprint to effectively zero.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-12 rounded-xl bg-primary/5 border border-primary/20 p-6">
                <h2 className="text-2xl font-bold mb-4">
                  🔍 How to Verify Any Passport Photo App Is Actually Private
                </h2>
                <p className="text-muted-foreground mb-4">
                  Don&apos;t take our word for it — or anyone&apos;s. Here&apos;s how to 
                  check for yourself:
                </p>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
                  <li>
                    <strong>Open Developer Tools</strong> — In Chrome/Safari/Firefox, 
                    press <code className="bg-card px-1.5 py-0.5 rounded text-sm">F12</code> or 
                    right-click → &ldquo;Inspect&rdquo;
                  </li>
                  <li>
                    <strong>Go to the Network tab</strong> — This shows all data 
                    sent/received
                  </li>
                  <li>
                    <strong>Upload a photo</strong> — Watch for any requests containing 
                    image data
                  </li>
                  <li>
                    <strong>Check request payloads</strong> — If you see your photo 
                    being sent to a server, that&apos;s your face leaving your device
                  </li>
                </ol>
                <p className="text-muted-foreground mt-4">
                  With SafePassportPic, you&apos;ll see zero image uploads. Just local 
                  processing.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  Red Flags: Signs a Passport Photo Service Isn&apos;t Private
                </h2>
                <ul className="space-y-2 text-muted-foreground">
                  {[
                    'Requires account creation or email to use',
                    '"Processing" takes several seconds with a loading indicator',
                    'Shows "uploading" progress when you add a photo',
                    'Terms of service mention "storing" or "retaining" images',
                    'Free service with no clear business model',
                    'App requests unnecessary permissions (contacts, location)',
                  ].map((flag) => (
                    <li key={flag} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">⚠️</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-4">
                  Why This Matters More Than Ever
                </h2>
                <p className="text-muted-foreground mb-4">
                  Facial recognition technology is advancing rapidly. What might seem 
                  like a harmless passport photo today could be:
                </p>
                <ul className="space-y-2 text-muted-foreground mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>Matched against surveillance databases years from now</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>Used to train AI systems without your knowledge</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">→</span>
                    <span>Sold to data brokers who aggregate identity information</span>
                  </li>
                </ul>
                <p className="text-muted-foreground">
                  Regulations like GDPR and CCPA are catching up, but enforcement is 
                  slow. The safest approach? <strong>Don&apos;t send your biometric data 
                  in the first place.</strong>
                </p>
              </section>

              {/* CTA */}
              <section className="rounded-xl bg-card border border-border p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">
                  Try SafePassportPic — Privacy Built In
                </h2>
                <p className="text-muted-foreground mb-6">
                  Create compliant passport photos without compromising your privacy. 
                  100% browser-based, $4.99 one-time, 30-day guarantee.
                </p>
                <Link
                  href="/app"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Create Private Passport Photo
                </Link>
                <p className="mt-4 text-xs text-muted-foreground">
                  Verify it yourself: open DevTools → Network tab while using the app. 
                  Zero photo uploads.
                </p>
              </section>
            </div>
          </div>
        </article>

        {/* Related Content */}
        <section className="py-16 bg-card/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-xl font-bold mb-6">Related</h2>
            <div className="grid gap-4">
              <Link
                href="/us-passport-photo"
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  US Passport Photo Requirements — Complete Guide
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Everything you need to know about 2×2 inch US passport photos
                </p>
              </Link>
              <Link
                href="/privacy"
                className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Privacy Policy
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our commitment to your data privacy explained in detail
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
