import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/config/site";

/**
 * Share card for links to the site (Telegram, WhatsApp, X, search results).
 * Latin text only: the image renderer can't load the site's WOFF2 font and
 * doesn't join Persian letters, so the Persian name lives in the page title.
 */
export const alt = `${SITE.latinName} | ${SITE.seoTitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dataUrl = async (file: string, type: string) =>
  `data:${type};base64,${(await readFile(join(process.cwd(), "public", file))).toString("base64")}`;

export default async function OpengraphImage() {
  const [poster, wordmark] = await Promise.all([dataUrl("media/hero-poster.jpg", "image/jpeg"), dataUrl("brand/k-wordmark.png", "image/png")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0D0D0E" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not a page */}
        <img src={poster} width={1200} height={675} alt="" style={{ position: "absolute", inset: 0, objectFit: "cover", opacity: 0.55 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(90deg, rgba(13,13,14,0.95) 0%, rgba(13,13,14,0.75) 45%, rgba(13,13,14,0.2) 100%)" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", gap: 28, padding: "0 80px", width: 760 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered to PNG, not a page */}
          <img src={wordmark} width={492} height={90} alt="" />
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#C9A45C", textTransform: "uppercase" }}>Padel · Beach Tennis · Beach Volley</div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, color: "#ECEAE4", lineHeight: 1.15 }}>Book a court online in Tehran</div>
          <div style={{ display: "flex", gap: 14, fontSize: 26, color: "#B4B0A8" }}>
            <span>Every day 08:00 – 24:00</span>
            <span style={{ color: "#C9A45C" }}>·</span>
            <span>{SITE.url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
