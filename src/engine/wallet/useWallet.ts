"use client";
/**
 * Player wallet: balance, transaction history with a type filter, this
 * month's totals, and top-up (preset or custom amount, then the bank gateway).
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTransactions, startTopUp } from "@/engine/api";
import { dayKey, jDate, toLatinDigits } from "@/engine/format";
import { useSession } from "@/engine/store";
import { redirectToPayment } from "@/engine/security";
import type { Tx } from "@/engine/types";

/** Quick top-up amounts in toman. */
export const TOPUP_PRESETS = [200_000, 500_000, 1_000_000, 2_000_000];
export const TOPUP_MIN = 50_000;
export const TOPUP_MAX = 50_000_000;

export type TxFilter = "all" | Tx["type"];

/** Transactions grouped by day, newest day first. */
export type TxDay = { date: string; items: Tx[] };

export function useWallet() {
  const user = useSession((s) => s.user);
  const phone = user?.phone ?? "";
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", phone],
    queryFn: () => getTransactions(),
    enabled: !!phone,
  });

  const [filter, setFilter] = useState<TxFilter>("all");
  const [amount, setAmount] = useState<number>(TOPUP_PRESETS[1]);
  const [customText, setCustomText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const shown = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);
  const days: TxDay[] = [];
  for (const tx of shown) {
    const last = days[days.length - 1];
    if (last?.date === tx.date) last.items.push(tx);
    else days.push({ date: tx.date, items: [tx] });
  }

  // Totals for the current Jalali month.
  const month = jDate(dayKey(new Date())).slice(0, 7);
  const inMonth = transactions.filter((t) => jDate(t.date).slice(0, 7) === month);
  const sum = (type: Tx["type"]) => inMonth.filter((t) => t.type === type).reduce((a, t) => a + Math.abs(t.amount), 0);

  /** Pick a preset; clears any custom amount. */
  const choosePreset = (value: number) => {
    setAmount(value);
    setCustomText("");
    setError("");
  };

  /** Type a custom amount (Persian or Latin digits, separators allowed). */
  const setCustom = (text: string) => {
    setCustomText(text);
    const value = Number(toLatinDigits(text).replace(/[^0-9]/g, ""));
    setAmount(value);
    setError("");
  };

  const amountValid = amount >= TOPUP_MIN && amount <= TOPUP_MAX;

  return {
    balance: user?.wallet ?? 0,
    holder: user ? `${user.first} ${user.last}` : "",
    phone,
    loading: isLoading,
    transactions,
    filter,
    setFilter,
    days,
    month: { charged: sum("charge"), spent: sum("pay"), refunded: sum("refund") },

    amount,
    customText,
    isPreset: !customText && TOPUP_PRESETS.includes(amount),
    choosePreset,
    setCustom,
    amountValid,
    busy,
    error,
    /** Validate and start the gateway top-up; resolves true when the redirect would happen. */
    topUp: async () => {
      if (!amountValid) {
        setError("مبلغ شارژ باید بین ۵۰ هزار و ۵۰ میلیون تومان باشد");
        return false;
      }
      setBusy(true);
      setError("");
      try {
        const { gatewayUrl } = await startTopUp(amount);
        // Only ever leave the site for an allowed bank gateway host.
        if (gatewayUrl && !redirectToPayment(gatewayUrl)) {
          setError("آدرس درگاه پرداخت معتبر نیست؛ با پشتیبانی تماس بگیرید.");
          return false;
        }
        return true;
      } catch {
        setError("اتصال به درگاه انجام نشد. دوباره تلاش کنید.");
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}
