import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📸</span>
              <span className="text-lg font-bold tracking-tight">
                Safe<span className="text-primary">PassportPic</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Create compliant passport and visa photos in seconds. 100% private
              — your photos never leave your device.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Supported</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>🇺🇸 US Passport & Visa</li>
              <li>🇬🇧 UK Passport & Visa</li>
              <li>🇪🇺 Schengen / EU</li>
              <li>🇨🇦 Canada Passport</li>
              <li>🇮🇳 India Passport & Visa</li>
              <li>+ 15 more countries</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/us-passport-photo"
                  className="hover:text-foreground transition-colors"
                >
                  US Passport Photo Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-foreground transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="hover:text-foreground transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Contact Us</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span>📧</span>
                <a
                  href="mailto:support@safepassportpic.com"
                  className="hover:text-foreground transition-colors"
                >
                  support@safepassportpic.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span>💬</span>
                <span>Questions? We typically respond within 24 hours.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} SafePassportPic. All rights reserved.
          </p>
          <p className="mt-1">
            Your photos are processed entirely in your browser. We never see,
            store, or transmit your images.
          </p>
        </div>
      </div>
    </footer>
  );
}
