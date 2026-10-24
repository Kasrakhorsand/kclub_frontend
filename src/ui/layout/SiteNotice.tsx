"use client";
/** Site-wide status banner the support team publishes (outage, gateway problem, maintenance). */
import Link from "next/link";
import clsx from "clsx";
import { useSiteNotice } from "@/engine/support/useSiteOps";
import type { SiteNotice } from "@/engine/types";

/** The bar itself; also used as the preview on the support notice page. */
export function SiteNoticeBar({ notice }: { notice: Pick<SiteNotice, "tone" | "text" | "link"> }) {
  return (
    <div className={clsx("site-notice", notice.tone)} role={notice.tone === "info" ? "status" : "alert"}>
      <span>{notice.text}</span>
      {notice.link && <Link href={notice.link}>بیشتر بدانید</Link>}
    </div>
  );
}

export function SiteNotice() {
  const notice = useSiteNotice();
  return notice ? <SiteNoticeBar notice={notice} /> : null;
}
