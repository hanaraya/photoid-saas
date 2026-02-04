'use client';

import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import {
  type ModerationResult,
  type ModerationViolation,
} from '@/lib/content-moderation';

interface ModerationBlockerProps {
  result: ModerationResult;
  onRetry: () => void;
}

/**
 * Full-screen blocker for serious content violations
 * Prevents user from proceeding with blocked content
 */
export function ModerationBlocker({ result, onRetry }: ModerationBlockerProps) {
  const blockingViolations = result.violations.filter(
    (v) => v.severity === 'block'
  );

  if (blockingViolations.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <XCircle className="h-8 w-8 flex-shrink-0" />
          <h2 className="text-xl font-semibold">Photo Cannot Be Used</h2>
        </div>

        <div className="mb-6 space-y-3">
          {blockingViolations.map((violation) => (
            <ViolationCard key={violation.code} violation={violation} />
          ))}
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Please take a new selfie that meets passport photo requirements.
        </p>

        <button
          onClick={onRetry}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          Try Another Photo
        </button>
      </div>
    </div>
  );
}

function ViolationCard({ violation }: { violation: ModerationViolation }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        <div>
          <h3 className="font-medium text-red-800">{violation.label}</h3>
          <p className="mt-1 text-sm text-red-700">{violation.message}</p>
          {violation.details && (
            <p className="mt-1 text-xs text-red-600">{violation.details}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline warning banner for non-blocking issues
 */
export function ModerationWarning({ result }: { result: ModerationResult }) {
  const warnings = result.violations.filter((v) => v.severity === 'warn');

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800">Advisory Warnings</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            {warnings.map((w) => (
              <li key={w.code}>• {w.message}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-600">
            You can proceed, but these may cause issues with official
            submission.
          </p>
        </div>
      </div>
    </div>
  );
}
