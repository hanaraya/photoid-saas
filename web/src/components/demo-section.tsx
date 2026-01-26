'use client';

import { useState } from 'react';
import Image from 'next/image';

const demos = [
  {
    id: 1,
    name: 'Sarah',
    before: '/demo/before-1.jpg',
    description: 'Outdoor selfie → Perfect passport photo',
  },
  {
    id: 2,
    name: 'Michael',
    before: '/demo/before-2.jpg',
    description: 'Casual photo → Government-compliant',
  },
  {
    id: 3,
    name: 'Emma',
    before: '/demo/before-3.jpg',
    description: 'Indoor shot → White background ready',
  },
  {
    id: 4,
    name: 'James',
    before: '/demo/before-4.jpg',
    description: 'Any background → Print-ready result',
  },
];

export function DemoSection() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [showAfter, setShowAfter] = useState(false);

  return (
    <section id="demo" className="py-20 bg-card/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            See the Transformation
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From any photo to a perfect passport photo in seconds
          </p>
        </div>

        {/* Main Demo Area */}
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-card rounded-2xl border border-border overflow-hidden">
            {/* Before/After Toggle */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setShowAfter(false)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  !showAfter
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📷 Before
              </button>
              <button
                onClick={() => setShowAfter(true)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  showAfter
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ✨ After
              </button>
            </div>

            {/* Image Display */}
            <div className="relative aspect-[4/3] bg-muted/50">
              {!showAfter ? (
                /* Before Image */
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden shadow-lg">
                    <Image
                      src={demos[activeDemo].before}
                      alt={`${demos[activeDemo].name}'s original photo`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ) : (
                /* After - Simulated passport photo */
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="flex gap-6 items-center">
                    {/* Single passport photo */}
                    <div className="relative">
                      <div className="w-[120px] h-[150px] bg-white rounded-lg shadow-lg overflow-hidden border-4 border-white">
                        <div className="w-full h-full relative">
                          <Image
                            src={demos[activeDemo].before}
                            alt={`${demos[activeDemo].name}'s passport photo`}
                            fill
                            className="object-cover object-top scale-110"
                          />
                          {/* White background simulation overlay */}
                          <div className="absolute inset-0 mix-blend-lighten bg-gradient-to-b from-white/20 via-transparent to-white/20" />
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        2×2 inch
                      </p>
                    </div>

                    {/* 4x6 Print Sheet */}
                    <div className="relative">
                      <div className="w-[180px] h-[120px] bg-white rounded-lg shadow-lg p-2 border border-gray-200">
                        <div className="grid grid-cols-3 grid-rows-2 gap-1 h-full">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className="relative bg-gray-100 rounded overflow-hidden"
                            >
                              <Image
                                src={demos[activeDemo].before}
                                alt=""
                                fill
                                className="object-cover object-top scale-110"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        4×6 Print Sheet
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-2 bg-black/70 text-white text-sm rounded-full">
                  {demos[activeDemo].description}
                </span>
              </div>
            </div>

            {/* Thumbnail Selector */}
            <div className="flex justify-center gap-3 p-4 border-t border-border bg-muted/30">
              {demos.map((demo, index) => (
                <button
                  key={demo.id}
                  onClick={() => {
                    setActiveDemo(index);
                    setShowAfter(false);
                  }}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden transition-all ${
                    activeDemo === index
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={demo.before}
                    alt={demo.name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Features under demo */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '🎯', label: 'Face Detection' },
              { icon: '✂️', label: 'Background Removal' },
              { icon: '📐', label: 'Auto Crop & Size' },
              { icon: '✅', label: 'Compliance Check' },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-2 justify-center p-3 rounded-lg bg-card border border-border"
              >
                <span>{feature.icon}</span>
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
