"use client";
/**
 * Admin courts: turn courts on or off for online booking, and close courts
 * for a time range (maintenance, tournament) with a preview of the bookings
 * that will be cancelled and refunded.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClosure, deleteClosure, getAdminCourts, getClosures, previewClosure, setCourtActive } from "@/engine/api";
import { addDays, dayKey } from "@/engine/format";
import { CLOSE_HOUR, OPEN_HOUR } from "@/engine/venue";
import type { Booking } from "@/engine/types";

export function useCourtsAdmin() {
  const client = useQueryClient();
  const { data: courts = [], isLoading } = useQuery({ queryKey: ["admin-courts"], queryFn: getAdminCourts });
  const [busyId, setBusyId] = useState<string | null>(null);
  return {
    courts, loading: isLoading, busyId,
    toggle: async (id: string, active: boolean) => {
      setBusyId(id);
      try {
        await setCourtActive(id, active);
        for (const key of [["admin-courts"], ["courts"], ["slots"], ["availability"], ["admin-audit"]]) client.invalidateQueries({ queryKey: key });
      } finally {
        setBusyId(null);
      }
    },
  };
}

export function useClosures() {
  const client = useQueryClient();
  const today = dayKey(new Date());
  const { data: closures = [], isLoading } = useQuery({ queryKey: ["admin-closures"], queryFn: getClosures });

  const [courtIds, setCourtIds] = useState<string[]>([]);
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState(OPEN_HOUR);
  const [to, setTo] = useState(Math.min(OPEN_HOUR + 4, CLOSE_HOUR));
  const [reason, setReason] = useState("");
  const [fullRefund, setFullRefund] = useState(true);
  const [preview, setPreview] = useState<Booking[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const days = Array.from({ length: 60 }, (_, i) => dayKey(addDays(new Date(), i)));
  const changed = () => {
    setPreview(null);
    setError("");
    setDone("");
  };
  const problem = !courtIds.length ? "حداقل یک زمین را انتخاب کنید" : to <= from ? "ساعت پایان باید بعد از شروع باشد" : reason.trim().length < 3 ? "دلیل بستن را بنویسید" : "";

  return {
    closures, loading: isLoading, days,
    courtIds, toggleCourt: (id: string) => { setCourtIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id])); changed(); },
    date, setDate: (d: string) => { setDate(d); changed(); },
    from, setFrom: (h: number) => { setFrom(h); if (to <= h) setTo(Math.min(h + 1, CLOSE_HOUR)); changed(); },
    to, setTo: (h: number) => { setTo(h); changed(); },
    reason, setReason: (r: string) => { setReason(r); changed(); },
    fullRefund, setFullRefund,
    problem, busy, error, done, preview,
    /** First step: see which bookings would be cancelled. */
    check: async () => {
      if (problem) return setError(problem);
      setBusy(true);
      setError("");
      try {
        setPreview(await previewClosure({ courtIds, date, from, to }));
      } catch (ex) {
        setError((ex as Error).message);
      } finally {
        setBusy(false);
      }
    },
    /** Second step: close and cancel those bookings. */
    confirm: async () => {
      if (problem || !preview) return;
      setBusy(true);
      setError("");
      try {
        const c = await createClosure({ courtIds, date, from, to, reason: reason.trim().slice(0, 120), fullRefund });
        setDone(c.affected ? `زمین بسته شد؛ ${c.affected.toLocaleString("fa-IR")} رزرو لغو و به رزروکنندگان پیامک شد.` : "زمین بسته شد.");
        setPreview(null);
        setReason("");
        setCourtIds([]);
        for (const key of [["admin-closures"], ["board"], ["slots"], ["availability"], ["admin-audit"]]) client.invalidateQueries({ queryKey: key });
      } catch (ex) {
        setError((ex as Error).message);
      } finally {
        setBusy(false);
      }
    },
    reopen: async (id: string) => {
      await deleteClosure(id);
      client.invalidateQueries({ queryKey: ["admin-closures"] });
    },
  };
}
