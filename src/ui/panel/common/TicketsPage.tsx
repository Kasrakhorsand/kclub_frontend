"use client";
/** Tickets — every role. Players message the front desk; staff answer and can escalate to admin. */
import { useState } from "react";
import { jDate } from "@/engine/format";
import { TICKETS } from "@/engine/mock";
import { useSession } from "@/engine/store";
import { toast } from "@/ui/kit/Toast";
import { PageHead } from "@/ui/panel/shell/PageHead";

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
