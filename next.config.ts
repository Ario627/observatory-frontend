import type { NextConfig } from "next";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

function resolveApiUrl(): string {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "";
  }
}

const apiOrigin = resolveApiUrl();

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${
    process.env.NODE_ENV === "development"
      ? " 'unsafe-inline' 'unsafe-eval'"
      : ""
  }`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${apiOrigin ? `${apiOrigin}` : ""}`,
  `connect-src 'self' ${apiOrigin ? `${apiOrigin}` : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/api/capture/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
export default nextConfig;