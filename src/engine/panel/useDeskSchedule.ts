"use client";
/**
 * Front desk schedule: any day's court × hour board, per-day occupancy for
 * the day strip, and the opened booking with check-in and cancel.
 */
import { useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { checkInBooking, deskCancelBooking, getDayBoard, isPast } from "@/engine/api";
import { addDays, dayKey } from "@/engine/format";
import { useDayBoard } from "@/engine/panel/stats";
import { HOURS, courtById } from "@/engine/venue";
import { refundPercentFor } from "@/engine/siteFacts";
import { useRules } from "@/engine/content/useSiteContent";
import { useActiveCourts } from "@/engine/useCourts";
import type { Booking } from "@/engine/types";

const STRIP_DAYS = 14;

export function useDeskSchedule() {
  const client = useQueryClient();
  const today = dayKey(new Date());
  const [date, setDate] = useState(today);
  const courts = useActiveCourts();
  const rules = useRules();
  const { data: bookings = [], isLoading } = useDayBoard(date);

  const days = Array.from({ length: STRIP_DAYS }, (_, i) => dayKey(addDays(new Date(), i)));
  const boards = useQueries({ queries: days.map((d) => ({ queryKey: ["board", d], queryFn: () => getDayBoard(d), staleTime: 60_000 })) });
  const capacity = courts.length * HOURS.length;
  const strip = days.map((d, i) => {
    const n = boards[i].data?.length;
    return { date: d, booked: n, occupancy: n === undefined ? undefined : Math.round((n / capacity) * 100) };
  });

  const cell = (courtId: string, hour: number) => bookings.find((b) => b.courtId === courtId && b.hour === hour && b.status === "active");

  /* ----- opened booking ----- */
  const [openId, setOpenId] = useState<string | null>(null);
  const opened: Booking | null = bookings.find((b) => b.id === openId) ?? null;
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [fullRefund, setFullRefund] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = () => {
    client.invalidateQueries({ queryKey: ["board"] });
    client.invalidateQueries({ queryKey: ["desk-customer-detail"] });
  };
  const act = async (task: () => Promise<string | void>) => {
    setBusy(true);
    setError("");
    try {
      const msg = await task();
      if (msg) setNotice(msg);
      refresh();
    } catch (ex) {
      setError((ex as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    today, date, days, strip, courts, hours: HOURS, loading: isLoading, bookings, cell,
    setDate: (d: string) => {
      setDate(d);
      setOpenId(null);
    },
    isPast: (h: number) => isPast(date, h),
    stats: {
      booked: bookings.length,
      occupancy: capacity ? Math.round((bookings.length / capacity) * 100) : 0,
      revenue: bookings.reduce((a, b) => a + b.price, 0),
      walkIns: bookings.filter((b) => b.source === "staff").length,
    },

    opened,
    openedCourt: opened ? courtById(opened.courtId) : undefined,
    /** Refund % under the normal rules for the opened booking. */
    rulePercent: opened ? refundPercentFor(rules, opened.date, opened.hour) : 0,
    open: (b: Booking | null) => {
      setOpenId(b?.id ?? null);
      setCancelling(false);
      setReason("");
      setFullRefund(false);
      setError("");
      setNotice("");
    },
    busy, error, notice,
    checkIn: () => act(async () => { if (opened) { await checkInBooking(opened.id); return "ورود ثبت شد"; } }),
    cancelling, startCancel: () => setCancelling(true), stopCancel: () => setCancelling(false),
    reason, setReason, fullRefund, setFullRefund,
    confirmCancel: () =>
      act(async () => {
        if (!opened) return;
        if (reason.trim().length < 3) throw new Error("دلیل لغو را بنویسید");
        const { refundAmount } = await deskCancelBooking(opened.id, reason.trim().slice(0, 120), fullRefund);
        setOpenId(null);
        return refundAmount ? `رزرو لغو شد و ${refundAmount.toLocaleString("fa-IR")} تومان به کیف پول برگشت` : "رزرو لغو شد";
      }),
  };
}
