'use client';

import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  text: string;
}

const processingSteps = [
  { id: 1, label: 'Detecting face', icon: '👤' },
  { id: 2, label: 'Analyzing photo quality', icon: '🔍' },
  { id: 3, label: 'Preparing editor', icon: '✨' },
];

export function LoadingOverlay({ text }: LoadingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Animate through steps
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < processingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 text-center px-6 max-w-sm">
        {/* Animated spinner */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-primary" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            {processingSteps[currentStep]?.icon || '🤖'}
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-3 w-full">
          {processingSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 transition-all duration-300 ${
                index <= currentStep
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-primary text-primary-foreground animate-pulse'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? '✓' : step.id}
              </div>
              <span
                className={`text-sm transition-all duration-300 ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
                {index === currentStep && (
                  <span className="ml-1 inline-block animate-pulse">...</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Footer text */}
        <p className="text-sm text-muted-foreground">
          All processing happens on your device
        </p>
      </div>
    </div>
  );
}

// Separate component for background removal progress
interface BgRemovalProgressProps {
  isRemoving: boolean;
}

export function BgRemovalProgress({ isRemoving }: BgRemovalProgressProps) {
  const [step, setStep] = useState(0);
  
  const bgSteps = [
    { label: 'Detecting edges', icon: '🔲' },
    { label: 'Removing background', icon: '✂️' },
    { label: 'Cleaning up', icon: '✨' },
    { label: 'Finalizing', icon: '✅' },
  ];

  useEffect(() => {
    if (!isRemoving) {
      setStep(0);
      return;
    }

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % bgSteps.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isRemoving, bgSteps.length]);

  if (!isRemoving) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-lg z-10">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <div className="text-4xl animate-bounce">
          {bgSteps[step].icon}
        </div>
        <div>
          <p className="font-medium">{bgSteps[step].label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            This may take 10-30 seconds
          </p>
        </div>
        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((step + 1) / bgSteps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
