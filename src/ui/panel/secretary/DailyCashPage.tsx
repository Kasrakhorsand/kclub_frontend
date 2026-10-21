"use client";
/**
 * Front desk › Daily cash report (/panel/cash). The desk user's day: money
 * in and out by method, the cash that should be in the drawer, today's
 * desk transactions, and closing the drawer with the counted amount.
 * Styles: secretary.css ("ch-").
 */
import clsx from "clsx";
import { fa, faNum, jDate, jFull, toman, weekday } from "@/engine/format";
import { useCashDrawer } from "@/engine/panel/useCashDrawer";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

export function DailyCashView() {
  const c = useCashDrawer();
  const r = c.report;
  return (
    <div className="ch">
      <PageHead title="گزارش صندوق روزانه" />
      <div className="ch-days" role="tablist" aria-label="روز">
        {c.days.map((d, i) => (
          <button key={d} type="button" role="tab" aria-selected={c.date === d} className={clsx(c.date === d && "on")} onClick={() => c.setDate(d)}>
            {i === 0 ? "امروز" : i === 1 ? "دیروز" : `${weekday(d)} ${jDate(d).slice(5)}`}
          </button>
        ))}
      </div>

      {c.loading || !r ? (
        <p className="ch-none">در حال بارگذاری…</p>
      ) : (
        <div className="ch-layout">
          <div className="ch-main">
            <section className="ch-card">
              <header><h3>{jFull(r.date)}</h3><span>{fa(r.rows.length)} تراکنش</span></header>
              <table className="ch-table">
                <thead><tr><th>روش</th><th>دریافت</th><th>برگشت</th><th>تعداد</th></tr></thead>
                <tbody>
                  {r.byMethod.map((m) => (
                    <tr key={m.method}><td>{m.method}</td><td>{toman(m.received)}</td><td>{m.refunded ? toman(m.refunded) : "—"}</td><td>{fa(m.count)}</td></tr>
                  ))}
                  {!r.byMethod.length && <tr><td colSpan={4} className="ch-none">در این روز تراکنشی ثبت نکرده‌اید.</td></tr>}
                </tbody>
                <tfoot><tr><td>جمع</td><td>{toman(r.received)}</td><td>{r.refunded ? toman(r.refunded) : "—"}</td><td /></tr></tfoot>
              </table>
            </section>

            <section className="ch-card">
              <header><h3>تراکنش‌های ثبت‌شده توسط شما</h3></header>
              {r.rows.length ? (
                <ul className="ch-rows">
                  {r.rows.map((t) => (
                    <li key={t.id}>
                      <span><b>{t.userName ?? fa(t.phone)}</b><small>{t.desc}</small></span>
                      <small>{t.method}</small>
                      <span className={t.amount < 0 ? "neg" : "pos"} dir="ltr">{faNum(t.amount)}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="ch-none">تراکنشی نیست.</p>}
            </section>
          </div>

          <aside className="ch-drawer">
            <h3>بستن صندوق</h3>
            <div className="ch-expected">
              <small>نقد مورد انتظار در صندوق</small>
              <b>{toman(r.expectedCash)}</b>
            </div>
            {r.closed ? (
              <div className="ch-closed">
                <p>صندوق ساعت <bdi>{fa(r.closed.at)}</bdi> بسته شد.</p>
                <p>شمرده‌شده: <b>{toman(r.closed.counted)}</b></p>
                <p className={clsx("ch-diff", r.closed.difference === 0 ? "ok" : "bad")}>
                  {r.closed.difference === 0 ? "بدون اختلاف" : `اختلاف ${r.closed.difference > 0 ? "اضافه" : "کسری"}: ${toman(Math.abs(r.closed.difference))}`}
                </p>
                {r.closed.note && <p className="ch-note">{r.closed.note}</p>}
              </div>
            ) : (
              <>
                <label className="f">
                  نقد شمرده‌شده
                  <span className="ch-amount">
                    <input className="input ltr" inputMode="numeric" maxLength={14} value={c.countedText} onChange={(e) => c.setCountedText(e.target.value)} placeholder="۰" />
                    <span>تومان</span>
                  </span>
                </label>
                {c.difference !== null && (
                  <p className={clsx("ch-diff", c.difference === 0 ? "ok" : "bad")}>
                    {c.difference === 0 ? "با صندوق برابر است" : `${c.difference > 0 ? "اضافه" : "کسری"}: ${toman(Math.abs(c.difference))}`}
                  </p>
                )}
                <label className="f">
                  توضیح {c.needsNote ? <small className="ch-req">برای این اختلاف لازم است</small> : <small className="muted">اختیاری</small>}
                  <textarea className="input" rows={2} maxLength={200} value={c.note} onChange={(e) => c.setNote(e.target.value)} />
                </label>
                {c.error && <p className="ch-err" role="alert">{c.error}</p>}
                <Button3D disabled={c.busy || c.counted === null} onClick={c.close}>{c.busy ? "…" : "ثبت و بستن صندوق"}</Button3D>
                <p className="ch-hint">کارتخوان و لینک پرداخت در حساب بانکی ثبت می‌شوند؛ فقط نقد را بشمارید.</p>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
