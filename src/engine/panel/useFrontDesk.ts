"use client";
/**
 * Front desk "today" view: what is on every court now and next, who arrives
 * in the next two hours (with check-in), which slots are still free for
 * walk-ins, today's numbers, and tickets waiting for an answer.
 * All data comes from the day board and tickets APIs; the clock ticks every 30 s.
 */
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { checkInBooking, getTickets } from "@/engine/api";
import { todayKey, useDayBoard } from "@/engine/panel/stats";
import { COURTS, HOURS, OPEN_HOUR, CLOSE_HOUR } from "@/engine/venue";
import type { Booking, Court } from "@/engine/types";

export type CourtNow = {
  court: Court;
  /** Booking playing right now, if any. */
  current?: Booking;
  /** Minutes until the current session ends (or until the next hour if free). */
  minutesLeft: number;
  /** Booking in the next hour, if any. */
  next?: Booking;
};

export type FreeSlot = { hour: number; courts: Court[] };

/** Current time, re-read every 30 seconds so the "now" line and countdowns move. */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function useFrontDesk() {
  const now = useClock();
  const today = todayKey();
  const client = useQueryClient();
  const { data: bookings = [], isLoading } = useDayBoard(today);
  const { data: tickets = [] } = useQuery({ queryKey: ["tickets", "desk"], queryFn: () => getTickets("secretary"), refetchInterval: 60_000 });
  const [busyId, setBusyId] = useState<string | null>(null);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const courts = COURTS.filter((c) => c.active);
  const at = (courtId: string, h: number) => bookings.find((b) => b.courtId === courtId && b.hour === h && b.status === "active");

  const board: CourtNow[] = courts.map((court) => ({
    court,
    current: at(court.id, hour),
    minutesLeft: 60 - minute,
    next: at(court.id, hour + 1),
  }));

  // People arriving: this hour (not yet checked in) and the next two hours.
  const arrivals = bookings
    .filter((b) => b.status === "active" && b.hour >= hour && b.hour <= hour + 2 && !(b.hour === hour && b.checkedIn))
    .sort((a, b) => a.hour - b.hour || a.courtId.localeCompare(b.courtId));

  // Free court-hours for walk-ins over the next four opening hours (this hour counts while 15+ minutes remain).
  const firstHour = minute <= 45 ? hour : hour + 1;
  const freeSoon: FreeSlot[] = HOURS.filter((h) => h >= firstHour && h < firstHour + 4)
    .map((h) => ({ hour: h, courts: courts.filter((c) => !at(c.id, h)) }))
    .filter((s) => s.courts.length);

  const active = bookings.filter((b) => b.status === "active");
  const totalSlots = courts.length * HOURS.length;
  const playedHours = HOURS.filter((h) => h < hour).length * courts.length;

  /** Position of "now" across the opening hours, 0–1 (clamped). */
  const dayProgress = Math.min(1, Math.max(0, (hour + minute / 60 - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR)));

  return {
    loading: isLoading,
    now,
    hour,
    minute,
    courts,
    bookings: active,
    board,
    arrivals,
    freeSoon,
    dayProgress,
    stats: {
      booked: active.length,
      totalSlots,
      occupancy: totalSlots ? Math.round((active.length / totalSlots) * 100) : 0,
      revenue: active.reduce((sum, b) => sum + b.price, 0),
      online: active.filter((b) => b.source === "online").length,
      checkedIn: active.filter((b) => b.checkedIn).length,
      /** Court-hours already gone today, to read occupancy against. */
      playedHours,
    },
    openTickets: tickets.filter((t) => t.status === "open"),
    busyId,
    /** Mark that the player arrived (keys or rackets handed over). */
    checkIn: async (booking: Booking) => {
      setBusyId(booking.id);
      try {
        await checkInBooking(booking.id);
        await client.invalidateQueries({ queryKey: ["board", today] });
      } finally {
        setBusyId(null);
      }
    },
  };
}
