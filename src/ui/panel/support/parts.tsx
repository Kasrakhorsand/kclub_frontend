"use client";
/** Bits shared by the support panel pages: status labels for the team, small bar charts. */
import clsx from "clsx";
import { fa } from "@/engine/format";
import type { SupportSeverity, SupportStatus } from "@/engine/types";

/** Status as the support team says it (the user sees the wording in common/SupportPage). */
export const DESK_STATUS: Record<SupportStatus, { label: string; tone: string }> = {
  new: { label: "تازه", tone: "hot" },
  in_progress: { label: "در حال بررسی", tone: "warn" },
  need_info: { label: "منتظر کاربر", tone: "info" },
  resolved: { label: "حل شد", tone: "ok" },
  closed: { label: "بسته", tone: "off" },
};

export const SEVERITY_FA: Record<SupportSeverity, string> = { blocker: "متوقف‌کننده", major: "جدی", minor: "جزئی" };

export const StatusPill = ({ status }: { status: SupportStatus }) => <span className={clsx("tc-status", DESK_STATUS[status].tone)}>{DESK_STATUS[status].label}</span>;
export const SeverityPill = ({ severity }: { severity: SupportSeverity }) => <span className={clsx("sd-sev", severity)}>{SEVERITY_FA[severity]}</span>;

/** "۳ ساعت پیش" style age of a date + time. */
export function ago(date: string, time = "00:00", now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(`${date}T${time}:00`).getTime()) / 60_000));
  if (mins < 60) return `${fa(Math.max(1, mins))} دقیقه پیش`;
  if (mins < 1440) return `${fa(Math.round(mins / 60))} ساعت پیش`;
  return `${fa(Math.round(mins / 1440))} روز پیش`;
}

/** Minutes as "۴۵ دقیقه" / "۳ ساعت" / "۲ روز". */
export const duration = (mins: number) => (mins < 60 ? `${fa(mins)} دقیقه` : mins < 1440 ? `${fa(Math.round(mins / 6) / 10)} ساعت` : `${fa(Math.round(mins / 144) / 10)} روز`);

/** Horizontal bars for a few labelled counts. */
export function Bars({ rows, empty = "داده‌ای نیست." }: { rows: { label: string; value: number }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="muted small">{empty}</p>;
  return (
    <ul className="sd-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span>{r.label}</span>
          <i style={{ ["--w" as string]: `${(r.value / max) * 100}%` }} aria-hidden="true" />
          <b>{fa(r.value)}</b>
        </li>
      ))}
    </ul>
  );
}
