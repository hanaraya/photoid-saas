'use client';

import { useState } from 'react';
import { type ComplianceCheck } from '@/lib/compliance';
import {
  getRetakeSuggestions,
  needsRetake,
  getAdjustableSuggestions,
  getRetakeSuggestions2,
  type RetakeSuggestion,
} from '@/lib/retake-suggestions';

interface RetakeSuggestionsProps {
  checks: ComplianceCheck[];
  onRetake?: () => void;
}

export function RetakeSuggestions({
  checks,
  onRetake,
}: RetakeSuggestionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const suggestions = getRetakeSuggestions(checks);

  if (suggestions.length === 0) return null;

  const requiresRetake = needsRetake(suggestions);
  const adjustable = getAdjustableSuggestions(suggestions);
  const retakeNeeded = getRetakeSuggestions2(suggestions);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={requiresRetake ? 'text-red-500' : 'text-yellow-500'}>
          {requiresRetake ? '❌' : '⚠️'}
        </span>
        <h3 className="text-sm font-semibold">
          {requiresRetake ? 'Photo Needs Retake' : 'Suggestions to Improve'}
        </h3>
      </div>

      {/* Quick summary */}
      {requiresRetake && (
        <p className="text-sm text-muted-foreground mb-4">
          Some issues can only be fixed by taking a new photo.
        </p>
      )}

      {/* Suggestions that require retake */}
      {retakeNeeded.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Requires New Photo
          </h4>
          {retakeNeeded.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isExpanded={expandedId === suggestion.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === suggestion.id ? null : suggestion.id
                )
              }
              variant="error"
            />
          ))}
        </div>
      )}

      {/* Suggestions that can be adjusted */}
      {adjustable.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Fixes Available
          </h4>
          {adjustable.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              isExpanded={expandedId === suggestion.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === suggestion.id ? null : suggestion.id
                )
              }
              variant="warning"
            />
          ))}
        </div>
      )}

      {/* Retake button */}
      {requiresRetake && onRetake && (
        <button
          onClick={onRetake}
          className="mt-4 w-full rounded-md bg-primary text-primary-foreground py-2 px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          📷 Take New Photo
        </button>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: RetakeSuggestion;
  isExpanded: boolean;
  onToggle: () => void;
  variant: 'error' | 'warning';
}

function SuggestionCard({
  suggestion,
  isExpanded,
  onToggle,
  variant,
}: SuggestionCardProps) {
  const borderColor =
    variant === 'error'
      ? 'border-red-200 dark:border-red-900'
      : 'border-yellow-200 dark:border-yellow-900';
  const bgColor =
    variant === 'error'
      ? 'bg-red-50 dark:bg-red-950/30'
      : 'bg-yellow-50 dark:bg-yellow-950/30';

  return (
    <div
      className={`rounded-md border ${borderColor} ${bgColor} overflow-hidden`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-expanded={isExpanded}
      >
        <span className="text-xl flex-shrink-0">{suggestion.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{suggestion.title}</div>
          <div className="text-xs text-muted-foreground truncate">
            {suggestion.problem}
          </div>
        </div>
        <span className="text-muted-foreground flex-shrink-0">
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-inherit">
          <div className="mt-3 space-y-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                How to Fix
              </div>
              <p className="text-sm">{suggestion.solution}</p>
            </div>

            {suggestion.tips.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Tips
                </div>
                <ul className="text-sm space-y-1">
                  {suggestion.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display
export function RetakeSuggestionsInline({
  checks,
}: {
  checks: ComplianceCheck[];
}) {
  const suggestions = getRetakeSuggestions(checks);

  if (suggestions.length === 0) return null;

  const requiresRetake = needsRetake(suggestions);

  return (
    <div
      className={`flex items-center gap-2 text-sm ${requiresRetake ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}
    >
      <span>{requiresRetake ? '❌' : '⚠️'}</span>
      <span>
        {suggestions.length} issue{suggestions.length !== 1 ? 's' : ''} found
        {requiresRetake && ' — retake recommended'}
      </span>
    </div>
  );
}
