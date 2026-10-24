"use client";
/**
 * Helpers for busy booking moments, shared by every club site.
 *
 * useReleaseCountdown: when the next day opens for booking (the admin's
 * "release hour"), a live countdown, and a refresh of the day strip the
 * moment it opens, so players wait on the page instead of refreshing it.
 *
 * useBookingLimit: how many more sessions this player may hold, from the
 * admin's "max active bookings per player", their upcoming bookings and the
 * cart. The backend enforces the limit; this only warns early.
 */
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyBookings } from "@/engine/api";
import { usePublicRules } from "@/engine/content/useSiteContent";
import { addDays, dayKey } from "@/engine/format";
import { myBookingsKey } from "@/engine/panel/stats";
import { useSession } from "@/engine/store";

/** Show the "opens soon" banner this long before the release. */
const SOON_MS = 60 * 60_000;

const pad = (n: number) => String(n).padStart(2, "0");

export function useReleaseCountdown() {
  const { rules } = usePublicRules();
  const client = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const releaseHour = rules?.releaseHour ?? 0;
  const days = rules?.maxDaysAhead ?? 0;
  const today = new Date(now);
  const release = new Date(today.getFullYear(), today.getMonth(), today.getDate(), releaseHour, 0, 0, 0);
  if (release.getTime() <= now) release.setDate(release.getDate() + 1);
  const releaseAt = release.getTime();
  const msLeft = releaseAt - now;
  // At each release a new last day is added to the window.
  const opensDay = dayKey(addDays(release, Math.max(0, days - 1)));

  // The moment it opens, refresh what can be booked (once per release).
  useEffect(() => {
    if (!rules) return;
    if (msLeft <= 1000 && fired.current !== releaseAt) {
      fired.current = releaseAt;
      setTimeout(() => {
        client.invalidateQueries({ queryKey: ["availability"] });
        client.invalidateQueries({ queryKey: ["slots"] });
      }, 1200);
    }
  }, [msLeft, rules, client, releaseAt]);

  const secs = Math.max(0, Math.floor(msLeft / 1000));
  return {
    ready: !!rules,
    /** Day key that opens next, and when. */
    opensDay,
    opensAt: release,
    releaseHour,
    msLeft,
    /** "hh:mm:ss" left (Latin digits; format for display). */
    clock: `${pad(Math.floor(secs / 3600))}:${pad(Math.floor((secs % 3600) / 60))}:${pad(secs % 60)}`,
    soon: !!rules && msLeft <= SOON_MS,
  };
}

export function useBookingLimit() {
  const { rules } = usePublicRules();
  const phone = useSession((s) => s.user?.phone ?? "");
  const cartCount = useSession((s) => s.cart.length);
  const max = rules?.maxActivePerUser ?? 0;
  const { data: upcoming = [] } = useQuery({
    queryKey: myBookingsKey("upcoming"),
    queryFn: () => getMyBookings("upcoming"),
    enabled: !!phone && max > 0,
  });
  const held = upcoming.length;
  const remaining = max > 0 ? Math.max(0, max - held - cartCount) : Infinity;
  return {
    /** 0 = no limit. */
    max,
    held,
    cartCount,
    remaining,
    /** The cart already uses every allowed session. */
    reached: max > 0 && remaining === 0,
    /** The cart holds more than allowed (checkout must not go ahead). */
    over: max > 0 && held + cartCount > max,
    /** True when one more session can go in the cart. */
    canAdd: max === 0 || remaining > 0,
  };
}
