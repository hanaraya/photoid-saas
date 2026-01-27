import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Blog — SafePassportPic',
  description:
    'Tips, guides, and insights about passport photos, privacy, and travel documentation. Learn how to take the perfect passport photo.',
  openGraph: {
    title: 'Blog — SafePassportPic',
    description:
      'Tips, guides, and insights about passport photos, privacy, and travel documentation.',
    type: 'website',
    url: 'https://safepassportpic.com/blog',
  },
  alternates: {
    canonical: 'https://safepassportpic.com/blog',
  },
};

const posts = [
  {
    slug: 'passport-photo-privacy',
    title:
      'Why Your Passport Photo App Might Be a Privacy Nightmare (And How to Stay Safe)',
    description:
      'Most passport photo apps upload your biometric data to servers. Learn why that matters and how to protect your identity.',
    date: '2025-01-27',
    readTime: '5 min read',
    category: 'Privacy',
    featured: true,
  },
  // Add more blog posts here as they're created
];

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Blog
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Passport photo tips, privacy insights, and travel documentation guides
              </p>
            </div>

            <div className="space-y-8">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
                >
                  <Link href={`/blog/${post.slug}`}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {post.category}
                        </span>
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-muted-foreground">{post.description}</p>
                      <span className="text-sm font-medium text-primary">
                        Read more →
                      </span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No posts yet. Check back soon!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-card/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to create your passport photo?
            </h2>
            <p className="mt-4 text-muted-foreground">
              100% private, processed in your browser. Just $4.99.
            </p>
            <Link
              href="/app"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create Passport Photo
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
