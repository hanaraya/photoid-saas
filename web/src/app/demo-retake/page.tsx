'use client';

import { RetakeSuggestions } from '@/components/retake-suggestions';
import { type ComplianceCheck } from '@/lib/compliance';

// Demo compliance checks with failures for screenshot
const demoChecks: ComplianceCheck[] = [
  { id: 'face', label: 'Face Detection', status: 'pass', message: 'Face detected successfully' },
  { id: 'sharpness', label: 'Image Sharpness', status: 'fail', message: 'Photo appears blurry' },
  { id: 'head_size', label: 'Head Size', status: 'warn', message: 'Head appears too small — try zooming in' },
  { id: 'lighting', label: 'Face Lighting', status: 'warn', message: 'Uneven lighting detected (65%) — avoid shadows on face' },
  { id: 'background', label: 'Background', status: 'warn', message: 'Click "Remove Background" for white background' },
];

export default function DemoRetakePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-center">Smart Retake Suggestions Demo</h1>
        <p className="text-muted-foreground text-center text-sm">
          This shows the new retake suggestions component with sample failures.
        </p>
        
        <RetakeSuggestions 
          checks={demoChecks} 
          onRetake={() => alert('Take New Photo clicked!')} 
        />
      </div>
    </div>
  );
}
