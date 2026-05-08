import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/buy", "/product/", "/how-it-works", "/privacy", "/faq", "/download-app", "/track-order"],
      disallow: ["/admin/", "/c/"]
    },
    sitemap: `${appUrl.replace(/\/$/, "")}/sitemap.xml`
  };
}
