"use client";
/** All wallet transactions for the front desk / admin: period, type and text filters, totals, grouped by day. */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllTransactions } from "@/engine/api";
import { addDays, dayKey, toLatinDigits } from "@/engine/format";
import type { Tx } from "@/engine/types";

export type TxPeriod = "today" | "7d" | "30d" | "90d";
export const TX_PERIODS: { id: TxPeriod; label: string; days: number }[] = [
  { id: "today", label: "امروز", days: 1 },
  { id: "7d", label: "۷ روز", days: 7 },
  { id: "30d", label: "۳۰ روز", days: 30 },
  { id: "90d", label: "۳ ماه", days: 90 },
];
export type TxKind = "all" | Tx["type"];

export function useDeskTransactions() {
  const [period, setPeriod] = useState<TxPeriod>("7d");
  const [kind, setKind] = useState<TxKind>("all");
  const [q, setQ] = useState("");
  const days = TX_PERIODS.find((p) => p.id === period)!.days;
  const to = dayKey(new Date());
  const from = dayKey(addDays(new Date(), -(days - 1)));
  const { data: all = [], isLoading } = useQuery({ queryKey: ["desk-transactions", from, to], queryFn: () => getAllTransactions(from, to) });

  const needle = toLatinDigits(q.trim());
  const rows = all.filter(
    (t) => (kind === "all" || t.type === kind) && (!needle || t.phone.includes(needle) || (t.userName ?? "").includes(q.trim()) || t.desc.includes(q.trim())),
  );
  const sum = (type: Tx["type"]) => rows.filter((t) => t.type === type).reduce((a, t) => a + Math.abs(t.amount), 0);
  const groups = useMemo(() => {
    const out: { date: string; items: Tx[]; net: number }[] = [];
    for (const t of rows) {
      const last = out[out.length - 1];
      if (last?.date === t.date) {
        last.items.push(t);
        last.net += t.amount;
      } else out.push({ date: t.date, items: [t], net: t.amount });
    }
    return out;
  }, [rows]);

  return {
    period, setPeriod, kind, setKind, q, setQ, loading: isLoading,
    count: rows.length, groups,
    totals: { charge: sum("charge"), pay: sum("pay"), refund: sum("refund") },
  };
}
