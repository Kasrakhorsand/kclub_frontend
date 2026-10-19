"use client";
/** Admin › Settings and rules (/panel/settings): booking window, payment hold, cancellation refunds. */
import { fa } from "@/engine/format";
import { CANCEL_RULES, HOLD_MINUTES, MAX_DAYS_AHEAD } from "@/engine/venue";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Booking window, payment hold and cancellation refund rules. */
export function SettingsView() {
  return (
    <>
      <PageHead title="تنظیمات و قوانین" action={<button className="btn" onClick={() => toast("تنظیمات ذخیره شد")}>ذخیره</button>} />
      <div className="grid cols2e">
        <div className="card stack">
          <label className="f">حداکثر روزهای آینده برای رزرو<input className="input ltr" defaultValue={MAX_DAYS_AHEAD} /></label>
          <label className="f">مدت نگه‌داشت زمین هنگام پرداخت (دقیقه)<input className="input ltr" defaultValue={HOLD_MINUTES} /></label>
        </div>
        <div className="card stack">
          <h3>قوانین لغو و بازگشت وجه</h3>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>ساعت مانده تا شروع</th><th>درصد بازگشت</th></tr></thead>
              <tbody>
                {CANCEL_RULES.map((r) => <tr key={r.hours}><td>بیش از {fa(r.hours)} ساعت</td><td>{fa(r.percent)}٪</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
