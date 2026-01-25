import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow SharedArrayBuffer for WASM workers (MediaPipe, bg removal)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
  // Turbopack config (Next.js 16 default)
  turbopack: {},
};

export default nextConfig;
