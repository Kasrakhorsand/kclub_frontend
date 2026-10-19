"use client";
/** Next open sessions across all sports: today's, or tomorrow's once today is full. */
import { useQuery } from "@tanstack/react-query";
import { getSlots } from "@/engine/api";
import { addDays, dayKey } from "@/engine/format";
import { SPORTS } from "@/engine/venue";
import type { Slot, Sport } from "@/engine/types";

export type OpenSlot = Slot & { sport: Sport; date: string };

async function fetchOpenSlots(limit: number): Promise<{ slots: OpenSlot[]; tomorrow: boolean }> {
  const load = async (date: string) => {
    const perSport = await Promise.all(
      SPORTS.map(async (sport) => (await getSlots(sport.id, date)).map((s): OpenSlot => ({ ...s, sport: sport.id, date }))),
    );
    return perSport
      .flat()
      .filter((s) => !s.past && s.freeCourts.length > 0)
      .sort((a, b) => a.hour - b.hour || a.sport.localeCompare(b.sport));
  };
  const today = await load(dayKey(new Date()));
  if (today.length) return { slots: today.slice(0, limit), tomorrow: false };
  return { slots: (await load(dayKey(addDays(new Date(), 1)))).slice(0, limit), tomorrow: true };
}

/** Up to `limit` open slots, refreshed every minute. `data` is undefined while loading. */
export function useOpenSlots(limit = 6) {
  return useQuery({ queryKey: ["open-slots", limit], queryFn: () => fetchOpenSlots(limit), refetchInterval: 60_000 });
}
