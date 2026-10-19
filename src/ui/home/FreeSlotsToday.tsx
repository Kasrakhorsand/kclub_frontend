"use client";
import Link from "next/link";
import { sportById } from "@/engine/venue";
import { useOpenSlots } from "@/engine/booking/useOpenSlots";
import { fa, hm } from "@/engine/format";

/** How many upcoming slots to show in the strip. */
const MAX_SLOTS = 6;

/** Strip under the hero: the next free sessions, each one click away from the court map. */
export function FreeSlotsToday() {
  const { data } = useOpenSlots(MAX_SLOTS);

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
