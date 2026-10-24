"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * K Club coaches page (/coaches). Everything shown is entered by the front
 * desk in the panel (Coaches). Game and gender filters, portrait cards, and
 * a profile sheet with bio, certificates, weekly teaching hours and prices.
 * Styles: coaches.css ("cp-").
 */
import { useEffect } from "react";
import clsx from "clsx";
import { CONTACT } from "@/config/content";
import { SITE } from "@/config/site";
import { COACH_LEVELS, WEEK_DAYS } from "@/engine/content/useCoachEditor";
import { useCoachDirectory } from "@/engine/content/useCoachDirectory";
import { fa, hm, toman } from "@/engine/format";
import type { Coach } from "@/engine/types";
import { CoachBook } from "@/ui/coaches/CoachBook";
import { CoachPortrait } from "@/ui/coaches/CoachPortrait";
import { JsonLd } from "@/ui/seo/JsonLd";
import { coachesSchema } from "@/ui/seo/schema";

const levelLatin = (c: Coach) => COACH_LEVELS.find((l) => l.id === c.level)?.latin ?? "Coach";

function Card({ c, d }: { c: Coach; d: ReturnType<typeof useCoachDirectory> }) {
  return (
    <article className="cp-card">
      <button type="button" className="cp-photo" onClick={() => d.open(c.id)} aria-label={`پروفایل ${c.name}`}>
        {c.photo ? <img src={c.photo} alt="" loading="lazy" /> : <CoachPortrait name={c.name} />}
        <span className="cp-level lat">{levelLatin(c)}</span>
        <span className="cp-name">
          <b>{c.name}</b>
          <small>{c.title}</small>
        </span>
      </button>
      <div className="cp-body">
        <div className="cp-games">{c.games.map((g) => <span key={g}>{d.gameName(g)}</span>)}</div>
        <p className="cp-facts">
          <span>{fa(c.years)} سال تجربه</span>
          {c.rating ? <span>★ {fa(c.rating)}<small> ({fa(c.reviews ?? 0)} نظر)</small></span> : null}
          {c.students ? <span>{fa(c.students)} شاگرد</span> : null}
        </p>
        {c.tags.length > 0 && <div className="cp-tags">{c.tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}</div>}
        <div className="cp-foot">
          <span className="cp-price"><b>{toman(c.price)}</b><small>هر ساعت، جلسه‌ی خصوصی</small></span>
          <button type="button" className="btn ghost sm" onClick={() => d.open(c.id)}>پروفایل و برنامه</button>
        </div>
      </div>
    </article>
  );
}

