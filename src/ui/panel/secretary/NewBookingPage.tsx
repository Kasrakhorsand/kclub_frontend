"use client";
/** Front desk + Admin › New booking (/panel/newb): walk-in or phone booking for a customer. */
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { isPast, takenSync } from "@/engine/api";
import { fa, hm, jFull, toman } from "@/engine/format";
import { USERS } from "@/engine/mock";
import { nextDays, todayKey } from "@/engine/panel/stats";
import { COURTS, HOLD_MINUTES, HOURS, MAX_DAYS_AHEAD, priceOf } from "@/engine/venue";
import { Button3D } from "@/ui/kit/Buttons";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

/** Walk-in or phone booking entered by staff; ?date, ?hour and ?court prefill the form. */
export function NewBookingView() {
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? todayKey());
  const [hour, setHour] = useState(Number(params.get("hour") ?? 18));
  const [courtId, setCourtId] = useState(params.get("court") ?? "P1");
  const [phone, setPhone] = useState("");
  const court = COURTS.find((c) => c.id === courtId)!;
  const taken = !!takenSync(date, courtId, hour);
  const customer = USERS[phone];
  const phoneComplete = phone.length === 11;

  return (
    <>
      <PageHead title="رزرو جدید" sub="ثبت رزرو حضوری یا تلفنی برای کاربر" />
      <div className="grid cols2">
        <div className="card stack">
          <div className="grid f2">
            <label className="f">
              زمین
              <select className="input" value={courtId} onChange={(e) => setCourtId(e.target.value)}>
                {COURTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="f">
              تاریخ
              <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
                {nextDays(MAX_DAYS_AHEAD).map((day) => <option key={day} value={day}>{jFull(day)}</option>)}
              </select>
            </label>
            <label className="f">
              ساعت
              <select className="input" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
                {HOURS.map((h) => <option key={h} value={h} disabled={isPast(date, h)}>{hm(h)} تا {hm(h + 1)}</option>)}
              </select>
            </label>
            <label className="f">
              موبایل کاربر
              <input className="input ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09121234567" />
            </label>
          </div>
          {phoneComplete && (
            <p className="small">
              {customer ? <>کاربر: <b>{customer.first} {customer.last}</b> · کیف پول {toman(customer.wallet)}</> : "کاربر جدید است؛ با ثبت رزرو حسابش ساخته می‌شود."}
            </p>
          )}
          <label className="f">
            روش پرداخت
            <select className="input"><option>کارتخوان</option><option>کیف پول کاربر</option><option>ارسال لینک درگاه</option></select>
          </label>
          <div>
            <Button3D disabled={taken || !phoneComplete} onClick={() => toast("رزرو ثبت شد و پیامک تأیید ارسال شد")}>
              {taken ? "این سانس رزرو شده است" : `ثبت رزرو · ${toman(priceOf(court.sport, hour))}`}
            </Button3D>
          </div>
        </div>
        <div className="card stack">
          <h3>خلاصه</h3>
          <p>{court.name} · {court.surface}</p>
          <p>{jFull(date)} · {hm(hour)} تا {hm(hour + 1)}</p>
          <p className="muted small">نگه‌داشت زمین برای پرداخت درگاه: {fa(HOLD_MINUTES)} دقیقه</p>
        </div>
      </div>
    </>
  );
}
