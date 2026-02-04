'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OriginalPhotoProps {
  sourceImg: HTMLImageElement | null;
}

export function OriginalPhoto({ sourceImg }: OriginalPhotoProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sourceImg) return null;

  return (
    <>
      {/* Thumbnail button - positioned absolutely by parent */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-16 h-16 rounded-lg border-2 border-background shadow-lg overflow-hidden hover:scale-105 transition-transform"
        title="View original"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sourceImg.src}
          alt="Original"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </div>
      </button>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Original Photo</DialogTitle>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sourceImg.src}
            alt="Original"
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
