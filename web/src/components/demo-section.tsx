'use client';

import { useState } from 'react';
import Image from 'next/image';

const demos = [
  {
    id: 1,
    name: 'Sarah',
    scene: 'Street photo',
    before: '/demo/before-1.jpg',
    after: '/demo/after-1.png', // Will use real processed image when available
  },
  {
    id: 2,
    name: 'Michael',
    scene: 'Indoor shot',
    before: '/demo/before-2.jpg',
    after: '/demo/after-2.png',
  },
  {
    id: 3,
    name: 'Emma',
    scene: 'Outdoor by lake',
    before: '/demo/before-3.jpg',
    after: '/demo/after-3.png',
  },
  {
    id: 4,
    name: 'James',
    scene: 'Studio portrait',
    before: '/demo/before-4.jpg',
    after: '/demo/after-4.png',
  },
];

export function DemoSection() {
  const [activeDemo, setActiveDemo] = useState(0);

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
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl border border-border overflow-hidden p-6 sm:p-8">
            {/* Side by Side Before/After */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
              {/* Before */}
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  📷 {demos[activeDemo].scene}
                </p>
                <div className="relative w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] rounded-xl overflow-hidden shadow-lg border-2 border-dashed border-muted-foreground/30">
                  <Image
                    src={demos[activeDemo].before}
                    alt="Original photo"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl sm:rotate-0 rotate-90">→</span>
                  <span className="text-xs text-muted-foreground font-medium hidden sm:block">
                    AI Magic
                  </span>
                </div>
              </div>

              {/* After */}
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  ✨ Passport Ready
                </p>
                <div className="flex gap-4 items-end">
                  {/* Single passport photo */}
                  <div>
                    <div className="w-[100px] h-[125px] sm:w-[120px] sm:h-[150px] bg-white rounded-lg shadow-lg overflow-hidden border-4 border-white ring-1 ring-gray-200">
                      <div className="w-full h-full relative">
                        <Image
                          src={demos[activeDemo].before}
                          alt="Passport photo"
                          fill
                          className="object-cover object-top scale-125"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">2×2 in</p>
                  </div>

                  {/* 4x6 Print Sheet */}
                  <div>
                    <div className="w-[90px] h-[60px] sm:w-[120px] sm:h-[80px] bg-white rounded shadow-lg p-1 ring-1 ring-gray-200">
                      <div className="grid grid-cols-3 grid-rows-2 gap-[2px] h-full">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="relative bg-gray-100 rounded-sm overflow-hidden"
                          >
                            <Image
                              src={demos[activeDemo].before}
                              alt=""
                              fill
                              className="object-cover object-top scale-125"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">4×6 sheet</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thumbnail Selector */}
            <div className="flex justify-center gap-3 mt-8 pt-6 border-t border-border">
              <span className="text-sm text-muted-foreground mr-2 self-center">
                Try different photos:
              </span>
              {demos.map((demo, index) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveDemo(index)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all ${
                    activeDemo === index
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                      : 'opacity-50 hover:opacity-100'
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
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
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
