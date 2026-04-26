const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appOrigin = new URL(appUrl).origin;
const extraAllowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
  allowedDevOrigins: Array.from(new Set([appOrigin, ...extraAllowedDevOrigins]))
};

export default nextConfig;
