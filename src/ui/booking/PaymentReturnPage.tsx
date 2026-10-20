"use client";
/**
 * K Club page the bank gateway returns to (/payment/return?ref=...). Shows
 * what the backend says about the payment: paid, failed or still being
 * confirmed. Styles: booking.css (".gw", ".okmark", ".pr-").
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { fa, toman } from "@/engine/format";
import { usePaymentResult } from "@/engine/booking/usePaymentResult";
import { Button3D } from "@/ui/kit/Buttons";

function ResultView() {
  const params = useSearchParams();
  const p = usePaymentResult(params.get("ref"));
  const r = p.result;
  const isTopUp = r?.kind === "topup";

  if (p.invalid)
    return (
      <Shell tone="warn" title="لینک بازگشت از بانک معتبر نیست">
        <p className="muted">اگر پرداختی انجام داده‌اید، نتیجه را در کیف پول یا «رزروهای من» ببینید.</p>
        <Actions primary={{ href: "/panel/res", label: "رزروهای من" }} secondary={{ href: "/panel/wallet", label: "کیف پول" }} />
      </Shell>
    );

  if (p.loading || (r?.status === "pending" && !p.stillPending))
    return (
      <Shell tone="wait" title="در حال تأیید پرداخت با بانک…">
        <p className="muted">چند لحظه صبر کنید و صفحه را نبندید.</p>
      </Shell>
    );

  if (p.failedToCheck)
    return (
      <Shell tone="warn" title="نتیجه‌ی پرداخت دریافت نشد">
        <p className="muted">{p.errorMessage ?? "اتصال برقرار نشد."} چند دقیقه بعد کیف پول یا رزروهایتان را ببینید؛ اگر مبلغ کم شده ولی رزرو ثبت نشده، از پشتیبانی فنی پیگیری کنید.</p>
        <Actions primary={{ href: "/panel/res", label: "رزروهای من" }} secondary={{ href: "/panel/support", label: "پشتیبانی فنی" }} />
      </Shell>
    );

  if (p.stillPending)
    return (
      <Shell tone="warn" title="تأیید بانک هنوز نرسیده">
        <p className="muted">پرداخت شما در حال بررسی است و نتیجه با اعلان و پیامک خبر داده می‌شود. اگر تأیید نشود، مبلغ تا ۷۲ ساعت به حسابتان برمی‌گردد.</p>
        <Ref r={r!} />
        <Actions primary={{ href: "/panel/notif", label: "اعلان‌ها" }} secondary={{ href: "/panel/support", label: "پشتیبانی فنی" }} />
      </Shell>
    );

  if (r?.status === "paid")
    return (
      <Shell tone="ok" title={isTopUp ? "کیف پول شارژ شد" : "پرداخت موفق بود؛ رزرو ثبت شد"}>
        <p className="pr-amount">{toman(r.amount)}</p>
        {r.tracking && !isTopUp && <div><span className="small muted">کد رهگیری رزرو</span><div className="code">{fa(r.tracking)}</div></div>}
        {r.wallet !== undefined && isTopUp && <p className="muted">موجودی جدید: {toman(r.wallet)}</p>}
        <Ref r={r} />
        <Actions primary={isTopUp ? { href: "/panel/wallet", label: "کیف پول" } : { href: "/panel/res", label: "رزروهای من" }} secondary={{ href: "/sport", label: "رزرو دیگر" }} />
      </Shell>
    );

  return (
    <Shell tone="bad" title="پرداخت انجام نشد">
      <p className="muted">{r?.message ?? "پرداخت لغو شد یا بانک آن را تأیید نکرد."} اگر مبلغی از حسابتان کم شده، حداکثر تا ۷۲ ساعت به‌طور خودکار برمی‌گردد.</p>
      {r && <Ref r={r} />}
      <Actions primary={isTopUp ? { href: "/panel/wallet", label: "تلاش دوباره" } : { href: "/checkout", label: "بازگشت به سبد و پرداخت" }} secondary={{ href: "/panel/support", label: "گزارش مشکل" }} />
    </Shell>
  );
}

function Shell({ tone, title, children }: { tone: "ok" | "bad" | "warn" | "wait"; title: string; children: React.ReactNode }) {
  return (
    <main className={`gw pr pr-${tone}`} aria-live="polite">
      <div className="stack-l" style={{ textAlign: "center" }}>
        <Mark tone={tone} />
        <h2>{title}</h2>
        {children}
      </div>
    </main>
  );
}

function Mark({ tone }: { tone: "ok" | "bad" | "warn" | "wait" }) {
  if (tone === "wait") return <span className="pr-spin" aria-hidden />;
  const color = tone === "ok" ? "var(--free)" : tone === "bad" ? "var(--busy)" : "var(--warn)";
  return (
    <svg className="okmark" viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" aria-hidden>
      <circle cx="50" cy="50" r="44" />
      {tone === "ok" ? <path d="M30 52l13 13 27-29" /> : tone === "bad" ? <path d="M35 35l30 30M65 35L35 65" /> : <path d="M50 28v28M50 70v2" />}
    </svg>
  );
}

function Ref({ r }: { r: { ref: string; bankRef?: string } }) {
  return (
    <p className="pr-ref small muted">
      شماره‌ی پیگیری پرداخت: <span dir="ltr">{r.ref}</span>
      {r.bankRef && <> · مرجع بانک: <span dir="ltr">{r.bankRef}</span></>}
    </p>
  );
}

function Actions({ primary, secondary }: { primary: { href: string; label: string }; secondary: { href: string; label: string } }) {
  return (
    <div className="pr-actions">
      <Link href={primary.href}><Button3D>{primary.label}</Button3D></Link>
      <Link className="btn ghost" href={secondary.href}>{secondary.label}</Link>
    </div>
  );
}

export function PaymentReturnPage() {
  return (
    <Suspense>
      <ResultView />
    </Suspense>
  );
}
