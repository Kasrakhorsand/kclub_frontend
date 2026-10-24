"use client";
import { ErrorView } from "@/ui/layout/ErrorView";

/** Any public page that throws: keeps the site's navbar and footer around the message. */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} />;
}
