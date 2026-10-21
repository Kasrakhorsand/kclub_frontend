"use client";
/** Panel data: today's numbers, the day board and a player's bookings. */
import { useQuery } from "@tanstack/react-query";
import { getDayBoard, getMyBookings } from "@/engine/api";
import { addDays, dayKey, jDate } from "@/engine/format";
import { useSession } from "@/engine/store";
import { CLOSE_HOUR, COURTS, HOURS, OPEN_HOUR, courtById } from "@/engine/venue";
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


/** Query key for the signed-in player's bookings, so cancelling can refresh them. */
export const myBookingsKey = (scope: "upcoming" | "past") => ["my-bookings", scope];

/** Signed-in player's upcoming bookings, soonest first. */
export function useMyBookings(limit = 8) {
  const user = useSession((s) => s.user);
  const { data = [] } = useQuery({ queryKey: myBookingsKey("upcoming"), queryFn: () => getMyBookings("upcoming"), enabled: !!user });
  return data.slice(0, limit);
}

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
  const played = usePastBookings(30);
  if (!user) return { upcoming: [], next: null, played30: 0, thisMonth: 0, favoriteSport: null, favoriteCourt: null };

  const today = todayKey();
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

/** Signed-in player's played games in the last `days` days, newest first. */
export function usePastBookings(days = 30) {
  const user = useSession((s) => s.user);
  const { data = [] } = useQuery({ queryKey: myBookingsKey("past"), queryFn: () => getMyBookings("past"), enabled: !!user });
  const from = dayKey(addDays(new Date(), -days));
  return data.filter((b) => b.date >= from);
}
