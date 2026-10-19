"use client";
/**
 * Player › Wallet (/panel/wallet): bank-style balance card with this month's
 * totals, top-up (presets or custom amount), and the transaction history
 * grouped by day with a type filter. Styles: player.css (classes "pw-").
 */
/* eslint-disable @next/next/no-img-element */
import clsx from "clsx";
import { fa, faNum, jFull, toman } from "@/engine/format";
import { TOPUP_PRESETS, useWallet, type TxFilter } from "@/engine/wallet/useWallet";
import type { Tx } from "@/engine/types";
import { SITE } from "@/config/site";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import type { Icon3DName } from "@/ui/kit/icons3d";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

const TX_KIND: Record<Tx["type"], { label: string; icon: Icon3DName }> = {
  charge: { label: "شارژ", icon: "plus" },
  pay: { label: "پرداخت", icon: "court" },
  refund: { label: "بازگشت وجه", icon: "swap" },
};

const FILTERS: { id: TxFilter; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "charge", label: "شارژ" },
  { id: "pay", label: "پرداخت" },
  { id: "refund", label: "بازگشت وجه" },
];

/** "۵۰۰ هزار" / "۲ میلیون" for preset buttons. */
const shortToman = (n: number) => (n >= 1e6 ? `${fa(n / 1e6)} میلیون` : `${fa(n / 1000)} هزار`);

export function WalletView() {
  const w = useWallet();

  const pay = async () => {
    if (await w.topUp()) toast(`انتقال به درگاه برای شارژ ${toman(w.amount)}…`);
  };

  return (
    <div className="pw">
      <PageHead title="کیف پول" sub="شارژ، پرداخت رزرو و بازگشت وجه لغوها" />

      <section className="pw-top">
        <div className="pw-card">
          <img className="pw-emb" src={SITE.logo.emblem} alt="" aria-hidden="true" />
          <div className="pw-card-head">
            <span>{SITE.walletName}</span>
            <span className="pw-chip" aria-hidden="true" />
          </div>
          <div>
            <small>موجودی قابل استفاده</small>
            <b className="pw-balance">{faNum(w.balance)} <span>تومان</span></b>
          </div>
          <div className="pw-card-foot">
            <span>{w.holder}</span>
            <span dir="ltr">{fa(w.phone.replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3"))}</span>
          </div>
        </div>

        <div className="pw-month" aria-label="این ماه">
          <span className="pw-month-title">این ماه</span>
          <div className="pw-month-row in">
            <Icon3D name="plus" />
            <span><small>شارژ</small><b>{faNum(w.month.charged)}</b></span>
          </div>
          <div className="pw-month-row out">
            <Icon3D name="court" />
            <span><small>پرداخت رزرو</small><b>{faNum(w.month.spent)}</b></span>
          </div>
          <div className="pw-month-row back">
            <Icon3D name="swap" />
            <span><small>بازگشت وجه</small><b>{faNum(w.month.refunded)}</b></span>
          </div>
        </div>
      </section>

      <section className="pw-panel pw-topup">
        <header>
          <h3>شارژ کیف پول</h3>
          <p className="small muted">با کیف پول، رزرو یک‌کلیکی است و بازگشت وجه لغوها هم همین‌جا می‌نشیند.</p>
        </header>
        <div className="pw-presets" role="group" aria-label="مبلغ‌های آماده">
          {TOPUP_PRESETS.map((v) => (
            <button key={v} type="button" className={clsx("pw-preset", w.isPreset && w.amount === v && "on")} onClick={() => w.choosePreset(v)} aria-pressed={w.isPreset && w.amount === v}>
              <b>{shortToman(v)}</b>
              <small>تومان</small>
            </button>
          ))}
        </div>
        <label className="pw-custom">
          <span>یا مبلغ دلخواه</span>
          <span className="pw-custom-field">
            <input className="input ltr" inputMode="numeric" placeholder="تومان ۷۵۰۰۰۰" value={w.customText} onChange={(e) => w.setCustom(e.target.value)} aria-invalid={!!w.error} />
            <em>مثلاً</em>
          </span>
        </label>
        {w.error && <p className="small" role="alert" style={{ color: "var(--busy)" }}>{w.error}</p>}
        <div className="pw-pay">
          <span>
            <small>بعد از شارژ</small>
            <b>{toman(w.balance + (w.amountValid ? w.amount : 0))}</b>
          </span>
          <Button3D size="lg" onClick={pay} disabled={w.busy || !w.amount}>
            {w.busy ? "در حال اتصال…" : `پرداخت ${toman(w.amount || 0)}`}
          </Button3D>
        </div>
        <p className="xs muted">پرداخت با همه‌ی کارت‌های عضو شتاب. اگر پرداخت ناموفق باشد ولی مبلغ کم شود، خودکار برمی‌گردد.</p>
      </section>

      <section className="pw-panel">
        <header className="pw-hist-head">
          <h3>تاریخچه‌ی تراکنش‌ها</h3>
          <div className="pw-filters" role="tablist" aria-label="نوع تراکنش">
            {FILTERS.map((f) => (
              <button key={f.id} role="tab" aria-selected={w.filter === f.id} className={clsx(w.filter === f.id && "on")} onClick={() => w.setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </header>
        {w.loading && <p className="muted small">در حال بارگذاری…</p>}
        {!w.loading && !w.days.length && <p className="muted small pw-empty">تراکنشی برای نمایش نیست.</p>}
        {w.days.map((day) => (
          <div className="pw-day" key={day.date}>
            <h4>{jFull(day.date)}</h4>
            <ul>
              {day.items.map((tx) => (
                <li key={tx.id} className={tx.type}>
                  <Icon3D name={TX_KIND[tx.type].icon} />
                  <span className="pw-tx-main">
                    <b>{tx.desc}</b>
                    <small>{TX_KIND[tx.type].label} · {tx.method}{tx.actor !== "کاربر" ? ` · ${tx.actor}` : ""}</small>
                  </span>
                  <span className="pw-tx-amount" dir="ltr">{tx.amount > 0 ? "+" : "−"}{faNum(Math.abs(tx.amount))}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
