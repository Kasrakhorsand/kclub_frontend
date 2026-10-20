"use client";
/**
 * Tickets — every role (/panel/tickets). Inbox on one side with a status
 * filter, the conversation as chat bubbles on the other, a reply box, and a
 * new-ticket form for players. Front desk can escalate; staff can close.
 * Styles: common.css ("tc-").
 */
import clsx from "clsx";
import { fa, jDate, jFull } from "@/engine/format";
import { TEXT_MAX, TICKET_CATEGORIES, TITLE_MAX, useTickets, type TicketFilter } from "@/engine/tickets/useTickets";
import type { Ticket, TicketMessage, TicketStatus } from "@/engine/types";
import { Button3D } from "@/ui/kit/Buttons";
import { Icon3D } from "@/ui/kit/Icon3D";
import { PageHead } from "@/ui/panel/shell/PageHead";

const STATUS: Record<TicketStatus, { label: string; tone: string }> = {
  open: { label: "در انتظار پاسخ", tone: "warn" },
  answered: { label: "پاسخ داده شد", tone: "ok" },
  escalated: { label: "ارجاع به مدیریت", tone: "hot" },
  closed: { label: "بسته", tone: "off" },
};

const FILTERS: { id: TicketFilter; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "open", label: "در انتظار" },
  { id: "answered", label: "پاسخ‌داده" },
  { id: "escalated", label: "ارجاعی" },
  { id: "closed", label: "بسته" },
];

const AUTHOR_LABEL: Record<TicketMessage["by"], string> = { user: "کاربر", staff: "پذیرش", admin: "مدیریت" };

const categoryLabel = (t: Ticket) => TICKET_CATEGORIES.find((c) => c.id === t.category)?.label;

