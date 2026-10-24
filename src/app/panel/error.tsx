"use client";
import { ErrorView } from "@/ui/layout/ErrorView";

/** Any panel page that throws: shown inside the panel frame, with a way back to the dashboard. */
export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} inPanel />;
}
