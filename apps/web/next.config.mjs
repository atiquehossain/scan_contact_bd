import os from "node:os";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const appHostname = new URL(appUrl).hostname;
const localNetworkHosts = Object.values(os.networkInterfaces())
  .flat()
  .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
  .map((entry) => entry.address);
const extraAllowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
  .split(",")
  .map((origin) => {
    const value = origin.trim();
    if (!value) return "";
    try {
      return new URL(value).hostname;
    } catch {
      return value;
    }
  })
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: true,
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    const apiUrl = process.env.NEXT_PRIVATE_API_URL || "http://localhost:4000";
    return [
      {
        source: "/backend/:path*",
        destination: `${apiUrl.replace(/\/$/, "")}/:path*`
      },
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace(/\/$/, "")}/:path*`
      }
    ];
  },
  allowedDevOrigins: Array.from(new Set(["localhost", "127.0.0.1", appHostname, ...localNetworkHosts, ...extraAllowedDevOrigins]))
};

export default nextConfig;
