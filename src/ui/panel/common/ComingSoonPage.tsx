"use client";
/** Placeholder page for features planned for a later phase. */
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Placeholder page for features planned for a later phase. */
export function ComingSoon({ title, lines }: { title: string; lines: string[] }) {
  return (
    <>
      <PageHead title={title} />
      <div className="card soonbox">
        <span className="pill ball">فاز بعد</span>
        {lines.map((line) => <p key={line} className="muted">{line}</p>)}
      </div>
    </>
  );
}
