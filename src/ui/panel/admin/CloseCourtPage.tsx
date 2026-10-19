"use client";
/** Admin › Close a court (/panel/close) for maintenance or a tournament. */
import { addDays, dayKey, hm, jFull } from "@/engine/format";
import { COURTS, HOURS } from "@/engine/venue";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Close a court for a time range (maintenance, tournament); affected bookings are refunded. */
export function CloseCourtView() {
  const days = Array.from({ length: 14 }, (_, i) => dayKey(addDays(new Date(), i)));
  return (
    <>
      <PageHead title="بستن زمین" sub="برای تعمیرات یا مسابقه؛ رزروهای این بازه لغو و وجه برگردانده می‌شود" />
      <div className="card stack" style={{ maxWidth: 620 }}>
        <div className="grid f2">
          <label className="f">زمین<select className="input">{COURTS.map((c) => <option key={c.id}>{c.name}</option>)}</select></label>
          <label className="f">تاریخ<select className="input">{days.map((d) => <option key={d}>{jFull(d)}</option>)}</select></label>
          <label className="f">از ساعت<select className="input">{HOURS.map((h) => <option key={h}>{hm(h)}</option>)}</select></label>
          <label className="f">تا ساعت<select className="input">{HOURS.map((h) => <option key={h}>{hm(h + 1)}</option>)}</select></label>
        </div>
        <label className="f">دلیل<input className="input" placeholder="مثلاً تعویض چمن" /></label>
        <label className="row small"><input type="checkbox" defaultChecked /> بازگشت کامل وجه به کیف پول رزروکنندگان</label>
        <div><button className="btn danger" onClick={() => toast("زمین بسته شد و به کاربران پیامک ارسال شد")}>بستن زمین</button></div>
      </div>
    </>
  );
}
