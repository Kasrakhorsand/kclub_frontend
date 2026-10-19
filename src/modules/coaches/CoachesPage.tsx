import { COACHES } from "@/modules/core/mock";
import { fa } from "@/modules/core/format";
import { CoachBook } from "@/modules/coaches/CoachBook";
import { CoachPortrait } from "@/modules/coaches/CoachPortrait";
import { SITE } from "@/config/site";

const Stars = ({ r }: { r: number }) => (
  <span className="stars" aria-label={`امتیاز ${fa(r)} از ۵`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <i key={i} className="st" style={{ ["--f" as string]: `${Math.max(0, Math.min(1, r - i + 1)) * 100}%` }} />
    ))}
  </span>
);

const price = (p: number) => (p >= 1e6 ? `${fa(p / 1e6)} میلیون تومان` : `${fa(p / 1000)} هزار تومان`);

/** Coach cards with rating, experience and price; booking a coach opens in a later phase. */
export function CoachesPage() {
  return (
    <main className="wrap">
      <div className="pghead">
        <div>
          <span className="lat" style={{ color: "var(--court)" }}>Coaches</span>
          <h2>مربیان {SITE.name}</h2>
        </div>
        <span className="small muted">{fa(COACHES.length)} مربی</span>
      </div>
      <p className="small muted" style={{ marginBlock: "14px 6px" }}>اطلاعات و تصاویر این صفحه نمونه است. رزرو جلسه‌ی مربی در فاز بعدی فعال می‌شود.</p>
      <section className="coaches2">
        {COACHES.map((c) => (
          <article className="cc" key={c.id}>
            <div className="ph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.photo ? <img src={c.photo} alt={c.name} /> : <CoachPortrait name={c.name} />}
              <span className="lv lat">{c.level}</span>
            </div>
            <div className="cb">
              <span className="badge" title="مربی تأییدشده">★</span>
              <div className="nm">
                <h3>{c.name}</h3>
                <p>{c.title}</p>
                <div className="rt"><Stars r={c.rating} /><b>{fa(c.rating)}</b><span>({fa(c.reviews)} نظر)</span></div>
              </div>
              <div className="chips">{c.tags.map((t, j) => <span key={t} className={`tg ${j === 0 ? "on" : ""}`}>{t}</span>)}</div>
              <div className="cst">
                <div><b>{fa(c.years)}</b><span>سال تجربه</span></div>
                <div><b>{fa(c.students)}</b><span>شاگرد</span></div>
                <div><b>{fa(c.satisfaction)}٪</b><span>رضایت</span></div>
              </div>
              <div className="pr"><b>از {price(c.price)}</b><span>هر ساعت جلسه‌ی خصوصی</span></div>
              <CoachBook />
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
