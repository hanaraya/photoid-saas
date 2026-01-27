'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type ComplianceCheck } from '@/lib/compliance';
import { type BgAnalysis } from '@/lib/bg-analysis';
import { getRetakeSuggestions, needsRetake } from '@/lib/retake-suggestions';

interface ComplianceSummaryProps {
  checks: ComplianceCheck[];
  bgAnalysis: BgAnalysis | null;
  bgRemoved: boolean;
  onRemoveBg: () => void;
  bgRemoving: boolean;
  bgModelLoading?: boolean;
  onRetake: () => void;
}

export function ComplianceSummary({
  checks,
  bgAnalysis,
  bgRemoved,
  onRemoveBg,
  bgRemoving,
  bgModelLoading = false,
  onRetake,
}: ComplianceSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const passedCount = checks.filter((c) => c.status === 'pass').length;
  const totalCount = checks.length;
  const allPassed = passedCount === totalCount;
  // Filter out background check from failedChecks since we handle it separately with bgNeedsAction
  const failedChecks = checks.filter((c) => (c.status === 'fail' || c.status === 'warn') && c.id !== 'background');
  
  const suggestions = getRetakeSuggestions(checks);
  const requiresRetake = needsRetake(suggestions);
  
  // Determine if background needs attention
  const bgNeedsAction = bgAnalysis && bgAnalysis.needsRemoval && !bgRemoved;
  
  if (totalCount === 0) return null;

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Summary header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            allPassed && !bgNeedsAction
              ? 'bg-emerald-500/10 text-emerald-500'
              : requiresRetake
                ? 'bg-red-500/10 text-red-500'
                : 'bg-amber-500/10 text-amber-500'
          }`}>
            {allPassed && !bgNeedsAction ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-lg font-semibold">{failedChecks.length + (bgNeedsAction ? 1 : 0)}</span>
            )}
          </div>
          <div className="text-left">
            <div className="font-medium text-sm">
              {allPassed && !bgNeedsAction
                ? 'Ready to print'
                : requiresRetake
                  ? 'Photo needs attention'
                  : `${failedChecks.length + (bgNeedsAction ? 1 : 0)} item${failedChecks.length + (bgNeedsAction ? 1 : 0) !== 1 ? 's' : ''} to review`}
            </div>
            <div className="text-xs text-muted-foreground">
              {passedCount}/{totalCount} checks passed
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-border/50 p-4 space-y-3">
          {/* Background action - most important */}
          {bgNeedsAction && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <span className="text-amber-500">🎨</span>
                <div>
                  <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Background removal needed</div>
                  <div className="text-xs text-muted-foreground">{bgAnalysis.reason}</div>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={onRemoveBg}
                disabled={bgRemoving || bgModelLoading}
                className="shrink-0"
              >
                {bgRemoving ? 'Removing...' : bgModelLoading ? 'Loading...' : 'Fix'}
              </Button>
            </div>
          )}

          {/* Failed checks */}
          {failedChecks.map((check) => (
            <div
              key={check.id}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                check.status === 'fail'
                  ? 'bg-red-500/5 border border-red-500/20'
                  : 'bg-amber-500/5 border border-amber-500/20'
              }`}
            >
              <span className={`mt-0.5 ${check.status === 'fail' ? 'text-red-500' : 'text-amber-500'}`}>
                {check.status === 'fail' ? '✗' : '!'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{check.label}</div>
                <div className="text-xs text-muted-foreground">{check.message}</div>
              </div>
            </div>
          ))}

          {/* Passed checks (collapsed by default) */}
          {checks.filter((c) => c.status === 'pass').length > 0 && (
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {passedCount} passed checks
              </summary>
              <div className="mt-2 space-y-1.5 pl-4">
                {checks.filter((c) => c.status === 'pass').map((check) => (
                  <div key={check.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-emerald-500">✓</span>
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Retake suggestion if needed */}
          {requiresRetake && (
            <button
              onClick={onRetake}
              className="w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              📷 Take a new photo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