/** Weekly teaching hours as one row per day. */
function Week({ c }: { c: Coach }) {
  const slots = c.schedule ?? [];
  if (!slots.length) return <p className="cp-muted">برای هماهنگی زمان جلسه با پذیرش تماس بگیرید.</p>;
  return (
    <ul className="cp-week">
      {WEEK_DAYS.map((day, i) => {
        const of = slots.filter((s) => s.day === i);
        return (
          <li key={day} className={clsx(!of.length && "off")}>
            <b>{day}</b>
            <span>{of.length ? of.map((s, j) => <bdi key={j}>{hm(s.from)} تا {hm(s.to)}</bdi>) : "—"}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Profile({ d }: { d: ReturnType<typeof useCoachDirectory> }) {
  const c = d.opened;
  useEffect(() => {
    if (!c) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && d.open(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [c, d]);
  if (!c) return null;
  return (
    <div className="cp-sheet-wrap" onClick={() => d.open(null)}>
      <aside className="cp-sheet" role="dialog" aria-modal="true" aria-label={`پروفایل ${c.name}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cp-close" onClick={() => d.open(null)} aria-label="بستن">✕</button>
        <div className="cp-sheet-photo">
          {c.photo ? <img src={c.photo} alt={c.name} /> : <CoachPortrait name={c.name} />}
        </div>
        <div className="cp-sheet-body">
          <span className="cp-sheet-level lat">{levelLatin(c)}</span>
          <h2>{c.name}</h2>
          <p className="cp-muted">{c.title}</p>
          <div className="cp-games">{c.games.map((g) => <span key={g}>{d.gameName(g)}</span>)}</div>

          <dl className="cp-stats">
            <div><dt>سابقه</dt><dd>{fa(c.years)} سال</dd></div>
            {c.rating ? <div><dt>امتیاز</dt><dd>★ {fa(c.rating)}<small> از {fa(c.reviews ?? 0)} نظر</small></dd></div> : null}
            {c.students ? <div><dt>شاگرد</dt><dd>{fa(c.students)}</dd></div> : null}
            {c.satisfaction ? <div><dt>رضایت</dt><dd>{fa(c.satisfaction)}٪</dd></div> : null}
          </dl>

          {c.bio && <section><h3>درباره‌ی مربی</h3><p>{c.bio}</p></section>}
          {c.tags.length > 0 && <div className="cp-tags">{c.tags.map((t) => <span key={t}>{t}</span>)}</div>}
          {c.certificates?.length ? (
            <section><h3>مدرک‌ها</h3><ul className="cp-certs">{c.certificates.map((x) => <li key={x}>{x}</li>)}</ul></section>
          ) : null}
          <section><h3>ساعت‌های تدریس</h3><Week c={c} /></section>

          <section className="cp-prices">
            <div><small>جلسه‌ی خصوصی، هر ساعت</small><b>{toman(c.price)}</b></div>
            {c.groupPrice ? <div><small>کلاس گروهی، هر نفر</small><b>{toman(c.groupPrice)}</b></div> : null}
          </section>
          <CoachBook />
          {CONTACT.phone && <p className="cp-muted">هماهنگی با پذیرش: <span dir="ltr">{fa(CONTACT.phone)}</span></p>}
        </div>
      </aside>
    </div>
  );
}

export function CoachesPage() {
  const d = useCoachDirectory();
  return (
    <main className="wrap coachpage">
      <header className="cp-head">
        <span className="lat eyebrow">Coaches</span>
        <h1>مربیان {SITE.name}</h1>
        <p>با مربی بازی را سریع‌تر و درست‌تر یاد بگیرید؛ جلسه‌ی خصوصی یا کلاس گروهی، از مبتدی تا آمادگی مسابقه.</p>
      </header>

      {(d.games.length > 1 || d.hasGender) && (
        <div className="cp-filters" role="toolbar" aria-label="فیلتر مربیان">
          {d.games.length > 1 && (
            <div className="cp-seg">
              <button type="button" aria-pressed={!d.game} className={clsx(!d.game && "on")} onClick={() => d.setGame(null)}>همه</button>
              {d.games.map((g) => <button key={g.id} type="button" aria-pressed={d.game === g.id} className={clsx(d.game === g.id && "on")} onClick={() => d.setGame(d.game === g.id ? null : g.id)}>{g.name}</button>)}
            </div>
          )}
          {d.hasGender && (
            <div className="cp-seg">
              <button type="button" aria-pressed={d.gender === "female"} className={clsx(d.gender === "female" && "on")} onClick={() => d.setGender(d.gender === "female" ? null : "female")}>مربی خانم</button>
              <button type="button" aria-pressed={d.gender === "male"} className={clsx(d.gender === "male" && "on")} onClick={() => d.setGender(d.gender === "male" ? null : "male")}>مربی آقا</button>
            </div>
          )}
          <span className="cp-count">{fa(d.shown.length)} مربی</span>
        </div>
      )}

      {d.loading && <p className="cp-muted">در حال بارگذاری…</p>}
      {!d.loading && !d.total && <p className="cp-empty">معرفی مربیان به‌زودی اینجا قرار می‌گیرد.</p>}
      {!d.loading && d.total > 0 && !d.shown.length && (
        <p className="cp-empty">مربی‌ای با این فیلتر نیست. <button type="button" onClick={d.clear}>نمایش همه</button></p>
      )}
      <section className="cp-grid">
        {d.shown.map((c) => <Card key={c.id} c={c} d={d} />)}
      </section>
      <Profile d={d} />
      {d.total > 0 && <JsonLd data={coachesSchema(d.all)} />}
    </main>
  );
}
