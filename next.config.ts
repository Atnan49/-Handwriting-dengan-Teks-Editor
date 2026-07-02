import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for offline-capable PWA
  // output: "export", // Uncomment for full static build

  // Allow pdf.js worker to load from CDN
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
};

export default nextConfig;
