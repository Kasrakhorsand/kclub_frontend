"use client";
/**
 * Front desk customers: search by name or phone, quick filters, the opened
 * customer's bookings and wallet, and wallet top-up / pay-back at the desk.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deskWalletOp, getCustomerDetail, getCustomers } from "@/engine/api";
import { toLatinDigits } from "@/engine/format";
import type { CustomerFilter, DeskMethod } from "@/engine/types";

export const CUSTOMER_FILTERS: { id: CustomerFilter; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "upcoming", label: "رزرو پیش رو" },
  { id: "vip", label: "VIP" },
  { id: "inactive", label: "بدون رزرو" },
];

/** Desk wallet amounts: at least 10,000 and at most 50 million toman. */
export const DESK_AMOUNT_MIN = 10_000;
export const DESK_AMOUNT_MAX = 50_000_000;

/** Typed text after a short pause, so the list isn't refetched on every key. */
function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useCustomers(initialPhone?: string | null) {
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const query = useDebounced(q.slice(0, 40));
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["desk-customers", query, filter], queryFn: () => getCustomers(query, filter) });

  const [phone, setPhone] = useState<string | null>(initialPhone && /^09\d{9}$/.test(initialPhone) ? initialPhone : null);
  const { data: detail, isLoading: detailLoading } = useQuery({ queryKey: ["desk-customer-detail", phone], queryFn: () => getCustomerDetail(phone!), enabled: !!phone });

  /* ----- wallet at the desk ----- */
  const [opKind, setOpKind] = useState<"charge" | "refund">("charge");
  const [amountText, setAmountText] = useState("");
  const [method, setMethod] = useState<DeskMethod>("pos");
  const [opNote, setOpNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const amount = Number(toLatinDigits(amountText).replace(/\D/g, "")) || 0;

  const walletOp = async () => {
    if (!phone || busy) return;
    if (amount < DESK_AMOUNT_MIN || amount > DESK_AMOUNT_MAX) return setError("مبلغ باید بین ۱۰ هزار و ۵۰ میلیون تومان باشد");
    if (opKind === "refund" && detail && amount > detail.customer.wallet) return setError("مبلغ بیشتر از موجودی کیف پول است");
    setBusy(true);
    setError("");
    setDone("");
    try {
      await deskWalletOp(phone, opKind, amount, method, opNote.trim().slice(0, 120) || undefined);
      setAmountText("");
      setOpNote("");
      setDone(opKind === "charge" ? "کیف پول شارژ شد" : "مبلغ برگشت داده شد");
      for (const key of [["desk-customer-detail"], ["desk-customers"], ["desk-transactions"], ["cash"], ["wallet"]]) client.invalidateQueries({ queryKey: key });
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    q, setQ, filter, setFilter, rows, loading: isLoading,
    phone,
    open: (p: string | null) => {
      setPhone(p);
      setError("");
      setDone("");
      setAmountText("");
    },
    detail: phone ? detail : undefined,
    detailLoading: !!phone && detailLoading,
    opKind, setOpKind: (k: "charge" | "refund") => { setOpKind(k); setError(""); setDone(""); },
    amountText, setAmountText: (t: string) => { setAmountText(t); setError(""); setDone(""); },
    amount, method, setMethod, opNote, setOpNote,
    busy, error, done, walletOp,
  };
}
