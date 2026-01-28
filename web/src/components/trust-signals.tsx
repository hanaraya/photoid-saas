export function TrustSignals() {
  const signals = [
    {
      icon: '💰',
      title: '30-Day Money Back',
      description: 'Full refund if not satisfied',
    },
    {
      icon: '✅',
      title: '100% Acceptance',
      description: 'Or we refund you',
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      description: 'Photos never leave your device',
    },
    {
      icon: '⚡',
      title: 'Instant Results',
      description: 'Ready in 60 seconds',
    },
  ];

  return (
    <section className="py-12 border-y border-border bg-card/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {signals.map((signal) => (
            <div
              key={signal.title}
              className="flex flex-col items-center text-center gap-2"
            >
              <span className="text-3xl">{signal.icon}</span>
              <div>
                <p className="font-semibold text-foreground">{signal.title}</p>
                <p className="text-sm text-muted-foreground">
                  {signal.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustBadgesInline() {
  return (
    <div className="flex flex-wrap justify-center gap-3 text-sm">
      <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-green-700 dark:text-green-400">
        <span>✓</span>
        <span>30-Day Money Back</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-blue-700 dark:text-blue-400">
        <span>🔒</span>
        <span>100% Private</span>
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1.5 text-orange-700 dark:text-orange-400">
        <span>💵</span>
        <span>Save $12 vs CVS</span>
      </div>
    </div>
  );
}
