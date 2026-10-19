"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getSlots } from "@/modules/core/api";
import { SPORTS, sportById } from "@/modules/core/venue";
import { addDays, dayKey, fa, hm } from "@/modules/core/format";
import type { Slot, Sport } from "@/modules/core/types";

/** How many upcoming slots to show in the strip. */
const MAX_SLOTS = 6;

type OpenSlot = Slot & { sport: Sport; date: string };

/** Today's open slots across all sports, earliest first; tomorrow's if today is full. */
async function fetchOpenSlots(): Promise<{ slots: OpenSlot[]; tomorrow: boolean }> {
  const today = dayKey(new Date());
  const tomorrow = dayKey(addDays(new Date(), 1));
  const load = async (date: string) => {
    const perSport = await Promise.all(
      SPORTS.map(async (sport) => (await getSlots(sport.id, date)).map((s): OpenSlot => ({ ...s, sport: sport.id, date }))),
    );
    return perSport
      .flat()
      .filter((s) => !s.past && s.freeCourts.length > 0)
      .sort((a, b) => a.hour - b.hour || a.sport.localeCompare(b.sport));
  };
  const todays = await load(today);
  if (todays.length) return { slots: todays.slice(0, MAX_SLOTS), tomorrow: false };
  return { slots: (await load(tomorrow)).slice(0, MAX_SLOTS), tomorrow: true };
}

/** Strip under the hero: the next free sessions, each one click away from the court map. */
export function FreeSlotsToday() {
  const { data } = useQuery({ queryKey: ["home-open-slots"], queryFn: fetchOpenSlots, refetchInterval: 60_000 });

  return (
    <section className="openslots" aria-labelledby="openslots-title">
      <div className="wrap">
        <div className="osh">
          <span className="pulse" aria-hidden="true" />
          <h2 id="openslots-title">{data?.tomorrow ? "سانس‌های خالی فردا" : "سانس‌های خالی امروز"}</h2>
          <Link className="osall" href="/sport">همه‌ی سانس‌ها ←</Link>
        </div>
        <div className="osr">
          {!data && Array.from({ length: MAX_SLOTS }, (_, i) => <span key={i} className="osc sk" aria-hidden="true" />)}
          {data?.slots.map((s) => (
            <Link
              key={`${s.sport}-${s.date}-${s.hour}`}
              className="osc"
              href={`/book/${s.sport}?date=${s.date}&hour=${s.hour}`}
              aria-label={`${sportById(s.sport)?.name}، ساعت ${hm(s.hour)}، ${fa(s.freeCourts.length)} زمین خالی`}
            >
              <span className="lat">{sportById(s.sport)?.latin}</span>
              <b>{hm(s.hour)}</b>
              <span className="osm">{sportById(s.sport)?.name} · {fa(s.freeCourts.length)} زمین خالی</span>
              <span className="osp">{fa(s.price / 1000)} هزار تومان</span>
            </Link>
          ))}
          {data && !data.slots.length && <p className="muted small">امروز و فردا سانس خالی نمانده؛ روزهای بعد را ببینید.</p>}
        </div>
      </div>
    </section>
  );
}
