import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";

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
  title: { default: "کی کلاب | رزرو آنلاین زمین پدل و ساحلی", template: "%s | کی کلاب" },
  description: "رزرو آنلاین زمین پدل، تنیس ساحلی و والیبال ساحلی در کی کلاب. سانس خالی را ببینید، زمین را انتخاب کنید و آنلاین پرداخت کنید.",
  robots: process.env.NEXT_PUBLIC_NOINDEX === "1" ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = { themeColor: "#0D0D0E", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="light" suppressHydrationWarning className={`${vazir.variable} ${jost.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
