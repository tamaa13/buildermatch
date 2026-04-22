import type { NextConfig } from "next";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok.app",
  ],
  // Same-origin proxy via Next.js rewrites rather than a route handler — the
  // route-handler approach gets buffered by Turbopack's production runtime,
  // which kills SSE. Rewrites proxy at the HTTP layer, preserving per-chunk
  // flush semantics end-to-end. Chat streams work, fetch JSON works, and
  // the browser never talks to the backend's ngrok URL directly so the
  // ngrok interstitial and CORS complications go away.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
