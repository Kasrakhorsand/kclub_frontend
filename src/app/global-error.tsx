"use client";
/**
 * Last resort when the root layout itself fails, so none of the site's CSS
 * or fonts may have loaded: plain inline styles, its own <html> and <body>.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fa" dir="rtl">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0D0D0E", color: "#ECEAE4", fontFamily: "Tahoma, sans-serif", padding: 16 }}>
        <main role="alert" style={{ maxWidth: 440, textAlign: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>سایت موقتاً در دسترس نیست</h1>
          <p style={{ margin: 0, lineHeight: 1.9, color: "#B4B0A8" }}>مشکلی پیش‌بینی‌نشده پیش آمد. اطلاعات رزرو و کیف پول شما سر جایش است. چند لحظه بعد دوباره امتحان کنید.</p>
          <button type="button" onClick={reset} style={{ alignSelf: "center", padding: "10px 22px", borderRadius: 12, border: 0, background: "#C9A45C", color: "#141210", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}>
            تلاش دوباره
          </button>
          {error.digest && <small style={{ color: "#8F8C86" }}>کد پیگیری خطا: <span dir="ltr">{error.digest}</span></small>}
        </main>
      </body>
    </html>
  );
}
