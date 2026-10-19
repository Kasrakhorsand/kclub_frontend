"use client";
/**
 * Building blocks shared by every panel role: KPI tiles, the transaction
 * table, tickets, notifications and the "coming soon" placeholder.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/modules/core/store";
import { getDayBoard } from "@/modules/core/api";
import { NOTIFS, TICKETS, USERS } from "@/modules/core/mock";
import { COURTS, HOURS } from "@/modules/core/venue";
import type { Tx } from "@/modules/core/types";
import { dayKey, fa, faNum, jDate } from "@/modules/core/format";
import { PageHead } from "@/modules/panel/PanelShell";
import { toast } from "@/modules/ui/Toast";

/** Today's date key (yyyy-MM-dd, local time). */
export const todayKey = () => dayKey(new Date());

/** Toman amount as "۱۲٫۳ میلیون" (one decimal). */
export const millions = (toman: number) => `${fa(Math.round(toman / 1e5) / 10)} میلیون`;

/** Placeholder page for features planned for a later phase. */
export function ComingSoon({ title, lines }: { title: string; lines: string[] }) {
  return (
    <>
      <PageHead title={title} />
      <div className="card soonbox">
        <span className="pill ball">فاز بعد</span>
        {lines.map((line) => <p key={line} className="muted">{line}</p>)}
      </div>
    </>
  );
}

/** One KPI tile: label, value and optional detail line. */
export type Kpi = [label: string, value: string, detail?: string];

/** Row of KPI tiles at the top of a dashboard or report. */
export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid kpis">
      {items.map(([label, value, detail]) => (
        <div className="card kpi" key={label}>
          <span className="small muted">{label}</span>
          <span className="v">{value}</span>
          {detail && <span className="d muted">{detail}</span>}
        </div>
      ))}
    </div>
  );
}

/** Today's booking count, occupancy and revenue across all courts. */
export function useTodayStats() {
  const today = todayKey();
  const { data: bookings = [] } = useQuery({ queryKey: ["board", today], queryFn: () => getDayBoard(today) });
  const totalSlots = COURTS.length * HOURS.length;
  return {
    booked: bookings.length,
    occupancy: Math.round((bookings.length / totalSlots) * 100),
    totalSlots,
    revenue: bookings.reduce((sum, b) => sum + b.price, 0),
  };
}

const TX_TYPE: Record<Tx["type"], [label: string, pill: string]> = {
  charge: ["شارژ", "green"],
  pay: ["پرداخت", "red"],
  refund: ["بازگشت وجه", "info"],
};

/** Wallet transactions table; `showUser` adds a column with the account holder. */
export function TransactionTable({ rows, showUser }: { rows: Tx[]; showUser?: boolean }) {
  const userName = (phone: string) => (USERS[phone] ? `${USERS[phone].first} ${USERS[phone].last}` : fa(phone));
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>تاریخ</th>
            {showUser && <th>کاربر</th>}
            <th>نوع</th>
            <th>شرح</th>
            <th>روش</th>
            <th>ثبت توسط</th>
            <th>مبلغ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <tr key={tx.id}>
              <td>{jDate(tx.date)}</td>
              {showUser && <td>{userName(tx.phone)}</td>}
              <td><span className={`pill ${TX_TYPE[tx.type][1]}`}>{TX_TYPE[tx.type][0]}</span></td>
              <td>{tx.desc}</td>
              <td>{tx.method}</td>
              <td>{tx.actor}</td>
              <td className={tx.amount > 0 ? "pos" : "neg"} style={{ direction: "ltr", textAlign: "right" }}>{faNum(tx.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TICKET_STATUS = {
  open: ["باز", "warn"],
  answered: ["پاسخ داده شد", "green"],
  escalated: ["ارجاع به ادمین", "red"],
  closed: ["بسته", ""],
} as const;

/** Ticket list with a reply pane; front desk can escalate to admin. */
export function TicketsView() {
  const role = useSession((s) => s.role);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ticket = TICKETS.find((t) => t.id === selectedId);
  const authorClass = { user: "u", admin: "a", staff: "s" } as const;

  return (
    <>
      <PageHead title="تیکت‌ها" sub={role === "player" ? "پیام به پذیرش مجموعه" : "درخواست‌ها و پیام‌های کاربران"} />
      <div className="grid cols2">
        <div className="card list">
          {TICKETS.map((t) => (
            <button
              key={t.id}
              className="li"
              style={{ background: "none", border: 0, borderBottom: "1px solid var(--line)", textAlign: "right", cursor: "pointer" }}
              onClick={() => setSelectedId(t.id)}
            >
              <span><b>{t.title}</b><br /><span className="xs muted">{t.id} · {jDate(t.date)}</span></span>
              <span className={`pill ${TICKET_STATUS[t.status][1]}`}>{TICKET_STATUS[t.status][0]}</span>
            </button>
          ))}
        </div>
        <div className="card stack">
          {!ticket && <p className="muted">یک تیکت را انتخاب کنید.</p>}
          {ticket && (
            <>
              <h3>{ticket.title}</h3>
              <div className="stack" style={{ gap: 4 }}>
                {ticket.messages.map((m, i) => <div key={i} className={`msg ${authorClass[m.by]}`}>{m.text}</div>)}
              </div>
              <textarea className="input" rows={3} placeholder="پاسخ خود را بنویسید" />
              <div className="row">
                <button className="btn" onClick={() => toast("پاسخ ارسال شد")}>ارسال</button>
                {role === "secretary" && <button className="btn ghost" onClick={() => toast("به ادمین ارجاع شد")}>ارجاع به ادمین</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** Full notification list; unread items get a "new" pill. */
export function NotificationsView() {
  return (
    <>
      <PageHead title="اعلان‌ها" />
      <div className="card list">
        {NOTIFS.map((n) => (
          <div className="li" key={n.id}>
            <span><b>{n.title}</b><br /><span className="small muted">{n.text}</span></span>
            {!n.read && <span className="pill red">جدید</span>}
          </div>
        ))}
      </div>
    </>
  );
}
