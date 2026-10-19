"use client";
/** K Club checkout: ticket-style cart, payment options and confirmation, on the engine's useCheckout. */
import { HOLD_MINUTES } from "@/engine/venue";
import { fa, hm, jFull, toman } from "@/engine/format";
import { useCheckout } from "@/engine/booking/useCheckout";
import { BackButton, Button3D } from "@/ui/kit/Buttons";
import { SITE } from "@/config/site";

export function CheckoutPage() {
  const checkout = useCheckout();
  const { user } = checkout;
  if (!user) return null;

  if (checkout.confirmation)
    return (
      <main className="gw" style={{ textAlign: "center" }}>
        <div className="card stack-l">
          <svg className="okmark" viewBox="0 0 100 100" fill="none" stroke="var(--free)" strokeWidth="6" strokeLinecap="round"><circle cx="50" cy="50" r="44" /><path d="M30 52l13 13 27-29" /></svg>
          <h2>رزرو شما ثبت شد</h2>
          <p className="muted">پیامک تأیید برای {fa(user.phone)} ارسال شد.</p>
          <div><span className="small muted">کد رهگیری</span><div className="code">{fa(checkout.confirmation.tracking)}</div></div>
          <Button3D href="/panel">رفتن به رزروهای من</Button3D>
        </div>
      </main>
    );

  return (
    <main className="wrap" style={{ paddingBlock: "10px 60px" }}>
      <div className="pghead"><h2>پرداخت</h2><BackButton href="/sport">بازگشت به رزرو</BackButton></div>
      <div className="co" style={{ marginTop: 20 }}>
        <div className="card stack">
          <h3>سانس‌های انتخاب‌شده</h3>
          {!checkout.items.length && <p className="muted">سبد خالی است.</p>}
          <div className="tix">
            {checkout.items.map(({ item, court, sport, rentalOptions, total }) => (
              <div className="tk" key={`${item.date}${item.hour}${item.courtId}`}>
                <span className="sp" style={{ background: court?.floor }}>{sport?.name}</span>
                <span>
                  <b>{court?.name}</b>
                  <br />
                  <span className="when">{jFull(item.date)} · {hm(item.hour)} تا {hm(item.hour + 1)}</span>
                  {rentalOptions.map((rental) => (
                    <span className="rent" key={rental.id}>
                      <span className="small">{rental.name} <span className="muted">({toman(rental.price)} هر {rental.unit})</span></span>
                      <span className="stepper" role="group" aria-label={rental.name}>
                        <button type="button" onClick={() => checkout.setRental(item, rental.id, rental.quantity - 1)} disabled={rental.quantity === 0} aria-label={`یک ${rental.unit} کمتر`}>−</button>
                        <b aria-live="polite">{fa(rental.quantity)}</b>
                        <button type="button" onClick={() => checkout.setRental(item, rental.id, rental.quantity + 1)} disabled={rental.quantity >= rental.maxPerBooking} aria-label={`یک ${rental.unit} بیشتر`}>+</button>
                      </span>
                    </span>
                  ))}
                </span>
                <span className="stack" style={{ gap: 2, alignItems: "flex-end" }}>
                  <span className="pr">{toman(total)}</span>
                  <button className="x" onClick={() => checkout.remove(item)}>حذف</button>
                </span>
              </div>
            ))}
          </div>
          <div className="sum"><span>جمع کل</span><b>{toman(checkout.total)}</b></div>
        </div>
        <div className="card stack">
          <h3>روش پرداخت</h3>
          <label className={`popt ${checkout.method === "gateway" ? "on" : ""}`}>
            <input type="radio" name="pm" checked={checkout.method === "gateway"} onChange={() => checkout.setMethod("gateway")} />
            <span className="rd" /><span><span className="ttl">درگاه بانکی</span><br /><span className="small muted">پرداخت با همه‌ی کارت‌های عضو شتاب</span></span>
          </label>
          <label className={`popt ${checkout.method === "wallet" ? "on" : ""}`} style={{ opacity: checkout.canUseWallet ? 1 : 0.5 }}>
            <input type="radio" name="pm" disabled={!checkout.canUseWallet} checked={checkout.method === "wallet"} onChange={() => checkout.setMethod("wallet")} />
            <span className="rd" /><span><span className="ttl">{SITE.walletName}</span><br /><span className="small muted">موجودی: {toman(user.wallet)}</span></span>
          </label>
          <p className="hold">زمین‌ها تا {fa(HOLD_MINUTES)} دقیقه بعد از رفتن به درگاه برای شما نگه داشته می‌شوند.</p>
          <Button3D block size="lg" disabled={!checkout.items.length || checkout.busy} onClick={checkout.pay}>
            {checkout.busy ? "در حال پرداخت…" : `پرداخت ${toman(checkout.total)}`}
          </Button3D>
          {checkout.error && <p className="small" role="alert" style={{ color: "var(--busy)" }}>{checkout.error}</p>}
          <p className="xs muted">اگر پرداخت ناموفق باشد ولی مبلغ از حساب کم شده باشد، همان مبلغ خودکار به {SITE.walletName} برمی‌گردد.</p>
        </div>
      </div>
    </main>
  );
}
