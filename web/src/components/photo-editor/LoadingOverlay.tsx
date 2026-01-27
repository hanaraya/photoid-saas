'use client';

interface LoadingOverlayProps {
  text: string;
}

export function LoadingOverlay({ text }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 text-center px-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        </div>
        <div>
          <p className="font-medium">{text}</p>
          <p className="text-sm text-muted-foreground mt-1">This only takes a moment</p>
        </div>
      </div>
    </div>
  );
}
