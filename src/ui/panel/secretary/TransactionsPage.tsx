"use client";
/**
 * Front desk › Wallet & transactions (/panel/wops); Admin › Transactions (/panel/alltx).
 * Period and type filters with search, totals for the filtered rows, and the
 * list grouped by day with each day's net. Styles: secretary.css ("tx-").
 */
import Link from "next/link";
import clsx from "clsx";
import { fa, faNum, jFull, toman } from "@/engine/format";
import { TX_PERIODS, useDeskTransactions, type TxKind } from "@/engine/panel/useDeskTransactions";
import type { Tx } from "@/engine/types";
import { PageHead } from "@/ui/panel/shell/PageHead";

const KINDS: { id: TxKind; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "charge", label: "شارژ" },
  { id: "pay", label: "پرداخت" },
  { id: "refund", label: "برگشت وجه" },
];
const TYPE_FA: Record<Tx["type"], string> = { charge: "شارژ", pay: "پرداخت", refund: "برگشت" };

/** Shared by the front desk wallet page and the admin transactions page. */
export function AllTransactionsView({ title }: { title: string }) {
  const t = useDeskTransactions();
  return (
    <div className="tx">
      <PageHead title={title} action={<Link className="btn soft sm" href="/panel/users">شارژ کیف پول مشتری</Link>} />
      <div className="tx-bar">
        <div className="tx-seg" role="tablist" aria-label="بازه">
          {TX_PERIODS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={t.period === p.id} className={clsx(t.period === p.id && "on")} onClick={() => t.setPeriod(p.id)}>{p.label}</button>
          ))}
        </div>
        <div className="tx-seg" role="tablist" aria-label="نوع">
          {KINDS.map((k) => (
            <button key={k.id} type="button" role="tab" aria-selected={t.kind === k.id} className={clsx(t.kind === k.id && "on")} onClick={() => t.setKind(k.id)}>{k.label}</button>
          ))}
        </div>
        <input className="input tx-search" type="search" maxLength={40} value={t.q} onChange={(e) => t.setQ(e.target.value)} placeholder="نام، شماره یا شرح" aria-label="جستجو" />
      </div>

      <dl className="tx-totals">
        <div><dt>شارژ</dt><dd className="pos">{toman(t.totals.charge)}</dd></div>
        <div><dt>پرداخت رزرو</dt><dd className="neg">{toman(t.totals.pay)}</dd></div>
        <div><dt>برگشت وجه</dt><dd>{toman(t.totals.refund)}</dd></div>
        <div><dt>تعداد</dt><dd>{fa(t.count)}</dd></div>
      </dl>

      {t.loading && <p className="tx-none">در حال بارگذاری…</p>}
      {!t.loading && !t.groups.length && <p className="tx-none">در این بازه تراکنشی با این فیلتر نیست.</p>}
      <div className="tx-days">
        {t.groups.map((g) => (
          <section key={g.date}>
            <header><h3>{jFull(g.date)}</h3><span dir="ltr" className={g.net < 0 ? "neg" : "pos"}>{faNum(g.net)}</span></header>
            <ul>
              {g.items.map((x) => (
                <li key={x.id}>
                  <span className={clsx("tx-type", x.type)}>{TYPE_FA[x.type]}</span>
                  <span className="tx-who">
                    <Link href={`/panel/users?phone=${x.phone}`}>{x.userName ?? fa(x.phone)}</Link>
                    <small>{x.desc}</small>
                  </span>
                  <span className="tx-meta"><small>{x.method}</small><small>{x.actor}</small></span>
                  <span className={clsx("tx-amt", x.amount < 0 ? "neg" : "pos")} dir="ltr">{faNum(x.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
