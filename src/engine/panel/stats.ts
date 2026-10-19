"use client";
/** Panel data: today's numbers, the day board, a player's bookings and revenue series. */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDayBoard } from "@/engine/api";
import { addDays, dayKey, jDate, jDay } from "@/engine/format";
import { seedBookings } from "@/engine/mock";
import { useSession } from "@/engine/store";
import { CLOSE_HOUR, COURTS, HOURS, OPEN_HOUR, SPORTS, courtById } from "@/engine/venue";
import type { Booking } from "@/engine/types";

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

/**
 * Sample data only: the seed gives one name several games a day, so keep at
 * most one game per day and only every third day to look like a real player.
 * Remove once bookings come from the API.
 */
function asPlayerHistory(bookings: Booking[], first: string, last: string) {
  const fullName = `${first} ${last}`;
  const seen = new Set<string>();
  return bookings.filter((b) => {
    if (!(b.userName === fullName || b.userName.startsWith(first))) return false;
    if (Number(b.date.slice(8)) % 3 !== 0 || seen.has(b.date)) return false;
    seen.add(b.date);
    return true;
  });
}

/** Signed-in player's upcoming bookings (sample data until the API is connected). */
export function useMyBookings(limit = 8) {
  const user = useSession((s) => s.user);
  const all = useMemo(() => seedBookings(), []);
  if (!user) return [];
  return asPlayerHistory(all, user.first, user.last).slice(0, limit);
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

/** What a player's dashboard shows: next game, recent activity and habits. */
export type PlayerSummary = {
  upcoming: Booking[];
  next: Booking | null;
  /** Sessions played in the last 30 days. */
  played30: number;
  /** Sessions in the current Jalali month (played and upcoming). */
  thisMonth: number;
  /** Most-played sport id in the last 30 days. */
  favoriteSport: string | null;
  /** Most-played court id in the last 30 days. */
  favoriteCourt: string | null;
};

/** Signed-in player's dashboard numbers (sample data until the API is connected). */
export function usePlayerSummary(): PlayerSummary {
  const user = useSession((s) => s.user);
  const upcoming = useMyBookings();
  // seedBookings covers 14 days per call; three windows cover the last 30 days.
  const past = useMemo(() => [-30, -16, -2].flatMap((d) => seedBookings(addDays(new Date(), d))), []);
  if (!user) return { upcoming: [], next: null, played30: 0, thisMonth: 0, favoriteSport: null, favoriteCourt: null };

  const today = todayKey();
  const played = asPlayerHistory(past, user.first, user.last).filter((b) => b.date < today && b.date >= dayKey(addDays(new Date(), -30)));
  const jalaliMonth = (date: string) => jDate(date).slice(0, 7); // "۱۴۰۵/۰۷"
  const mostCommon = (keys: string[]) => {
    const counts = new Map<string, number>();
    keys.forEach((k) => counts.set(k, (counts.get(k) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  return {
    upcoming,
    next: upcoming[0] ?? null,
    played30: played.length,
    thisMonth: [...played, ...upcoming].filter((b) => jalaliMonth(b.date) === jalaliMonth(today)).length,
    favoriteSport: mostCommon(played.map((b) => courtById(b.courtId)?.sport ?? "")),
    favoriteCourt: mostCommon(played.map((b) => b.courtId)),
  };
}

/** Signed-in player's played games in the last `days` days, newest first (sample data until the API is connected). */
export function usePastBookings(days = 30) {
  const user = useSession((s) => s.user);
  const past = useMemo(() => [-30, -16, -2].flatMap((d) => seedBookings(addDays(new Date(), d))), []);
  if (!user) return [];
  const today = todayKey();
  const from = dayKey(addDays(new Date(), -days));
  return asPlayerHistory(past, user.first, user.last)
    .filter((b) => b.date < today && b.date >= from)
    .sort((a, b) => b.date.localeCompare(a.date) || b.hour - a.hour);
}
