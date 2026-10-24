"use client";
/**
 * Shown when a page throws an unexpected error (app/(site)/error.tsx and
 * app/panel/error.tsx). Says what happened in plain words, offers to try
 * again, go somewhere safe or report it, and shows the error reference so
 * support can find it in the server logs. Styles: layout.css ("er-").
 */
import Link from "next/link";
import { useEffect } from "react";
import { Button3D } from "@/ui/kit/Buttons";

export function ErrorView({ error, reset, inPanel = false }: { error: Error & { digest?: string }; reset: () => void; inPanel?: boolean }) {
  useEffect(() => {
    // Keep it in the browser console for support; the digest matches the server log entry.
    console.error(error);
  }, [error]);

  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <main className={inPanel ? "er er-panel" : "er"} role="alert">
      <div className="er-card">
        <span className="er-mark" aria-hidden>!</span>
        <h1>{offline ? "اتصال اینترنت قطع است" : "این صفحه به مشکل خورد"}</h1>
        <p>
          {offline
            ? "به نظر می‌رسد اینترنت شما قطع شده. بعد از وصل شدن، دوباره امتحان کنید."
            : "مشکلی پیش‌بینی‌نشده پیش آمد و صفحه کامل باز نشد. اطلاعات رزرو و کیف پول شما سر جایش است. یک بار دیگر امتحان کنید؛ اگر تکرار شد، گزارش دهید."}
        </p>
        <div className="er-actions">
          <Button3D onClick={reset}>تلاش دوباره</Button3D>
          <Link className="btn ghost" href={inPanel ? "/panel" : "/"}>{inPanel ? "داشبورد" : "صفحه‌ی اصلی"}</Link>
          <Link className="btn ghost" href="/panel/support">گزارش مشکل</Link>
        </div>
        {error.digest && (
          <p className="er-ref">کد پیگیری خطا: <span dir="ltr">{error.digest}</span></p>
        )}
      </div>
    </main>
  );
}
