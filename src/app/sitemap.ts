import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { SPORTS } from "@/engine/venue";

/** Public pages for search engines; booking pages change daily (new days open). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page("/", "daily", 1),
    page("/sport", "weekly", 0.8),
    ...SPORTS.map((s) => page(`/book/${s.id}`, "daily", 0.9)),
    page("/coaches", "weekly", 0.7),
    page("/terms", "monthly", 0.3),
    page("/privacy", "yearly", 0.2),
  ];
}
