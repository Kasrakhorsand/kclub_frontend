"use client";
/** Admin audit log: who changed what, with period, action and text filters, grouped by day. */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuditLog } from "@/engine/api";
import { addDays, dayKey } from "@/engine/format";
import type { Audit } from "@/engine/types";

export const AUDIT_PERIODS = [7, 30, 90] as const;

export function useAuditLog() {
  const [days, setDays] = useState<(typeof AUDIT_PERIODS)[number]>(30);
  const [action, setAction] = useState("all");
  const [q, setQ] = useState("");
  const from = dayKey(addDays(new Date(), -(days - 1)));
  const { data: all = [], isLoading } = useQuery({ queryKey: ["admin-audit", from], queryFn: () => getAuditLog(from) });

  const actions = [...new Set(all.map((a) => a.action))];
  const needle = q.trim();
  const rows = all.filter((a) => (action === "all" || a.action === action) && (!needle || [a.actor, a.target, a.detail].some((t) => t.includes(needle))));
  const groups: { date: string; items: Audit[] }[] = [];
  for (const a of rows) {
    const last = groups[groups.length - 1];
    if (last?.date === a.date) last.items.push(a);
    else groups.push({ date: a.date, items: [a] });
  }
  return { days, setDays, action, setAction, actions, q, setQ, loading: isLoading, count: rows.length, groups };
}
