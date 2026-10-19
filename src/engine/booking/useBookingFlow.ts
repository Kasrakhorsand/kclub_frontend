"use client";
/**
 * Booking flow state for one sport: chosen day, hour and weekly repeat,
 * the day's slots and courts, and adding/removing court-hours in the cart.
 * Returns plain data and actions; the UI decides how it looks.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { freeCountSync, getCourts, getSlots, isPast, takenSync } from "@/engine/api";
import { addDays, dayKey } from "@/engine/format";
import { MAX_DAYS_AHEAD, courtsOf, gameOf, priceOf, sportById } from "@/engine/venue";
import { useSession } from "@/engine/store";
import type { Court, CourtState, Sport } from "@/engine/types";

/** Weekly repeat choices offered to the player. */
export const REPEAT_WEEKS = [1, 2, 4, 8, 12];

/** Same weekday `weeks` weeks after `date`. */
const plusWeeks = (date: string, weeks: number) => dayKey(addDays(new Date(`${date}T00:00:00`), weeks * 7));

/** One day in the booking window with how many sessions are still free. */
export type DayAvailability = { date: string; free: number; inCart: boolean };

/** What happened when a court was picked: how many weeks were added or removed. */
export type PickResult = { action: "added" | "removed"; count: number; requested: number };

type Options = {
  /** Game id for shared courts (e.g. "tennis" on beach courts). */
  game?: string | null;
  /** Preselected day (yyyy-MM-dd) and hour, e.g. from a home-page link. */
  date?: string | null;
  hour?: number | null;
};

export function useBookingFlow(sport: Sport, { game, date: initialDate, hour: initialHour }: Options = {}) {
  const sportDef = sportById(sport);
  if (!sportDef) throw new Error(`Unknown sport "${sport}"`);
  const cart = useSession((s) => s.cart);
  const toggleCart = useSession((s) => s.toggleCart);

  const [date, setDate] = useState(() => initialDate ?? dayKey(new Date()));
  const [hour, setHour] = useState<number | null>(initialHour ?? null);
  const [weeks, setWeeks] = useState(1);

  const { data: slots = [] } = useQuery({ queryKey: ["slots", sport, date], queryFn: () => getSlots(sport, date) });
  const { data: courts = courtsOf(sport) } = useQuery({ queryKey: ["courts", sport], queryFn: () => getCourts(sport) });

  // A named game on shared courts, the sport's only game, or the sport itself.
  const title = game || sportDef.games.length === 1 ? gameOf(sportDef, game).name : sportDef.name;

  const days: DayAvailability[] = useMemo(
    () =>
      Array.from({ length: MAX_DAYS_AHEAD }, (_, i) => {
        const d = dayKey(addDays(new Date(), i));
        return { date: d, free: freeCountSync(sport, d), inCart: cart.some((item) => item.date === d) };
      }),
    [sport, cart],
  );

  const selectedSlot = slots.find((s) => s.hour === hour) ?? null;
  const inCart = (court: Court, d = date, h = hour) => cart.some((x) => x.date === d && x.hour === h && x.courtId === court.id);
  /** True if any court at this hour of the chosen day is in the cart. */
  const hourInCart = (h: number) => cart.some((item) => item.date === date && item.hour === h);

  const courtState = (court: Court): CourtState =>
    inCart(court) ? "sel" : selectedSlot?.freeCourts.includes(court.id) ? "free" : "taken";

  /** Toggle a court at the chosen hour, for every repeated week that is free and inside the booking window. */
  const pickCourt = (court: Court): PickResult | null => {
    if (hour === null) return null;
    const item = (d: string) => ({ date: d, hour, courtId: court.id, price: priceOf(sport, hour) });
    if (inCart(court)) {
      let removed = 0;
      for (let w = 0; w < weeks; w++) {
        const d = plusWeeks(date, w);
        if (inCart(court, d)) {
          toggleCart(item(d));
          removed++;
        }
      }
      return { action: "removed", count: removed, requested: weeks };
    }
    const lastDay = dayKey(addDays(new Date(), MAX_DAYS_AHEAD - 1));
    let added = 0;
    for (let w = 0; w < weeks; w++) {
      const d = plusWeeks(date, w);
      if (d > lastDay) break;
      if (isPast(d, hour) || takenSync(d, court.id, hour) || inCart(court, d)) continue;
      toggleCart(item(d));
      added++;
    }
    return { action: "added", count: added, requested: weeks };
  };

  return {
    sport: sportDef,
    title,
    days,
    date,
    /** Choose a day; clears the chosen hour. */
    selectDate: (d: string) => {
      setDate(d);
      setHour(null);
    },
    slots,
    hour,
    selectHour: setHour,
    selectedSlot,
    hourInCart,
    weeks,
    setWeeks,
    courts,
    courtState,
    pickCourt,
    priceAt: (court: Court) => (hour === null ? 0 : priceOf(court.sport, hour)),
  };
}
