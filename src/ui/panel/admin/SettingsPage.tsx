"use client";
/**
 * Admin › Settings and rules (/panel/settings): public booking window, daily
 * release hour, gateway hold, per-player limit, and the cancellation refund
 * ladder, with a plain-language preview of the rules. Styles: admin.css ("st-").
 */
import { fa, hm } from "@/engine/format";
import { SETTING_LIMITS, useVenueSettings } from "@/engine/admin/useVenueSettings";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

const FIELDS: { key: keyof typeof SETTING_LIMITS; label: string; unit: string; hint: string }[] = [
  { key: "maxDaysAhead", label: "رزرو عمومی تا چند روز جلوتر", unit: "روز", hint: "تایم‌های ثابت و مربی‌ها جلوتر از این بازه ثبت می‌شوند." },
  { key: "releaseHour", label: "ساعت باز شدن روز جدید", unit: "ساعت", hint: "هر روز در این ساعت یک روز تازه به بازه اضافه می‌شود." },
  { key: "holdMinutes", label: "نگه‌داشت سانس هنگام پرداخت", unit: "دقیقه", hint: "مدتی که سانس برای کاربرِ در صفحه‌ی بانک نگه داشته می‌شود." },
  { key: "maxActivePerUser", label: "حداکثر رزرو فعال هر بازیکن", unit: "رزرو", hint: "۰ یعنی بدون محدودیت." },
];

export function SettingsView() {
  const st = useVenueSettings();
  const s = st.s;
  return (
    <div className="ad">
      <PageHead title="تنظیمات و قوانین" sub="تغییرات برای رزروهای تازه اعمال می‌شود؛ رزروهای قبلی با قوانین زمان ثبتشان می‌مانند." />
      {st.loading || !s ? (
        <p className="ad-none">در حال بارگذاری…</p>
      ) : (
        <div className="st-layout">
          <section className="ad-card">
            <header><h3>رزرو</h3></header>
            <div className="st-fields">
              {FIELDS.map((f) => (
                <label key={f.key} className="st-field">
                  <span><b>{f.label}</b><small>{f.hint}</small></span>
                  <span className="st-input">
                    <input
                      className="input ltr"
                      type="number"
                      min={SETTING_LIMITS[f.key][0]}
                      max={SETTING_LIMITS[f.key][1]}
                      value={s[f.key]}
                      onChange={(e) => st.set(f.key, Math.trunc(Number(e.target.value)))}
                    />
                    <small>{f.key === "releaseHour" ? hm(s.releaseHour) : f.unit}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="ad-card">
            <header><h3>لغو و بازگشت وجه</h3><button type="button" className="btn ghost sm" onClick={st.addRule}>افزودن پله</button></header>
            <table className="st-rules">
              <thead><tr><th>لغو حداقل … ساعت قبل از شروع</th><th>بازگشت</th><th /></tr></thead>
              <tbody>
                {s.cancelRules.map((r, i) => (
                  <tr key={i}>
                    <td><input className="input ltr" type="number" min={0} max={168} value={r.hours} onChange={(e) => st.setRule(i, "hours", Math.trunc(Number(e.target.value)))} aria-label="ساعت" /></td>
                    <td><span className="st-pct"><input className="input ltr" type="number" min={0} max={100} value={r.percent} onChange={(e) => st.setRule(i, "percent", Math.trunc(Number(e.target.value)))} aria-label="درصد" />٪</span></td>
                    <td>{s.cancelRules.length > 1 && <button type="button" className="st-del" onClick={() => st.removeRule(i)} aria-label="حذف پله">✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="st-preview">
              {[...s.cancelRules].sort((a, b) => b.hours - a.hours).map((r, i, all) => (
                <li key={i}>
                  {r.hours ? `لغو ${fa(r.hours)} ساعت یا بیشتر قبل از شروع` : `لغو کمتر از ${fa(all[i - 1]?.hours ?? 0)} ساعت مانده`}: <b>{r.percent ? `${fa(r.percent)}٪ برمی‌گردد` : "برگشتی ندارد"}</b>
                </li>
              ))}
            </ul>
          </section>

          <div className="st-bar">
            {(st.error || (st.dirty && st.problem)) && <p className="ad-err" role="alert">{st.error || st.problem}</p>}
            {st.done && !st.dirty && <p className="ad-ok" role="status">تنظیمات ذخیره شد.</p>}
            {st.dirty && <button type="button" className="btn ghost sm" onClick={st.reset}>برگرداندن</button>}
            <Button3D disabled={!st.dirty || !!st.problem || st.busy} onClick={st.save}>{st.busy ? "…" : "ذخیره‌ی تنظیمات"}</Button3D>
          </div>
        </div>
      )}
    </div>
  );
}
