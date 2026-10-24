"use client";
/**
 * K Club terms and privacy pages (/terms, /privacy): title and last-updated
 * date, a contents list (sticky beside the text on wide screens), and the
 * sections from config/legal.ts. The terms page fills in the live refund
 * ladder and booking window from GET /site/rules. Styles: layout.css ("lg2-").
 */
import Link from "next/link";
import { LEGAL_DRAFT, LEGAL_UPDATED, type LegalSection } from "@/config/legal";
import { SHOW_PLACEHOLDERS } from "@/config/content";
import { SITE } from "@/config/site";
import { usePublicRules } from "@/engine/content/useSiteContent";
import { fa } from "@/engine/format";

function Refunds() {
  const { rules } = usePublicRules();
  if (!rules) return <p className="lg2-muted">در حال بارگذاری قوانین…</p>;
  const list = [...rules.cancelRules].sort((a, b) => b.hours - a.hours);
  return (
    <table className="lg2-table">
      <thead><tr><th>زمان لغو</th><th>بازگشت به کیف پول</th></tr></thead>
      <tbody>
        {list.map((r, i) => (
          <tr key={r.hours}>
            <td>{r.hours ? `${fa(r.hours)} ساعت یا بیشتر قبل از شروع` : `کمتر از ${fa(list[i - 1]?.hours ?? 0)} ساعت مانده`}</td>
            <td><b>{r.percent ? `${fa(r.percent)}٪ مبلغ` : "برگشتی ندارد"}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Booking() {
  const { rules } = usePublicRules();
  if (!rules) return null;
  return (
    <ul className="lg2-list">
      <li>رزرو آنلاین تا <b>{fa(rules.maxDaysAhead)} روز</b> آینده باز است.</li>
      <li>وقتی به درگاه بانک می‌روید، سانس‌ها <b>{fa(rules.holdMinutes)} دقیقه</b> برای شما نگه داشته می‌شوند؛ اگر پرداخت در این مدت تمام نشود، سانس آزاد می‌شود.</li>
    </ul>
  );
}

export function LegalPage({ eyebrow, title, intro, sections, other }: { eyebrow: string; title: string; intro: string; sections: LegalSection[]; other: { href: string; label: string } }) {
  return (
    <main className="wrap lg2">
      <header className="lg2-head">
        <span className="lat eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <small>آخرین به‌روزرسانی: {LEGAL_UPDATED}</small>
        {LEGAL_DRAFT && SHOW_PLACEHOLDERS && (
          <p className="lg2-draft" role="note">پیش‌نویس: این متن از روی عملکرد فعلی سایت نوشته شده و پیش از انتشار باید مدیر مجموعه آن را تأیید کند (src/config/legal.ts).</p>
        )}
      </header>
      <div className="lg2-cols">
        <nav className="lg2-toc" aria-label="فهرست">
          <b>در این صفحه</b>
          <ol>
            {sections.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
          </ol>
          <Link href={other.href} className="lg2-other">{other.label}</Link>
        </nav>
        <article className="lg2-body">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id}>
              <h2><span>{fa(i + 1)}</span>{s.title}</h2>
              {s.body.map((p, j) =>
                Array.isArray(p) ? (
                  <ul key={j} className="lg2-list">{p.map((li) => <li key={li}>{li}</li>)}</ul>
                ) : (
                  <p key={j}>{p}</p>
                ),
              )}
              {s.live === "refunds" && <Refunds />}
              {s.live === "booking" && <Booking />}
            </section>
          ))}
          <p className="lg2-contact">سؤالی درباره‌ی این متن دارید؟ از بخش «تیکت‌ها» در پنل یا پذیرش {SITE.name} بپرسید.</p>
        </article>
      </div>
    </main>
  );
}
