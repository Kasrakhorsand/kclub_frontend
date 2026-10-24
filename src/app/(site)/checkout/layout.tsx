import type { Metadata } from "next";

/** Personal flow page: not useful in search results. */
export const metadata: Metadata = { title: "پرداخت", robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
