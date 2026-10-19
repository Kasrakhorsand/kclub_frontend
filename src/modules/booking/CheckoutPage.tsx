"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBookings } from "@/modules/core/api";
import { cartTotal, useSession } from "@/modules/core/store";
import { COURTS, HOLD_MINUTES, sportById } from "@/modules/core/venue";
import { fa, hm, jFull, toman } from "@/modules/core/format";
import { BackButton, Button3D } from "@/modules/ui/Buttons";
import { SITE } from "@/config/site";

/** Checkout: cart review, payment method, then confirmation with a tracking code. Guests are sent to login first. */
export function CheckoutPage() {
  const router = useRouter();
  const { user, cart, toggleCart, clearCart, setAfterLogin } = useSession();
  const [method, setMethod] = useState<"wallet" | "gateway">("gateway");
  const [done, setDone] = useState<{ tracking: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const total = cartTotal(cart);

  useEffect(() => {
    if (!user) {
      setAfterLogin("/checkout");
      router.replace("/login");
    }
  }, [user, router, setAfterLogin]);
  if (!user) return null;

  if (done)
    return (
      <main className="gw" style={{ textAlign: "center" }}>
        <div className="card stack-l">
          <svg className="okmark" viewBox="0 0 100 100" fill="none" stroke="var(--free)" strokeWidth="6" strokeLinecap="round"><circle cx="50" cy="50" r="44" /><path d="M30 52l13 13 27-29" /></svg>
          <h2>رزرو شما ثبت شد</h2>
          <p className="muted">پیامک تأیید برای {fa(user.phone)} ارسال شد.</p>
          <div><span className="small muted">کد رهگیری</span><div className="code">{fa(done.tracking)}</div></div>
          <Button3D href="/panel">رفتن به رزروهای من</Button3D>
        </div>
      </main>
    );

  const canWallet = user.wallet >= total;
  return (
    <main className="wrap" style={{ paddingBlock: "10px 60px" }}>
      <div className="pghead"><h2>پرداخت</h2><BackButton href="/sport">بازگشت به رزرو</BackButton></div>
      <div className="co" style={{ marginTop: 20 }}>
        <div className="card stack">
          <h3>سانس‌های انتخاب‌شده</h3>
          {!cart.length && <p className="muted">سبد خالی است.</p>}
          <div className="tix">
            {cart.map((x) => {
              const c = COURTS.find((k) => k.id === x.courtId)!;
              return (
                <div className="tk" key={`${x.date}${x.hour}${x.courtId}`}>
                  <span className="sp" style={{ background: c.floor }}>{sportById(c.sport)?.name}</span>
                  <span><b>{c.name}</b><br /><span className="when">{jFull(x.date)} · {hm(x.hour)} تا {hm(x.hour + 1)}</span></span>
                  <span className="stack" style={{ gap: 2, alignItems: "flex-end" }}><span className="pr">{toman(x.price)}</span><button className="x" onClick={() => toggleCart(x)}>حذف</button></span>
                </div>
              );
            })}
          </div>
          <div className="sum"><span>جمع کل</span><b>{toman(total)}</b></div>
        </div>
        <div className="card stack">
          <h3>روش پرداخت</h3>
          <label className={`popt ${method === "gateway" ? "on" : ""}`}>
            <input type="radio" name="pm" checked={method === "gateway"} onChange={() => setMethod("gateway")} />
            <span className="rd" /><span><span className="ttl">درگاه بانکی</span><br /><span className="small muted">پرداخت با همه‌ی کارت‌های عضو شتاب</span></span>
          </label>
          <label className={`popt ${method === "wallet" ? "on" : ""}`} style={{ opacity: canWallet ? 1 : 0.5 }}>
            <input type="radio" name="pm" disabled={!canWallet} checked={method === "wallet"} onChange={() => setMethod("wallet")} />
            <span className="rd" /><span><span className="ttl">{SITE.walletName}</span><br /><span className="small muted">موجودی: {toman(user.wallet)}</span></span>
          </label>
          <p className="hold">زمین‌ها تا {fa(HOLD_MINUTES)} دقیقه بعد از رفتن به درگاه برای شما نگه داشته می‌شوند.</p>
          <Button3D
            block
            size="lg"
            disabled={!cart.length || busy}
            onClick={async () => {
              setBusy(true);
              setErr("");
              try {
                const r = await createBookings(user, cart, method);
                clearCart();
                setDone({ tracking: r.tracking });
              } catch {
                setErr("پرداخت انجام نشد. دوباره تلاش کنید؛ اگر مبلغی کم شده باشد به کیف پول برمی‌گردد.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "در حال پرداخت…" : `پرداخت ${toman(total)}`}
          </Button3D>
          {err && <p className="small" role="alert" style={{ color: "var(--busy)" }}>{err}</p>}
          <p className="xs muted">اگر پرداخت ناموفق باشد ولی مبلغ از حساب کم شده باشد، همان مبلغ خودکار به {SITE.walletName} برمی‌گردد.</p>
        </div>
      </div>
    </main>
  );
}
