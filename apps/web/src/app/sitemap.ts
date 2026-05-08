import type { MetadataRoute } from "next";
import { publicProducts } from "@/lib/publicCatalog";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const routes = ["", "/buy", "/how-it-works", "/privacy", "/faq", "/download-app", "/track-order", "/pricing", "/contact"];
  return [
    ...routes.map((route) => ({ url: `${appUrl}${route}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: route === "" ? 1 : 0.7 })),
    ...publicProducts.map((product) => ({
      url: `${appUrl}/product/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8
    }))
  ];
}
