import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/** Pages that are personal or have no value in search results. */
const PRIVATE = ["/panel", "/checkout", "/payment", "/login"];

/**
 * AI assistants and answer engines that read the site to answer questions
 * like "padel court booking in Tehran". Listed explicitly so they are
 * allowed even if a default rule changes later (GEO).
 */
const AI_CRAWLERS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "Bingbot", "DuckAssistBot", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  // Staging and preview builds stay out of every index.
  if (process.env.NEXT_PUBLIC_NOINDEX === "1") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: ["/", "/llms.txt"], disallow: PRIVATE },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