export function TicketsView() {
  const t = useTickets();
  const isPlayer = t.role === "player";
  /** In the conversation, "mine" sits on the start side: the player's own messages, or staff messages for staff. */
  const mine = (m: TicketMessage) => (isPlayer ? m.by === "user" : m.by !== "user");

  return (
    <div className="tc">
      <PageHead
        title="تیکت‌ها"
        sub={isPlayer ? "پیام به پذیرش مجموعه؛ معمولاً در چند ساعت پاسخ می‌دهیم" : "درخواست‌ها و پیام‌های کاربران"}
        action={t.canCreate ? <Button3D size="sm" onClick={t.startCompose}>تیکت جدید</Button3D> : undefined}
      />

      <div className={clsx("tc-layout", (t.selected || t.composing) && "has-open")}>
        <aside className="tc-inbox" aria-label="فهرست تیکت‌ها">
          <div className="tc-filters" role="tablist">
            {FILTERS.map((f) => (
              <button key={f.id} role="tab" aria-selected={t.filter === f.id} className={clsx(t.filter === f.id && "on")} onClick={() => t.setFilter(f.id)}>
                {f.label}
                {f.id !== "all" && t.counts[f.id] > 0 && <i>{fa(t.counts[f.id])}</i>}
              </button>
            ))}
          </div>
          {t.loading && <p className="muted small">در حال بارگذاری…</p>}
          {!t.loading && !t.tickets.length && <p className="tc-none muted small">تیکتی در این دسته نیست.</p>}
          <ul>
            {t.tickets.map((ticket) => {
              const last = ticket.messages[ticket.messages.length - 1];
              return (
                <li key={ticket.id}>
                  <button type="button" className={clsx("tc-row", t.selected?.id === ticket.id && "on")} onClick={() => t.select(ticket.id)}>
                    <span className="tc-row-top">
                      <b>{ticket.title}</b>
                      <span className={clsx("tc-status", STATUS[ticket.status].tone)}>{STATUS[ticket.status].label}</span>
                    </span>
                    <span className="tc-row-last">{last ? `${AUTHOR_LABEL[last.by]}: ${last.text}` : ""}</span>
                    <small>{fa(ticket.id)} · {jDate(ticket.date)}{categoryLabel(ticket) ? ` · ${categoryLabel(ticket)}` : ""}</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="tc-pane">
          {t.composing ? (
            <form
              className="tc-new"
              onSubmit={(e) => {
                e.preventDefault();
                t.submitDraft();
              }}
            >
              <header className="tc-pane-head">
                <button type="button" className="tc-back" onClick={t.cancelCompose} aria-label="بازگشت">→</button>
                <h3>تیکت جدید</h3>
              </header>
              <label className="f">
                موضوع
                <input className="input" maxLength={TITLE_MAX} value={t.draft.title} onChange={(e) => t.setDraft({ title: e.target.value })} placeholder="مثلاً مشکل در پرداخت رزرو" />
              </label>
              <div className="tc-cats" role="radiogroup" aria-label="دسته">
                {TICKET_CATEGORIES.map((c) => (
                  <button key={c.id} type="button" role="radio" aria-checked={t.draft.category === c.id} className={clsx(t.draft.category === c.id && "on")} onClick={() => t.setDraft({ category: c.id })}>
                    {c.label}
                  </button>
                ))}
              </div>
              <label className="f">
                پیام
                <textarea className="input" rows={5} maxLength={TEXT_MAX} value={t.draft.text} onChange={(e) => t.setDraft({ text: e.target.value })} placeholder="جزئیات را بنویسید؛ اگر درباره‌ی رزرو است، تاریخ و ساعت را هم بگویید." />
              </label>
              {t.error && <p className="small" role="alert" style={{ color: "var(--busy)" }}>{t.error}</p>}
              <div className="tc-actions">
                <button type="button" className="btn ghost" onClick={t.cancelCompose}>انصراف</button>
                <Button3D type="submit" disabled={t.busy}>{t.busy ? "در حال ارسال…" : "ارسال تیکت"}</Button3D>
              </div>
            </form>
          ) : t.selected ? (
            <>
              <header className="tc-pane-head">
                <button type="button" className="tc-back" onClick={() => t.select(null)} aria-label="بازگشت به فهرست">→</button>
                <div>
                  <h3>{t.selected.title}</h3>
                  <small>{fa(t.selected.id)} · {jFull(t.selected.date)}{categoryLabel(t.selected) ? ` · ${categoryLabel(t.selected)}` : ""}</small>
                </div>
                <span className={clsx("tc-status", STATUS[t.selected.status].tone)}>{STATUS[t.selected.status].label}</span>
              </header>

              <ol className="tc-thread">
                {t.selected.messages.map((m, i) => (
                  <li key={i} className={clsx("tc-msg", mine(m) ? "mine" : "theirs", m.by)}>
                    <span className="tc-who">{AUTHOR_LABEL[m.by]}</span>
                    <p>{m.text}</p>
                    {m.time && <small>{fa(m.time)}{m.date && m.date !== t.selected!.date ? ` · ${jDate(m.date)}` : ""}</small>}
                  </li>
                ))}
              </ol>

              {t.selected.status === "closed" && <p className="tc-closed">این تیکت بسته شده است؛ با ارسال پیام دوباره باز می‌شود.</p>}

              <form
                className="tc-reply"
                onSubmit={(e) => {
                  e.preventDefault();
                  t.sendReply();
                }}
              >
                <textarea className="input" rows={2} maxLength={TEXT_MAX} value={t.reply} onChange={(e) => t.setReply(e.target.value)} placeholder={isPlayer ? "پیام خود را بنویسید" : "پاسخ به کاربر"} aria-label="متن پاسخ" />
                <div className="tc-actions">
                  {t.canEscalate && t.selected.status !== "escalated" && <button type="button" className="btn ghost sm" onClick={t.escalate} disabled={t.busy}>ارجاع به مدیریت</button>}
                  {t.canClose && t.selected.status !== "closed" && <button type="button" className="btn ghost sm" onClick={t.close} disabled={t.busy}>بستن تیکت</button>}
                  <Button3D type="submit" size="sm" disabled={t.busy || !t.reply.trim()}>ارسال</Button3D>
                </div>
                {t.error && <p className="small" role="alert" style={{ color: "var(--busy)" }}>{t.error}</p>}
              </form>
            </>
          ) : (
            <div className="tc-placeholder">
              <Icon3D name="ticket" />
              <h3>یک تیکت را انتخاب کنید</h3>
              {t.canCreate && <p className="muted small">یا برای سؤال تازه «تیکت جدید» بزنید.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
