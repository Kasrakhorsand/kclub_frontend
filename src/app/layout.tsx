import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
// Stylesheets, in cascade order (later wins): Tailwind, K Club colour tokens,
// one file per site section, the panel (frame, shared parts, then one file per role),
// and the last global tweaks.
import "@/app/tailwind.css";
import "@/config/theme.css";
import "@/ui/styles/base.css";
import "@/ui/styles/layout.css";
import "@/ui/styles/three.css";
import "@/ui/styles/home.css";
import "@/ui/styles/booking.css";
import "@/ui/styles/auth.css";
import "@/ui/styles/coaches.css";
import "@/ui/panel/shell/shell.css";
import "@/ui/panel/parts/parts.css";
import "@/ui/panel/common/common.css";
import "@/ui/panel/player/player.css";
import "@/ui/panel/secretary/secretary.css";
import "@/ui/panel/admin/admin.css";
import "@/app/globals.css";
import Providers from "@/ui/layout/Providers";
import { SITE } from "@/config/site";

/** Self-hosted fonts (no Google Fonts, for reliability inside Iran). */
const vazir = localFont({
  src: "../fonts/Vazirmatn.woff2",
  variable: "--font-vazir",
  weight: "100 900",
  display: "swap",
});
const jost = localFont({
  src: [
    { path: "../fonts/Jost-400.woff2", weight: "400" },
    { path: "../fonts/Jost-500.woff2", weight: "500" },
  ],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.seoTitle, template: `%s | ${SITE.name}` },
  description: SITE.seoDescription,
  applicationName: SITE.name,
  category: "sports",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    siteName: SITE.name,
    title: SITE.seoTitle,
    description: SITE.seoDescription,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: SITE.seoTitle, description: SITE.seoDescription },
  // Phone numbers in copy (prices, codes) shouldn't turn into call links on iOS.
  formatDetection: { telephone: false },
  robots: process.env.NEXT_PUBLIC_NOINDEX === "1" ? { index: false, follow: false } : { index: true, follow: true, "max-image-preview": "large" },
};

export const viewport: Viewport = { themeColor: SITE.themeColor, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="light" suppressHydrationWarning className={`${vazir.variable} ${jost.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
