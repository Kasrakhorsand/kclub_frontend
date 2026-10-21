import type { NextConfig } from "next";
import pkg from "./package.json";

const isDev = process.env.NODE_ENV !== "production";
const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : "";
  } catch {
    return "";
  }
})();

/**
 * Content-Security-Policy: everything is self-hosted (fonts, media, three.js),
 * so only our own origin and the backend API are allowed. Next.js needs
 * inline scripts/styles; dev mode also needs eval for fast refresh.
 * Bank gateways are top-level navigations, which CSP doesn't restrict.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Support screenshots are served by the API.
  `img-src 'self' data: blob:${apiOrigin ? ` ${apiOrigin}` : ""}`,
  // Home videos replaced from the panel come from the API (blob: while previewing sample data).
  `media-src 'self' blob:${apiOrigin ? ` ${apiOrigin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // No embedding in other sites (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HTTPS only, once deployed behind TLS.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  // Self-contained server output for Docker / PM2 deployment.
  output: "standalone",
  poweredByHeader: false,
  // Shown in support reports so the team knows which build a user is on.
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
  images: { unoptimized: true },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/(media|models|brand)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
