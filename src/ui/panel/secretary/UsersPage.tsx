"use client";
/**
 * Front desk + Admin › Users (/panel/users). Customer list with search and
 * quick filters on one side; the opened customer on the other: contact,
 * wallet with top-up / pay-back at the desk, upcoming and recent bookings,
 * and wallet history. ?phone opens a customer. Styles: secretary.css ("cu-").
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { fa, faNum, hm, jDate, toman } from "@/engine/format";
import { ROLE_FA } from "@/engine/panel/menus";
import { CUSTOMER_FILTERS, useCustomers } from "@/engine/panel/useCustomers";
import { useSession } from "@/engine/store";
import { courtById } from "@/engine/venue";
import type { Booking } from "@/engine/types";
import { Button3D } from "@/ui/kit/Buttons";
import { PageHead } from "@/ui/panel/shell/PageHead";

type C = ReturnType<typeof useCustomers>;

function BookingLine({ b }: { b: Booking }) {
  return (
    <li>
      <span className="cu-when"><b>{jDate(b.date)}</b><bdi>{hm(b.hour)}</bdi></span>
      <span className="cu-what">{courtById(b.courtId)?.name}{b.source === "staff" ? " · حضوری" : ""}</span>
      <span className="cu-amt">{toman(b.price)}</span>
    </li>
  );
}

function WalletBox({ c }: { c: C }) {
  const d = c.detail!;
  return (
    <section className="cu-wallet">
      <div className="cu-bal">
        <small>موجودی کیف پول</small>
        <b>{toman(d.customer.wallet)}</b>
      </div>
      <div className="cu-op">
        <div className="cu-seg" role="radiogroup" aria-label="نوع عملیات">
          <button type="button" role="radio" aria-checked={c.opKind === "charge"} className={clsx(c.opKind === "charge" && "on")} onClick={() => c.setOpKind("charge")}>شارژ</button>
          <button type="button" role="radio" aria-checked={c.opKind === "refund"} className={clsx(c.opKind === "refund" && "on")} onClick={() => c.setOpKind("refund")}>برگشت وجه</button>
        </div>
        <label className="cu-amount">
          <span className="sr-only">مبلغ</span>
          <input className="input ltr" inputMode="numeric" maxLength={14} value={c.amountText} onChange={(e) => c.setAmountText(e.target.value)} placeholder="مبلغ" />
          <span>تومان</span>
        </label>
        <div className="cu-seg" role="radiogroup" aria-label="روش">
          <button type="button" role="radio" aria-checked={c.method === "pos"} className={clsx(c.method === "pos" && "on")} onClick={() => c.setMethod("pos")}>کارتخوان</button>
          <button type="button" role="radio" aria-checked={c.method === "cash"} className={clsx(c.method === "cash" && "on")} onClick={() => c.setMethod("cash")}>نقدی</button>
        </div>
        <input className="input" maxLength={120} value={c.opNote} onChange={(e) => c.setOpNote(e.target.value)} placeholder="شرح (اختیاری)" aria-label="شرح" />
        <Button3D size="sm" disabled={c.busy || !c.amount} onClick={c.walletOp}>
          {c.busy ? "…" : c.opKind === "charge" ? `شارژ ${c.amount ? toman(c.amount) : ""}` : `برگشت ${c.amount ? toman(c.amount) : ""}`}
        </Button3D>
      </div>
      {c.error && <p className="cu-err" role="alert">{c.error}</p>}
      {c.done && <p className="cu-ok" role="status">{c.done}</p>}
    </section>
  );
}

function Detail({ c, isAdmin }: { c: C; isAdmin: boolean }) {
  if (!c.phone)
    return (
      <div className="cu-empty">
        <b>یک مشتری را انتخاب کنید</b>
        <p>با نام یا شماره جستجو کنید؛ برای مشتری تازه از «رزرو جدید» شروع کنید.</p>
        <Link className="btn soft sm" href="/panel/newb">رزرو جدید</Link>
      </div>
    );
  if (c.detailLoading || !c.detail) return <div className="cu-empty"><p>در حال بارگذاری…</p></div>;
  const { customer: u, upcoming, recent, transactions } = c.detail;
  return (
    <div className="cu-detail">
      <header className="cu-head">
        <button type="button" className="cu-back" onClick={() => c.open(null)} aria-label="بازگشت به فهرست">→</button>
        <span className="cu-avatar lg">{u.first[0]}</span>
        <div>
          <h3>{u.first} {u.last}{u.vip && <em className="cu-vip">VIP</em>}</h3>
          <p dir="ltr" className="cu-phone">{fa(u.phone)}</p>
          {isAdmin && <p className="cu-roles">{u.roles.map((r) => <i key={r}>{ROLE_FA[r]}</i>)}</p>}
        </div>
        <Link className="btn sm" href={`/panel/newb?phone=${u.phone}`}>رزرو برای این مشتری</Link>
      </header>

      <dl className="cu-facts">
        <div><dt>رزرو پیش رو</dt><dd>{fa(u.upcoming)}</dd></div>
        <div><dt>کل رزروها</dt><dd>{fa(u.totalBookings)}</dd></div>
        <div><dt>آخرین حضور</dt><dd>{u.lastVisit ? jDate(u.lastVisit) : "—"}</dd></div>
      </dl>

      <WalletBox c={c} />

      <div className="cu-two">
        <section>
          <h4>رزروهای پیش رو</h4>
          {upcoming.length ? <ul className="cu-list">{upcoming.map((b) => <BookingLine key={b.id} b={b} />)}</ul> : <p className="cu-none">رزرو پیش رو ندارد.</p>}
          {recent.length > 0 && (
            <>
              <h4>رزروهای اخیر</h4>
              <ul className="cu-list past">{recent.map((b) => <BookingLine key={b.id} b={b} />)}</ul>
            </>
          )}
        </section>
        <section>
          <h4>تراکنش‌های کیف پول</h4>
          {transactions.length ? (
            <ul className="cu-list">
              {transactions.slice(0, 12).map((t) => (
                <li key={t.id}>
                  <span className="cu-when"><b>{jDate(t.date)}</b><small>{t.method}</small></span>
                  <span className="cu-what">{t.desc}</span>
                  <span className={clsx("cu-amt", t.amount < 0 ? "neg" : "pos")} dir="ltr">{faNum(t.amount)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="cu-none">تراکنشی ثبت نشده است.</p>}
        </section>
      </div>
    </div>
  );
}

export function UsersView() {
  const params = useSearchParams();
  const isAdmin = useSession((s) => s.role) === "admin";
  const c = useCustomers(params.get("phone"));
  return (
    <div className="cu">
      <PageHead title={isAdmin ? "کاربران و نقش‌ها" : "کاربران"} sub="جستجوی مشتری، کیف پول و سابقه‌ی رزرو" />
      <div className={clsx("cu-layout", c.phone && "has-open")}>
        <aside className="cu-side" aria-label="فهرست مشتری‌ها">
          <input className="input cu-search" type="search" maxLength={40} value={c.q} onChange={(e) => c.setQ(e.target.value)} placeholder="نام یا شماره موبایل" aria-label="جستجوی مشتری" />
          <div className="cu-filters" role="tablist">
            {CUSTOMER_FILTERS.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={c.filter === f.id} className={clsx(c.filter === f.id && "on")} onClick={() => c.setFilter(f.id)}>{f.label}</button>
            ))}
          </div>
          <p className="cu-count">{c.loading ? "در حال جستجو…" : `${fa(c.rows.length)} مشتری`}</p>
          <ul className="cu-rows">
            {c.rows.map((u) => (
              <li key={u.phone}>
                <button type="button" className={clsx("cu-row", c.phone === u.phone && "on")} onClick={() => c.open(u.phone)}>
                  <span className="cu-avatar">{u.first[0]}</span>
                  <span className="cu-row-main">
                    <b>{u.first} {u.last}{u.vip && <em className="cu-vip">VIP</em>}</b>
                    <small dir="ltr">{fa(u.phone)}</small>
                  </span>
                  <span className="cu-row-side">
                    {u.upcoming > 0 && <i>{fa(u.upcoming)} رزرو</i>}
                    <small>{toman(u.wallet)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!c.loading && !c.rows.length && <p className="cu-none">مشتری‌ای با این مشخصات پیدا نشد.</p>}
        </aside>
        <section className="cu-main"><Detail c={c} isAdmin={isAdmin} /></section>
      </div>
    </div>
  );
}
