"use client";
/**
 * Front desk cash drawer for a day: money taken and paid back by method,
 * the cash that should be in the drawer, and closing the day by entering the
 * counted cash (the difference is recorded for the manager).
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { closeCashDrawer, getCashReport } from "@/engine/api";
import { addDays, dayKey, toLatinDigits } from "@/engine/format";

export function useCashDrawer() {
  const client = useQueryClient();
  const today = dayKey(new Date());
  const [date, setDate] = useState(today);
  const { data: report, isLoading } = useQuery({ queryKey: ["cash", date], queryFn: () => getCashReport(date), refetchInterval: 60_000 });

  const [countedText, setCountedText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const counted = countedText.trim() === "" ? null : Number(toLatinDigits(countedText).replace(/\D/g, "")) || 0;
  const difference = counted === null || !report ? null : counted - report.expectedCash;

  return {
    today, date, loading: isLoading, report,
    /** Today and the six days before, for the day switcher. */
    days: Array.from({ length: 7 }, (_, i) => dayKey(addDays(new Date(), -i))),
    setDate: (d: string) => {
      setDate(d);
      setCountedText("");
      setError("");
    },
    countedText, setCountedText, counted, difference, note, setNote,
    busy, error,
    /** A big difference needs an explanation before closing. */
    needsNote: difference !== null && Math.abs(difference) >= 100_000 && note.trim().length < 5,
    close: async () => {
      if (counted === null) return setError("مبلغ شمرده‌شده را وارد کنید");
      if (difference !== null && Math.abs(difference) >= 100_000 && note.trim().length < 5) return setError("برای اختلاف بیش از ۱۰۰ هزار تومان توضیح بنویسید");
      setBusy(true);
      setError("");
      try {
        await closeCashDrawer(date, counted, note.trim().slice(0, 200) || undefined);
        await client.invalidateQueries({ queryKey: ["cash", date] });
      } catch (ex) {
        setError((ex as Error).message);
      } finally {
        setBusy(false);
      }
    },
  };
}
