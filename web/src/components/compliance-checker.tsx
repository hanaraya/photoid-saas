'use client';

import { type ComplianceCheck } from '@/lib/compliance';

interface ComplianceCheckerProps {
  checks: ComplianceCheck[];
}

export function ComplianceChecker({ checks }: ComplianceCheckerProps) {
  if (checks.length === 0) return null;

  const allPassed = checks.every((c) => c.status === 'pass');

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={allPassed ? 'text-green-500' : 'text-yellow-500'}>
          {allPassed ? '✅' : '⚠️'}
        </span>
        <h3 className="text-sm font-semibold">
          {allPassed ? 'All Checks Passed' : 'Compliance Status'}
        </h3>
      </div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 flex-shrink-0">
              {check.status === 'pass' && (
                <span className="text-green-500">✓</span>
              )}
              {check.status === 'fail' && (
                <span className="text-red-500">✗</span>
              )}
              {check.status === 'warn' && (
                <span className="text-yellow-500">!</span>
              )}
              {check.status === 'pending' && (
                <span className="text-muted-foreground">○</span>
              )}
            </span>
            <div>
              <span className="font-medium">{check.label}</span>
              <span className="text-muted-foreground ml-1.5">
                — {check.message}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
