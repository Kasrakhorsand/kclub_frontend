"use client";
/** Panel data: today's numbers, the day board, a player's bookings and revenue series. */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDayBoard } from "@/engine/api";
import { addDays, dayKey, jDay } from "@/engine/format";
import { seedBookings } from "@/engine/mock";
import { useSession } from "@/engine/store";
import { CLOSE_HOUR, COURTS, HOURS, OPEN_HOUR, SPORTS, courtById } from "@/engine/venue";

/** Today's date key (yyyy-MM-dd, local time). */
export const todayKey = () => dayKey(new Date());

/** Next `count` day keys starting today. */
export const nextDays = (count: number) => Array.from({ length: count }, (_, i) => dayKey(addDays(new Date(), i)));

/** Active bookings on a day, refreshed every 20 seconds. */
export function useDayBoard(date: string) {
  return useQuery({ queryKey: ["board", date], queryFn: () => getDayBoard(date), refetchInterval: 20_000 });
}

/** Today's booking count, occupancy and revenue across all courts. */
export function useTodayStats() {
  const { data: bookings = [] } = useDayBoard(todayKey());
  const totalSlots = COURTS.length * HOURS.length;
  return {
    booked: bookings.length,
    occupancy: Math.round((bookings.length / totalSlots) * 100),
    totalSlots,
    revenue: bookings.reduce((sum, b) => sum + b.price, 0),
  };
}

/** Opening hours to show on the board: all, or `columns` hours starting one hour before now. */
export function visibleHours(around: boolean, nowHour = new Date().getHours(), columns = 7) {
  if (!around) return HOURS;
  const end = Math.min(CLOSE_HOUR, Math.max(OPEN_HOUR, Math.min(CLOSE_HOUR - 1, nowHour) - 1) + columns);
  const start = Math.max(OPEN_HOUR, end - columns);
  return HOURS.filter((h) => h >= start && h < end);
}

/** Signed-in player's upcoming bookings (sample data until the API is connected). */
export function useMyBookings(limit = 8) {
  const user = useSession((s) => s.user);
  const all = useMemo(() => seedBookings(), []);
  if (!user) return [];
  const fullName = `${user.first} ${user.last}`;
  return all.filter((b) => b.userName === fullName || b.userName.startsWith(user.first)).slice(0, limit);
}

/** One day of revenue: Jalali day label plus millions of toman per sport id. */
export type DayRevenue = { day: string } & Record<string, number | string>;

/** Daily revenue in millions of toman for the last `days` days, one key per sport. */
export function revenueSeries(days = 30): DayRevenue[] {
  const start = addDays(new Date(), -days + 1);
  // seedBookings covers two weeks from its start date, so stitch three windows together.
  const bookings = [0, 14, 28].flatMap((offset) => seedBookings(addDays(start, offset)));
  return Array.from({ length: days }, (_, i) => {
    const key = dayKey(addDays(start, i));
    const ofDay = bookings.filter((b) => b.date === key);
    const row: DayRevenue = { day: jDay(key) };
    for (const sport of SPORTS) {
      row[sport.id] = ofDay.filter((b) => courtById(b.courtId)?.sport === sport.id).reduce((a, b) => a + b.price, 0) / 1e6;
    }
    return row;
  });
}

/** Total of one sport, or of all sports, across a revenue series (millions of toman). */
export const revenueTotal = (series: DayRevenue[], sport?: string) =>
  series.reduce((sum, d) => sum + SPORTS.filter((s) => !sport || s.id === sport).reduce((a, s) => a + Number(d[s.id]), 0), 0);
