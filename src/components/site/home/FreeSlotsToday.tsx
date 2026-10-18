"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getSlots } from "@/lib/api";
import { addDays, dayKey, fa, hm } from "@/lib/format";
import type { Slot, Sport } from "@/lib/types";

/** How many upcoming slots to show in the strip. */
const MAX_SLOTS = 6;

const SPORT_LABEL: Record<Sport, string> = { padel: "پدل", beach: "ساحلی" };

type OpenSlot = Slot & { sport: Sport; date: string };

/** Today's and tomorrow's open slots for both sports, earliest first. */
async function fetchOpenSlots(): Promise<{ slots: OpenSlot[]; tomorrow: boolean }> {
  const today = dayKey(new Date());
  const tomorrow = dayKey(addDays(new Date(), 1));
  const load = async (date: string) => {
    const [padel, beach] = await Promise.all([getSlots("padel", date), getSlots("beach", date)]);
    const tag = (sport: Sport) => (s: Slot): OpenSlot => ({ ...s, sport, date });
    return [...padel.map(tag("padel")), ...beach.map(tag("beach"))]
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
              aria-label={`${SPORT_LABEL[s.sport]}، ساعت ${hm(s.hour)}، ${fa(s.freeCourts.length)} زمین خالی`}
            >
              <span className="lat">{s.sport === "padel" ? "Padel" : "Beach"}</span>
              <b>{hm(s.hour)}</b>
              <span className="osm">{SPORT_LABEL[s.sport]} · {fa(s.freeCourts.length)} زمین خالی</span>
              <span className="osp">{fa(s.price / 1000)} هزار تومان</span>
            </Link>
          ))}
          {data && !data.slots.length && <p className="muted small">امروز و فردا سانس خالی نمانده؛ روزهای بعد را ببینید.</p>}
        </div>
      </div>
    </section>
  );
}
