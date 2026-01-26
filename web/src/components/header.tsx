import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl print-hide">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <span className="text-lg font-bold tracking-tight">
            Photo<span className="text-primary">ID</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/app"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Make Photo
          </Link>
        </nav>
      </div>
    </header>
  );
}
